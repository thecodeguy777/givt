<script setup>
import { onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { handleAuthCallback, isLoading, error } = useAuth()

onMounted(() => {
  handleAuthCallback()
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-100 to-primary/10">
    <div class="text-center">
      <div v-if="isLoading" class="flex flex-col items-center gap-4">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-lg">Signing you in...</p>
      </div>

      <div v-else-if="error" class="alert alert-error max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>
    </div>
  </div>
</template>
