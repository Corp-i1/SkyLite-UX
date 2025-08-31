import { createError, defineEventHandler, getCookie } from "h3";
import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../../utils";

// In-memory log store
const authLogs: Array<{
  type: string;
  username: string;
  timestamp: number;
  ip: string;
  success: boolean;
  details?: string;
}> = [];

// Export for use in other files
export function logAuthEvent(type: string, username: string, ip: string, success: boolean, details?: string) {
  const log = {
    type,
    username,
    timestamp: Date.now(),
    ip,
    success,
    details,
  };

  authLogs.unshift(log);

  // Keep only last 100 logs
  if (authLogs.length > 100) {
    authLogs.pop();
  }
}

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

    return authLogs;
  }
  catch {
    throw createError({
      statusCode: 401,
      message: "Invalid token",
    });
  }
});
