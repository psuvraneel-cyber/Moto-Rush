import { MathUtils } from '../utilities/MathUtils';
import { GAME_CONFIG } from '../core/GameConfig';

export interface FormationSlot {
  index: number;
  row: number;
  col: number;
  targetOffsetX: number;
  targetOffsetY: number;
  targetOffsetZ: number;
}

export class FormationController {
  private readonly rowSpacing: number = 2.0;
  private readonly colSpacing: number = 1.05;
  private readonly maxColsPerRow: number = 7;

  /**
   * Generates target relative offsets (dx, dy, dz) for up to `count` followers
   * behind the hero motorcycle at (0, 0, 0).
   *
   * @param count Number of followers (logicalFleet - 1)
   * @param steeringLean Lean factor (-1 to +1) to apply lateral compression & trail bend
   * @param maxRendered Cap for rendered slots (e.g. 120)
   */
  public calculateFollowerSlots(
    count: number,
    steeringLean: number = 0,
    maxRendered: number = GAME_CONFIG.MAX_RENDERED_FOLLOWERS
  ): FormationSlot[] {
    const slotsToRender = Math.min(count, maxRendered);
    const slots: FormationSlot[] = [];

    // Lateral compression during tight turns
    const compression = 1.0 - Math.min(0.3, Math.abs(steeringLean) * 0.25);
    const effectiveColSpacing = this.colSpacing * compression;

    let currentIndex = 0;
    let row = 1;

    // Build wedge / staggered rows
    while (currentIndex < slotsToRender) {
      // Wedge expansion: row 1 has 2, row 2 has 3 or 4, up to maxColsPerRow
      const colsInThisRow = Math.min(this.maxColsPerRow, Math.min(slotsToRender - currentIndex, 1 + row));

      const rowZ = -row * this.rowSpacing;
      // Stagger trail bend based on steering lean and row depth
      const trailBendX = -steeringLean * (row * 0.12);

      const totalWidth = (colsInThisRow - 1) * effectiveColSpacing;
      const startX = -totalWidth / 2;

      for (let c = 0; c < colsInThisRow && currentIndex < slotsToRender; c++) {
        const slotX = startX + c * effectiveColSpacing + trailBendX;
        const slotY = 0;

        slots.push({
          index: currentIndex,
          row,
          col: c,
          targetOffsetX: slotX,
          targetOffsetY: slotY,
          targetOffsetZ: rowZ,
        });

        currentIndex++;
      }

      row++;
    }

    return slots;
  }

  /**
   * Ensures that offsets don't cause motorcycles to exceed road boundaries.
   */
  public clampToTrack(heroX: number, slotOffsetX: number, trackWidth: number = GAME_CONFIG.TRACK_WIDTH): number {
    const halfWidth = trackWidth / 2 - 0.6; // margin for bike width
    return MathUtils.clamp(heroX + slotOffsetX, -halfWidth, halfWidth);
  }
}
