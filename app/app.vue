<script setup>
const route = useRoute();
const isLoginPage = computed(() => route.path === "/login");
</script>

<template>
  <div>
    <NuxtPage v-if="isLoginPage" />
    <NuxtLayout v-else>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
