import cors from 'cors';
import express from 'express';
import healthRouter from './routes/health';
import roomsRouter from './routes/rooms';
import giftsRouter from './routes/gifts';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', healthRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/gifts', giftsRouter);

export default app;