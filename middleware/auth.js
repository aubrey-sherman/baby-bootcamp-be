import jwt from 'express-jwt';
import jwks from 'jwks-rsa';

// JWT Middleware
const checkJwt = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: YOUR_API_IDENTIFIER,
  issuer: AUTH0_DOMAIN,
  algorithms: ['RS256']
});

export default checkJwt;