<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useParty } from '@/composables/useParty'
import { useUserStore } from '@/stores/userStore'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const route = useRoute()
const { joinParty, isLoading, error } = useParty()
const userStore = useUserStore()
const { signInWithGoogle } = useAuth()

const joinCode = ref('')
const joinError = ref(null)
const hasAttemptedAutoJoin = ref(false)

// Pre-fill code from URL if provided
onMounted(() => {
  if (route.params.code) {
    joinCode.value = route.params.code.toUpperCase()
    // If auth is already loaded and user is authenticated, auto-join
    if (!userStore.isLoading && userStore.isAuthenticated) {
      hasAttemptedAutoJoin.value = true
      handleJoin()
    }
  }
})

// Watch for auth loading to complete, then auto-join if code is in URL
watch(() => userStore.isLoading, (loading) => {
  if (!loading && !hasAttemptedAutoJoin.value && route.params.code && userStore.isAuthenticated) {
    hasAttemptedAutoJoin.value = true
    handleJoin()
  }
})

async function handleJoin() {
  if (!joinCode.value.trim()) {
    joinError.value = 'Please enter a join code'
    return
  }

  // If not authenticated, redirect to login with join code
  if (!userStore.isAuthenticated) {
    sessionStorage.setItem('pendingJoinCode', joinCode.value.toUpperCase())
    router.push({ name: 'Login', query: { join: joinCode.value.toUpperCase() } })
    return
  }

  joinError.value = null

  const { data, error: joinErr, alreadyMember } = await joinParty(joinCode.value)

  if (joinErr) {
    joinError.value = joinErr.message || 'Failed to join party'
    return
  }

  if (data) {
    // Success! Redirect to party
    if (alreadyMember) {
      // Optionally show a toast that they're already a member
    }
    router.push(`/party/${data.id}`)
  }
}

function formatCode(event) {
  // Auto-format: uppercase and remove non-alphanumeric
  joinCode.value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}
</script>

<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="navbar bg-base-100 shadow-lg">
      <div class="flex-1">
        <RouterLink to="/parties" class="btn btn-ghost gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back
        </RouterLink>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8 max-w-md">
      <div class="text-center mb-8">
        <div class="text-5xl mb-4">🎟️</div>
        <h1 class="text-2xl font-bold">Join a Party</h1>
        <p class="text-base-content/70 mt-2">Enter the 6-character code to join</p>
      </div>

      <!-- Error Alert -->
      <div v-if="joinError || error" class="alert alert-error mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ joinError || error }}</span>
      </div>

      <!-- Join Form -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Join Code</span>
            </label>
            <input
              :value="joinCode"
              @input="formatCode"
              type="text"
              placeholder="ABC123"
              maxlength="6"
              class="input input-bordered input-lg text-center font-mono tracking-widest text-2xl uppercase"
              @keyup.enter="handleJoin"
            />
            <label class="label">
              <span class="label-text-alt">Ask your host for the party code</span>
            </label>
          </div>

          <!-- Not authenticated message -->
          <div v-if="!userStore.isAuthenticated" class="alert alert-info mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>You'll need to sign in to join the party</span>
          </div>

          <div class="card-actions pt-4">
            <button
              @click="handleJoin"
              :disabled="isLoading || joinCode.length < 6"
              class="btn btn-primary w-full"
            >
              <span v-if="isLoading" class="loading loading-spinner"></span>
              {{ isLoading ? 'Joining...' : (userStore.isAuthenticated ? 'Join Party' : 'Continue') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Help Text -->
      <div class="text-center mt-8 text-sm text-base-content/60">
        <p>Don't have a code?</p>
        <RouterLink to="/create" class="link link-primary">
          Create your own party instead
        </RouterLink>
      </div>
    </main>
  </div>
</template>
