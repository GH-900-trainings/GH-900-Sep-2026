import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import express from 'express';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { citiesRouter } from './routes/cities.js';
import { healthRouter } from './routes/health.js';
import { weatherRouter } from './routes/weather.js';

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend');

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

app.use(healthRouter);
app.use('/api', citiesRouter);
app.use('/api', weatherRouter);

// Dashboard is served same-origin, so the browser never needs CORS or an API base URL.
app.use(express.static(frontendDir));

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
