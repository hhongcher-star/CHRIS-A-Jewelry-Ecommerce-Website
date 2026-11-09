import { AppError } from '../errors/app-error.js';

// The existing database requires an end date. Reserve MySQL's last DATETIME
// value as the "no end date" marker, so no destructive migration is needed.
export const NO_END_DATE = '9999-12-31T23:59:59.000Z';
const noEndTime = new Date(NO_END_DATE).getTime();

export function isUnlimitedPromotionEnd(value) {
  if (value === null || value === undefined) return false;
  return new Date(value).getTime() === noEndTime;
}

export function parsePromotionPeriod(startsAt, endsAt) {
  const starts = new Date(startsAt);
  const ends = endsAt === null ? new Date(NO_END_DATE) : new Date(endsAt);
  if (!Number.isFinite(starts.getTime()) || !Number.isFinite(ends.getTime()) || ends.getTime() > noEndTime || ends <= starts) {
    throw new AppError(400, 'INVALID_PROMOTION_DATES', 'Choose a valid start date and an end date after it.');
  }
  return { starts, ends };
}
