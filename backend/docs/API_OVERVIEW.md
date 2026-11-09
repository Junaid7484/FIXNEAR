# FixNear API Overview

This document describes the route modules mounted by the backend snapshot uploaded on 8 November 2026. It is an overview, not a replacement for inspecting the route/controller source before publishing a public API contract.

## Base URL

Local development: `http://localhost:5000`

API prefix: `/api`

## Response conventions

The root health endpoint returns:

```http
GET /
```

```json
{
  "success": true,
  "message": "FIXNEAR API is running"
}
```

The not-found handler returns HTTP 404:

```json
{
  "success": false,
  "message": "API endpoint not found."
}
```

Exact status codes and response bodies for individual operations are defined by their controllers.

## Route groups

| HTTP path prefix | Main operations |
|---|---|
| `/api/auth` | `POST /register`, `POST /login`, `POST /forgot-password`, `POST /reset-password`, `GET /me`, `PUT /change-password` |
| `/api/services` | `GET /`, `GET /:id`; administrative create/update/delete/list operations |
| `/api/categories` | `GET /`, `GET /:id`; administrative create/update/delete/list operations |
| `/api/providers` | `POST /register`, `POST /login`, `GET /nearby`, `GET /`, `GET /my/profile`, provider profile/service-related actions, admin verification/status actions, `GET /:id` |
| `/api/providers/services` | `GET /service/:serviceId`, `GET /provider/:providerId`, provider-owned list/create/update/delete operations under `/my` |
| `/api/bookings` | Customer booking creation/listing, provider booking listing, booking detail and status operations, admin booking management, payment-related actions |
| `/api/reviews` | `POST /`, `GET /provider/:providerId`, `GET /my`, `DELETE /:id` |
| `/api/favorites` | `POST /`, `GET /my`, favourite lookup/removal operations |
| `/api/notifications` | `GET /my`, `GET /unread-count`, mark one/all read, delete, admin notification management |
| `/api/complaints` | `POST /`, `GET /my`, admin list/update, complaint detail |
| `/api/users` | `GET /profile`, `PUT /profile`, admin list/detail/status operations |
| `/api/provider-settings` | `GET /`, `PUT /` |
| `/api/admin` | Dashboard, providers, users, settings and other administrative operations |
| `/api/contact` | `POST /` |
| `/api/location` | `POST /geocode`, `POST /reverse` |
| `/api` (message router) | `GET /bookings/:bookingId/messages`, `POST /bookings/:bookingId/messages` |
| `/api/maintenance-status` | `GET /` |

## Authentication

Protected endpoints expect a valid bearer token in the `Authorization` header, according to the backend authentication middleware:

```http
Authorization: Bearer <JWT>
```

Some routes also enforce a role, such as `customer`, `provider`, or `admin`. The backend is the authority for permissions.

## Pagination

The project includes a shared pagination helper. Where pagination is enabled, inspect the relevant controller for supported query parameters and response metadata. Do not assume every endpoint supports pagination merely because the helper exists.

## Location search

The nearby-provider feature accepts coordinates and a radius in its search workflow. Provider location uses GeoJSON Point coordinates in `[longitude, latitude]` order. The exact query parameter names and allowed radius values should be confirmed against the active nearby-provider controller and frontend before publishing an integration contract.

## Payments

The booking module includes payment-related flows, including Razorpay integration. The backend must verify payment signatures and determine final payment/booking state. The client must not treat a dismissed or cancelled checkout as a successful paid booking.

## API maintenance

When adding or changing an endpoint:
1. Add/modify the route in the appropriate `backend/routes` module.
2. Implement request validation and business logic in the controller.
3. Apply authentication and role middleware as required.
4. Use the shared error middleware for failures.
5. Add or update automated tests.
6. Update this document with exact method, path, authentication, query/body schema, and response shape.
