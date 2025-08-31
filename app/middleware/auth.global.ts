import { defineNuxtRouteMiddleware, navigateTo, useFetch } from "#app";

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip this middleware for static assets and api routes
  if (to.path.startsWith("/_") || to.path.startsWith("/api/")) {
    return;
  }

  // Public routes that don't require auth
  const publicRoutes = ["/login"];
  const isPublicRoute = publicRoutes.includes(to.path);

  // Try to determine authentication by calling the server session endpoint.
  // This works both on server (SSR) and client because we pass credentials.
  let isAuthenticated = false;
  try {
    const { data } = await useFetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      immediate: true,
    });
    if (data && (data as any).value && (data as any).value.username) {
      isAuthenticated = true;
    }
  }
  catch {
    // treat as unauthenticated
    isAuthenticated = false;
  }

  // Handle root path
  if (to.path === "/") {
    return navigateTo(isAuthenticated ? "/shoppinglists" : "/login", { replace: true });
  }

  // If not authenticated and trying to access protected route
  if (!isAuthenticated && !isPublicRoute) {
    return navigateTo("/login", { replace: true });
  }

  // If authenticated and trying to access login page
  if (isAuthenticated && isPublicRoute) {
    return navigateTo("/shoppinglists", { replace: true });
  }
});
