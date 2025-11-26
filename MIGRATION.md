# Postgres -> MongoDB Migration (Mongoose)

This document describes how to migrate data from the existing Postgres database to MongoDB using the provided migration script.

Prerequisites
- Node.js installed (>=16)
- Access to the running Postgres instance (DATABASE_URL env var)
- Running MongoDB instance (MONGODB_URI env var)

Steps
1. Install dependencies in the backend folder:

```bash
cd backend
npm ci
```

2. Build backend so model files are available in `dist` (the migration script imports from `dist`):

```bash
npm run build
```

3. Set environment variables (example):

```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/padel"
export MONGODB_URI="mongodb://localhost:27017/padel"
```

4. Run the migration script:

```bash
node scripts/migrate-postgres-to-mongo.js
```

Notes
- The script is a best-effort transform: it expects certain legacy fields like `userEmail`, `courtName` in the `Booking` rows for basic resolution. You may need to adapt queries if your schema differs.
- Adjust the script for large datasets to use batching and streaming to avoid memory issues.
- Test the migrated data locally before switching production.

Rollback
- Do not destroy Postgres data. Keep Postgres as the source of truth until you're confident in the migrated dataset.
- You can drop the MongoDB collections and re-run migration if needed.

Contact
- If you need assistance adapting the migration script to your exact schema, tell me about the Postgres table structure and I can update the script.
