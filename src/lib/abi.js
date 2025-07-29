export const CONTRACT_ABI = [
  {
    inputs: [],
    name: "claimReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "canPlayerClaim",
    outputs: [
      { internalType: "bool", name: "canClaim", type: "bool" },
      { internalType: "uint256", name: "timeUntilNext", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getPlayerStats",
    outputs: [
      { internalType: "uint256", name: "claims", type: "uint256" },
      { internalType: "uint256", name: "totalEarned", type: "uint256" },
      { internalType: "uint256", name: "lastClaim", type: "uint256" },
      { internalType: "bool", name: "canClaim", type: "bool" },
      { internalType: "uint256", name: "nextClaimIn", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getContractStats",
    outputs: [
      { internalType: "uint256", name: "balance", type: "uint256" },
      { internalType: "uint256", name: "totalRewards", type: "uint256" },
      { internalType: "uint256", name: "playerCount", type: "uint256" },
      { internalType: "uint256", name: "rewardAmount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "winner", type: "address" },
      { internalType: "address", name: "loser", type: "address" },
      { internalType: "uint256", name: "winnerScore", type: "uint256" },
      { internalType: "uint256", name: "loserScore", type: "uint256" },
    ],
    name: "recordGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalClaims",
        type: "uint256",
      },
    ],
    name: "RewardClaimed",
    type: "event",
  },
];
