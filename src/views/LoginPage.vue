<script setup>
import { useAuth } from '@/composables/useAuth'
import { useUserStore } from '@/stores/userStore'
import { useRouter, useRoute } from 'vue-router'
import { onMounted, watch } from 'vue'

const { signInWithGoogle, isLoading, error } = useAuth()
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

// If already authenticated, redirect
watch(() => userStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    router.push('/parties')
  }
}, { immediate: true })

// Save join code if coming from join link
onMounted(() => {
  const joinCode = route.query.join
  if (joinCode) {
    sessionStorage.setItem('pendingJoinCode', joinCode)
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-100 to-primary/10 p-4">
    <div class="card bg-base-100 shadow-2xl w-full max-w-md">
      <div class="card-body items-center text-center">
        <!-- Logo / Title -->
        <div class="mb-6">
          <div class="text-6xl mb-4 animate-bounce">🎁</div>
          <h1 class="text-3xl font-bold text-primary">Givt</h1>
          <p class="text-base-content/70 mt-2">Gift Exchange Made Fun!</p>
        </div>

        <!-- Join Party Message -->
        <div v-if="route.query.join" class="alert alert-info mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Sign in to join the party!</span>
        </div>

        <!-- Error Alert -->
        <div v-if="error" class="alert alert-error mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ error }}</span>
        </div>

        <!-- Google Sign In Button -->
        <button
          @click="signInWithGoogle"
          :disabled="isLoading"
          class="btn btn-lg btn-outline gap-3 w-full"
        >
          <span v-if="isLoading" class="loading loading-spinner"></span>
          <svg v-else class="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {{ isLoading ? 'Signing in...' : 'Continue with Google' }}
        </button>

        <!-- Info Text -->
        <p class="text-xs text-base-content/50 mt-6">
          By signing in, you agree to exchange gifts and spread joy!
        </p>

        <!-- Features -->
        <div class="divider">What you can do</div>
        <ul class="text-left text-sm space-y-2 text-base-content/70">
          <li class="flex items-center gap-2">
            <span class="text-success">✓</span>
            Create gift exchange parties
          </li>
          <li class="flex items-center gap-2">
            <span class="text-success">✓</span>
            Build wishlists with Lazada/Shopee links
          </li>
          <li class="flex items-center gap-2">
            <span class="text-success">✓</span>
            Draw names and see who you're gifting
          </li>
          <li class="flex items-center gap-2">
            <span class="text-success">✓</span>
            Share parties with friends & family
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
