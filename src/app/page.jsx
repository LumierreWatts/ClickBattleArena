"use client";

import ClaimReward from "@/components/claim-reward";
import { getContainerDimensions } from "@/lib/getContainerDimensions";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import React, { useState, useEffect, useCallback } from "react";
import {
  useStateTogether,
  useStateTogetherWithPerUserValues,
  useConnectedUsers,
} from "react-together";

const TARGET_SIZE = 60;
const GAME_DURATION = 10; // seconds
const TARGET_SPAWN_INTERVAL = 2000; // 2 seconds
const EMOJIS = ["🎯", "⭐", "💎", "🎁", "🏆", "🔥", "⚡", "🌟", "💫", "🎪"];

export default function ClickBattle1v1() {
  const [gameActive, setGameActive] = useStateTogether("game-active", false);
  const [gameTimer, setGameTimer] = useStateTogether(
    "game-timer",
    GAME_DURATION
  );
  const [leftTargets, setLeftTargets] = useStateTogether("left-targets", []);
  const [rightTargets, setRightTargets] = useStateTogether("right-targets", []);

  const [scores, setScores, scoresPerUser] = useStateTogetherWithPerUserValues(
    "player-scores",
    0
  );
  const [playerSides, setPlayerSides, playerSidesPerUser] =
    useStateTogetherWithPerUserValues("player-sides", null);

  const connectedUsers = useConnectedUsers();
  const [showClickEffect, setShowClickEffect] = useState(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState(
    getContainerDimensions
  );

  // Handle window resize for responsive containers
  useEffect(() => {
    const handleResize = () => {
      setContainerDimensions(getContainerDimensions());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Assign player to a side based on connected users
  useEffect(() => {
    if (playerSides === null && connectedUsers.length > 0) {
      const currentUser = connectedUsers.find(user => user.isYou);
      if (!currentUser) return;

      const activePlayers = Object.entries(playerSidesPerUser).filter(
        ([userId, side]) =>
          side !== null && connectedUsers.some(user => user.userId === userId)
      );

      if (connectedUsers.length > 2) {
        // More than 2 users connected, become spectator
        setPlayerSides("spectator");
      } else if (activePlayers.length === 0) {
        // First player becomes left
        setPlayerSides("left");
      } else if (activePlayers.length === 1) {
        // Second player takes the opposite side
        const takenSide = activePlayers[0][1];
        setPlayerSides(takenSide === "left" ? "right" : "left");
      } else {
        // Game is full, become spectator
        setPlayerSides("spectator");
      }
    }
  }, [playerSides, playerSidesPerUser, connectedUsers, setPlayerSides]);

  // Generate new target for specific side
  const generateTarget = useCallback(
    side => {
      const newTarget = {
        id: Date.now() + Math.random(),
        x: Math.random() * (containerDimensions.width - TARGET_SIZE),
        y: Math.random() * (containerDimensions.height - TARGET_SIZE),
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        points: Math.floor(Math.random() * 3) + 1, // 1-3 points
        createdAt: Date.now(),
      };

      if (side === "left") {
        setLeftTargets(prev => [...prev, newTarget]);
      } else {
        setRightTargets(prev => [...prev, newTarget]);
      }
    },
    [setLeftTargets, setRightTargets, containerDimensions]
  );

  // Start game
  const startGame = () => {
    const activeConnectedPlayers = connectedUsers.filter(user => {
      const userSide = playerSidesPerUser[user.userId];
      return userSide === "left" || userSide === "right";
    });

    if (activeConnectedPlayers.length < 2) {
      setWaitingForOpponent(true);
      return;
    }

    setWaitingForOpponent(false);
    setGameActive(true);
    setGameTimer(GAME_DURATION);
    setLeftTargets([]);
    setRightTargets([]);

    // Generate initial targets
    generateTarget("left");
    generateTarget("right");
  };

  // Handle target click
  const handleTargetClick = (target, side, e) => {
    e.stopPropagation();
    if (!gameActive || playerSides !== side) return;

    // Add points to my score
    setScores(prev => prev + target.points);

    // Show click effect
    setShowClickEffect({
      x: e.clientX,
      y: e.clientY,
      points: target.points,
    });
    setTimeout(() => setShowClickEffect(null), 800);

    // Remove clicked target
    if (side === "left") {
      setLeftTargets(prev => prev.filter(t => t.id !== target.id));
    } else {
      setRightTargets(prev => prev.filter(t => t.id !== target.id));
    }
  };

  // Game timer
  useEffect(() => {
    if (!gameActive) return;

    const timer = setInterval(() => {
      setGameTimer(prev => {
        if (prev <= 1) {
          setGameActive(false);
          setLeftTargets([]);
          setRightTargets([]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    gameActive,
    setGameTimer,
    setGameActive,
    setLeftTargets,
    setRightTargets,
  ]);

  // Target spawning system
  useEffect(() => {
    if (!gameActive) return;

    const spawnTimer = setInterval(() => {
      // Spawn targets for both sides
      if (Math.random() > 0.3) generateTarget("left");
      if (Math.random() > 0.3) generateTarget("right");
    }, TARGET_SPAWN_INTERVAL);

    return () => clearInterval(spawnTimer);
  }, [gameActive, generateTarget]);

  // Clean up old targets
  useEffect(() => {
    if (!gameActive) return;

    const cleanup = setInterval(() => {
      const now = Date.now();
      setLeftTargets(prev =>
        prev.filter(target => now - target.createdAt < 5000)
      );
      setRightTargets(prev =>
        prev.filter(target => now - target.createdAt < 5000)
      );
    }, 1000);

    return () => clearInterval(cleanup);
  }, [gameActive, setLeftTargets, setRightTargets]);

  // Get players by side (only connected users)
  const connectedPlayerSides = connectedUsers.reduce((acc, user) => {
    const side = playerSidesPerUser[user.userId];
    if (side === "left" || side === "right") {
      acc[side] = { userId: user.userId, nickname: user.nickname };
    }
    return acc;
  }, {});

  const leftPlayer = connectedPlayerSides.left;
  const rightPlayer = connectedPlayerSides.right;
  const leftScore = leftPlayer ? scoresPerUser[leftPlayer.userId] || 0 : 0;
  const rightScore = rightPlayer ? scoresPerUser[rightPlayer.userId] || 0 : 0;

  const isGameOver = !gameActive && (leftScore > 0 || rightScore > 0);
  const winner = isGameOver
    ? leftScore > rightScore
      ? "left"
      : rightScore > leftScore
      ? "right"
      : "tie"
    : null;

  // Check if current user is the winner
  const isCurrentUserWinner =
    isGameOver &&
    winner !== "tie" &&
    ((winner === "left" && playerSides === "left") ||
      (winner === "right" && playerSides === "right"));

  const canStart =
    connectedUsers.filter(user => {
      const side = playerSidesPerUser[user.userId];
      return side === "left" || side === "right";
    }).length >= 2;

  return (
    <div className="flex flex-col items-center p-2 sm:p-4 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 min-h-screen text-white">
      <div className="self-end mb-2 sm:mb-0">
        <ConnectButton />
      </div>

      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-center px-2">
        ⚡ 1v1 Click Battle Arena ⚡
      </h1>

      {/* Game Stats */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 lg:gap-8 mb-4 text-center">
        <div className="bg-black bg-opacity-30 px-3 sm:px-4 py-2 rounded-lg min-w-[80px]">
          <div className="text-xl sm:text-2xl font-bold">{gameTimer}</div>
          <div className="text-xs sm:text-sm">Time Left</div>
        </div>
        <div className="bg-black bg-opacity-30 px-3 sm:px-4 py-2 rounded-lg min-w-[80px]">
          <div className="text-xl sm:text-2xl font-bold text-blue-300">
            {leftScore}
          </div>
          <div className="text-xs sm:text-sm">Left Player</div>
        </div>
        <div className="bg-black bg-opacity-30 px-3 sm:px-4 py-2 rounded-lg min-w-[80px]">
          <div className="text-xl sm:text-2xl font-bold text-red-300">
            {rightScore}
          </div>
          <div className="text-xs sm:text-sm">Right Player</div>
        </div>
      </div>

      {/* Player Status */}
      <div className="mb-4 text-center w-full max-w-md">
        <div className="mb-2 bg-black bg-opacity-30 px-4 py-2 rounded-lg">
          <p className="text-sm">
            Connected Players: {connectedUsers.length}/2
          </p>
        </div>

        {playerSides === "spectator" ? (
          <div className="bg-gray-600 bg-opacity-50 px-4 py-2 rounded-lg">
            <p className="text-base sm:text-lg">👀 You are spectating</p>
            <p className="text-sm">Game is full (2/2 players)</p>
          </div>
        ) : playerSides ? (
          <div
            className={`px-4 py-2 rounded-lg ${
              playerSides === "left"
                ? "bg-blue-600 bg-opacity-50"
                : "bg-red-600 bg-opacity-50"
            }`}
          >
            <p className="text-base sm:text-lg">
              You are on the{" "}
              <span className="font-bold capitalize">{playerSides}</span> side
            </p>
            {connectedUsers.find(u => u.isYou)?.nickname && (
              <p className="text-sm">
                Playing as: {connectedUsers.find(u => u.isYou)?.nickname}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-yellow-600 bg-opacity-50 px-4 py-2 rounded-lg">
            <p className="text-base sm:text-lg">🔄 Joining game...</p>
          </div>
        )}
      </div>

      {/* Game Controls */}
      <div className="mb-4">
        {waitingForOpponent ? (
          <div className="text-center">
            <div className="bg-yellow-600 bg-opacity-50 px-4 sm:px-8 py-3 rounded-lg">
              <p className="text-base sm:text-lg font-bold">
                ⏳ Waiting for opponent...
              </p>
              <p className="text-sm">Need 2 players to start</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <button
              onClick={startGame}
              disabled={gameActive || !canStart || playerSides === "spectator"}
              className="px-4 sm:px-8 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 rounded-lg font-bold text-base sm:text-lg transition-colors shadow-lg"
            >
              {gameActive
                ? "Battle in Progress..."
                : !canStart
                ? "Need 2 Players"
                : playerSides === "spectator"
                ? "Spectating"
                : "Start Battle!"}
            </button>

            <button
              onClick={() => setScores(0)}
              disabled={gameActive || !canStart || playerSides === "spectator"}
              className="px-4 sm:px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 rounded-lg font-bold text-base sm:text-lg transition-colors shadow-lg"
            >
              Reset Score
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      {!gameActive && !isGameOver && canStart && (
        <div className="mb-4 text-center bg-black bg-opacity-30 p-4 rounded-lg max-w-2xl mx-2">
          <p className="text-base sm:text-lg mb-2">
            🎯 Click targets in your container as fast as you can!
          </p>
          <p className="text-sm">
            Left player clicks left side, right player clicks right side.
            Different emojis give different points!
          </p>
        </div>
      )}

      {/* Game Containers */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 mb-10 w-full justify-center items-center">
        {/* Left Container */}
        <div className="flex flex-col items-center">
          <div
            className={`mb-2 px-3 py-1 rounded text-sm font-bold ${
              playerSides === "left" ? "bg-blue-600" : "bg-gray-600"
            }`}
          >
            <div className="text-center">
              Left Player {playerSides === "left" ? "(You)" : ""}
              {leftPlayer && (
                <div className="text-xs opacity-75">
                  {leftPlayer.nickname || leftPlayer.userId.slice(0, 8)}
                </div>
              )}
            </div>
          </div>
          <div
            className={`relative border-4 rounded-lg overflow-hidden cursor-crosshair ${
              playerSides === "left" ? "border-blue-400" : "border-gray-400"
            }`}
            style={{
              width: containerDimensions.width,
              height: containerDimensions.height,
              background: "linear-gradient(45deg, #1a1a2e, #16213e, #0f3460)",
            }}
          >
            {/* Left Targets */}
            {gameActive &&
              leftTargets.map(target => (
                <div
                  key={target.id}
                  onClick={e => handleTargetClick(target, "left", e)}
                  className={`absolute transform hover:scale-110 transition-transform duration-100 select-none ${
                    playerSides === "left"
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-75"
                  }`}
                  style={{
                    left: target.x,
                    top: target.y,
                    fontSize: TARGET_SIZE,
                    animation: "pulse 1s infinite",
                  }}
                >
                  {target.emoji}
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {target.points}
                  </div>
                </div>
              ))}

            {/* Left Container Overlay */}
            {(!gameActive || !leftPlayer) && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center p-2">
                  {!leftPlayer ? (
                    <p className="text-base sm:text-lg">
                      Waiting for left player...
                    </p>
                  ) : isGameOver ? (
                    <div>
                      <h3 className="text-lg sm:text-2xl font-bold mb-2">
                        Final Score
                      </h3>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-300">
                        {leftScore}
                      </p>
                      {winner === "left" && (
                        <p className="text-lg sm:text-xl text-yellow-300 mt-2">
                          🏆 Winner!
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-base sm:text-lg">Ready to battle!</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-300 bg-black bg-opacity-30 px-3 sm:px-4 py-4 sm:py-8 rounded-lg">
            VS
          </div>
        </div>

        {/* Right Container */}
        <div className="flex flex-col items-center">
          <div
            className={`mb-2 px-3 py-1 rounded text-sm font-bold ${
              playerSides === "right" ? "bg-red-600" : "bg-gray-600"
            }`}
          >
            <div className="text-center">
              Right Player {playerSides === "right" ? "(You)" : ""}
              {rightPlayer && (
                <div className="text-xs opacity-75">
                  {rightPlayer.nickname || rightPlayer.userId.slice(0, 8)}
                </div>
              )}
            </div>
          </div>
          <div
            className={`relative border-4 rounded-lg overflow-hidden cursor-crosshair ${
              playerSides === "right" ? "border-red-400" : "border-gray-400"
            }`}
            style={{
              width: containerDimensions.width,
              height: containerDimensions.height,
              background: "linear-gradient(45deg, #2e1a1a, #3e1616, #600f0f)",
            }}
          >
            {/* Right Targets */}
            {gameActive &&
              rightTargets.map(target => (
                <div
                  key={target.id}
                  onClick={e => handleTargetClick(target, "right", e)}
                  className={`animate-pulse absolute transform hover:scale-110 transition-transform duration-100 select-none ${
                    playerSides === "right"
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-75"
                  }`}
                  style={{
                    left: target.x,
                    top: target.y,
                    fontSize: TARGET_SIZE,
                  }}
                >
                  {target.emoji}
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {target.points}
                  </div>
                </div>
              ))}

            {/* Right Container Overlay */}
            {(!gameActive || !rightPlayer) && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center p-2">
                  {!rightPlayer ? (
                    <p className="text-base sm:text-lg">
                      Waiting for right player...
                    </p>
                  ) : isGameOver ? (
                    <div>
                      <h3 className="text-lg sm:text-2xl font-bold mb-2">
                        Final Score
                      </h3>
                      <p className="text-2xl sm:text-3xl font-bold text-red-300">
                        {rightScore}
                      </p>
                      {winner === "right" && (
                        <p className="text-lg sm:text-xl text-yellow-300 mt-2">
                          🏆 Winner!
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-base sm:text-lg">Ready to battle!</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Game Over Message */}
      {isGameOver && (
        <div className="bg-black bg-opacity-50 p-4 sm:p-6 rounded-lg text-center mb-4 w-full max-w-2xl mx-2">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            🏆 Battle Complete! 🏆
          </h2>
          {winner === "tie" ? (
            <p className="text-xl sm:text-2xl text-yellow-300">
              🤝 It&apos;s a Tie!
            </p>
          ) : (
            <p className="text-xl sm:text-2xl">
              <span
                className={winner === "left" ? "text-blue-300" : "text-red-300"}
              >
                {winner === "left" ? "Left" : "Right"} Player Wins!
              </span>
            </p>
          )}
          <p className="text-base sm:text-lg mt-2">
            Final Score: {leftScore} - {rightScore}
          </p>

          {/* Winner message for current user */}
          {isCurrentUserWinner && (
            <div className="mt-4 p-4 bg-green-500 bg-opacity-20 border border-green-400 rounded-lg">
              <p className="text-lg sm:text-xl text-yellow-300 font-bold">
                🎉 Congratulations! You Won! 🎉
              </p>
              <p className="text-sm text-green-200 mt-1">
                You can now claim your reward below!
              </p>
              <ClaimReward />
            </div>
          )}

          {/* Message for losers */}
          {isGameOver &&
            winner !== "tie" &&
            !isCurrentUserWinner &&
            playerSides !== "spectator" && (
              <div className="mt-4 p-4 bg-red-500 bg-opacity-20 border border-red-400 rounded-lg">
                <p className="text-base sm:text-lg text-red-200">
                  Better luck next time! 🎮
                </p>
              </div>
            )}
        </div>
      )}

      {/* Click Effect */}
      {showClickEffect && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: showClickEffect.x - 20,
            top: showClickEffect.y - 20,
          }}
        >
          <div className="w-10 h-10 bg-green-400 rounded-full animate-ping"></div>
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-lg font-bold text-green-300 animate-bounce">
            +{showClickEffect.points}
          </div>
        </div>
      )}
    </div>
  );
}
