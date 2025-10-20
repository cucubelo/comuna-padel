import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { isAfter, parseISO, formatISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Get the user's current timezone
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Could not detect user timezone, falling back to Europe/Madrid');
    return 'Europe/Madrid';
  }
}

/**
 * Convert local date and time to UTC for database storage
 */
export function convertToUTC(
  dateString: string, 
  timeString: string, 
  timezone: string
): Date {
  const combinedDateTime = `${dateString}T${timeString}`;
  const localDate = new Date(combinedDateTime);
  return fromZonedTime(localDate, timezone);
}

/**
 * Convert UTC date to local timezone for display
 */
export function convertFromUTC(
  utcDate: Date | string, 
  timezone: string
): Date {
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return toZonedTime(date, timezone);
}

/**
 * Validate that a match date/time is not in the past
 */
export function validateMatchDateTime(
  dateString: string,
  timeString: string,
  timezone: string
): { isValid: boolean; error?: string } {
  try {
    const matchDateTime = `${dateString}T${timeString}`;
  const matchDate = new Date(matchDateTime);
  const nowInTimezone = toZonedTime(new Date(), timezone);

  if (!isAfter(matchDate, nowInTimezone)) {
      return {
        isValid: false,
        error: 'La fecha y hora del partido no puede ser en el pasado'
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Fecha u hora inválida'
    };
  }
}

/**
 * Format a date for display in a specific timezone
 */
export function formatMatchDateTime(
  utcDate: Date | string,
  timezone: string,
  options: {
    showTimezone?: boolean;
    dateFormat?: string;
    timeFormat?: string;
  } = {}
): string {
  const {
    showTimezone = false,
    dateFormat = 'dd/MM/yyyy',
    timeFormat = 'HH:mm'
  } = options;

  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  const localDate = toZonedTime(date, timezone);

  const formattedDate = format(localDate, dateFormat, { 
    timeZone: timezone,
    locale: es 
  });
  const formattedTime = format(localDate, timeFormat, { 
    timeZone: timezone,
    locale: es 
  });

  let result = `${formattedDate} a las ${formattedTime}`;

  if (showTimezone) {
    const timezoneAbbr = getTimezoneAbbreviation(timezone);
    result += ` (${timezoneAbbr})`;
  }

  return result;
}

/**
 * Get timezone abbreviation for display
 */
export function getTimezoneAbbreviation(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('es', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    
    const parts = formatter.formatToParts(now);
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    
    return timeZonePart?.value || timezone.split('/').pop() || timezone;
  } catch (error) {
    return timezone.split('/').pop() || timezone;
  }
}

/**
 * Get current date and time in a specific timezone for form defaults
 */
export function getCurrentDateTimeInTimezone(timezone: string): {
  date: string;
  time: string;
} {
  const now = new Date();
  const localTime = toZonedTime(now, timezone);
  
  // Add 1 hour to current time as default
  localTime.setHours(localTime.getHours() + 1);
  
  const date = format(localTime, 'yyyy-MM-dd', { timeZone: timezone });
  const time = format(localTime, 'HH:mm', { timeZone: timezone });
  
  return { date, time };
}

/**
 * Check if two timezones are the same
 */
export function isSameTimezone(tz1: string, tz2: string): boolean {
  return tz1 === tz2;
}

/**
 * Get a user-friendly timezone name
 */
export function getTimezoneName(timezone: string): string {
  const timezoneNames: Record<string, string> = {
    'Europe/Madrid': 'España (Madrid)',
    'Europe/Barcelona': 'España (Barcelona)',
    'America/Argentina/Buenos_Aires': 'Argentina (Buenos Aires)',
    'America/Mexico_City': 'México (Ciudad de México)',
    'America/Bogota': 'Colombia (Bogotá)',
    'America/Lima': 'Perú (Lima)',
    'America/Santiago': 'Chile (Santiago)',
    'Europe/London': 'Reino Unido (Londres)',
    'Europe/Paris': 'Francia (París)',
    'Europe/Rome': 'Italia (Roma)',
    'America/New_York': 'Estados Unidos (Nueva York)',
    'America/Los_Angeles': 'Estados Unidos (Los Ángeles)',
  };

  return timezoneNames[timezone] || timezone.replace('_', ' ').replace('/', ' - ');
}

/**
 * Convert match data for database storage
 */
export function prepareMatchDataForStorage(
  dateString: string,
  timeString: string,
  organizerTimezone: string
): {
  scheduled_at: string; // UTC ISO string
  timezone: string;
} {
  const combinedDateTime = `${dateString}T${timeString}`;
  const localDate = new Date(combinedDateTime);
  const utcDate = fromZonedTime(localDate, organizerTimezone);
  
  return {
    scheduled_at: formatISO(utcDate),
    timezone: organizerTimezone
  };
}

/**
 * Parse match data from database for display
 */
export function parseMatchDataForDisplay(
  utcDateString: string,
  originalTimezone: string,
  displayTimezone?: string
): {
  localDate: Date;
  formattedDateTime: string;
  isOriginalTimezone: boolean;
} {
  const targetTimezone = displayTimezone || getUserTimezone();
  const localDate = convertFromUTC(utcDateString, targetTimezone);
  const isOriginalTimezone = isSameTimezone(originalTimezone, targetTimezone);
  
  let formattedDateTime = formatMatchDateTime(utcDateString, targetTimezone, {
    showTimezone: !isOriginalTimezone
  });

  // If showing in different timezone, add original timezone info
  if (!isOriginalTimezone) {
    const originalFormatted = formatMatchDateTime(utcDateString, originalTimezone, {
      timeFormat: 'HH:mm'
    });
    const originalTzName = getTimezoneAbbreviation(originalTimezone);
    formattedDateTime += ` (${originalFormatted.split(' a las ')[1]} ${originalTzName})`;
  }

  return {
    localDate,
    formattedDateTime,
    isOriginalTimezone
  };
}