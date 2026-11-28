import express from 'express';
import cors from 'cors';
import { legacyCorsGuard } from './hardening/activitySurface';

const app = express();
app.set('trust proxy', true); // AC-4: req.ip = client IP behind the tunnel proxy
app.use(legacyCorsGuard(cors()));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

import staticDataRouter from './routes/staticData';
import entityRouter from './routes/entity';
import chatRouter from './routes/chat';

app.use('/static-data', staticDataRouter);
app.use('/entity', entityRouter);
app.use('/chat', chatRouter);

import activityRouter from './activity/activityRouter';

app.use('/activity', activityRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
