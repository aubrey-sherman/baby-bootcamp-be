import jwt from "jsonwebtoken";
import  { SECRET_KEY } from "../../config.js";

/** Returns signed JWT {username, isAdmin} from user data. */

// TODO: Add type for user

function createToken(user)  {
  let payload = {
    username: user.username,
    isAdmin: user.isAdmin === true,
  };

  return jwt.sign(payload, SECRET_KEY);
}

export { createToken };