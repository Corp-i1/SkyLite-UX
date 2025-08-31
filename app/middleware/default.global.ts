import { defineNuxtRouteMiddleware, navigateTo } from "#app";

export default defineNuxtRouteMiddleware((to) => {
  // Only perform the default redirect when visiting the root path
  if (to.path !== "/") {
    return;
  }

  const token = useCookie("auth_token").value;

  // If token exists, redirect to shopping lists by default
  if (token) {
    return navigateTo("/shoppinglists", { replace: true });
  }

  // Otherwise redirect to login
  return navigateTo("/login", { replace: true });
});
