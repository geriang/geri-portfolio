import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

import staticDataRouter from './routes/staticData';
import entityRouter from './routes/entity';

app.use('/static-data', staticDataRouter);
app.use('/entity', entityRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
