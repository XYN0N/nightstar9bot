import { Client } from "colyseus.js";
import { Game } from '../types';

const client = new Client("ws://localhost:3000");

export async function findMatch(betAmount: number): Promise<Game> {
  try {
    const room = await client.joinOrCreate("game", { betAmount });
    
    // Convert room state to Game type
    const game: Game = {
      id: room.id,
      betAmount,
      status: 'waiting',
      player1: room.state.players.get(room.sessionId),
      player2: null,
      winner: null,
      coinSide: null
    };

    // Set up room state change handler
    room.onStateChange((state) => {
      game.status = state.status;
      game.coinSide = state.coinSide;
      game.winner = state.winner;
      
      // Update players
      const players = Array.from(state.players.values());
      if (players[0]) game.player1 = players[0];
      if (players[1]) game.player2 = players[1];
    });

    return game;
  } catch (error) {
    console.error("Error finding match:", error);
    throw error;
  }
}

export async function getGameStatus(gameId: string): Promise<Game> {
  try {
    const room = await client.joinById(gameId);
    return {
      id: room.id,
      betAmount: room.state.betAmount,
      status: room.state.status,
      player1: room.state.players.get(room.sessionId),
      player2: Array.from(room.state.players.values())[1] || null,
      winner: room.state.winner,
      coinSide: room.state.coinSide
    };
  } catch (error) {
    console.error("Error getting game status:", error);
    throw error;
  }
}