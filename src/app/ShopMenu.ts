import { Direction } from '../domain/Direction';
import { ALL_UPGRADES, UpgradeType } from '../domain/upgrades';
import { Game } from './Game';

/**
 * Selection + purchase logic for the surface shop menu, independent of how it
 * is drawn. Left/Right move along the upgrade row (clamped), Down highlights
 * the "Drill again" button, Up returns to the row; confirm buys the upgrade
 * (reporting successful purchases) or leaves via "Drill again". The highlight
 * resets whenever the menu reopens.
 */
export class ShopMenu {
  readonly types: readonly UpgradeType[] = ALL_UPGRADES;
  private selected = 0;
  private drillAgain = false;
  private wasOpen = false;

  constructor(
    private readonly game: Game,
    private readonly onPurchase: () => void,
  ) {}

  get selectedIndex(): number {
    return this.selected;
  }

  get onDrillAgain(): boolean {
    return this.drillAgain;
  }

  /** Tracks menu open/close; resets the highlight on each fresh opening. */
  update(): void {
    const open = this.game.isMenuOpen();
    if (open && !this.wasOpen) {
      this.selected = 0;
      this.drillAgain = false;
    }
    this.wasOpen = open;
  }

  /** Moves the highlight in response to an edge-triggered direction press. */
  navigate(direction: Direction): void {
    if (direction.dy > 0) {
      this.drillAgain = true;
    } else if (direction.dy < 0) {
      this.drillAgain = false;
    } else if (!this.drillAgain) {
      const next = this.selected + direction.dx;
      this.selected = Math.max(0, Math.min(this.types.length - 1, next));
    }
  }

  /** Confirms the highlighted item (X): buy, or leave via "Drill again". */
  confirm(): void {
    if (this.drillAgain) {
      this.game.closeMenu();
      return;
    }
    if (this.game.buyUpgrade(this.types[this.selected])) this.onPurchase();
  }
}
