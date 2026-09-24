# Smart Medicine Reminder

## Project objective

Smart Medicine Reminder is a college-project prototype that helps a user keep track of scheduled medicines. It covers the main demonstration flow:

**Create an account → add a medicine → upload a tablet photo → set a time → wait for the browser reminder → mark Taken or Skipped.**

This is a reminder and record-keeping tool. It does not diagnose, identify real medicines reliably, recommend treatment, or provide medical advice.

## Features

- Registration and login with hashed passwords and cookie-based sessions
- Dashboard with:
  - Today's reminders
  - Next scheduled dose
  - Adherence percentage
  - Medicine shelf
- Add, edit, and delete medicines
- Medicine image upload preview, stored with the medicine record
- Once daily, twice daily, three times daily, and custom reminder times
- Start and optional end dates
- Reminders filtered by today, upcoming, completed, skipped, or all
- Taken, Skipped, and Dismiss alarm actions
- Browser reminder modal with tablet image, alarm tone, and notification support
- Demo-only tablet identifier with a clearly labeled disclaimer
- Responsive layouts for desktop and mobile

## Technology stack

The Replit prototype uses the workspace's native runnable stack so the app can preview and publish inside this project:

- Frontend: React + Vite, HTML, CSS, JavaScript/TypeScript
- Backend: Express REST API
- Database: PostgreSQL with Drizzle ORM
- Validation: OpenAPI-generated Zod schemas
- File input: browser image previews stored as image data for the college prototype

The API contract is kept separate in `lib/api-spec/openapi.yaml`, so the backend can be ported to Flask/MySQL later without changing the product surface.

## System architecture

```text
Browser
  │
  ├── React/Vite pages and reminder polling
  │       └── typed API hooks generated from OpenAPI
  │
  └── /api requests
          │
          ▼
      Express REST API
          │
          ├── cookie sessions + password hashing
          ├── medicine and reminder routes
          └── demo tablet identifier
          │
          ▼
      PostgreSQL + Drizzle tables
      users → medicines → reminders
```

## Database structure

- `users`: profile details and password hash
- `sessions`: expiring browser sessions linked to a user
- `medicines`: medicine name, dosage, image data, frequency, dates, and reminder times
- `reminders`: generated date/time entries with upcoming, due, taken, or skipped status

Foreign keys cascade from users to medicines and medicines to reminders.

## API endpoints

### Authentication

- `POST /api/register`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`

### Dashboard

- `GET /api/dashboard/summary`

### Medicines

- `GET /api/medicines`
- `POST /api/medicines`
- `GET /api/medicines/:id`
- `PATCH /api/medicines/:id`
- `DELETE /api/medicines/:id`

### Reminders

- `GET /api/reminders?filter=today|upcoming|completed|skipped|all`
- `POST /api/reminders`
- `PATCH /api/reminders/:id/taken`
- `PATCH /api/reminders/:id/skipped`
- `PATCH /api/reminders/:id/dismiss`

### Tablet prototype

- `POST /api/tablet/identify`

## Configuration

The Replit project supplies the development PostgreSQL connection through `DATABASE_URL`. The database schema is applied with:

```bash
pnpm --filter @workspace/db run push
```

For a local copy, provide:

```text
DATABASE_URL=postgresql://...
SESSION_SECRET=your-development-secret
```

Never place database credentials in frontend code or commit them to the repository.

## Run in Replit

The project has two managed services:

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/smart-medicine-reminder run dev
```

Open the web preview, choose **Create Account**, and use the generated demo medicine to see the dashboard immediately. To test the alarm quickly, add a medicine with a time a few minutes in the future while the preview remains open. Browser notification permission and audio autoplay depend on the browser.

## Testing the reminder

1. Create an account.
2. Open **Add medicine**.
3. Enter a medicine name and dosage.
4. Choose an image if desired.
5. Set a reminder time.
6. Keep the app open until the time arrives.
7. The app polls today's reminders and shows the reminder modal when the status becomes due.
8. Use **Taken**, **Skip**, or **Dismiss alarm**.
9. Open **Reminders** to verify the saved status and **Today** to verify adherence.

Browser alarms are reliable while the app is open or active. Notifications require browser permission, and a browser cannot guarantee alarms when the page is closed or the device is asleep.

## Known limitations

- The tablet identifier is a deterministic demonstration response, not an ML model and not a medicine safety tool.
- Reminder generation is capped at 90 days per medicine in this prototype.
- Image data is kept with the medicine record for a simple expo demo; production deployments should move image bytes to object storage and keep only a protected object path in the database.
- The Replit-native runtime currently uses Express/PostgreSQL for immediate preview. The OpenAPI boundary makes a Flask/MySQL implementation a contained backend replacement for a later deployment target.