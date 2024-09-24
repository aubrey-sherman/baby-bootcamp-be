import jwt from "jsonwebtoken";
import  { SECRET_KEY } from "../config.js";

// NOTE: Can improve documentation by specifying shape/content of user data.
/** Returns signed JWT {username, isAdmin} from user data. */

function createToken(user)  {
  let payload = {
    username: user.username,
    isAdmin: user.isAdmin === true,
  };

  return jwt.sign(payload, SECRET_KEY);
}

export { createToken };