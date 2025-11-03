import { createServer } from 'http';
import app from './app';
import { Server } from 'socket.io';
import { config } from 'dotenv';
import cors from 'cors';

// Load environment variables
config();

const port = process.env.PORT || 5000;
const server = createServer(app);

// CORS configuration for Express
// Allow multiple frontend origins via FRONTEND_URLS env (comma-separated)
const allowedOrigins = (process.env.FRONTEND_URLS || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map((s) => s.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS policy: Origin not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  console.log(`📚 API Documentation available at http://localhost:${port}/api-docs`);
});