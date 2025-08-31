import { createError, defineEventHandler, getCookie } from "h3";
import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../../utils";

export default defineEventHandler((event) => {
  const token = getCookie(event, "auth_token");

  if (!token) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; role: string };
    return { username: decoded.username, role: decoded.role };
  }
  catch {
    throw createError({
      statusCode: 401,
      message: "Invalid token",
    });
  }
});
