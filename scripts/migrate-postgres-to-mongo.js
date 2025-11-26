#!/usr/bin/env node
/*
  Migration script: Postgres -> Mongo (via Mongoose)
  - Requires env vars: DATABASE_URL (Postgres), MONGODB_URI (Mongo)
  - Run: node scripts/migrate-postgres-to-mongo.js
*/

const { Client } = require('pg');
const mongoose = require('mongoose');
const User = require('../dist/src/models/User').User;
const Court = require('../dist/src/models/Court').Court;
const Booking = require('../dist/src/models/Booking').Booking;
const Notification = require('../dist/src/models/Notification').Notification;

async function main() {
  const pgUrl = process.env.DATABASE_URL;
  const mongoUrl = process.env.MONGODB_URI;
  if (!pgUrl || !mongoUrl) {
    console.error('Please set DATABASE_URL and MONGODB_URI');
    process.exit(1);
  }

  console.log('Connecting to Postgres...');
  const pg = new Client({ connectionString: pgUrl });
  await pg.connect();

  console.log('Connecting to Mongo...');
  await mongoose.connect(mongoUrl, { strictQuery: false });

  try {
    console.log('Migrating users...');
    const usersRes = await pg.query('SELECT * FROM "User"');
    for (const u of usersRes.rows) {
      const doc = {
        email: u.email,
        password: u.password || undefined,
        firstName: u.firstName || undefined,
        lastName: u.lastName || undefined,
        role: u.role || 'PLAYER',
        avatar: u.avatar || undefined,
        createdAt: u.createdAt || new Date(),
        updatedAt: u.updatedAt || new Date(),
      };
      await User.findOneAndUpdate({ email: doc.email }, doc, { upsert: true });
    }

    console.log('Migrating courts...');
    const courtsRes = await pg.query('SELECT * FROM "Court"');
    for (const c of courtsRes.rows) {
      const doc = {
        name: c.name,
        color: c.color || undefined,
        openingHours: c.openingHours || [],
      };
      await Court.findOneAndUpdate({ name: doc.name }, doc, { upsert: true });
    }

    console.log('Migrating bookings...');
    const bookingsRes = await pg.query('SELECT * FROM "Booking"');
    for (const b of bookingsRes.rows) {
      // We will try to find a user/court by legacy id fields (assumes same emails/names exist)
      const userDoc = await User.findOne({ email: b.userEmail }) || null;
      const courtDoc = await Court.findOne({ name: b.courtName }) || null;
      const doc = {
        user: userDoc ? userDoc._id : null,
        court: courtDoc ? courtDoc._id : null,
        startTime: b.startTime ? new Date(b.startTime) : new Date(b.createdAt),
        endTime: b.endTime ? new Date(b.endTime) : new Date(b.startTime),
        status: b.status || 'CONFIRMED',
      };
      await Booking.create(doc);
    }

    console.log('Migrating notifications...');
    const notRes = await pg.query('SELECT * FROM "Notification"');
    for (const n of notRes.rows) {
      const userDoc = await User.findOne({ email: n.userEmail }) || null;
      const doc = {
        user: userDoc ? userDoc._id : null,
        message: n.message,
        read: n.read || false,
        metadata: n.metadata || {},
      };
      await Notification.create(doc);
    }

    console.log('Migration complete');
  } catch (err) {
    console.error('Migration error', err);
  } finally {
    await pg.end();
    await mongoose.disconnect();
  }
}

main();
