// import "dotenv/config";
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import dotenv from 'dotenv';
import { NotFoundError, ExpressError } from './expressError.js';
import { authenticateJWT } from './middleware/auth.js';
import authRoutes from "./routes/auth.js";
import feedingRoutes from './routes/feedingRoutes.js'
import usersRoutes from './routes/users.js';

dotenv.config();

import morgan from "morgan";

const app = express();

app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin
  });
  next();
});

app.use(cors({
  origin: 'https://present-turtles.surge.sh',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-timezone'],
  credentials: true
}));

// After CORS middleware
app.use((req, res, next) => {
  console.log('After CORS middleware');
  next();
});

app.options('*', cors()); // enable pre-flight for all routes

app.use(express.json());
app.use(morgan("tiny"));
app.use(authenticateJWT);
app.use(express.urlencoded({ extended: true }));

app.get("/ping", (req, res) => {
  console.log("Ping route hit");
  res.json({ message: "pong" });
});

// Routes
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/feeding-routes", feedingRoutes);

app.get("/", (req, res) => {
  console.log("Root route hit");
  res.json({ message: "Server is running" });
});

app.get("/test", (req, res) => {
  console.log("Test route hit");
  res.json({ message: "Test route working" });
});

/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  throw new NotFoundError();
});

/** Generic error handler; anything unhandled goes here. */
app.use((
  err: ExpressError,
  req: Request,
  res: Response,
  next: NextFunction) => {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

export default app;