<script setup>
import { ref } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
  canMarkPurchased: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['remove', 'mark-purchased'])

const imageError = ref(false)

function handleImageError() {
  imageError.value = true
}

function formatPrice(price, currency = 'PHP') {
  if (!price) return null
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

function getPlatformColor(source) {
  switch (source) {
    case 'lazada':
      return 'badge-warning'
    case 'shopee':
      return 'badge-error'
    default:
      return 'badge-ghost'
  }
}
</script>

<template>
  <div
    class="card card-side bg-base-100 shadow-sm border border-base-200"
    :class="{ 'opacity-60': item.is_purchased }"
  >
    <!-- Product Image -->
    <figure class="w-24 h-24 flex-shrink-0 bg-base-200">
      <img
        v-if="item.image_url && !imageError"
        :src="item.image_url"
        :alt="item.title"
        class="h-full w-full object-cover"
        loading="lazy"
        @error="handleImageError"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-4xl"
      >
        🎁
      </div>
    </figure>

    <!-- Content -->
    <div class="card-body p-3 flex-1 min-w-0">
      <!-- Title -->
      <h4 class="font-medium text-sm line-clamp-2 leading-tight">
        {{ item.title }}
      </h4>

      <!-- Price & Source -->
      <div class="flex items-center gap-2 flex-wrap mt-1">
        <span v-if="item.price" class="text-accent font-bold text-sm">
          {{ formatPrice(item.price, item.currency) }}
        </span>
        <span
          v-if="item.source && item.source !== 'manual'"
          class="badge badge-xs capitalize"
          :class="getPlatformColor(item.source)"
        >
          {{ item.source }}
        </span>
      </div>

      <!-- Notes -->
      <p v-if="item.notes" class="text-xs text-base-content/60 line-clamp-1 mt-1">
        {{ item.notes }}
      </p>

      <!-- Purchased indicator -->
      <div v-if="item.is_purchased" class="badge badge-success badge-sm gap-1 mt-1">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
        Purchased
      </div>

      <!-- Actions -->
      <div class="card-actions justify-end mt-auto pt-1">
        <!-- View link -->
        <a
          v-if="item.url"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-ghost btn-xs gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          View
        </a>

        <!-- Mark as purchased (for gifter) -->
        <button
          v-if="canMarkPurchased && !item.is_purchased"
          @click="emit('mark-purchased', item.id, true)"
          class="btn btn-success btn-xs gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Got it
        </button>

        <!-- Unmark purchased -->
        <button
          v-if="canMarkPurchased && item.is_purchased"
          @click="emit('mark-purchased', item.id, false)"
          class="btn btn-ghost btn-xs"
        >
          Undo
        </button>

        <!-- Remove (for owner) -->
        <button
          v-if="canEdit"
          @click="emit('remove', item.id)"
          class="btn btn-ghost btn-xs text-error"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
