<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  joinCode: {
    type: String,
    required: true,
  },
  partyName: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['close'])

const copied = ref(false)
const canShare = ref(false)

onMounted(() => {
  canShare.value = typeof navigator !== 'undefined' && !!navigator.share
})

const joinUrl = computed(() => {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/join/${props.joinCode}`
})

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      // Fallback for insecure contexts (HTTP)
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

async function copyCode() {
  await copyToClipboard(props.joinCode)
}

async function copyLink() {
  await copyToClipboard(joinUrl.value)
}

async function shareNative() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Join ${props.partyName}`,
        text: `You're invited to join our gift exchange! Use code: ${props.joinCode}`,
        url: joinUrl.value,
      })
    } catch (e) {
      // User cancelled or error
    }
  }
}
</script>

<template>
  <div class="modal modal-open">
    <div class="modal-box">
      <button @click="emit('close')" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
        ✕
      </button>

      <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
        <span>🎟️</span> Share Party
      </h3>

      <!-- Join Code -->
      <div class="mb-6">
        <label class="label">
          <span class="label-text font-medium">Join Code</span>
        </label>
        <div class="flex gap-2">
          <div class="flex-1 bg-base-200 rounded-lg p-4 text-center">
            <span class="font-mono text-3xl tracking-widest font-bold text-primary">
              {{ joinCode }}
            </span>
          </div>
          <button @click="copyCode" class="btn btn-square btn-outline">
            <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-success">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </button>
        </div>
        <p class="text-xs text-base-content/60 mt-2">
          Share this code with friends to invite them
        </p>
      </div>

      <!-- Join Link -->
      <div class="mb-6">
        <label class="label">
          <span class="label-text font-medium">Or share link</span>
        </label>
        <div class="flex gap-2">
          <input
            type="text"
            :value="joinUrl"
            readonly
            class="input input-bordered flex-1 text-sm"
          />
          <button @click="copyLink" class="btn btn-outline">
            Copy
          </button>
        </div>
      </div>

      <!-- Native Share (mobile) -->
      <div v-if="canShare" class="mb-4">
        <button @click="shareNative" class="btn btn-primary w-full gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
          </svg>
          Share via...
        </button>
      </div>

      <!-- Copy success toast -->
      <div v-if="copied" class="alert alert-success py-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Copied to clipboard!</span>
      </div>
    </div>
    <div class="modal-backdrop bg-black/50" @click="emit('close')"></div>
  </div>
</template>
