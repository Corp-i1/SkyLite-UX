import { defineNuxtRouteMiddleware, navigateTo } from "nuxt/app";

export default defineNuxtRouteMiddleware((to) => {
  // Check if the route requires authentication
  const requiresAuth = to.meta.auth !== false;

  // Get session token from cookie
  const token = useCookie("auth_token").value;

  if (requiresAuth && !token) {
    // Redirect to login if authentication is required but no token exists
    return navigateTo("/login");
  }

  if (!requiresAuth && token) {
    // Redirect to home if user is already authenticated but tries to access login
    return navigateTo("/");
  }
});
