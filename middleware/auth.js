import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import User from '../models/User.js';

// Middleware to check JWT and attach user
const checkJwt = jwt({
  // Dynamically provide a signing key based on the kid in the header and the signing keys provided by the JWKS endpoint
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://YOUR_AUTH0_DOMAIN/.well-known/jwks.json`,  // Replace YOUR_AUTH0_DOMAIN
  }),
  audience: 'YOUR_API_IDENTIFIER',  // Replace with your API identifier
  issuer: `https://YOUR_AUTH0_DOMAIN/`,  // Replace with your Auth0 domain
  algorithms: ['RS256'],
});

// Middleware to attach user information to the request
const attachUser = async (req, res, next) => {
  if (!req.user) {
    return next();
  }

  try {
    const auth0Id = req.user.sub;  // Auth0 ID is usually in the `sub` property
    let user = await User.findOne({ where: { auth0Id } });

    // If the user does not exist in our database, create a new record
    if (!user) {
      user = await User.create({
        auth0Id,
        email: req.user.email,  // Assuming email is available in the token; adjust as needed
      });
    }

    req.user.dbUser = user;  // Attach the database user to the request object
    next();
  } catch (error) {
    console.error('Error attaching user to request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export { checkJwt, attachUser };