require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blogs');

const app = express();

// CORS: in development this allows any origin. For production, set
// FRONTEND_URL in your environment variables (e.g. https://your-site.com)
// to restrict the API to your deployed frontend only. If the frontend and
// backend are deployed together on the same domain (as with the Vercel
// setup in this project), CORS doesn't even come into play.
const allowedOrigin = process.env.FRONTEND_URL;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use(express.json());

// Make sure we're connected to MongoDB before handling any request.
// connectDB() caches the connection, so after the first "cold start"
// this resolves instantly.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: 'Could not connect to the database.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Marginalia API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

module.exports = app;
