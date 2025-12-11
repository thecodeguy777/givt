<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '../stores/eventStore'

const router = useRouter()
const eventStore = useEventStore()

const events = computed(() => eventStore.events)

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function goToEvent(eventId) {
  router.push(`/event/${eventId}`)
}

function deleteEvent(eventId) {
  if (confirm('Are you sure you want to delete this event?')) {
    eventStore.deleteEvent(eventId)
  }
}
</script>

<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <div class="hero min-h-[60vh] bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      <div class="hero-content text-center">
        <div class="max-w-2xl">
          <div class="text-8xl mb-6 animate-bounce">🎁</div>
          <h1 class="text-5xl font-extrabold text-base-content mb-4">
            Bunutan
          </h1>
          <p class="text-xl text-base-content/70 mb-8">
            The fun way to organize your gift exchange! Create an event, add participants,
            and let everyone draw their secret gift recipient with an exciting animated reveal.
          </p>
          <router-link to="/create" class="btn btn-primary btn-lg gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create New Event
          </router-link>
        </div>
      </div>
    </div>

    <!-- Events List -->
    <div class="container mx-auto px-4 py-12">
      <div v-if="events.length > 0">
        <h2 class="text-2xl font-bold text-base-content mb-6">Your Events</h2>
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="event in events"
            :key="event.id"
            class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer participant-card"
          >
            <div class="card-body">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="card-title text-primary">{{ event.name }}</h3>
                  <p class="text-sm text-base-content/60">{{ formatDate(event.date) }}</p>
                </div>
                <div class="badge badge-secondary">
                  {{ event.participants.length }} participants
                </div>
              </div>

              <p v-if="event.description" class="text-base-content/70 mt-2 line-clamp-2">
                {{ event.description }}
              </p>

              <div class="flex items-center gap-2 mt-4">
                <span class="text-accent font-semibold">₱{{ event.budget }}</span>
                <span class="text-base-content/50">budget</span>
              </div>

              <div class="flex items-center gap-2 mt-2">
                <div
                  v-if="event.drawComplete"
                  class="badge badge-success gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Draw Complete
                </div>
                <div
                  v-else
                  class="badge badge-warning gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pending
                </div>
              </div>

              <div class="card-actions justify-end mt-4">
                <button
                  @click.stop="deleteEvent(event.id)"
                  class="btn btn-ghost btn-sm text-error"
                >
                  Delete
                </button>
                <button
                  @click="goToEvent(event.id)"
                  class="btn btn-primary btn-sm"
                >
                  Open
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-16">
        <div class="text-6xl mb-4">🎄</div>
        <h3 class="text-xl font-semibold text-base-content/70 mb-2">No events yet</h3>
        <p class="text-base-content/50 mb-6">Create your first gift exchange event to get started!</p>
        <router-link to="/create" class="btn btn-secondary">
          Create Event
        </router-link>
      </div>
    </div>
  </div>
</template>
