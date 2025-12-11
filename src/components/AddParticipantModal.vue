<script setup>
import { ref } from 'vue'
import { useEventStore } from '../stores/eventStore'

const props = defineProps({
  eventId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['close'])

const eventStore = useEventStore()

const avatars = ['🎅', '🤶', '🧝', '⛄', '🦌', '🎄', '🌟', '❄️', '🎁', '🔔', '🧦', '🍪']

const form = ref({
  name: '',
  email: '',
  avatar: avatars[Math.floor(Math.random() * avatars.length)],
  wishlist: [''],
})

const errors = ref({})

function addWishlistItem() {
  form.value.wishlist.push('')
}

function removeWishlistItem(index) {
  form.value.wishlist.splice(index, 1)
}

function validateForm() {
  errors.value = {}

  if (!form.value.name.trim()) {
    errors.value.name = 'Name is required'
  }

  return Object.keys(errors.value).length === 0
}

function submit() {
  if (!validateForm()) return

  const wishlist = form.value.wishlist.filter(item => item.trim())

  eventStore.addParticipant(props.eventId, {
    name: form.value.name,
    email: form.value.email,
    avatar: form.value.avatar,
    wishlist,
  })

  emit('close')
}
</script>

<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-lg">
      <button @click="emit('close')" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>

      <h3 class="font-bold text-xl mb-6">Add Participant</h3>

      <form @submit.prevent="submit" class="space-y-4">
        <!-- Avatar Selection -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Choose Avatar</span>
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="avatar in avatars"
              :key="avatar"
              type="button"
              @click="form.avatar = avatar"
              class="btn btn-circle btn-lg text-2xl"
              :class="form.avatar === avatar ? 'btn-primary' : 'btn-ghost'"
            >
              {{ avatar }}
            </button>
          </div>
        </div>

        <!-- Name -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Name</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Enter name"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.name }"
          />
          <label v-if="errors.name" class="label">
            <span class="label-text-alt text-error">{{ errors.name }}</span>
          </label>
        </div>

        <!-- Email (Optional) -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Email (Optional)</span>
          </label>
          <input
            v-model="form.email"
            type="email"
            placeholder="email@example.com"
            class="input input-bordered w-full"
          />
        </div>

        <!-- Wishlist -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Wishlist (Optional)</span>
          </label>
          <div class="space-y-2">
            <div
              v-for="(item, index) in form.wishlist"
              :key="index"
              class="flex gap-2"
            >
              <input
                v-model="form.wishlist[index]"
                type="text"
                :placeholder="`Gift idea ${index + 1}`"
                class="input input-bordered flex-1"
              />
              <button
                v-if="form.wishlist.length > 1"
                type="button"
                @click="removeWishlistItem(index)"
                class="btn btn-ghost btn-square"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <button
            type="button"
            @click="addWishlistItem"
            class="btn btn-ghost btn-sm gap-1 mt-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        </div>

        <!-- Actions -->
        <div class="modal-action">
          <button type="button" @click="emit('close')" class="btn btn-ghost">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Participant</button>
        </div>
      </form>
    </div>
    <div class="modal-backdrop bg-black/50" @click="emit('close')"></div>
  </div>
</template>
