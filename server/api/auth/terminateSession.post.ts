import { createError, defineEventHandler, getCookie, readBody } from "h3";
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

    const body = await readBody(event);
    const { sessionId } = body;

    if (!sessionId || !activeSessions.has(sessionId)) {
      throw createError({
        statusCode: 404,
        message: "Session not found",
      });
    }

    activeSessions.delete(sessionId);
    return { success: true };
  }
  catch {
    throw createError({
      statusCode: 401,
      message: "Invalid token",
    });
  }
});
