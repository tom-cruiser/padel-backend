#!/usr/bin/env node
/**
 * Simple MongoDB connection tester.
 * Usage:
 *   MONGODB_URI="mongodb://localhost:27017/padel" node scripts/test-mongo-connection.js
 */

const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/padel';

(async () => {
  console.log('Testing MongoDB connection to:', uri);
  try {
    await mongoose.connect(uri, { dbName: process.env.MONGODB_DBNAME || undefined });
    console.log('✅ MongoDB connected successfully');
    const admin = new mongoose.mongo.Admin(mongoose.connection.db);
    const info = await admin.serverStatus();
    console.log('Mongo server info:', { version: info.version });
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ MongoDB connection failed');
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  }
})();
