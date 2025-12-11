<script setup>
defineProps({
  isShaking: {
    type: Boolean,
    default: false,
  },
  isOpened: {
    type: Boolean,
    default: false,
  },
  revealedPerson: {
    type: Object,
    default: null,
  },
})
</script>

<template>
  <div
    class="gift-box relative w-48 h-48 mx-auto"
    :class="{ shaking: isShaking, opened: isOpened }"
  >
    <!-- Gift Box Body -->
    <div class="absolute bottom-0 w-full h-36 bg-gradient-to-b from-red-500 to-red-600 rounded-lg shadow-lg overflow-hidden">
      <!-- Vertical Ribbon -->
      <div class="absolute left-1/2 -translate-x-1/2 w-8 h-full bg-gradient-to-b from-yellow-400 to-yellow-500"></div>
      <!-- Horizontal Ribbon -->
      <div class="absolute top-1/2 -translate-y-1/2 w-full h-8 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400"></div>

      <!-- Person Reveal (shows when opened) -->
      <div
        v-if="isOpened && revealedPerson"
        class="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-red-400 to-red-500"
      >
        <div class="text-6xl animate-bounce">
          {{ revealedPerson.avatar }}
        </div>
      </div>
    </div>

    <!-- Gift Box Lid -->
    <div
      class="gift-box-lid absolute top-0 w-full h-16 origin-bottom transition-all duration-500"
      :class="isOpened ? 'transform -rotate-x-110 -translate-y-8' : ''"
    >
      <!-- Lid Top -->
      <div class="absolute bottom-0 w-full h-12 bg-gradient-to-b from-red-400 to-red-500 rounded-t-lg shadow-lg">
        <!-- Lid Ribbon Vertical -->
        <div class="absolute left-1/2 -translate-x-1/2 w-8 h-full bg-gradient-to-b from-yellow-300 to-yellow-400"></div>
      </div>

      <!-- Ribbon Bow -->
      <div class="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center">
        <!-- Left Loop -->
        <div class="w-8 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full transform -rotate-45 -mr-2"></div>
        <!-- Center Knot -->
        <div class="w-6 h-6 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full z-10 shadow-md"></div>
        <!-- Right Loop -->
        <div class="w-8 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full transform rotate-45 -ml-2"></div>
      </div>
    </div>

    <!-- Glow Effect when shaking -->
    <div
      v-if="isShaking"
      class="absolute inset-0 rounded-lg animate-pulse"
      style="box-shadow: 0 0 30px rgba(251, 191, 36, 0.6), 0 0 60px rgba(251, 191, 36, 0.3);"
    ></div>

    <!-- Sparkles when shaking -->
    <div v-if="isShaking" class="absolute inset-0 pointer-events-none">
      <div class="absolute top-2 left-4 text-2xl animate-ping">✨</div>
      <div class="absolute top-8 right-2 text-xl animate-ping" style="animation-delay: 0.2s;">✨</div>
      <div class="absolute bottom-4 left-8 text-lg animate-ping" style="animation-delay: 0.4s;">✨</div>
      <div class="absolute bottom-8 right-6 text-2xl animate-ping" style="animation-delay: 0.3s;">✨</div>
    </div>
  </div>
</template>

<style scoped>
.gift-box.shaking {
  animation: shake 0.1s ease-in-out infinite;
}

@keyframes shake {
  0%, 100% {
    transform: translateX(-2px) rotate(-2deg);
  }
  25% {
    transform: translateX(2px) rotate(2deg);
  }
  50% {
    transform: translateX(-2px) rotate(-1deg);
  }
  75% {
    transform: translateX(2px) rotate(1deg);
  }
}

.gift-box-lid {
  transform-style: preserve-3d;
  perspective: 500px;
}

.gift-box.opened .gift-box-lid {
  transform: rotateX(-110deg) translateY(-30px);
}
</style>
