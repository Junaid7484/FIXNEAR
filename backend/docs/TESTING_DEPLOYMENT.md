# FixNear – Testing, Deployment and Submission Checklist

## Backend test setup status

The uploaded `FixNear(3).zip` does not include the latest Jest/Supertest setup described in the conversation. In that archive:
- `backend/package.json` has a placeholder `test` script.
- `backend/tests/app.test.js` is absent.
- `backend/server.js` is absent.
- `backend/app.js` both configures Express and starts the database/server.

The local working tree discussed separately may already have newer files. Synchronize the current local files into the final project before relying on this document as evidence of test coverage.

## Suggested backend test cases

### Health and routing
- Root endpoint returns HTTP 200 with expected JSON.
- Unknown API path returns HTTP 404.
- Error middleware returns a safe error response.

### Authentication
- Valid registration succeeds.
- Duplicate email is rejected.
- Valid login returns an access token.
- Invalid password is rejected.
- Protected route rejects missing/invalid token.
- Role-restricted route rejects the wrong role.
- Forgot-password response does not disclose whether an email exists.
- Expired/invalid reset token is rejected.

### Booking and payment
- Customer can create a valid booking.
- Provider can only access assigned bookings.
- Invalid status transitions are rejected.
- Payment signature verification rejects tampered signatures.
- Cancelled/failed Razorpay checkout does not leave a paid booking.
- Duplicate payment callbacks do not duplicate payment records.

### Data and pagination
- Pagination defaults and maximum limit are enforced.
- Sorting is stable where cursor pagination is used.
- GeoJSON location validation rejects missing or out-of-range coordinates.
- User/provider access boundaries are enforced.

## Frontend verification
Run from `Dashboard`:

```bash
npm install
npm run build
```

Then manually test the main flows in a browser:
- Public navigation and service search.
- Customer registration/login/password reset.
- Nearby services and radius filtering.
- Booking creation and confirmation.
- Booking chat and notifications.
- Provider registration and dashboard.
- Provider booking response/status updates.
- Admin login and management pages.
- Responsive layout on desktop and mobile widths.

## Production deployment outline

1. Provision MongoDB and create a least-privilege database user.
2. Configure backend environment variables in the hosting provider's secret manager.
3. Deploy the backend and configure its public URL.
4. Set production CORS to the exact frontend domain.
5. Configure SMTP, Razorpay webhook/signature secrets, and Cloudinary as needed.
6. Build the frontend with the production API base URL.
7. Deploy `Dashboard/dist` to static hosting.
8. Configure SPA fallback so client-side routes resolve to `index.html`.
9. Test authentication cookies/headers, CORS, uploads, payment callbacks and email delivery in production.
10. Enable HTTPS, backups, monitoring and log redaction.

## Final source archive rules

Include:
- Backend source (`config`, `controllers`, `middleware`, `models`, `routes`, `utils`).
- Frontend source (`src`, `public`, package files, Vite config).
- `.env.example` with placeholder values.
- README and documentation.

Exclude:
- `.env` and all real secrets.
- `node_modules`.
- `Dashboard/dist` unless a deployment artifact is explicitly requested.
- Temporary logs, caches, and unnecessary runtime uploads.
- Database dumps containing personal/customer information.

Before submission, inspect the ZIP contents and search for secret-like values. Rotate any credential that may have been included in a shared archive.
