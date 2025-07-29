import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { CONTRACT_ABI } from "@/lib/abi";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default function ClaimReward() {
  const { address, isConnected } = useAccount();
  const [canClaim, setCanClaim] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  const [contractBalance, setContractBalance] = useState(0);

  // Read if the player can claim
  const { data: claimData, refetch: refetchClaimData } = useReadContract({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "canPlayerClaim",
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Read contract stats including balance
  const { data: contractStats, refetch: refetchContractStats } =
    useReadContract({
      address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "getContractStats",
      enabled: !!address,
    });

  // Write contract to claim reward
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  useEffect(() => {
    if (claimData) {
      const [canClaimResult, timeUntilNextResult] = claimData;
      setCanClaim(canClaimResult);
      setTimeUntilNext(Number(timeUntilNextResult));
    }
  }, [claimData]);

  // Update contract balance from contractStats
  useEffect(() => {
    if (contractStats) {
      const [balance, totalRewards, playerCount, rewardAmount] = contractStats;
      setContractBalance(Number(balance));
    }
  }, [contractStats]);

  // Real-time countdown timer
  useEffect(() => {
    if (timeUntilNext > 0 && !canClaim) {
      const timer = setInterval(() => {
        setTimeUntilNext(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            refetchClaimData(); // Refetch to check if claim is now available
            return 0;
          }
          return prev - 1;
        });
      }, 1000); // Update every second

      return () => clearInterval(timer);
    }
  }, [timeUntilNext, canClaim, refetchClaimData]);

  // Function to handle reward claim
  const handleClaimReward = async () => {
    try {
      writeContract({
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "claimReward",
      });
    } catch (err) {
      console.error("Error claiming reward:", err);
    }
  };

  // Convert seconds to readable time
  const formatTimeUntilNext = seconds => {
    if (seconds <= 0) return "Now";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  // Format balance for display (assuming 18 decimals for MON token)
  const formatBalance = balance => {
    return (Number(balance) / 1e18).toFixed(4);
  };

  // Check if contract has sufficient balance
  const hasInsufficientBalance = contractBalance === 0;

  // Refetch data after successful transaction
  useEffect(() => {
    if (isConfirmed) {
      refetchClaimData();
      refetchContractStats();
    }
  }, [isConfirmed, refetchClaimData, refetchContractStats]);

  // Periodic refetch to sync with blockchain (every minute)
  useEffect(() => {
    if (timeUntilNext > 0 && !canClaim) {
      const interval = setInterval(() => {
        refetchClaimData();
        refetchContractStats(); // Also refetch contract stats to update balance
      }, 60000); // Refresh every minute

      return () => clearInterval(interval);
    }
  }, [timeUntilNext, canClaim, refetchClaimData, refetchContractStats]);

  return (
    <div className="w-full max-w-md mx-auto mt-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <span className="text-3xl">🏆</span>
          Claim Your Victory Reward
          <span className="text-3xl">🏆</span>
        </h2>
        <p className="text-blue-200 text-sm">
          Congratulations on your win! Claim your MON tokens below.
        </p>
      </div>

      {isConnected ? (
        <div className="space-y-4">
          {/* Claim Status Card */}
          <div className="bg-black bg-opacity-40 backdrop-blur-sm border border-white border-opacity-20 p-6 rounded-xl shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-2">💰</div>
              <h3 className="text-xl font-bold text-white mb-2">
                Reward Status
              </h3>
            </div>

            {/* Status Info */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center bg-black bg-opacity-30 p-3 rounded-lg">
                <span className="text-white font-medium">Can Claim:</span>
                <span
                  className={`font-bold px-3 py-1 rounded-full text-sm ${
                    canClaim && !hasInsufficientBalance
                      ? "bg-green-500 bg-opacity-20 text-green-300 border border-green-400"
                      : "bg-red-500 bg-opacity-20 text-red-300 border border-red-400"
                  }`}
                >
                  {canClaim && !hasInsufficientBalance ? "✅ Yes" : "❌ No"}
                </span>
              </div>

              <div className="flex justify-between items-center bg-black bg-opacity-30 p-3 rounded-lg">
                <span className="text-white font-medium">Next Claim:</span>
                <span className="text-yellow-300 font-bold">
                  {formatTimeUntilNext(timeUntilNext)}
                </span>
              </div>

              <div className="flex justify-between items-center bg-black bg-opacity-30 p-3 rounded-lg">
                <span className="text-white font-medium">
                  Contract Balance:
                </span>
                <span
                  className={`font-bold ${
                    hasInsufficientBalance ? "text-red-300" : "text-green-300"
                  }`}
                >
                  {formatBalance(contractBalance)} MON
                </span>
              </div>
            </div>

            {/* Insufficient Balance Warning */}
            {hasInsufficientBalance && (
              <div className="mb-4 p-4 bg-red-500 bg-opacity-20 border border-red-400 rounded-lg">
                <p className="text-red-200 font-bold mb-2 flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  Insufficient Contract Balance
                </p>
                <p className="text-red-300 text-sm">
                  💰 The contract doesn&apos;t have enough MON tokens to
                  distribute rewards. Please try again later.
                </p>
              </div>
            )}

            {/* Claim Button */}
            <button
              className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform ${
                !canClaim || isPending || isConfirming || hasInsufficientBalance
                  ? "bg-gray-600 bg-opacity-50 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:scale-105 shadow-lg hover:shadow-green-500/25"
              }`}
              onClick={handleClaimReward}
              disabled={
                !canClaim || isPending || isConfirming || hasInsufficientBalance
              }
            >
              {isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending Transaction...
                </div>
              ) : isConfirming ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Confirming...
                </div>
              ) : hasInsufficientBalance ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">🚫</span>
                  Contract Out of Funds
                  <span className="text-2xl">🚫</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">🎁</span>
                  Claim Reward (0.05 MON)
                  <span className="text-2xl">🎁</span>
                </div>
              )}
            </button>

            {/* Transaction Hash */}
            {hash && (
              <div className="mt-4 p-4 bg-yellow-500 bg-opacity-20 border border-yellow-400 rounded-lg">
                <p className="text-yellow-200 text-sm font-medium mb-2">
                  📋 Transaction Submitted:
                </p>{" "}
                <Link
                  className="text-xs"
                  href={`https://testnet.monadexplorer.com/tx/${hash}`}
                  target="_blank"
                  referrerPolicy="no-referrer"
                >
                  View on Explorer
                  <ExternalLink className="h-4 w-4 inline-block ml-1 mb-1" />
                </Link>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-500 bg-opacity-20 border border-red-400 rounded-lg">
                <p className="text-red-200 font-bold mb-2 flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  Error Occurred:
                </p>
                <p className="text-red-300 text-sm">
                  {error.message.includes("ClaimTooEarly")
                    ? "⏰ Please wait for the cooldown period to end."
                    : error.message.includes("InsufficientContractBalance")
                    ? "💰 Contract doesn&apos;t have enough funds."
                    : error.message}
                </p>
              </div>
            )}

            {/* Success Message */}
            {isConfirmed && (
              <div className="mt-4 p-4 bg-green-500 bg-opacity-20 border border-green-400 rounded-lg animate-pulse">
                <p className="text-green-200 font-bold mb-2 flex items-center gap-2">
                  <span className="text-xl">🎉</span>
                  Reward Claimed Successfully!
                </p>
                <p className="text-green-300 text-sm">
                  💰 You received 0.05 MON tokens! Next claim available in 24
                  hours.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="bg-black bg-opacity-40 backdrop-blur-sm border border-white border-opacity-20 p-8 rounded-xl">
            <div className="text-6xl mb-4">🔐</div>
            <p className="text-white text-lg mb-4 font-medium">
              Connect Your Wallet to Claim Rewards
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
