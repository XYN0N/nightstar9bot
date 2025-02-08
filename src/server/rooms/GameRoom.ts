import { Room, Client } from "@colyseus/core";
import { Schema, type, MapSchema } from "@colyseus/schema";
import { User } from '../models/User';

class PlayerState extends Schema {
  @type("string") id: string;
  @type("string") username: string;
  @type("number") stars: number;
  @type("string") side: string;
  @type("boolean") ready: boolean;

  constructor() {
    super();
    this.id = "";
    this.username = "";
    this.stars = 0;
    this.side = "";
    this.ready = false;
  }
}

class GameState extends Schema {
  @type("string") status: string;
  @type("number") betAmount: number;
  @type({ map: PlayerState }) players: MapSchema<PlayerState>;
  @type("string") winner: string;
  @type("string") coinSide: string;

  constructor() {
    super();
    this.status = "waiting";
    this.betAmount = 0;
    this.players = new MapSchema<PlayerState>();
    this.winner = "";
    this.coinSide = "";
  }
}

export class GameRoom extends Room<GameState> {
  maxClients = 2;

  onCreate(options: { betAmount: number }) {
    const state = new GameState();
    state.betAmount = options.betAmount;
    this.setState(state);

    this.onMessage("ready", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.ready = true;

        // Check if all players are ready
        let allReady = true;
        this.state.players.forEach((p) => {
          if (!p.ready) allReady = false;
        });

        if (allReady && this.state.players.size === 2) {
          this.startGame();
        }
      }
    });
  }

  async onJoin(client: Client, options: { username: string; stars: number; telegramId: number }) {
    const player = new PlayerState();
    player.id = client.sessionId;
    player.username = options.username;
    player.stars = options.stars;
    
    // Assign heads to first player, tails to second
    player.side = this.state.players.size === 0 ? "heads" : "tails";
    
    this.state.players.set(client.sessionId, player);

    // If room is full, start the game
    if (this.state.players.size === 2) {
      this.startGame();
    }
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
  }

  private async startGame() {
    this.state.status = "playing";
    
    // Random coin flip
    this.state.coinSide = Math.random() < 0.5 ? "heads" : "tails";
    
    // Find winner based on coin side
    const players = Array.from(this.state.players.values());
    const winner = players.find(p => p.side === this.state.coinSide);
    
    if (winner) {
      this.state.winner = winner.id;
      
      // Update players' stars in database
      try {
        const winningPlayer = await User.findOneAndUpdate(
          { username: winner.username },
          { 
            $inc: { 
              stars: this.state.betAmount,
              totalWins: 1,
              totalEarnings: this.state.betAmount
            }
          },
          { new: true }
        );

        const losingPlayer = await User.findOneAndUpdate(
          { username: players.find(p => p.id !== winner.id)?.username },
          { 
            $inc: { 
              stars: -this.state.betAmount,
              totalLosses: 1
            }
          },
          { new: true }
        );

        this.state.status = "finished";
        this.broadcast("gameEnd", {
          winner: winner.id,
          coinSide: this.state.coinSide,
          winningPlayer,
          losingPlayer
        });
      } catch (error) {
        console.error('Error updating player stats:', error);
        this.state.status = "error";
      }
    }
  }
}