<script setup>
import { ref, computed, watch } from 'vue'
import { useProductSearch } from '@/composables/useProductSearch'

const props = defineProps({
  partyId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['close', 'add-item'])

const activeTab = ref('url') // 'url' | 'manual'
const { isLoading, error, extractMetadata, isValidProductUrl, getPlatformFromUrl } = useProductSearch()

// URL Tab State
const productUrl = ref('')
const extractedProduct = ref(null)
const urlError = ref(null)

// Manual Tab State
const manualForm = ref({
  title: '',
  url: '',
  imageUrl: '',
  price: null,
  notes: '',
})

// Computed
const canExtract = computed(() => {
  return productUrl.value.trim() && isValidProductUrl(productUrl.value)
})

const detectedPlatform = computed(() => {
  return getPlatformFromUrl(productUrl.value)
})

// Watch URL input for validation feedback
watch(productUrl, (newUrl) => {
  if (newUrl && !isValidProductUrl(newUrl)) {
    urlError.value = 'Please enter a valid Lazada or Shopee Philippines URL'
  } else {
    urlError.value = null
  }
  extractedProduct.value = null
})

// URL Tab Functions
async function handleExtract() {
  if (!canExtract.value) return

  urlError.value = null
  extractedProduct.value = null

  const result = await extractMetadata(productUrl.value)

  if (result) {
    extractedProduct.value = result
  } else if (error.value) {
    urlError.value = error.value
  }
}

function confirmAddFromUrl() {
  if (!extractedProduct.value) return

  emit('add-item', {
    title: extractedProduct.value.title,
    url: extractedProduct.value.url,
    imageUrl: extractedProduct.value.imageUrl,
    price: extractedProduct.value.price,
    currency: extractedProduct.value.currency,
    source: extractedProduct.value.source,
  })

  emit('close')
}

// Manual Tab Functions
const canSubmitManual = computed(() => {
  return manualForm.value.title.trim().length > 0
})

function submitManual() {
  if (!canSubmitManual.value) return

  emit('add-item', {
    title: manualForm.value.title.trim(),
    url: manualForm.value.url.trim() || null,
    imageUrl: manualForm.value.imageUrl.trim() || null,
    price: manualForm.value.price || null,
    currency: 'PHP',
    source: 'manual',
    notes: manualForm.value.notes.trim() || null,
  })

  emit('close')
}

// Reset state when switching tabs
watch(activeTab, () => {
  productUrl.value = ''
  extractedProduct.value = null
  urlError.value = null
  manualForm.value = {
    title: '',
    url: '',
    imageUrl: '',
    price: null,
    notes: '',
  }
})
</script>

<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-lg max-h-[90vh]">
      <button @click="emit('close')" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
        ✕
      </button>

      <h3 class="font-bold text-xl mb-4 flex items-center gap-2">
        <span>🎁</span> Add to Wishlist
      </h3>

      <!-- Tabs -->
      <div class="tabs tabs-boxed mb-4">
        <a
          class="tab flex-1"
          :class="{ 'tab-active': activeTab === 'url' }"
          @click="activeTab = 'url'"
        >
          <span class="mr-2">🔗</span> Paste URL
        </a>
        <a
          class="tab flex-1"
          :class="{ 'tab-active': activeTab === 'manual' }"
          @click="activeTab = 'manual'"
        >
          <span class="mr-2">✏️</span> Manual
        </a>
      </div>

      <!-- URL Tab Content -->
      <div v-if="activeTab === 'url'" class="space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Paste Lazada or Shopee product URL</span>
          </label>
          <div class="flex gap-2">
            <input
              v-model="productUrl"
              type="url"
              placeholder="https://www.lazada.com.ph/products/..."
              class="input input-bordered flex-1"
              :class="{ 'input-error': urlError }"
              @keyup.enter="handleExtract"
            />
            <button
              @click="handleExtract"
              class="btn btn-primary"
              :disabled="isLoading || !canExtract"
            >
              <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
              <span v-else>Extract</span>
            </button>
          </div>

          <!-- Platform indicator -->
          <label class="label" v-if="detectedPlatform || urlError">
            <span v-if="urlError" class="label-text-alt text-error">{{ urlError }}</span>
            <span v-else-if="detectedPlatform" class="label-text-alt text-success capitalize">
              ✓ {{ detectedPlatform }} link detected
            </span>
          </label>
        </div>

        <!-- Extracted Product Preview -->
        <div v-if="extractedProduct" class="card bg-base-200">
          <div class="card-body p-4">
            <div class="flex gap-4">
              <div class="w-20 h-20 flex-shrink-0 bg-base-300 rounded-lg overflow-hidden">
                <img
                  v-if="extractedProduct.imageUrl"
                  :src="extractedProduct.imageUrl"
                  :alt="extractedProduct.title"
                  class="w-full h-full object-cover"
                  @error="$event.target.style.display = 'none'"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-3xl">
                  🎁
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold line-clamp-2 text-sm">{{ extractedProduct.title }}</h4>
                <div class="flex items-center gap-2 mt-2">
                  <span v-if="extractedProduct.price" class="text-accent font-bold">
                    {{ extractedProduct.currency }} {{ extractedProduct.price?.toLocaleString() }}
                  </span>
                  <span class="badge badge-sm capitalize" :class="{
                    'badge-warning': extractedProduct.source === 'lazada',
                    'badge-error': extractedProduct.source === 'shopee',
                  }">
                    {{ extractedProduct.source }}
                  </span>
                </div>
              </div>
            </div>
            <div class="card-actions justify-end mt-3">
              <button @click="confirmAddFromUrl" class="btn btn-primary btn-sm">
                Add to Wishlist
              </button>
            </div>
          </div>
        </div>

        <!-- Help text -->
        <div class="text-xs text-base-content/60 bg-base-200 rounded-lg p-3">
          <p class="font-medium mb-1">How to get a product URL:</p>
          <ol class="list-decimal list-inside space-y-1">
            <li>Open the product page on Lazada or Shopee</li>
            <li>Copy the URL from your browser's address bar</li>
            <li>Paste it here and click Extract</li>
          </ol>
        </div>
      </div>

      <!-- Manual Tab Content -->
      <div v-if="activeTab === 'manual'" class="space-y-5">
        <!-- Product Name -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend text-sm font-medium">
            Product Name
            <span class="text-error">*</span>
          </legend>
          <input
            v-model="manualForm.title"
            type="text"
            placeholder="e.g., Wireless Earbuds, Nike Air Max, etc."
            class="input input-bordered w-full"
          />
        </fieldset>

        <!-- Link -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend text-sm font-medium">
            Link
            <span class="badge badge-ghost badge-xs ml-1">Optional</span>
          </legend>
          <input
            v-model="manualForm.url"
            type="url"
            placeholder="https://www.lazada.com.ph/..."
            class="input input-bordered w-full"
          />
        </fieldset>

        <!-- Image URL -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend text-sm font-medium">
            Image URL
            <span class="badge badge-ghost badge-xs ml-1">Optional</span>
          </legend>
          <input
            v-model="manualForm.imageUrl"
            type="url"
            placeholder="https://..."
            class="input input-bordered w-full"
          />
          <p class="text-xs text-base-content/50 mt-1">
            Right-click on an image and select "Copy image address"
          </p>
        </fieldset>

        <!-- Price -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend text-sm font-medium">
            Price
            <span class="badge badge-ghost badge-xs ml-1">Optional</span>
          </legend>
          <div class="join w-full">
            <span class="join-item btn no-animation">₱</span>
            <input
              v-model.number="manualForm.price"
              type="number"
              placeholder="0"
              min="0"
              class="input input-bordered join-item w-full"
            />
          </div>
        </fieldset>

        <!-- Notes -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend text-sm font-medium">
            Notes
            <span class="badge badge-ghost badge-xs ml-1">Optional</span>
          </legend>
          <textarea
            v-model="manualForm.notes"
            placeholder="Color preference, size, specific variant, etc."
            class="textarea textarea-bordered w-full h-20 resize-none"
          ></textarea>
        </fieldset>

        <!-- Submit Button -->
        <button
          @click="submitManual"
          :disabled="!canSubmitManual"
          class="btn btn-primary w-full gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add to Wishlist
        </button>
      </div>
    </div>
    <div class="modal-backdrop bg-black/50" @click="emit('close')"></div>
  </div>
</template>
