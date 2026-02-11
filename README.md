# CampusSponsor

CampusSponsor is a full-stack college event sponsorship platform built from the provided SRS and SDD.

## Project Structure

- `reference_docs/srs.md`
- `reference_docs/sdd.md`
- `public/` - HTML, CSS, and client-side JavaScript
- `src/` - backend source code
- `.env` - runtime environment variables
- `package.json` - root project scripts and dependencies

## Backend Setup

1. Copy `.env.example` to `.env`.
2. Create the MySQL database:

```sql
CREATE DATABASE campussponsor;
```

3. Make sure MySQL is running on `127.0.0.1:3306` or update the `.env` file.
4. Make sure MongoDB is running locally or update `MONGO_URI`.
5. Install dependencies:

```bash
npm install
```

6. Start the server:

```bash
npm run dev
```

The backend boot process automatically creates the MySQL tables from `src/services/schema.sql` and serves the frontend from `public/`.

## Default Local URL

- App: `http://localhost:4000`

## Features Implemented

- JWT auth for club, company, and admin roles
- Profile management
- Event creation with brochure and poster uploads
- Sponsorship tier management
- Event discovery with filters
- Collaboration requests and responses
- Polling-based chat with file attachments
- Media upload and retrieval
- Role-aware dashboards
- Admin moderation for users and event approvals
