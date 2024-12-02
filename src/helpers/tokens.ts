import jwt from "jsonwebtoken";
import  { SECRET_KEY } from "../config.js";
import { UserType } from "../types.js";


/** Returns signed JWT {username, isAdmin} from user data. */
function createToken(user: UserType)  {
  let payload = {
    username: user.username,
    isAdmin: user.isAdmin === true,
  };

  return jwt.sign(payload, SECRET_KEY);
}

export { createToken };