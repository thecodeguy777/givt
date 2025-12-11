<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '../stores/eventStore'

const router = useRouter()
const eventStore = useEventStore()

const form = ref({
  name: '',
  date: '',
  budget: 500,
  description: '',
})

const errors = ref({})

function validateForm() {
  errors.value = {}

  if (!form.value.name.trim()) {
    errors.value.name = 'Event name is required'
  }

  if (!form.value.date) {
    errors.value.date = 'Event date is required'
  }

  if (!form.value.budget || form.value.budget < 0) {
    errors.value.budget = 'Please enter a valid budget'
  }

  return Object.keys(errors.value).length === 0
}

function createEvent() {
  if (!validateForm()) return

  const eventId = eventStore.createEvent(form.value)
  router.push(`/event/${eventId}`)
}
</script>

<template>
  <div class="min-h-screen py-8 px-4">
    <div class="container mx-auto max-w-2xl">
      <!-- Back Button -->
      <router-link to="/" class="btn btn-ghost gap-2 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </router-link>

      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="text-center mb-6">
            <div class="text-5xl mb-3">🎁</div>
            <h1 class="text-3xl font-bold text-base-content">Create New Event</h1>
            <p class="text-base-content/60 mt-2">Set up your gift exchange event</p>
          </div>

          <form @submit.prevent="createEvent" class="space-y-6">
            <!-- Event Name -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Event Name</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="e.g., Christmas Party 2024"
                class="input input-bordered w-full"
                :class="{ 'input-error': errors.name }"
              />
              <label v-if="errors.name" class="label">
                <span class="label-text-alt text-error">{{ errors.name }}</span>
              </label>
            </div>

            <!-- Event Date -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Event Date</span>
              </label>
              <input
                v-model="form.date"
                type="date"
                class="input input-bordered w-full"
                :class="{ 'input-error': errors.date }"
              />
              <label v-if="errors.date" class="label">
                <span class="label-text-alt text-error">{{ errors.date }}</span>
              </label>
            </div>

            <!-- Budget -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Gift Budget (₱)</span>
              </label>
              <input
                v-model.number="form.budget"
                type="number"
                min="0"
                step="50"
                placeholder="500"
                class="input input-bordered w-full"
                :class="{ 'input-error': errors.budget }"
              />
              <label class="label">
                <span class="label-text-alt text-base-content/50">Suggested spending limit per gift</span>
              </label>
              <label v-if="errors.budget" class="label">
                <span class="label-text-alt text-error">{{ errors.budget }}</span>
              </label>
            </div>

            <!-- Description -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-semibold">Description (Optional)</span>
              </label>
              <textarea
                v-model="form.description"
                class="textarea textarea-bordered h-24"
                placeholder="Add any special instructions or notes for participants..."
              ></textarea>
            </div>

            <!-- Submit -->
            <div class="card-actions justify-end pt-4">
              <router-link to="/" class="btn btn-ghost">Cancel</router-link>
              <button type="submit" class="btn btn-primary gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Create Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
