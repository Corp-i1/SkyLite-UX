import { defineNuxtRouteMiddleware, navigateTo } from "#app";

export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie("auth_token").value;

  // Redirect to shopping lists if authenticated and trying to access login
  if (to.path === "/login" && token) {
    return navigateTo("/shoppinglists");
  }

  // Allow access to login page
  if (to.path === "/login") {
    return;
  }

  // Require authentication for all other pages
  if (!token) {
    return navigateTo("/login");
  }
});
