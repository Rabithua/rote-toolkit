/**
 * Parse comma-separated tags string into an array of trimmed, non-empty tags.
 */
export function parseTags(tagsRaw?: string): string[] {
  if (!tagsRaw) {
    return [];
  }

  return tagsRaw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/**
 * Validate date format (YYYY-MM-DD).
 */
export function isValidDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

/**
 * Validate that a date string represents a valid calendar date.
 */
export function isValidCalendarDate(date: string): boolean {
  if (!isValidDateFormat(date)) {
    return false;
  }

  const dateObj = new Date(date + "T00:00:00Z");
  if (isNaN(dateObj.getTime())) {
    return false;
  }

  // Check that parsing back gives the same date
  return dateObj.toISOString().slice(0, 10) === date;
}

/**
 * Validate pagination parameters.
 */
export function validatePagination(
  limit?: number,
  skip?: number
): { limit: number; skip: number } {
  const parsedLimit = limit ?? 10;
  const parsedSkip = skip ?? 0;

  if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
    throw new Error("Invalid limit: must be a positive integer");
  }

  if (!Number.isFinite(parsedSkip) || parsedSkip < 0) {
    throw new Error("Invalid skip: must be a non-negative integer");
  }

  return { limit: parsedLimit, skip: parsedSkip };
}
