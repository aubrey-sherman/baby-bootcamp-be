import express from 'express';
import cors from 'cors';

import { NotFoundError } from './expressError.js';
import dotenv from 'dotenv';
import { authenticateJWT } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import feedingRoutes from './routes/feedingEntries.js';
import usersRoutes from './routes/users.js';

import sequelize from './db.js';
// import { User, FeedTimeEntry } from './models/index.js';

dotenv.config();

import morgan from "morgan";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use(authenticateJWT);
app.use(express.urlencoded({ extended: true }));

// Sync models with the database
sequelize.sync({ alter: true })
  .then(() => console.log('Database & tables synced successfully.'))
  .catch((error) => console.error('Error syncing database:', error));

// Routes
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/feedingEntries", feedingRoutes);

// /** Sample route for testing */
// app.get("/", function (req, res) {
//   return res.send(`Hello from the backend!`);
// });

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