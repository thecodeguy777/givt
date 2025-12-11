import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useEventStore = defineStore('event', () => {
  // State
  const events = ref(JSON.parse(localStorage.getItem('bunutan-events') || '[]'))

  // Persist to localStorage
  watch(events, (newEvents) => {
    localStorage.setItem('bunutan-events', JSON.stringify(newEvents))
  }, { deep: true })

  // Getters
  const getEventById = computed(() => {
    return (id) => events.value.find(e => e.id === id)
  })

  const getParticipant = computed(() => {
    return (eventId, participantId) => {
      const event = events.value.find(e => e.id === eventId)
      return event?.participants.find(p => p.id === participantId)
    }
  })

  // Actions
  function createEvent(eventData) {
    const newEvent = {
      id: generateId(),
      name: eventData.name,
      date: eventData.date,
      budget: eventData.budget,
      description: eventData.description || '',
      participants: [],
      assignments: {},
      drawComplete: false,
      createdAt: new Date().toISOString(),
    }
    events.value.push(newEvent)
    return newEvent.id
  }

  function updateEvent(eventId, updates) {
    const index = events.value.findIndex(e => e.id === eventId)
    if (index !== -1) {
      events.value[index] = { ...events.value[index], ...updates }
    }
  }

  function deleteEvent(eventId) {
    const index = events.value.findIndex(e => e.id === eventId)
    if (index !== -1) {
      events.value.splice(index, 1)
    }
  }

  function addParticipant(eventId, participantData) {
    const event = events.value.find(e => e.id === eventId)
    if (event) {
      const newParticipant = {
        id: generateId(),
        name: participantData.name,
        email: participantData.email || '',
        avatar: participantData.avatar || getRandomAvatar(),
        wishlist: participantData.wishlist || [],
        color: participantData.color || getRandomColor(),
        hasDrawn: false,
        drawnPerson: null,
      }
      event.participants.push(newParticipant)
      return newParticipant.id
    }
  }

  function updateParticipant(eventId, participantId, updates) {
    const event = events.value.find(e => e.id === eventId)
    if (event) {
      const participant = event.participants.find(p => p.id === participantId)
      if (participant) {
        Object.assign(participant, updates)
      }
    }
  }

  function removeParticipant(eventId, participantId) {
    const event = events.value.find(e => e.id === eventId)
    if (event) {
      const index = event.participants.findIndex(p => p.id === participantId)
      if (index !== -1) {
        event.participants.splice(index, 1)
      }
    }
  }

  function performDraw(eventId, drawerId) {
    const event = events.value.find(e => e.id === eventId)
    if (!event) return null

    const drawer = event.participants.find(p => p.id === drawerId)
    if (!drawer || drawer.hasDrawn) return null

    // Get available participants (not yet assigned to anyone and not the drawer)
    const assignedIds = Object.values(event.assignments)
    const available = event.participants.filter(
      p => p.id !== drawerId && !assignedIds.includes(p.id)
    )

    if (available.length === 0) return null

    // Random selection
    const randomIndex = Math.floor(Math.random() * available.length)
    const selected = available[randomIndex]

    // Record assignment
    event.assignments[drawerId] = selected.id
    drawer.hasDrawn = true
    drawer.drawnPerson = selected.id

    // Check if draw is complete
    if (Object.keys(event.assignments).length === event.participants.length) {
      event.drawComplete = true
    }

    return selected
  }

  function resetDraw(eventId) {
    const event = events.value.find(e => e.id === eventId)
    if (event) {
      event.assignments = {}
      event.drawComplete = false
      event.participants.forEach(p => {
        p.hasDrawn = false
        p.drawnPerson = null
      })
    }
  }

  // Helper functions
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  function getRandomColor() {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
      'bg-orange-500', 'bg-cyan-500'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  function getRandomAvatar() {
    const avatars = ['🎅', '🤶', '🧝', '⛄', '🦌', '🎄', '🌟', '❄️', '🎁', '🔔']
    return avatars[Math.floor(Math.random() * avatars.length)]
  }

  return {
    events,
    getEventById,
    getParticipant,
    createEvent,
    updateEvent,
    deleteEvent,
    addParticipant,
    updateParticipant,
    removeParticipant,
    performDraw,
    resetDraw,
  }
})
