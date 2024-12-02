import { DateTime } from 'luxon';

/**
 * Methods related to handling timezone logic between local and UTC for database
 * operations.
 *
 * Converts user timezone dates to UTC for storage and handles date range
 * calculations.
 *
 * All methods return JavaScript Date objects compatible with database timestamps.
 */
class TimezoneHandler {

  /** Converts a date from user's timezone to UTC. */
  toUTC(date: Date | string, timezone: string): Date {
    const luxonDate = typeof date === 'string'
      ? DateTime.fromISO(date, { zone: timezone })
      : DateTime.fromJSDate(date, { zone: timezone });

    return luxonDate.toUTC().toJSDate();
  }

  /** Method for use in database queries */
  getDateRangeForWeek(weekStart: Date | string, timezone: string): {
    start: Date;
    end: Date;
  } {
    const startLuxon = typeof weekStart === 'string'
      ? DateTime.fromISO(weekStart, { zone: timezone })
      : DateTime.fromJSDate(weekStart, { zone: timezone });

    const endLuxon = startLuxon.plus({ days: 7 });

    return {
      start: startLuxon.toUTC().toJSDate(),
      end: endLuxon.toUTC().toJSDate()
    };
  }

  /** Method for use in creating feeding entries */
  createFeedingTime(date: Date | string, currentTime: Date | string, timezone: string): Date {
    const dateLuxon = typeof date === 'string'
      ? DateTime.fromISO(date, { zone: timezone })
      : DateTime.fromJSDate(date, { zone: timezone });

    const timeLuxon = typeof currentTime === 'string'
      ? DateTime.fromISO(currentTime, { zone: timezone })
      : DateTime.fromJSDate(currentTime, { zone: timezone });

    return dateLuxon.set({
      hour: timeLuxon.hour,
      minute: timeLuxon.minute,
      second: timeLuxon.second
    }).toUTC().toJSDate();
  }
}

export default TimezoneHandler;