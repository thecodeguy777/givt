<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useParty } from '@/composables/useParty'
import { useWishlist } from '@/composables/useWishlist'
import { useUserStore } from '@/stores/userStore'
import GiftBoxMagic from '@/components/GiftBoxMagic.vue'
import MagicRevealBurst from '@/components/MagicRevealBurst.vue'
import WishlistItemCard from '@/components/wishlist/WishlistItemCard.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { fetchParty, getMyMembership, revealDraw, isLoading, error } = useParty()

const partyId = computed(() => route.params.id)
const { markPurchased } = useWishlist(partyId.value)

const party = ref(null)
const myMembership = ref(null)
const assignedPerson = ref(null)
const assignedWishlist = ref([])

// Animation states
const showMagicBurst = ref(false)
const giftPhase = ref('idle') // 'idle', 'hover', 'charging', 'shaking', 'opening', 'revealed'
const drawPhase = ref('loading') // 'loading', 'not-ready', 'ready', 'drawing', 'revealed'

const hasAlreadyRevealed = computed(() => myMembership.value?.has_drawn)

async function loadData() {
  drawPhase.value = 'loading'

  const { data: partyData } = await fetchParty(partyId.value)
  if (!partyData) {
    drawPhase.value = 'not-ready'
    return
  }
  party.value = partyData

  const { data: membershipData } = await getMyMembership(partyId.value)
  myMembership.value = membershipData

  if (!partyData.draw_complete) {
    drawPhase.value = 'not-ready'
    return
  }

  // If already revealed, fetch the assigned person directly
  if (membershipData?.has_drawn && membershipData?.assigned_to) {
    await loadAssignedPerson(membershipData.assigned_to)
    drawPhase.value = 'revealed'
    giftPhase.value = 'revealed'
  } else {
    drawPhase.value = 'ready'
    giftPhase.value = 'idle'
  }
}

async function loadAssignedPerson(userId) {
  // Find the assigned person from party members
  const member = party.value.members.find(m => m.userId === userId)
  if (member) {
    assignedPerson.value = {
      id: member.userId,
      displayName: member.displayName,
      avatarEmoji: member.avatarEmoji,
    }

    // Fetch their wishlist
    const { fetchUserWishlist } = useWishlist(partyId.value)
    assignedWishlist.value = await fetchUserWishlist(userId)
  }
}

function handleGiftHover(isHovering) {
  if (drawPhase.value === 'ready' && giftPhase.value !== 'charging') {
    giftPhase.value = isHovering ? 'hover' : 'idle'
  }
}

async function startReveal() {
  if (drawPhase.value !== 'ready' || giftPhase.value === 'charging') return

  drawPhase.value = 'drawing'

  // Phase 1: Charging (ribbon untying) - 1.5s
  giftPhase.value = 'charging'
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Phase 2: Shaking (building suspense) - 2s
  giftPhase.value = 'shaking'
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Perform the reveal
  const { data, error: revealError } = await revealDraw(partyId.value)

  if (data) {
    assignedPerson.value = {
      id: data.id,
      displayName: data.display_name,
      avatarEmoji: data.avatar_emoji,
    }
    assignedWishlist.value = data.wishlist || []

    // Phase 3: Opening - trigger magic burst
    giftPhase.value = 'opening'
    showMagicBurst.value = true
    await new Promise(resolve => setTimeout(resolve, 800))

    // Phase 4: Revealed
    giftPhase.value = 'revealed'
    drawPhase.value = 'revealed'

    // Reload membership to reflect has_drawn
    const { data: membershipData } = await getMyMembership(partyId.value)
    myMembership.value = membershipData

    // Hide magic burst after animation
    setTimeout(() => {
      showMagicBurst.value = false
    }, 3500)
  } else {
    alert(revealError?.message || 'Could not reveal. Please try again.')
    drawPhase.value = 'ready'
    giftPhase.value = 'idle'
  }
}

async function handleMarkPurchased(itemId, isPurchased) {
  const { data } = await markPurchased(itemId, isPurchased)
  if (data) {
    // Update local wishlist
    const index = assignedWishlist.value.findIndex(i => i.id === itemId)
    if (index !== -1) {
      assignedWishlist.value[index] = data
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

function goBack() {
  router.push(`/party/${partyId.value}`)
}

onMounted(loadData)
</script>

<template>
  <div class="min-h-screen py-8 px-4 relative overflow-hidden">
    <!-- Magic Reveal Burst -->
    <MagicRevealBurst
      :active="showMagicBurst"
      :person-name="assignedPerson?.displayName"
      :person-avatar="assignedPerson?.avatarEmoji"
    />

    <div class="container mx-auto max-w-2xl relative z-10">
      <!-- Back Button -->
      <button @click="goBack" class="btn btn-ghost gap-2 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Party
      </button>

      <!-- Loading -->
      <div v-if="drawPhase === 'loading'" class="flex justify-center py-20">
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <!-- Draw Not Ready -->
      <div v-else-if="drawPhase === 'not-ready'" class="text-center py-16">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body items-center">
            <div class="text-6xl mb-4">⏳</div>
            <h2 class="text-2xl font-bold mb-2">Draw Not Ready Yet</h2>
            <p class="text-base-content/70 mb-4">
              {{ party ? "The party host hasn't run the draw yet." : "Party not found." }}
            </p>
            <p v-if="party" class="text-sm text-base-content/60 mb-6">
              Check back later or ask the host to run the draw.
            </p>
            <button @click="goBack" class="btn btn-primary">
              Go Back
            </button>
          </div>
        </div>
      </div>

      <!-- Ready to Reveal -->
      <div v-else-if="drawPhase === 'ready'" class="text-center">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body items-center">
            <h1 class="text-2xl font-bold mb-2">{{ party?.name }}</h1>
            <p class="text-base-content/60 mb-6">Click the gift box to reveal who you're gifting!</p>

            <div
              @mouseenter="handleGiftHover(true)"
              @mouseleave="handleGiftHover(false)"
            >
              <GiftBoxMagic
                :phase="giftPhase"
                :revealed-person="null"
                @click="startReveal"
              />
            </div>

            <p class="text-sm text-base-content/50 mt-6">
              Tap or click the gift to reveal
            </p>
          </div>
        </div>
      </div>

      <!-- Drawing Animation -->
      <div v-else-if="drawPhase === 'drawing'" class="text-center">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body items-center">
            <h2 class="text-2xl font-bold mb-2 animate-pulse">
              {{ giftPhase === 'charging' ? '✨ Preparing...' : '🎁 Revealing...' }}
            </h2>
            <p class="text-base-content/60 mb-6">
              {{ giftPhase === 'charging' ? 'Untying the magical ribbon...' : 'Selecting your gift recipient...' }}
            </p>

            <GiftBoxMagic
              :phase="giftPhase"
              :revealed-person="null"
            />

            <div class="mt-6 flex items-center gap-2">
              <span class="loading loading-dots loading-md text-primary"></span>
              <span class="text-sm text-base-content/50">Magic in progress...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Revealed -->
      <div v-else-if="drawPhase === 'revealed'" class="text-center">
        <div class="card bg-base-100 shadow-xl mb-6">
          <div class="card-body items-center">
            <GiftBoxMagic
              :phase="giftPhase"
              :revealed-person="assignedPerson"
            />

            <div class="mt-6">
              <p class="text-base-content/60 mb-2">You are the Secret Santa for:</p>
              <div class="text-6xl mb-4">{{ assignedPerson?.avatarEmoji }}</div>
              <h2 class="text-3xl font-bold text-primary mb-2">{{ assignedPerson?.displayName }}</h2>

              <p v-if="party?.budget" class="text-accent font-semibold mt-2">
                Budget: {{ formatBudget(party.budget) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Wishlist Section -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🎁</span>
              {{ assignedPerson?.displayName }}'s Wishlist
              <span class="badge badge-ghost">{{ assignedWishlist.length }}</span>
            </h3>

            <div v-if="assignedWishlist.length === 0" class="text-center py-8">
              <div class="text-4xl mb-2">📝</div>
              <p class="text-base-content/70">No wishlist items yet</p>
              <p class="text-sm text-base-content/50 mt-1">
                They haven't added any items to their wishlist
              </p>
            </div>

            <div v-else class="space-y-3">
              <WishlistItemCard
                v-for="item in assignedWishlist"
                :key="item.id"
                :item="item"
                :can-mark-purchased="true"
                @mark-purchased="handleMarkPurchased"
              />
            </div>

            <div class="alert bg-base-200 mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-sm">
                Click "Got it" on items you've purchased to help avoid duplicates!
              </span>
            </div>
          </div>
        </div>

        <button @click="goBack" class="btn btn-ghost mt-6">
          Back to Party
        </button>
      </div>
    </div>
  </div>
</template>
