# FixNear Step 6 — Backend pagination and indexes

This update adds opt-in pagination to existing list APIs while preserving legacy behavior for current frontend screens. Requests without `page` or `limit` continue returning the full list, so existing screens do not suddenly show only the first page.

## Pagination query format

Append `?page=1&limit=10` to a supported endpoint. `limit` is capped at 100.

Example:

`GET /api/bookings/my?page=1&limit=10`

The existing response array remains unchanged (`bookings`, `users`, etc.) and a `pagination` object is added when pagination is requested:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Updated endpoints

- `GET /api/admin/users`
- `GET /api/admin/providers`
- `GET /api/bookings/my`
- `GET /api/bookings/provider/my`
- `GET /api/bookings` (admin)
- `GET /api/complaints/my`
- `GET /api/complaints` (admin)
- `GET /api/favorites/my`
- `GET /api/notifications/my`
- `GET /api/reviews/my`

## Added indexes

- Booking: customer + createdAt, provider + createdAt, provider + status + createdAt
- User: createdAt, role + isActive
- Provider: createdAt, verified + available + createdAt
- Notification: user + createdAt, user + isRead + createdAt
- Favorite: customer + createdAt
- ProviderService: provider + isActive + createdAt

Existing indexes were retained. MongoDB will create missing indexes when the corresponding Mongoose models initialize (subject to the project's `autoIndex` configuration and database permissions).

## Compatibility and next work

No route paths or existing response-array names were changed. The frontend has not yet been switched to request page/limit or display page controls; that is the next part of Step 6. Do not mark Step 6 complete until frontend pagination is connected and tested.

## Validation performed

- `node --check` passed for all changed backend JavaScript files.
- No live MongoDB integration test was run in this environment.

## Frontend pagination integration (2026-11-07)

- Added `Dashboard/src/components/PaginationControls.jsx` as a reusable server-pagination control.
- Connected Admin Manage Users to `GET /api/admin/users?page=&limit=&search=&status=`.
- Connected Admin Manage Providers to `GET /api/admin/providers?page=&limit=` and the existing provider pagination UI now follows server metadata rather than slicing the current page a second time.
- Connected Customer My Bookings to `GET /api/bookings/my?page=&limit=`.
- Connected Provider My Bookings to `GET /api/bookings/provider/my?page=&limit=`.
- Connected Customer and Admin Complaints to their paginated complaint endpoints.
- Connected Customer Favorites and Customer/Provider Notifications to their paginated endpoints.
- Added server-side customer role, active/inactive status, and search filtering to the admin users endpoint so pagination totals match the displayed customer directory.

The provider reviews page still uses its existing provider-specific reviews endpoint, which is not one of the paginated `my reviews` endpoints. Its pagination should be implemented separately if that endpoint is also to be paginated.

## Validation update

- `node --check` passed for all backend JavaScript files.
- A full Vite production build could not be run in this environment because dependency installation timed out. Run `npm ci` and `npm run build` inside `Dashboard` locally before deployment.
- Live MongoDB pagination/index tests have not been run. Verify the indexes in the target database and test pages 1, 2, and the last page with real data.
