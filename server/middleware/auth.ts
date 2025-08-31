import { createError, defineEventHandler, getCookie } from "h3";
import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../utils";

// Define protected API routes that require authentication
const PROTECTED_API_ROUTES = [
  "/api/lists",
  "/api/auth/logout",
  "/api/auth/sessions",
  "/api/auth/verifyAdmin",
];

export default defineEventHandler((event) => {
  const url = event.node.req.url || "";

  // Only check authentication for protected API routes
  if (!PROTECTED_API_ROUTES.some(route => url.startsWith(route))) {
    return;
  }

  const token = getCookie(event, "auth_token");

  if (!token) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Add user info to the event context
    event.context.user = decoded;
  }
  catch {
    throw createError({
      statusCode: 401,
      message: "Invalid token",
    });
  }
});
