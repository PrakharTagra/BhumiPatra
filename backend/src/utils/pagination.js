/**
 * Pagination helper utility
 */
export const getPagination = (query, defaultLimit = 20, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const requestedLimit = parseInt(query.limit || String(defaultLimit), 10);
  const limit = Math.min(Math.max(1, requestedLimit), maxLimit);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    buildMeta: (total) => ({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 0,
    }),
  };
};

export default getPagination;
