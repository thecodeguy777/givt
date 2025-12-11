<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useParty } from '@/composables/useParty'
import { useWishlist } from '@/composables/useWishlist'
import { useUserStore } from '@/stores/userStore'
import WishlistItemCard from '@/components/wishlist/WishlistItemCard.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { fetchParty, getMyMembership, isLoading, error } = useParty()

const partyId = computed(() => route.params.id)
const memberId = computed(() => route.params.memberId)

const party = ref(null)
const member = ref(null)
const memberWishlist = ref([])
const myMembership = ref(null)

const isMyAssignment = computed(() => {
  return myMembership.value?.assigned_to === memberId.value
})

async function loadData() {
  // Fetch party data
  const { data: partyData } = await fetchParty(partyId.value)
  if (!partyData) return

  party.value = partyData

  // Find the member
  const foundMember = partyData.members.find(m => m.userId === memberId.value)
  if (foundMember) {
    member.value = foundMember
  }

  // Get current user's membership
  const { data: membershipData } = await getMyMembership(partyId.value)
  myMembership.value = membershipData

  // Fetch member's wishlist
  const { fetchUserWishlist } = useWishlist(partyId.value)
  memberWishlist.value = await fetchUserWishlist(memberId.value)
}

async function handleMarkPurchased(itemId, isPurchased) {
  const { markPurchased } = useWishlist(partyId.value)
  const { data } = await markPurchased(itemId, isPurchased)
  if (data) {
    const index = memberWishlist.value.findIndex(i => i.id === itemId)
    if (index !== -1) {
      memberWishlist.value[index] = data
    }
  }
}

function formatBudget(amount) {
  if (!amount) return null
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
  }).format(amount)
}

onMounted(loadData)
</script>

<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="navbar bg-base-100 shadow-lg sticky top-0 z-40">
      <div class="flex-1">
        <button @click="router.back()" class="btn btn-ghost gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back
        </button>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="isLoading && !member" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Not Found -->
    <div v-else-if="!member" class="container mx-auto px-4 py-8 text-center">
      <div class="text-6xl mb-4">😢</div>
      <h2 class="text-xl font-bold mb-2">Member Not Found</h2>
      <button @click="router.back()" class="btn btn-primary mt-4">
        Go Back
      </button>
    </div>

    <!-- Member Profile -->
    <main v-else class="container mx-auto px-4 py-6 max-w-2xl">
      <!-- Profile Header -->
      <div class="text-center mb-8">
        <div class="text-6xl mb-4">{{ member.avatarEmoji }}</div>
        <h1 class="text-2xl font-bold">{{ member.displayName }}</h1>

        <!-- Assignment badge -->
        <div v-if="isMyAssignment" class="badge badge-primary badge-lg gap-2 mt-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
          Your Gift Recipient
        </div>

        <p class="text-base-content/70 mt-2">
          {{ party?.name }}
        </p>

        <div v-if="party?.budget" class="badge badge-outline mt-2">
          Budget: {{ formatBudget(party.budget) }}
        </div>
      </div>

      <!-- Wishlist Section -->
      <div class="mb-6">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>🎁</span> {{ member.displayName }}'s Wishlist
          <span class="badge badge-ghost">{{ memberWishlist.length }}</span>
        </h2>

        <!-- Empty State -->
        <div v-if="memberWishlist.length === 0" class="text-center py-12 bg-base-200 rounded-xl">
          <div class="text-5xl mb-4">📝</div>
          <h3 class="text-lg font-semibold mb-2">No wishlist items yet</h3>
          <p class="text-base-content/70">
            {{ member.displayName }} hasn't added any items to their wishlist.
          </p>
        </div>

        <!-- Wishlist Items -->
        <div v-else class="space-y-3">
          <WishlistItemCard
            v-for="item in memberWishlist"
            :key="item.id"
            :item="item"
            :can-mark-purchased="isMyAssignment"
            @mark-purchased="handleMarkPurchased"
          />
        </div>

        <!-- Tip for assigned Santa -->
        <div v-if="isMyAssignment && memberWishlist.length > 0" class="alert bg-base-200 mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="text-sm">
            Mark items as "Got it" when you've purchased them to help avoid duplicate gifts!
          </span>
        </div>
      </div>
    </main>
  </div>
</template>
