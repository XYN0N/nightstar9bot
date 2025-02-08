import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { getGameStatus } from '../api/game';
import { useSocket } from '../hooks/useSocket';

function Game() {
  const { gameId } = useParams();
  const { data: game } = useQuery(['game', gameId], () => getGameStatus(gameId!), {
    refetchInterval: 1000,
  });

  const [flipping, setFlipping] = React.useState(false);
  const [result, setResult] = React.useState<'heads' | 'tails' | null>(null);

  useSocket(gameId, (updatedGame) => {
    if (updatedGame.status === 'playing') {
      setFlipping(true);
      setTimeout(() => {
        setFlipping(false);
        setResult(updatedGame.coinSide);
      }, 3000);
    }
  });

  if (!game) return null;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="text-center">
          <img
            src={game.player1.photoUrl}
            alt={game.player1.username}
            className="w-16 h-16 rounded-full mx-auto mb-2"
          />
          <p className="font-semibold">{game.player1.username}</p>
          <p className="text-sm text-gray-300">
            {game.player1.id === game.winner?.id ? 'Winner!' : ''}
          </p>
        </div>

        <div className="text-center">
          <p className="text-2xl font-bold mb-2">{game.betAmount} ⭐️</p>
          <p className="text-sm text-gray-300">at stake</p>
        </div>

        <div className="text-center">
          <img
            src={game.player2.photoUrl}
            alt={game.player2.username}
            className="w-16 h-16 rounded-full mx-auto mb-2"
          />
          <p className="font-semibold">{game.player2.username}</p>
          <p className="text-sm text-gray-300">
            {game.player2.id === game.winner?.id ? 'Winner!' : ''}
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <AnimatePresence>
          {flipping ? (
            <motion.div
              animate={{
                rotateX: [0, 720],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3,
                ease: "easeInOut",
              }}
              className="w-32 h-32"
            >
              <img
                src="/heads.png"
                alt="Coin"
                className="w-full h-full object-contain"
              />
            </motion.div>
          ) : result ? (
            <div className="w-32 h-32">
              <img
                src={`/${result}.png`}
                alt={result}
                className="w-full h-full object-contain"
              />
            </div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="text-center">
        {game.status === 'waiting' && (
          <p className="text-xl">Waiting for opponent...</p>
        )}
        {game.status === 'playing' && !result && (
          <p className="text-xl">Flipping coin...</p>
        )}
        {game.status === 'finished' && (
          <div>
            <p className="text-2xl font-bold mb-2">
              {game.winner?.username} wins!
            </p>
            <p className="text-gray-300">
              {game.betAmount * 2} stars have been transferred
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Game