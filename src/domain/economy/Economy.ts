import { Cargo } from './Cargo';
import { PlayerProgress } from './PlayerProgress';

/**
 * Sells the entire cargo: banks its value into the player's money and empties
 * the hold. Returns the amount earned.
 */
export function sellCargo(progress: PlayerProgress, cargo: Cargo): number {
  const earned = cargo.totalValue;
  progress.addMoney(earned);
  cargo.clear();
  return earned;
}
