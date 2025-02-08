import { useEffect } from 'react';
import { joinGame, onGameStart, cleanup } from '../api/socket';

export function useSocket(gameId: string | undefined, onStart: (game: any) => void) {
  useEffect(() => {
    if (!gameId) return;

    joinGame(gameId);
    onGameStart(onStart);

    return () => {
      cleanup();
    };
  }, [gameId, onStart]);
}