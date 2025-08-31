<script setup>
definePageMeta({
  layout: "login",
});

const router = useRouter();
const username = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

// helper to read cookie (csrf_token is set by server middleware)
function getCookie(name) {
  const m = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[2]) : null;
}

async function handleLogin() {
  loading.value = true;
  error.value = "";

  try {
    const csrfToken = getCookie("csrf_token") || "";

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      credentials: "include",
      body: JSON.stringify({ username: username.value, password: password.value }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      error.value = data?.message || data?.error || "Login failed";
      return;
    }

    // successful login -> go to shopping lists (use consistent lowercase route)
    await router.push("/shoppinglists");
  }
  catch (e) {
    error.value = e?.message || "An error occurred. Please try again.";
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
      Login
    </h1>

    <form class="space-y-4" @submit.prevent="handleLogin">
      <div v-if="error" class="p-3 bg-red-100 text-red-700 rounded-lg mb-4">
        {{ error }}
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Username
        </label>
        <input
          v-model="username"
          type="text"
          required
          class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
        >
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Password
        </label>
        <input
          v-model="password"
          type="password"
          required
          class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
        >
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
      >
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>
    </form>
  </div>
</template>
