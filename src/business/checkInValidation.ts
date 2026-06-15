import { CheckInType } from "../types/EmployeeCheckIn";

export const CHECK_IN_COOLDOWN_MS = 15 * 60 * 1000;

export type CheckInEntryLike = {
  type: CheckInType | string;
  date: Date | string;
};

export enum CheckInValidationCode {
  OPEN_CHECK_IN = "OPEN_CHECK_IN",
  COOLDOWN_AFTER_CHECK_OUT = "COOLDOWN_AFTER_CHECK_OUT",
  NO_OPEN_CHECK_IN = "NO_OPEN_CHECK_IN",
  COOLDOWN_AFTER_CHECK_IN = "COOLDOWN_AFTER_CHECK_IN",
}

export type CheckInValidationResult = {
  valid: boolean;
  code?: CheckInValidationCode;
};

function _toTime(value: Date | string): number {
  return new Date(value).getTime();
}

function _sortEntries(entries: CheckInEntryLike[]): CheckInEntryLike[] {
  return [...entries].sort((a, b) => {
    const diff = _toTime(a.date) - _toTime(b.date);
    if (diff !== 0) {
      return diff;
    }

    if (a.type === CheckInType.CHECK_IN && b.type === CheckInType.CHECK_OUT) {
      return -1;
    }
    if (a.type === CheckInType.CHECK_OUT && b.type === CheckInType.CHECK_IN) {
      return 1;
    }

    return 0;
  });
}

/**
 * Validates whether a new check-in or check-out can be appended to the timeline.
 * Rules:
 * - No check-in while an open check-in exists (unclosed pair).
 * - No check-in within 15 minutes after a check-out.
 * - No check-out without an open check-in.
 * - No check-out within 15 minutes after the matching check-in.
 */
export function validateCheckInEntry(
  existingEntries: CheckInEntryLike[],
  proposedType: CheckInType,
  proposedDate: Date
): CheckInValidationResult {
  const proposed: CheckInEntryLike = { type: proposedType, date: proposedDate };
  const timeline = _sortEntries([...existingEntries, proposed]);

  let openCheckIn: CheckInEntryLike | null = null;
  let lastCheckOut: CheckInEntryLike | null = null;

  for (const entry of timeline) {
    if (entry.type === CheckInType.CHECK_IN) {
      if (openCheckIn) {
        return entry === proposed
          ? { valid: false, code: CheckInValidationCode.OPEN_CHECK_IN }
          : { valid: false, code: CheckInValidationCode.OPEN_CHECK_IN };
      }

      if (
        lastCheckOut
        && _toTime(entry.date) < _toTime(lastCheckOut.date) + CHECK_IN_COOLDOWN_MS
      ) {
        return entry === proposed
          ? { valid: false, code: CheckInValidationCode.COOLDOWN_AFTER_CHECK_OUT }
          : { valid: false, code: CheckInValidationCode.COOLDOWN_AFTER_CHECK_OUT };
      }

      openCheckIn = entry;
      continue;
    }

    if (!openCheckIn) {
      return entry === proposed
        ? { valid: false, code: CheckInValidationCode.NO_OPEN_CHECK_IN }
        : { valid: false, code: CheckInValidationCode.NO_OPEN_CHECK_IN };
    }

    if (_toTime(entry.date) < _toTime(openCheckIn.date) + CHECK_IN_COOLDOWN_MS) {
      return entry === proposed
        ? { valid: false, code: CheckInValidationCode.COOLDOWN_AFTER_CHECK_IN }
        : { valid: false, code: CheckInValidationCode.COOLDOWN_AFTER_CHECK_IN };
    }

    openCheckIn = null;
    lastCheckOut = entry;
  }

  return { valid: true };
}
