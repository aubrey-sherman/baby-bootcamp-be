import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

// Middleware to check JWT and attach user
const checkJwt = expressjwt({
  // Dynamically provide a signing key based on the kid in the header and the signing keys provided by the JWKS endpoint
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: `${AUTH0_AUDIENCE}`,
  issuer: `${AUTH0_DOMAIN}`,
  algorithms: ['RS256'],
});

// Middleware to attach user information to the request
const attachUser = async (req, res, next) => {
  if (!req.auth) {  // Updated to use `req.auth` instead of `req.user`
    return next();
  }

  try {
    const auth0Id = req.auth.sub;  // `req.auth` is where the authenticated user information is now available
    let user = await User.findOne({ where: { auth0Id } });

    // If the user does not exist in our database, create a new record
    if (!user) {
      user = await User.create({
        auth0Id,
        email: req.auth.email,  // Assuming email is available in the token; adjust as needed
      });
    }

    req.user = user;  // Attach the database user to the request object
    next();
  } catch (error) {
    console.error('Error attaching user to request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export { checkJwt, attachUser };