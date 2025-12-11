<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

onMounted(() => {
  userStore.initialize()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-300">
    <!-- Loading screen while auth initializes -->
    <div v-if="userStore.isLoading" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="text-6xl mb-4 animate-bounce">🎁</div>
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>
    </div>

    <!-- Main app with keep-alive for faster navigation -->
    <RouterView v-else v-slot="{ Component }">
      <KeepAlive :include="['MyPartiesPage', 'PartyDashboardPage']" :max="5">
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </div>
</template>
