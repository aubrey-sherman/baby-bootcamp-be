import jwt from 'express-jwt';
import jwks from 'jwks-rsa';

// JWT Middleware
const checkJwt = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: 'https://YOUR_AUTH0_DOMAIN/.well-known/jwks.json'
  }),
  audience: 'YOUR_API_IDENTIFIER', // TODO: Replace with your Auth0 API Identifier
  issuer: 'https://YOUR_AUTH0_DOMAIN/', // TODO: Replace with your Auth0 Domain
  algorithms: ['RS256']
});

export default checkJwt;