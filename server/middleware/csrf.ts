import { createError, defineEventHandler, getCookie, setCookie } from "h3";
import { randomBytes } from "node:crypto";

// Store CSRF tokens with their creation time
const csrfTokens = new Map<string, number>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, timestamp] of csrfTokens.entries()) {
    if (now - timestamp > 24 * 60 * 60 * 1000) { // 24 hours
      csrfTokens.delete(token);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

// Helper to decide secure flag in dev vs production
function isSecureCookie(event: any) {
  // Rely on request/proxy headers to detect https; avoid direct process.env use
  const proto = (event.node?.req?.headers && (event.node.req.headers["x-forwarded-proto"] as string))
    || (event.node?.req && (event.node.req as any).protocol)
    || "";
  return typeof proto === "string" && proto.startsWith("https");
}

export default defineEventHandler((event) => {
  // Skip CSRF check for GET requests and public routes
  if (
    event.node.req.method === "GET"
    || event.node.req.url === "/api/auth/login"
    || event.node.req.url?.startsWith("/_nuxt")
    || event.node.req.url === "/favicon.ico"
    || event.node.req.url === "/__nuxt_error"
  ) {
    // Generate new CSRF token
    const token = randomBytes(32).toString("hex");
    csrfTokens.set(token, Date.now());
    setCookie(event, "csrf_token", token, {
      httpOnly: false, // client JS must read and forward it
      secure: isSecureCookie(event), // secure only if request indicates https
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60,
    });
    return;
  }

  // Verify CSRF token for all other requests
  const cookieToken = getCookie(event, "csrf_token");
  const headerToken = event.node.req.headers["x-csrf-token"];

  if (!cookieToken || !headerToken || cookieToken !== headerToken || !csrfTokens.has(cookieToken)) {
    throw createError({
      statusCode: 403,
      message: "Invalid CSRF token",
    });
  }

  // Update token timestamp
  csrfTokens.set(cookieToken, Date.now());
});
