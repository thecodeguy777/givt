<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventStore } from '../stores/eventStore'

const route = useRoute()
const router = useRouter()
const eventStore = useEventStore()

const event = computed(() => eventStore.getEventById(route.params.id))
const participant = computed(() => {
  if (!event.value) return null
  return event.value.participants.find(p => p.id === route.params.participantId)
})

const drawnPerson = computed(() => {
  if (!participant.value?.drawnPerson || !event.value) return null
  return event.value.participants.find(p => p.id === participant.value.drawnPerson)
})

// Edit mode
const isEditing = ref(false)
const editForm = ref({
  name: '',
  email: '',
  wishlist: [],
})

function startEdit() {
  editForm.value = {
    name: participant.value.name,
    email: participant.value.email || '',
    wishlist: [...(participant.value.wishlist || [])],
  }
  if (editForm.value.wishlist.length === 0) {
    editForm.value.wishlist.push('')
  }
  isEditing.value = true
}

function addWishlistItem() {
  editForm.value.wishlist.push('')
}

function removeWishlistItem(index) {
  editForm.value.wishlist.splice(index, 1)
}

function saveChanges() {
  const wishlist = editForm.value.wishlist.filter(item => item.trim())

  eventStore.updateParticipant(route.params.id, route.params.participantId, {
    name: editForm.value.name,
    email: editForm.value.email,
    wishlist,
  })

  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
}

function goBack() {
  router.push(`/event/${route.params.id}`)
}
</script>

<template>
  <div class="min-h-screen py-8 px-4">
    <div class="container mx-auto max-w-2xl">
      <!-- Back Button -->
      <button @click="goBack" class="btn btn-ghost gap-2 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Event
      </button>

      <div v-if="participant && event">
        <!-- Profile Card -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <!-- Header -->
            <div class="flex flex-col items-center text-center mb-6">
              <div
                class="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4"
                :class="participant.color || 'bg-primary/20'"
              >
                {{ participant.avatar }}
              </div>

              <div v-if="!isEditing">
                <h1 class="text-3xl font-bold text-base-content">{{ participant.name }}</h1>
                <p v-if="participant.email" class="text-base-content/60 mt-1">
                  {{ participant.email }}
                </p>
              </div>

              <div v-else class="w-full max-w-xs space-y-3">
                <input
                  v-model="editForm.name"
                  type="text"
                  class="input input-bordered w-full text-center text-xl font-bold"
                  placeholder="Name"
                />
                <input
                  v-model="editForm.email"
                  type="email"
                  class="input input-bordered w-full text-center"
                  placeholder="Email (optional)"
                />
              </div>
            </div>

            <!-- Status Badge -->
            <div class="flex justify-center mb-6">
              <div
                v-if="participant.hasDrawn"
                class="badge badge-success badge-lg gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Has drawn a gift recipient
              </div>
              <div
                v-else
                class="badge badge-warning badge-lg gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Waiting to draw
              </div>
            </div>

            <!-- Gift Assignment (if drawn) -->
            <div
              v-if="drawnPerson"
              class="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 mb-6"
            >
              <h3 class="text-sm font-semibold text-base-content/60 mb-3 uppercase tracking-wide">
                Giving Gift To
              </h3>
              <div class="flex items-center gap-4">
                <div
                  class="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                  :class="drawnPerson.color || 'bg-secondary/20'"
                >
                  {{ drawnPerson.avatar }}
                </div>
                <div>
                  <h4 class="text-xl font-bold">{{ drawnPerson.name }}</h4>
                  <router-link
                    :to="`/event/${event.id}/participant/${drawnPerson.id}`"
                    class="text-primary text-sm hover:underline"
                  >
                    View their wishlist →
                  </router-link>
                </div>
              </div>
            </div>

            <!-- Budget Info -->
            <div class="bg-accent/10 rounded-xl p-4 mb-6 text-center">
              <p class="text-sm text-base-content/60">Event Budget</p>
              <p class="text-2xl font-bold text-accent">₱{{ event.budget }}</p>
            </div>

            <!-- Wishlist -->
            <div class="mb-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">Wishlist</h3>
                <button
                  v-if="!isEditing"
                  @click="startEdit"
                  class="btn btn-ghost btn-sm gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit
                </button>
              </div>

              <div v-if="!isEditing">
                <div v-if="participant.wishlist?.length > 0" class="space-y-2">
                  <div
                    v-for="(item, index) in participant.wishlist"
                    :key="index"
                    class="flex items-center gap-3 p-3 bg-base-200 rounded-lg"
                  >
                    <span class="text-xl">🎁</span>
                    <span>{{ item }}</span>
                  </div>
                </div>
                <div v-else class="text-center py-8 text-base-content/50">
                  <div class="text-4xl mb-2">📝</div>
                  <p>No wishlist items yet</p>
                  <button @click="startEdit" class="btn btn-ghost btn-sm mt-2">
                    Add items
                  </button>
                </div>
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="(item, index) in editForm.wishlist"
                  :key="index"
                  class="flex gap-2"
                >
                  <input
                    v-model="editForm.wishlist[index]"
                    type="text"
                    :placeholder="`Gift idea ${index + 1}`"
                    class="input input-bordered flex-1"
                  />
                  <button
                    v-if="editForm.wishlist.length > 1"
                    type="button"
                    @click="removeWishlistItem(index)"
                    class="btn btn-ghost btn-square"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <button
                  type="button"
                  @click="addWishlistItem"
                  class="btn btn-ghost btn-sm gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Item
                </button>
              </div>
            </div>

            <!-- Edit Actions -->
            <div v-if="isEditing" class="flex justify-end gap-3">
              <button @click="cancelEdit" class="btn btn-ghost">Cancel</button>
              <button @click="saveChanges" class="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Not Found -->
      <div v-else class="text-center py-16">
        <div class="text-6xl mb-4">😢</div>
        <h3 class="text-xl font-semibold text-base-content/70 mb-2">Participant not found</h3>
        <router-link :to="`/event/${route.params.id}`" class="btn btn-primary">
          Back to Event
        </router-link>
      </div>
    </div>
  </div>
</template>
