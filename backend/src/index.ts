import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import hackathonRoutes from './routes/hackathons';

// Load env vars
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/hackathons', hackathonRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
