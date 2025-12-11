<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useParty } from '@/composables/useParty'
import { useWishlist } from '@/composables/useWishlist'
import { useUserStore } from '@/stores/userStore'
import WishlistItemCard from '@/components/wishlist/WishlistItemCard.vue'
import ProductSearchModal from '@/components/wishlist/ProductSearchModal.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { fetchParty, isLoading: partyLoading, error: partyError } = useParty()

const partyId = computed(() => route.params.id)
const { items: wishlistItems, isLoading: wishlistLoading, fetchItems, addItem, removeItem } = useWishlist(partyId.value)

const party = ref(null)
const showAddModal = ref(false)

async function loadData() {
  const { data } = await fetchParty(partyId.value)
  if (data) {
    party.value = data
    await fetchItems()
  }
}

async function handleAddItem(item) {
  const { error } = await addItem(item)
  if (!error) {
    showAddModal.value = false
  }
}

async function handleRemoveItem(itemId) {
  await removeItem(itemId)
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
          <span class="hidden sm:inline">Back to Party</span>
        </button>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="partyLoading && !party" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Error -->
    <div v-else-if="partyError && !party" class="container mx-auto px-4 py-8">
      <div class="alert alert-error">
        <span>{{ partyError }}</span>
      </div>
    </div>

    <!-- Content -->
    <main v-else-if="party" class="container mx-auto px-4 py-6 max-w-2xl">
      <!-- Profile Header -->
      <div class="text-center mb-8">
        <div class="text-6xl mb-4">{{ userStore.avatarEmoji }}</div>
        <h1 class="text-2xl font-bold">{{ userStore.displayName }}</h1>
        <p class="text-base-content/70 mt-1">Your wishlist for "{{ party.name }}"</p>
        <div v-if="party.budget" class="badge badge-outline mt-2">
          Budget: {{ formatBudget(party.budget) }}
        </div>
      </div>

      <!-- Wishlist Section -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <span>🎁</span> My Wishlist
            <span class="badge badge-ghost">{{ wishlistItems.length }}</span>
          </h2>
          <button
            @click="showAddModal = true"
            class="btn btn-primary btn-sm gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Item
          </button>
        </div>

        <!-- Loading -->
        <div v-if="wishlistLoading" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-md text-primary"></span>
        </div>

        <!-- Empty State -->
        <div v-else-if="wishlistItems.length === 0" class="text-center py-12 bg-base-200 rounded-xl">
          <div class="text-5xl mb-4">📝</div>
          <h3 class="text-lg font-semibold mb-2">Your wishlist is empty</h3>
          <p class="text-base-content/70 mb-6 max-w-sm mx-auto">
            Add items you'd like to receive! You can paste Lazada or Shopee links to auto-fill product details.
          </p>
          <button
            @click="showAddModal = true"
            class="btn btn-primary gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Your First Item
          </button>
        </div>

        <!-- Wishlist Items -->
        <div v-else class="space-y-3">
          <WishlistItemCard
            v-for="item in wishlistItems"
            :key="item.id"
            :item="item"
            :can-edit="true"
            @remove="handleRemoveItem"
          />
        </div>
      </div>

      <!-- Tips -->
      <div class="bg-base-200 rounded-xl p-4 mt-8">
        <h3 class="font-semibold mb-2 flex items-center gap-2">
          <span>💡</span> Tips
        </h3>
        <ul class="text-sm text-base-content/70 space-y-1">
          <li>• Add items at different price points to give options</li>
          <li>• Include product links so your Santa knows exactly what to get</li>
          <li>• Be specific about colors, sizes, or preferences in notes</li>
        </ul>
      </div>
    </main>

    <!-- Add Item Modal -->
    <ProductSearchModal
      v-if="showAddModal"
      :party-id="partyId"
      @close="showAddModal = false"
      @add-item="handleAddItem"
    />
  </div>
</template>
