/**
 * Shared Pagination Utilities
 * Standardizes parsing query parameters and constructing paginated envelopes.
 */

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationQueryInput {
  page?: unknown;
  limit?: unknown;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Parses and bounds page and limit query parameters safely.
 *
 * @param query Object containing optional page and limit
 * @param defaultLimit Default limit if unspecified (defaults to 10)
 * @param maxLimit Maximum allowed limit (defaults to 100)
 */
export function parsePaginationParams(
  query: PaginationQueryInput = {},
  defaultLimit = 10,
  maxLimit = 100
): PaginationParams {
  const parsedPage =
    typeof query.page === 'number'
      ? query.page
      : parseInt(String(query.page || ''), 10);
  const page = !isNaN(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

  const parsedLimit =
    typeof query.limit === 'number'
      ? query.limit
      : parseInt(String(query.limit || ''), 10);
  const rawLimit =
    !isNaN(parsedLimit) && parsedLimit > 0 ? Math.floor(parsedLimit) : defaultLimit;
  const limit = Math.min(rawLimit, maxLimit);

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Builds a standardized paginated response envelope.
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    data,
    total,
    page,
    limit,
    totalPages,
  };
}
