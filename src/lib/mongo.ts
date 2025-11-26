import mongoose from 'mongoose';

let isConnected = false;

export async function connectMongo(uri: string) {
  if (isConnected) return mongoose.connection;
  mongoose.set('strictQuery', false);
  await mongoose.connect(uri, {
    // options can be adjusted as needed
  } as mongoose.ConnectOptions);
  isConnected = true;
  console.log('✅ Connected to MongoDB');
  return mongoose.connection;
}

export function disconnectMongo() {
  if (!isConnected) return;
  mongoose.disconnect();
  isConnected = false;
}

export default mongoose;
