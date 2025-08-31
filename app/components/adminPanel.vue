<script setup>
const showAdminLogin = ref(false);
const adminUsername = ref("");
const adminPassword = ref("");
const error = ref("");
const verifying = ref(false);
const isAdmin = ref(false);
const sessions = ref([]);
const authLogs = ref([]);

async function verifyAdmin() {
  verifying.value = true;
  error.value = "";

  try {
    const response = await $fetch("/api/auth/verify-admin", {
      method: "POST",
      body: {
        username: adminUsername.value,
        password: adminPassword.value,
      },
    });

    if (response.success) {
      isAdmin.value = true;
      showAdminLogin.value = false;
      await fetchAdminData();
    }
  }
  catch (e) {
    error.value = e.data?.message || "Invalid credentials";
  }
  finally {
    verifying.value = false;
  }
}

async function fetchAdminData() {
  const [sessionsData, logsData] = await Promise.all([
    $fetch("/api/auth/sessions"),
    $fetch("/api/auth/logs"),
  ]);

  sessions.value = sessionsData;
  authLogs.value = logsData;
}

async function terminateSession(sessionId) {
  await $fetch("/api/auth/terminate-session", {
    method: "POST",
    body: { sessionId },
  });
  await fetchAdminData();
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function closeAdminPanel() {
  showAdminLogin.value = false;
  adminUsername.value = "";
  adminPassword.value = "";
  error.value = "";
}

// Export method to open admin panel
defineExpose({ openAdminPanel: () => showAdminLogin.value = true });
</script>

<template>
  <div v-if="showAdminLogin" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
      <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Admin Access
      </h2>

      <form class="space-y-4" @submit.prevent="verifyAdmin">
        <div v-if="error" class="text-red-500 text-sm">
          {{ error }}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
          <input
            v-model="adminUsername"
            type="text"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <input
            v-model="adminPassword"
            type="password"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
        </div>

        <div class="flex justify-end space-x-3">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            @click="closeAdminPanel"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            :disabled="verifying"
          >
            {{ verifying ? 'Verifying...' : 'Verify' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <div v-if="isAdmin" class="space-y-6">
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Active Sessions
      </h3>
      <div class="space-y-4">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded"
        >
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ session.username }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Last active: {{ formatDate(session.lastAccessed) }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              IP: {{ session.ip }}
            </p>
          </div>
          <button
            class="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-600"
            @click="terminateSession(session.id)"
          >
            Terminate
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Authentication Logs
      </h3>
      <div class="space-y-2">
        <div
          v-for="(log, index) in authLogs"
          :key="index"
          class="text-sm p-2 rounded"
          :class="log.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'"
        >
          <p class="font-medium" :class="log.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
            {{ log.type }} - {{ log.username }}
          </p>
          <p class="text-gray-600 dark:text-gray-400">
            {{ formatDate(log.timestamp) }} - IP: {{ log.ip }}
          </p>
          <p v-if="log.details" class="text-gray-500 dark:text-gray-500 mt-1">
            {{ log.details }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
