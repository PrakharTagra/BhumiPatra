import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import env from './config/env.js';
import routes from './routes/index.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

const app = express();

// 1. Security Headers via Helmet
const defaultDirectives = helmet.contentSecurityPolicy.getDefaultDirectives();
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        ...defaultDirectives,
        'frame-ancestors': ["'self'", ...env.CLIENT_ORIGINS, 'http://localhost:*', 'http://127.0.0.1:*'],
      },
    },
    xFrameOptions: false,
  })
);

// 2. Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (env.CLIENT_ORIGINS.includes('*') || env.CLIENT_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. HTTP Request Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// 4. Rate Limiting for all incoming API calls
app.use('/api', generalLimiter);

// 5. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Serve Uploaded Scans Statically with Cross-Origin and Framing Allowed for Portals
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' data: blob:; frame-ancestors 'self' http://localhost:* http://127.0.0.1:*"
    );
    res.removeHeader('X-Frame-Options');
    next();
  },
  express.static(path.resolve(env.UPLOAD_DIR))
);

// 7. Mount Core REST API
app.use('/api', routes);

// 8. Handle 404 Not Found
app.use(notFoundHandler);

// 9. Centralized Error Handler (Never leaks stack traces in production)
app.use(errorHandler);

export default app;
