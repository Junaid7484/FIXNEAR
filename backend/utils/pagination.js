/**
 * Safe, reusable pagination helpers.
 * Pagination is opt-in for backward compatibility: endpoints keep their
 * previous full-list response unless page or limit is supplied.
 */
const getPagination = (query = {}, defaultLimit = 10, maxLimit = 100) => {
  const requested = query.page !== undefined || query.limit !== undefined;
  const pageValue = Number.parseInt(query.page, 10);
  const limitValue = Number.parseInt(query.limit, 10);
  const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number.isFinite(limitValue) && limitValue > 0 ? limitValue : defaultLimit),
  );

  return {
    requested,
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const getPaginationMeta = (total, { page, limit }) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

const applyPagination = (query, pagination) => {
  if (!pagination?.requested) return query;
  return query.skip(pagination.skip).limit(pagination.limit);
};

module.exports = { getPagination, getPaginationMeta, applyPagination };
