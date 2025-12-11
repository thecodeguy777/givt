<script setup>
import { ref, onMounted, onActivated, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useParty } from '@/composables/useParty'
import { useAuth } from '@/composables/useAuth'
import { useUserStore } from '@/stores/userStore'

defineOptions({ name: 'MyPartiesPage' })

const router = useRouter()
const { fetchMyParties, isLoading, error } = useParty()
const { signOut } = useAuth()
const userStore = useUserStore()

const parties = ref([])
const hasInitiallyLoaded = ref(false)

const upcomingParties = computed(() =>
  parties.value.filter(p => new Date(p.date) >= new Date())
)

const pastParties = computed(() =>
  parties.value.filter(p => new Date(p.date) < new Date())
)

async function loadParties(forceRefresh = false) {
  const { data } = await fetchMyParties(forceRefresh)
  parties.value = data || []
  hasInitiallyLoaded.value = true
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatBudget(amount) {
  if (!amount) return null
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Initial load
onMounted(loadParties)

// Refresh when returning to cached page
onActivated(() => {
  if (hasInitiallyLoaded.value) {
    loadParties() // Will use cache if fresh, otherwise fetch
  }
})
</script>

<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="navbar bg-base-100 shadow-lg sticky top-0 z-50">
      <div class="flex-1">
        <RouterLink to="/parties" class="btn btn-ghost text-xl gap-2">
          <span>🎁</span>
          <span class="hidden sm:inline">Givt</span>
        </RouterLink>
      </div>
      <div class="flex-none gap-2">
        <RouterLink to="/join" class="btn btn-ghost btn-sm">
          Join Party
        </RouterLink>
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
            <div class="w-10 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
              {{ userStore.avatarEmoji }}
            </div>
          </div>
          <ul tabindex="0" class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
            <li class="menu-title">
              <span>{{ userStore.displayName }}</span>
            </li>
            <li><a @click="signOut">Sign out</a></li>
          </ul>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8 max-w-4xl">
      <!-- Hero Section -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold mb-2">My Parties</h1>
        <p class="text-base-content/70">Join the fun or create your own gift exchange!</p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <RouterLink to="/create" class="btn btn-primary gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Party
        </RouterLink>
        <RouterLink to="/join" class="btn btn-outline gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
          </svg>
          Join with Code
        </RouterLink>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-error mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="parties.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">🎄</div>
        <h2 class="text-xl font-semibold mb-2">No parties yet!</h2>
        <p class="text-base-content/70 mb-6">
          Create your first gift exchange or join one with a code.
        </p>
      </div>

      <!-- Parties List -->
      <template v-else>
        <!-- Upcoming Parties -->
        <div v-if="upcomingParties.length > 0" class="mb-8">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🎉</span> Upcoming
          </h2>
          <div class="grid gap-4">
            <RouterLink
              v-for="party in upcomingParties"
              :key="party.id"
              :to="`/party/${party.id}`"
              class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div class="card-body">
                <!-- Assigned Person Summary (top priority info) -->
                <div v-if="party.draw_complete && party.hasDrawn && party.assignedUser" class="flex items-center gap-3 p-3 bg-primary/10 rounded-lg mb-3">
                  <div class="text-3xl">{{ party.assignedUser.avatar_emoji }}</div>
                  <div class="flex-1">
                    <p class="text-xs text-base-content/60">You're buying for</p>
                    <p class="font-semibold text-lg">{{ party.assignedUser.display_name }}</p>
                  </div>
                  <div class="badge badge-success gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    Revealed
                  </div>
                </div>

                <!-- Tap to reveal prompt -->
                <div v-else-if="party.draw_complete" class="flex items-center gap-3 p-3 bg-info/10 rounded-lg mb-3">
                  <div class="text-3xl">🎁</div>
                  <div class="flex-1">
                    <p class="font-semibold">Tap to reveal your match!</p>
                    <p class="text-xs text-base-content/60">The draw is complete</p>
                  </div>
                  <div class="badge badge-info">Reveal</div>
                </div>

                <!-- Party Details -->
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="card-title text-lg">
                      {{ party.name }}
                      <span v-if="party.role === 'creator'" class="badge badge-primary badge-sm">
                        Host
                      </span>
                    </h3>
                    <p v-if="party.description" class="text-sm text-base-content/70 mt-1">
                      {{ party.description }}
                    </p>
                  </div>
                  <div class="text-right">
                    <div class="badge badge-outline">{{ formatDate(party.date) }}</div>
                    <div v-if="party.budget" class="text-sm text-accent font-semibold mt-1">
                      {{ formatBudget(party.budget) }}
                    </div>
                  </div>
                </div>

                <div class="card-actions justify-between items-center mt-3">
                  <span v-if="!party.draw_complete" class="badge badge-warning gap-1">
                    Pending Draw
                  </span>
                  <span v-else></span>
                  <span class="text-primary text-sm">View →</span>
                </div>
              </div>
            </RouterLink>
          </div>
        </div>

        <!-- Past Parties -->
        <div v-if="pastParties.length > 0">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2 text-base-content/70">
            <span>📜</span> Past Parties
          </h2>
          <div class="grid gap-4 opacity-75">
            <RouterLink
              v-for="party in pastParties"
              :key="party.id"
              :to="`/party/${party.id}`"
              class="card bg-base-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div class="card-body py-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-medium">{{ party.name }}</h3>
                  </div>
                  <div class="text-sm text-base-content/70">
                    {{ formatDate(party.date) }}
                  </div>
                </div>
              </div>
            </RouterLink>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
