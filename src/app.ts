// import "dotenv/config";
import express from 'express';
import cors from 'cors';

import { NotFoundError } from './expressError.ts';
import dotenv from 'dotenv';
import { authenticateJWT } from './middleware/auth.ts';
import authRoutes from "./routes/auth.ts";
import feedingRoutes from './routes/feedingRoutes.ts'
import usersRoutes from './routes/users.ts';

dotenv.config();

import morgan from "morgan";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use(authenticateJWT);
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/feeding-routes", feedingRoutes);

/** Handle 404 errors -- this matches everything */
app.use(function (req, res, next) {
  throw new NotFoundError();
});

/** Generic error handler; anything unhandled goes here. */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

export default app;