<script setup>
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useParty } from '@/composables/useParty'
import { useUserStore } from '@/stores/userStore'
import SharePartyModal from '@/components/party/SharePartyModal.vue'

defineOptions({ name: 'PartyDashboardPage' })

const route = useRoute()
const router = useRouter()
const { fetchParty, performDraw, deleteParty, leaveParty, getMyMembership, isLoading, error } = useParty()
const userStore = useUserStore()

const party = ref(null)
const myMembership = ref(null)
const showShareModal = ref(false)
const showDeleteConfirm = ref(false)
const showLeaveConfirm = ref(false)
const actionLoading = ref(false)
const currentPartyId = ref(null)

const isCreator = computed(() => party.value?.created_by === userStore.user?.id)
const canDraw = computed(() => party.value && !party.value.draw_complete && party.value.members?.length >= 3)
const hasDrawn = computed(() => myMembership.value?.has_drawn)

async function loadParty(forceRefresh = false) {
  const partyId = route.params.id
  const { data } = await fetchParty(partyId, forceRefresh)
  if (data) {
    party.value = data
    currentPartyId.value = partyId
    await loadMyMembership()
  }
}

async function loadMyMembership() {
  const { data } = await getMyMembership(route.params.id)
  myMembership.value = data
}

async function handleDraw() {
  if (!canDraw.value) return

  actionLoading.value = true
  const { success, error: drawError } = await performDraw(route.params.id)

  if (success) {
    await loadParty()
  }
  actionLoading.value = false
}

async function handleDelete() {
  actionLoading.value = true
  const { success } = await deleteParty(route.params.id)

  if (success) {
    router.push('/parties')
  }
  actionLoading.value = false
  showDeleteConfirm.value = false
}

async function handleLeave() {
  actionLoading.value = true
  const { success } = await leaveParty(route.params.id)

  if (success) {
    router.push('/parties')
  }
  actionLoading.value = false
  showLeaveConfirm.value = false
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
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
onMounted(loadParty)

// Refresh when returning to cached page or when party ID changes
onActivated(() => {
  // If navigating to a different party, reload
  if (route.params.id !== currentPartyId.value) {
    loadParty()
  } else {
    // Same party, just refresh from cache
    loadParty()
  }
})

// Watch for route param changes (navigating between parties)
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    loadParty()
  }
})
</script>

<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="navbar bg-base-100 shadow-lg sticky top-0 z-40">
      <div class="flex-1">
        <RouterLink to="/parties" class="btn btn-ghost gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          <span class="hidden sm:inline">My Parties</span>
        </RouterLink>
      </div>
      <div class="flex-none gap-2">
        <button @click="showShareModal = true" class="btn btn-ghost btn-sm gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
          </svg>
          Share
        </button>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="isLoading && !party" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Error -->
    <div v-else-if="error && !party" class="container mx-auto px-4 py-8">
      <div class="alert alert-error">
        <span>{{ error }}</span>
      </div>
    </div>

    <!-- Party Content -->
    <main v-else-if="party" class="container mx-auto px-4 py-6 max-w-4xl">
      <!-- Party Header Card -->
      <div class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 class="text-2xl font-bold flex items-center gap-2">
                🎄 {{ party.name }}
              </h1>
              <p v-if="party.description" class="text-base-content/70 mt-2">
                {{ party.description }}
              </p>
            </div>
            <div class="flex flex-col items-end gap-2">
              <div class="badge badge-lg badge-outline">
                {{ formatDate(party.date) }}
              </div>
              <div v-if="party.budget" class="text-accent font-bold">
                Budget: {{ formatBudget(party.budget) }}
              </div>
            </div>
          </div>

          <!-- Status & Actions -->
          <div class="divider"></div>
          <div class="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div class="flex items-center gap-2">
              <span v-if="party.draw_complete" class="badge badge-success gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                Draw Complete
              </span>
              <span v-else class="badge badge-warning">Waiting for Draw</span>

              <span class="badge badge-ghost">
                {{ party.members?.length || 0 }} members
              </span>
            </div>

            <div class="flex gap-2">
              <!-- My Wishlist -->
              <RouterLink
                :to="`/party/${party.id}/my-profile`"
                class="btn btn-outline btn-sm gap-2"
              >
                <span>🎁</span>
                My Wishlist
              </RouterLink>

              <!-- Draw Button (for creator, before draw) -->
              <button
                v-if="isCreator && !party.draw_complete"
                @click="handleDraw"
                :disabled="!canDraw || actionLoading"
                class="btn btn-primary btn-sm gap-2"
              >
                <span v-if="actionLoading" class="loading loading-spinner loading-xs"></span>
                <span v-else>🎲</span>
                Run Draw
              </button>

              <!-- Reveal Button (after draw) -->
              <RouterLink
                v-if="party.draw_complete"
                :to="`/party/${party.id}/draw`"
                class="btn btn-primary btn-sm gap-2"
              >
                <span>{{ hasDrawn ? '👀' : '🎁' }}</span>
                {{ hasDrawn ? 'View Assignment' : 'Reveal Your Match' }}
              </RouterLink>
            </div>
          </div>

          <!-- Draw warning -->
          <div v-if="!party.draw_complete && party.members?.length < 3" class="alert alert-warning mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Need at least 3 members to run the draw. Share the party code to invite more people!</span>
          </div>
        </div>
      </div>

      <!-- Members Section -->
      <div class="mb-6">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>👥</span> Members
        </h2>

        <div class="grid gap-3 sm:grid-cols-2">
          <div
            v-for="member in party.members"
            :key="member.id"
            class="card bg-base-100 shadow-sm"
          >
            <div class="card-body p-4 flex-row items-center gap-4">
              <div class="text-3xl">{{ member.avatarEmoji }}</div>
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate flex items-center gap-2">
                  {{ member.displayName }}
                  <span v-if="member.userId === userStore.user?.id" class="badge badge-primary badge-xs">You</span>
                  <span v-if="member.role === 'creator'" class="badge badge-secondary badge-xs">Host</span>
                </div>
                <div class="text-sm text-base-content/60">
                  Joined {{ new Date(member.joinedAt).toLocaleDateString() }}
                </div>
              </div>
              <div v-if="party.draw_complete" class="flex-none">
                <span v-if="member.hasDrawn" class="badge badge-success badge-sm gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Revealed
                </span>
                <span v-else class="badge badge-ghost badge-sm">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Danger Zone (for creator) -->
      <div v-if="isCreator" class="card bg-base-100 shadow-sm border border-error/20">
        <div class="card-body">
          <h3 class="font-semibold text-error flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            Danger Zone
          </h3>
          <p class="text-sm text-base-content/70">
            Deleting this party will remove all members and their wishlists.
          </p>
          <div class="card-actions justify-end">
            <button @click="showDeleteConfirm = true" class="btn btn-error btn-sm">
              Delete Party
            </button>
          </div>
        </div>
      </div>

      <!-- Leave Party (for non-creators) -->
      <div v-else class="mt-6 text-center">
        <button @click="showLeaveConfirm = true" class="btn btn-ghost btn-sm text-error">
          Leave Party
        </button>
      </div>
    </main>

    <!-- Share Modal -->
    <SharePartyModal
      v-if="showShareModal && party"
      :join-code="party.join_code"
      :party-name="party.name"
      @close="showShareModal = false"
    />

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Delete Party?</h3>
        <p class="py-4">This will permanently delete "{{ party?.name }}" and remove all members. This cannot be undone.</p>
        <div class="modal-action">
          <button @click="showDeleteConfirm = false" class="btn btn-ghost">Cancel</button>
          <button @click="handleDelete" :disabled="actionLoading" class="btn btn-error">
            <span v-if="actionLoading" class="loading loading-spinner loading-xs"></span>
            Delete
          </button>
        </div>
      </div>
      <div class="modal-backdrop bg-black/50" @click="showDeleteConfirm = false"></div>
    </div>

    <!-- Leave Confirmation Modal -->
    <div v-if="showLeaveConfirm" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Leave Party?</h3>
        <p class="py-4">Are you sure you want to leave "{{ party?.name }}"? Your wishlist will be removed.</p>
        <div class="modal-action">
          <button @click="showLeaveConfirm = false" class="btn btn-ghost">Cancel</button>
          <button @click="handleLeave" :disabled="actionLoading" class="btn btn-error">
            <span v-if="actionLoading" class="loading loading-spinner loading-xs"></span>
            Leave
          </button>
        </div>
      </div>
      <div class="modal-backdrop bg-black/50" @click="showLeaveConfirm = false"></div>
    </div>
  </div>
</template>
