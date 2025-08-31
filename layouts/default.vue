<script setup>
</script>

<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
    <GlobalDock />
    <GlobalSideBar />
    <div class="ml-64 p-6">
      <slot />
    </div>
  </div>
</template>
