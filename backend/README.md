# FixNear – Local Service Booking Platform

FixNear is a MERN-based platform that helps customers discover local service providers, request services, manage bookings, communicate about bookings, and make payments. Service providers can manage their profiles and service listings, respond to bookings, and view their activity. Administrators manage platform users, providers, services, categories, bookings, complaints, notifications, and settings.

> **Documentation basis:** This documentation was prepared from the `FixNear(3).zip` project snapshot uploaded on 8 November 2026. The archive contains a few files that do not match the newer local testing/startup changes discussed separately. See **Known snapshot differences** below before using this as a final submission copy.

## 1. Technology stack

### Frontend
- React 19
- Vite
- React Router
- Tailwind CSS
- Axios for HTTP requests
- Lucide React icons

### Backend
- Node.js
- Express 5
- MongoDB with Mongoose
- JSON Web Tokens (JWT) for authentication
- bcryptjs for password hashing
- Multer for multipart file uploads
- Cloudinary integration for media storage
- Nodemailer for email delivery
- Razorpay for online payments
- Helmet, CORS, and express-rate-limit for security and request protection

### Database and external services
- MongoDB / MongoDB Atlas
- Cloudinary (optional, depending on upload configuration)
- Razorpay (for online payment flows)
- SMTP email provider (for password reset and email workflows)
- OpenStreetMap Nominatim (for address geocoding/reverse geocoding)

## 2. User roles

### Customer
Customers can:
- Register, log in, and manage their profile.
- Browse service categories and available services.
- View service and provider details.
- Search for nearby providers using location and a selected radius.
- Create and review bookings.
- Track booking status and view booking details.
- Use booking chat where enabled.
- Save providers/services to favourites.
- Submit ratings and reviews.
- Receive notifications.
- Submit and track complaints.
- Use the password reset flow.

### Service provider
Providers can:
- Register and submit provider/business information.
- Log in and view application status.
- Manage their profile and service information.
- Add, update, and remove provider-specific service listings.
- View and respond to bookings.
- Update booking status through provider workflows.
- View earnings, reviews, and notifications.
- Manage provider settings and working-hour information where enabled.
- Contact provider help/support.

### Administrator
Administrators can:
- View dashboard statistics.
- Manage users and providers.
- Review provider verification/application status.
- Manage services and categories.
- View and manage bookings.
- Handle complaints.
- Manage notifications.
- Configure platform settings, including maintenance and booking/payment-related settings.
- Access administrative detail pages for users, providers, bookings, and notifications.

## 3. Main application modules

| Module | Purpose |
|---|---|
| Authentication | Customer/provider/admin access, JWT-protected requests, password reset |
| Services and categories | Public service discovery and administrative catalogue management |
| Provider directory | Provider registration, profile management, public listings, nearby search |
| Provider services | Services offered by an individual provider |
| Bookings | Booking creation, customer/provider booking views, status workflows |
| Payments | Cash and Razorpay-related payment workflows |
| Reviews | Customer ratings and provider reviews |
| Favourites | Customer-saved providers/services |
| Notifications | User notifications and read/unread handling |
| Complaints | Customer complaints and administrator resolution |
| Booking messages | Customer/provider messages associated with a booking |
| Location | Address geocoding and reverse geocoding |
| Admin settings | Platform configuration and maintenance status |
| Contact/support | Contact form and provider help workflows |

## 4. Repository structure

```text
FixNear/
├── backend/
│   ├── config/          # Database and Cloudinary configuration
│   ├── controllers/     # Request/business logic
│   ├── middleware/     # Authentication, roles, uploads, rate limits, errors
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route modules
│   ├── uploads/         # Local uploaded files (runtime data)
│   ├── utils/           # Shared helpers, pagination, tokens, notifications
│   ├── app.js            # Express app setup and route mounting in uploaded snapshot
│   ├── createAdmin.js    # Administrative account setup utility
│   ├── package.json
│   └── .env.example
└── Dashboard/
    ├── public/
    ├── src/
    │   ├── Admin/              # Admin screens
    │   ├── Customer/           # Customer dashboard screens
    │   ├── Provider/           # Provider dashboard screens
    │   ├── PublicDashboard/    # Public pages and discovery
    │   ├── components/         # Shared UI components
    │   ├── services/           # API client and frontend services
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    └── package.json
```

## 5. Database models

The backend snapshot contains these Mongoose models:

- `User` – customer/admin account data and authentication-related fields.
- `Provider` – provider business profile, verification, and location information.
- `Service` – platform service catalogue.
- `Category` – service categories.
- `ProviderService` – service offerings maintained by providers.
- `Booking` – customer/provider booking records and booking/payment status.
- `Payment` – payment-related records.
- `Review` – customer reviews and ratings.
- `Favorite` – customer favourites.
- `Message` – booking conversation messages.
- `Notification` – user notifications.
- `Complaint` – customer complaints and their administrative status.
- `AdminSettings` – platform-level configuration.
- `ProviderSettings` – provider-level preferences/settings.

### Location data
The nearby-provider feature uses geographic coordinates. The expected GeoJSON point format is:

```json
{
  "type": "Point",
  "coordinates": [longitude, latitude]
}
```

MongoDB geospatial queries require valid coordinate pairs. Longitude is stored first, latitude second. Do not save a Point object with missing or invalid coordinates.

## 6. Backend API overview

The backend exposes REST-style endpoints under `/api`. The route modules are mounted as follows:

| Route prefix | Responsibility |
|---|---|
| `/api/auth` | Registration, login, current-user information, password changes and password reset |
| `/api/services` | Public service catalogue and admin service management |
| `/api/categories` | Category listing and admin category management |
| `/api/providers` | Provider registration, login, profile, directory and nearby search |
| `/api/providers/services` | Provider service listings |
| `/api/bookings` | Booking creation, retrieval, status and payment workflows |
| `/api/reviews` | Provider reviews and customer review management |
| `/api/favorites` | Customer favourites |
| `/api/notifications` | User and admin notifications |
| `/api/complaints` | Customer complaints and admin complaint handling |
| `/api/users` | User profile and admin user management |
| `/api/provider-settings` | Provider preferences/settings |
| `/api/admin` | Administrative dashboard and management |
| `/api/contact` | Contact form |
| `/api/location` | Geocoding and reverse geocoding |
| `/api/bookings/:bookingId/messages` | Booking conversation messages (mounted through the message router) |
| `/api/maintenance-status` | Public maintenance-mode status |
| `/` | API health/root response |

### Authentication and authorization
Protected endpoints use JWT authentication middleware. Role authorization is applied to role-specific operations, such as customer booking/review actions, provider service and booking management, and administrator management endpoints.

The API root health response in the uploaded snapshot is:

```json
{
  "success": true,
  "message": "FIXNEAR API is running"
}
```

Unknown routes return a JSON 404 response. The application also registers a centralized error handler.

For a detailed route-by-route reference, see [API Overview](docs/API_OVERVIEW.md).

## 7. Environment configuration

Create `backend/.env` from `backend/.env.example`. Fill in values locally; never commit real credentials.

Variable names present in the uploaded example:

| Variable | Purpose |
|---|---|
| `PORT` | Backend listening port |
| `NODE_ENV` | Runtime environment |
| `MONGO_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign/verify JWTs |
| `JWT_EXPIRES_IN` | Token lifetime |
| `RAZORPAY_KEY_ID` | Razorpay public/key identifier |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signature verification |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `EMAIL_USER` | SMTP account |
| `EMAIL_PASS` / `EMAIL_PASSWORD` | SMTP app password (confirm which key the active mail helper reads) |
| `CONTACT_RECEIVER_EMAIL` | Contact form recipient |
| `ADMIN_EMAIL` | Initial administrator email for setup utility |
| `ADMIN_PASSWORD` | Initial administrator password for setup utility |
| `NOMINATIM_EMAIL` | Contact identity for geocoding requests |
| `NOMINATIM_USER_AGENT` | Application user-agent for geocoding requests |

Use a long, unique JWT secret and strong credentials. Do not place secrets in frontend variables or source control. Frontend-exposed Vite variables are public to browser users.

## 8. Local development setup

### Prerequisites
- Node.js 18 or later (the project uses Express 5; use a currently supported Node.js LTS release).
- npm.
- A MongoDB database (local MongoDB or MongoDB Atlas).
- Credentials for optional integrations you intend to test (SMTP, Cloudinary, Razorpay).

### Backend setup

```bash
cd FixNear/backend
npm install
```

1. Copy `.env.example` to `.env`.
2. Fill in the required environment variables.
3. Start the backend using the startup arrangement in your current working tree.

**Important:** The uploaded ZIP snapshot has the server listener inside `app.js` and does not contain `server.js`. In the newer local arrangement discussed separately, `server.js` starts the server and `app.js` should only configure/export the Express app. Do not mix the two arrangements. Use the command matching the files currently on your computer:
- Uploaded snapshot: `node app.js`
- Split app/server arrangement: `node server.js` (or the matching npm script if you add one).

The backend is expected to use port `5000` unless `PORT` is changed.

### Frontend setup

```bash
cd FixNear/Dashboard
npm install
npm run dev
```

Vite normally serves the frontend at `http://localhost:5173`.

The frontend API client must point to the backend API base URL. Confirm the API base URL in the current `Dashboard/src/services` configuration before starting the app.

### Production frontend build

```bash
cd FixNear/Dashboard
npm run build
npm run preview
```

The build output is written to `Dashboard/dist`. Deploy the generated static files to a static hosting provider and configure the backend API URL and CORS origin for the production domains.

## 9. Testing and verification

The uploaded ZIP snapshot does **not** contain the Jest/Supertest test setup discussed in the latest local development conversation. Its backend `package.json` still has the placeholder test command. Therefore, do not report automated backend tests as included in this ZIP until the current `package.json`, test files, and server/app separation have been copied into the project and verified.

Recommended verification checklist:

- [ ] Backend starts and connects to MongoDB.
- [ ] `GET /` returns HTTP 200 and the expected health JSON.
- [ ] Unknown API route returns HTTP 404.
- [ ] Customer registration and login work.
- [ ] Provider registration, login, and application status work.
- [ ] Password reset email and reset-token expiry work.
- [ ] Public service/category listings work.
- [ ] Nearby provider search returns providers within the selected radius.
- [ ] Customer can create, view, and cancel a booking.
- [ ] Provider can view and update assigned bookings.
- [ ] Payment success, failure, and cancellation states are handled correctly.
- [ ] Reviews, favourites, notifications, complaints and booking messages work.
- [ ] Admin access and management pages enforce admin authorization.
- [ ] Frontend production build succeeds.

## 10. Security and operational notes

- Keep `.env` out of Git and out of submission archives.
- Do not publish MongoDB, JWT, SMTP, Cloudinary, or Razorpay secrets.
- Use HTTPS in production.
- Configure CORS for the actual deployed frontend origin, not a wildcard when credentials are enabled.
- Keep authentication and role checks on the backend; hiding a frontend button is not authorization.
- Keep request body limits and rate limits enabled.
- Validate uploaded file type and size on the server.
- Verify Razorpay signatures on the backend; never trust a frontend payment-success message alone.
- Use a real production SMTP configuration for password reset.
- Review geocoding provider usage policies and identify the application appropriately.
- Back up MongoDB and monitor server logs without printing secrets or password-reset tokens.

## 11. Known snapshot differences and finalization items

The 8 November archive differs from the latest code described in the conversation:

1. `backend/package.json` in the archive still has `"test": "echo \"Error: no test specified\" && exit 1"` and does not list Jest/Supertest.
2. `backend/app.js` in the archive calls `connectDB()` and `app.listen()`.
3. The archive does not contain `backend/server.js` or `backend/tests/app.test.js`, although these were shown in the newer local workflow.
4. The frontend `Dashboard/README.md` is still the default Vite template and should be replaced with this project README or removed.
5. The archive contains `backend/.env`; remove it from any shared/submission ZIP and rotate any credentials if that archive was shared outside a trusted environment.
6. Exclude `node_modules`, `dist`, runtime uploads that are not required for the demo, and real `.env` files from the final source archive.

Before submission, create a fresh ZIP from the current working project after reconciling these differences. Then rerun backend tests and the frontend production build.

## 12. External technical references

- [Express 5 documentation](https://expressjs.com/en/5x/)
- [Express routing guide](https://expressjs.com/en/5x/guide/routing/)
- [Express error handling](https://expressjs.com/en/5x/guide/error-handling/)
- [Mongoose documentation](https://mongoosejs.com/docs/)
- [Vite documentation](https://vite.dev/guide/)
- [React documentation](https://react.dev/learn)
- [MongoDB geospatial queries](https://www.mongodb.com/docs/manual/geospatial-queries/)
- [Razorpay documentation](https://razorpay.com/docs/)
- [Cloudinary documentation](https://cloudinary.com/documentation)
