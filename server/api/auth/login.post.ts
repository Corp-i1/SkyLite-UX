import { compare } from "bcryptjs";
import { createError, defineEventHandler, readBody, setCookie } from "h3";
import jwt from "jsonwebtoken";

import { JWT_SECRET, USERS } from "../../utils";

type AttemptInfo = {
  count: number;
  timestamp: number;
  blocked?: number;
};

// Rate limiting setup
const attempts = new Map<string, AttemptInfo>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 7;
const BLOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export default defineEventHandler(async (event) => {
  const ip = event.node.req.socket.remoteAddress || "unknown";

  // Check if IP is blocked
  const ipAttempts = attempts.get(ip) || { count: 0, timestamp: Date.now() };
  if (ipAttempts.blocked && Date.now() - ipAttempts.blocked < BLOCK_DURATION) {
    throw createError({
      statusCode: 429,
      message: "Too many attempts. Please try again later.",
    });
  }

  // Clear old attempts
  if (Date.now() - ipAttempts.timestamp > RATE_LIMIT_WINDOW) {
    ipAttempts.count = 0;
    ipAttempts.timestamp = Date.now();
  }

  // Check rate limit
  if (ipAttempts.count >= MAX_ATTEMPTS) {
    ipAttempts.blocked = Date.now();
    attempts.set(ip, ipAttempts);
    throw createError({
      statusCode: 429,
      message: "Too many attempts. Please try again later.",
    });
  }

  const body = await readBody(event);
  const { username, password } = body;

  // Validate input
  if (!username || !password || typeof username !== "string" || typeof password !== "string") {
    throw createError({
      statusCode: 400,
      message: "Invalid input format",
    });
  }

  const user = USERS.get(username);
  if (!user) {
    ipAttempts.count++;
    attempts.set(ip, ipAttempts);
    throw createError({
      statusCode: 401,
      message: "Invalid credentials",
    });
  }

  const validPassword = await compare(password, user.hashedPassword);
  if (!validPassword) {
    ipAttempts.count++;
    attempts.set(ip, ipAttempts);
    throw createError({
      statusCode: 401,
      message: "Invalid credentials",
    });
  }

  // Generate JWT token
  const token = jwt.sign({ username, role: user.role }, JWT_SECRET, { expiresIn: "24h" });

  // Decide secure cookie flag (production only). Use runtimeConfig if present; fallback to NODE_ENV.
  function isSecureCookie(event: any) {
    const cfg = event.context?.runtimeConfig;
    const nodeEnv = cfg?.public?.nodeEnv || cfg?.nodeEnv || process.env.NODE_ENV || "";
    if (nodeEnv === "production")
      return true;
    const proto = (event.node?.req?.headers && (event.node.req.headers["x-forwarded-proto"] as string))
      || (event.node?.req && (event.node.req as any).protocol)
      || "";
    return typeof proto === "string" && proto.startsWith("https");
  }

  // Temporary debug log (remove when confirmed working)
  console.debug("[auth] setting cookie secure =", isSecureCookie(event), "for ip=", ip);

  // Set HTTP-only cookie
  setCookie(event, "auth_token", token, {
    httpOnly: true,
    secure: isSecureCookie(event), // only secure in prod/https
    sameSite: "lax", // allow normal navigation
    path: "/",
    maxAge: 24 * 60 * 60,
  });

  return { success: true };
});
