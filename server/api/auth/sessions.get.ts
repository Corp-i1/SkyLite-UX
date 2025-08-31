import { createError, defineEventHandler, getCookie } from "h3";
import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../../utils";

// In-memory session store from login.post.ts
declare const activeSessions: Map<string, any>;

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "auth_token");

  if (!token) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; role: string };

    if (decoded.role !== "admin") {
      throw createError({
        statusCode: 403,
        message: "Forbidden",
      });
    }

    // Convert sessions to array for response
    return Array.from(activeSessions.entries()).map(([id, session]) => ({
      id,
      username: session.username,
      createdAt: session.createdAt,
      lastAccessed: session.lastAccessed,
      ip: session.ip,
    }));
  }
  catch {
    throw createError({
      statusCode: 401,
      message: "Invalid token",
    });
  }
});
