import cors from 'cors';
import express from 'express';
import healthRouter from './routes/health';
import roomsRouter from './routes/rooms';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', healthRouter);
app.use('/api/rooms', roomsRouter);

export default app;