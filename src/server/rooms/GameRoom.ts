import { Room, Client } from "@colyseus/core";
import { Schema, type, MapSchema } from "@colyseus/schema";

class PlayerState extends Schema {
  @type("string") id: string;
  @type("string") username: string;
  @type("number") stars: number;
  @type("boolean") ready: boolean;

  constructor() {
    super();
    this.id = "";
    this.username = "";
    this.stars = 0;
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
    this.coinSide = "heads";
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

  onJoin(client: Client, options: { username: string; stars: number }) {
    const player = new PlayerState();
    player.id = client.sessionId;
    player.username = options.username;
    player.stars = options.stars;
    
    this.state.players.set(client.sessionId, player);

    // If room is full, start the game
    if (this.state.players.size === 2) {
      this.broadcast("full");
    }
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
  }

  private startGame() {
    this.state.status = "playing";
    this.state.coinSide = Math.random() < 0.5 ? "heads" : "tails";
    
    // Determine winner randomly for now
    const players = Array.from(this.state.players.values());
    const winner = players[Math.floor(Math.random() * players.length)];
    this.state.winner = winner.id;
    
    this.state.status = "finished";
    this.broadcast("gameEnd", {
      winner: winner.id,
      coinSide: this.state.coinSide
    });
  }
}