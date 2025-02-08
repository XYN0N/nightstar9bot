import { Room, Client } from "@colyseus/core";
import { Schema, type, MapSchema } from "@colyseus/schema";

class PlayerState extends Schema {
  @type("string") id!: string;
  @type("string") username!: string;
  @type("number") stars!: number;
  @type("boolean") ready: boolean = false;

  constructor(id: string, username: string, stars: number) {
    super();
    this.id = id;
    this.username = username;
    this.stars = stars;
  }
}

class GameState extends Schema {
  @type("string") status: "waiting" | "playing" | "finished" = "waiting";
  @type("number") betAmount!: number;
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type("string") winner!: string;
  @type("string") coinSide!: "heads" | "tails";

  constructor() {
    super();
    this.betAmount = 0;
    this.winner = "";
    this.coinSide = "heads";
  }
}

export class GameRoom extends Room<GameState> {
  maxClients = 2;

  onCreate(options: { betAmount: number }) {
    this.setState(new GameState());
    this.state.betAmount = options.betAmount;

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
    this.state.players.set(
      client.sessionId,
      new PlayerState(client.sessionId, options.username, options.stars)
    );

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