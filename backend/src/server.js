import app from './app.js';
import { assertConfig, config } from './config/env.js';

try {
  assertConfig();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const server = app.listen(config.port, () => {
  console.log(`Listening on http://localhost:${config.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down.`);
    server.close(() => process.exit(0));
  });
}
