// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract ClickBattleRewards is ReentrancyGuard, Ownable, Pausable {
    // Constants
    uint256 public constant REWARD_AMOUNT = 0.05 * 10**18;  // 0.05 MON
    uint256 public constant CLAIM_COOLDOWN = 24 hours;
    
    // State variables
    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public totalClaims;
    mapping(address => uint256) public totalRewardsEarned;
    
    uint256 public totalGameRewards;
    uint256 public totalPlayers;
    
    // Events
    event RewardClaimed(
        address indexed player,
        uint256 amount,
        uint256 timestamp,
        uint256 totalClaims
    );
    
    event GameCompleted(
        address indexed winner,
        address indexed loser,
        uint256 winnerScore,
        uint256 loserScore,
        uint256 timestamp
    );
    
    event ContractFunded(address indexed funder, uint256 amount);
    event EmergencyWithdraw(address indexed owner, uint256 amount);
    
    // Errors
    error InsufficientContractBalance();
    error ClaimTooEarly();
    error ClaimFailed();
    error InvalidGameData();
    
    constructor() {}
    
    /**
     * @dev Check if a player can claim rewards
     * @param player The player's address
     * @return canClaim Whether the player can claim
     * @return timeUntilNext Time until next claim is available (0 if can claim now)
     */
    function canPlayerClaim(address player) 
        external 
        view 
        returns (bool canClaim, uint256 timeUntilNext) 
    {
        uint256 lastClaim = lastClaimTime[player];
        
        if (lastClaim == 0) {
            return (true, 0); // First time claiming
        }
        
        uint256 nextClaimTime = lastClaim + CLAIM_COOLDOWN;
        
        if (block.timestamp >= nextClaimTime) {
            return (true, 0);
        } else {
            return (false, nextClaimTime - block.timestamp);
        }
    }
    
    /**
     * @dev Claim reward for winning a game
     * @dev Can only be called once every 24 hours per player
     */
    function claimReward() external nonReentrant whenNotPaused {
        if (address(this).balance < REWARD_AMOUNT) {
            revert InsufficientContractBalance();
        }
        
        uint256 lastClaim = lastClaimTime[msg.sender];
        
        // Check cooldown
        if (lastClaim != 0 && block.timestamp < lastClaim + CLAIM_COOLDOWN) {
            revert ClaimTooEarly();
        }
        
        // Update state before external call
        lastClaimTime[msg.sender] = block.timestamp;
        totalClaims[msg.sender]++;
        totalRewardsEarned[msg.sender] += REWARD_AMOUNT;
        totalGameRewards += REWARD_AMOUNT;
        
        // If this is the first claim, increment total players
        if (totalClaims[msg.sender] == 1) {
            totalPlayers++;
        }
        
        // Send reward
        (bool success, ) = payable(msg.sender).call{value: REWARD_AMOUNT}("");
        if (!success) {
            revert ClaimFailed();
        }
        
        emit RewardClaimed(
            msg.sender,
            REWARD_AMOUNT,
            block.timestamp,
            totalClaims[msg.sender]
        );
    }
    
    /**
     * @dev Record a completed game (for analytics)
     * @param winner Address of the winning player
     * @param loser Address of the losing player  
     * @param winnerScore Final score of winner
     * @param loserScore Final score of loser
     */
    function recordGame(
        address winner,
        address loser,
        uint256 winnerScore,
        uint256 loserScore
    ) external whenNotPaused {
        if (winner == address(0) || loser == address(0) || winnerScore <= loserScore) {
            revert InvalidGameData();
        }
        
        emit GameCompleted(
            winner,
            loser,
            winnerScore,
            loserScore,
            block.timestamp
        );
    }
    
    /**
     * @dev Get player statistics
     * @param player The player's address
     * @return claims Total number of claims
     * @return totalEarned Total MON earned
     * @return lastClaim Timestamp of last claim
     * @return canClaim Whether player can claim now
     * @return nextClaimIn Seconds until next claim available
     */
    function getPlayerStats(address player)
        external
        view
        returns (
            uint256 claims,
            uint256 totalEarned,
            uint256 lastClaim,
            bool canClaim,
            uint256 nextClaimIn
        )
    {
        claims = totalClaims[player];
        totalEarned = totalRewardsEarned[player];
        lastClaim = lastClaimTime[player];
        
        (canClaim, nextClaimIn) = this.canPlayerClaim(player);
    }
    
    /**
     * @dev Get contract statistics
     * @return balance Contract balance
     * @return totalRewards Total rewards distributed
     * @return playerCount Total unique players
     * @return rewardAmount Reward per win
     */
    function getContractStats()
        external
        view
        returns (
            uint256 balance,
            uint256 totalRewards,
            uint256 playerCount,
            uint256 rewardAmount
        )
    {
        return (
            address(this).balance,
            totalGameRewards,
            totalPlayers,
            REWARD_AMOUNT
        );
    }
    
    // Owner functions
    
    /**
     * @dev Fund the contract with MON
     */
    function fundContract() external payable onlyOwner {
        emit ContractFunded(msg.sender, msg.value);
    }
    
    /**
     * @dev Emergency withdraw (only owner)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit EmergencyWithdraw(owner(), amount);
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Receive function to accept MON
     */
    receive() external payable {
        emit ContractFunded(msg.sender, msg.value);
    }
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {
        emit ContractFunded(msg.sender, msg.value);
    }
}