<script setup>
import { computed } from 'vue'

const props = defineProps({
  participant: {
    type: Object,
    required: true,
  },
  event: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['view', 'remove', 'draw'])

const drawnPerson = computed(() => {
  if (!props.participant.drawnPerson) return null
  return props.event.participants.find(p => p.id === props.participant.drawnPerson)
})
</script>

<template>
  <div class="card bg-base-100 shadow-lg participant-card">
    <div class="card-body p-4">
      <div class="flex items-center gap-4">
        <!-- Avatar -->
        <div
          class="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
          :class="participant.color || 'bg-primary/20'"
        >
          {{ participant.avatar }}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-lg truncate">{{ participant.name }}</h3>
          <p v-if="participant.email" class="text-sm text-base-content/50 truncate">
            {{ participant.email }}
          </p>

          <!-- Status -->
          <div class="mt-1">
            <span
              v-if="participant.hasDrawn"
              class="badge badge-success badge-sm gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Drew
            </span>
            <span
              v-else-if="!event.drawComplete"
              class="badge badge-warning badge-sm"
            >
              Waiting to draw
            </span>
          </div>
        </div>
      </div>

      <!-- Wishlist Preview -->
      <div v-if="participant.wishlist?.length > 0" class="mt-3">
        <p class="text-xs text-base-content/50 mb-1">Wishlist:</p>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="(item, index) in participant.wishlist.slice(0, 3)"
            :key="index"
            class="badge badge-ghost badge-sm"
          >
            {{ item }}
          </span>
          <span
            v-if="participant.wishlist.length > 3"
            class="badge badge-ghost badge-sm"
          >
            +{{ participant.wishlist.length - 3 }} more
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="card-actions justify-end mt-3 pt-3 border-t border-base-200">
        <button
          @click="emit('remove')"
          class="btn btn-ghost btn-xs text-error"
          :disabled="event.drawComplete"
        >
          Remove
        </button>
        <button
          @click="emit('view')"
          class="btn btn-ghost btn-xs"
        >
          View Profile
        </button>
        <button
          v-if="!participant.hasDrawn && !event.drawComplete && event.participants.length >= 2"
          @click="emit('draw')"
          class="btn btn-primary btn-xs"
        >
          Draw Now
        </button>
      </div>
    </div>
  </div>
</template>
