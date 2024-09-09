import express from 'express';
import { NotFoundError } from './expressError.js';
import cors from 'cors';
import dotenv from 'dotenv';

import sequelize from './db.js';
import { User, FeedTimeEntry } from './models/index.js';
import eatRoutes from './routes/eat.js';
// import usersRoutes from './routes/users.js';

import { checkJwt, attachUser } from './middleware/auth.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sync models with the database
sequelize.sync({ alter: true })
  .then(() => console.log('Database & tables synced successfully.'))
  .catch((error) => console.error('Error syncing database:', error));

// Routes
app.use("/eat", eatRoutes);
// app.use("/users", usersRoutes);

// Code to protect specific specific routes
// app.use('/eat', checkJwt, attachUser, eatRoutes);

/** Sample route for testing */
app.get("/", function (req, res) {
  return res.send(`Hello from the backend!`);
});

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