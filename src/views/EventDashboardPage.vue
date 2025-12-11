<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventStore } from '../stores/eventStore'
import AddParticipantModal from '../components/AddParticipantModal.vue'
import ParticipantCard from '../components/ParticipantCard.vue'

const route = useRoute()
const router = useRouter()
const eventStore = useEventStore()

const event = computed(() => eventStore.getEventById(route.params.id))
const showAddModal = ref(false)

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function goToDraw() {
  router.push(`/event/${route.params.id}/draw`)
}

function resetDraw() {
  if (confirm('Are you sure you want to reset the draw? All assignments will be cleared.')) {
    eventStore.resetDraw(route.params.id)
  }
}

function removeParticipant(participantId) {
  if (confirm('Are you sure you want to remove this participant?')) {
    eventStore.removeParticipant(route.params.id, participantId)
  }
}

function viewProfile(participantId) {
  router.push(`/event/${route.params.id}/participant/${participantId}`)
}

const drawnCount = computed(() => {
  if (!event.value) return 0
  return event.value.participants.filter(p => p.hasDrawn).length
})

const canStartDraw = computed(() => {
  return event.value && event.value.participants.length >= 2 && !event.value.drawComplete
})
</script>

<template>
  <div class="min-h-screen py-8 px-4">
    <div class="container mx-auto max-w-4xl">
      <!-- Back Button -->
      <router-link to="/" class="btn btn-ghost gap-2 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Events
      </router-link>

      <div v-if="event">
        <!-- Event Header -->
        <div class="card bg-base-100 shadow-xl mb-8">
          <div class="card-body">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 class="text-3xl font-bold text-primary flex items-center gap-3">
                  🎁 {{ event.name }}
                </h1>
                <p class="text-base-content/60 mt-1">{{ formatDate(event.date) }}</p>
                <p v-if="event.description" class="text-base-content/70 mt-3">
                  {{ event.description }}
                </p>
              </div>
              <div class="flex flex-col items-end gap-2">
                <div class="badge badge-accent badge-lg">₱{{ event.budget }} budget</div>
                <div v-if="event.drawComplete" class="badge badge-success gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Draw Complete!
                </div>
              </div>
            </div>

            <!-- Progress -->
            <div v-if="event.participants.length > 0 && !event.drawComplete" class="mt-6">
              <div class="flex justify-between text-sm mb-2">
                <span>Draw Progress</span>
                <span class="font-semibold">{{ drawnCount }} / {{ event.participants.length }}</span>
              </div>
              <progress
                class="progress progress-primary w-full"
                :value="drawnCount"
                :max="event.participants.length"
              ></progress>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-3 mb-8">
          <button
            @click="showAddModal = true"
            class="btn btn-secondary gap-2"
            :disabled="event.drawComplete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add Participant
          </button>

          <button
            v-if="canStartDraw"
            @click="goToDraw"
            class="btn btn-primary gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Draw
          </button>

          <button
            v-if="event.drawComplete || drawnCount > 0"
            @click="resetDraw"
            class="btn btn-ghost btn-outline gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Draw
          </button>
        </div>

        <!-- Participants Grid -->
        <div v-if="event.participants.length > 0">
          <h2 class="text-xl font-bold mb-4">
            Participants ({{ event.participants.length }})
          </h2>
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ParticipantCard
              v-for="participant in event.participants"
              :key="participant.id"
              :participant="participant"
              :event="event"
              @view="viewProfile(participant.id)"
              @remove="removeParticipant(participant.id)"
              @draw="goToDraw"
            />
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-16 card bg-base-100 shadow-lg">
          <div class="card-body">
            <div class="text-6xl mb-4">👥</div>
            <h3 class="text-xl font-semibold text-base-content/70 mb-2">No participants yet</h3>
            <p class="text-base-content/50 mb-6">Add at least 2 participants to start the gift exchange!</p>
            <button @click="showAddModal = true" class="btn btn-secondary mx-auto">
              Add First Participant
            </button>
          </div>
        </div>
      </div>

      <!-- Event Not Found -->
      <div v-else class="text-center py-16">
        <div class="text-6xl mb-4">😢</div>
        <h3 class="text-xl font-semibold text-base-content/70 mb-2">Event not found</h3>
        <router-link to="/" class="btn btn-primary">
          Go Home
        </router-link>
      </div>
    </div>

    <!-- Add Participant Modal -->
    <AddParticipantModal
      v-if="showAddModal"
      :event-id="route.params.id"
      @close="showAddModal = false"
    />
  </div>
</template>
