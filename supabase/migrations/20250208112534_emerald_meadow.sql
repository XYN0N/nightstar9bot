/*
  # Initial Schema Setup

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `telegram_id` (bigint, unique)
      - `username` (text)
      - `photo_url` (text)
      - `stars` (int)
      - `total_wins` (int)
      - `total_losses` (int)
      - `total_earnings` (int)
      - `created_at` (timestamp)
    - `games`
      - `id` (uuid, primary key)
      - `player1_id` (uuid, references users)
      - `player2_id` (uuid, references users)
      - `bet_amount` (int)
      - `status` (text)
      - `winner_id` (uuid, references users)
      - `coin_side` (text)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint UNIQUE NOT NULL,
  username text NOT NULL,
  photo_url text,
  stars int DEFAULT 0,
  total_wins int DEFAULT 0,
  total_losses int DEFAULT 0,
  total_earnings int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id uuid REFERENCES users NOT NULL,
  player2_id uuid REFERENCES users,
  bet_amount int NOT NULL,
  status text NOT NULL DEFAULT 'waiting',
  winner_id uuid REFERENCES users,
  coin_side text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('waiting', 'playing', 'finished')),
  CONSTRAINT valid_coin_side CHECK (coin_side IN ('heads', 'tails'))
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read games they participate in"
  ON games
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id
  );