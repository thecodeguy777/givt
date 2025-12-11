<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  },
  personName: {
    type: String,
    default: ''
  },
  personAvatar: {
    type: String,
    default: '🎁'
  }
})

const showBurst = ref(false)
const showSparkles = ref(false)
const showRings = ref(false)

const sparkles = ref([])
const confettiPieces = ref([])

const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD', '#F0E68C']

function generateSparkles() {
  sparkles.value = []
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2
    const distance = 80 + Math.random() * 100
    sparkles.value.push({
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 4 + Math.random() * 8,
      delay: Math.random() * 0.3,
      duration: 0.8 + Math.random() * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)]
    })
  }
}

function generateConfetti() {
  confettiPieces.value = []
  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI * 2
    const velocity = 3 + Math.random() * 5
    confettiPieces.value.push({
      id: i,
      startX: 50,
      startY: 50,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 720,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 10,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
      delay: Math.random() * 0.2,
      duration: 2 + Math.random() * 1
    })
  }
}

watch(() => props.active, (newVal) => {
  if (newVal) {
    generateSparkles()
    generateConfetti()

    showBurst.value = true

    setTimeout(() => {
      showSparkles.value = true
    }, 100)

    setTimeout(() => {
      showRings.value = true
    }, 200)
  } else {
    showBurst.value = false
    showSparkles.value = false
    showRings.value = false
  }
})

onMounted(() => {
  if (props.active) {
    generateSparkles()
    generateConfetti()
    showBurst.value = true
    showSparkles.value = true
    showRings.value = true
  }
})
</script>

<template>
  <div v-if="active" class="fixed inset-0 pointer-events-none z-50 overflow-hidden">
    <!-- Central Burst Flash -->
    <div
      v-if="showBurst"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <!-- Initial flash -->
      <div class="absolute inset-0 -translate-x-1/2 -translate-y-1/2 animate-burst-flash">
        <div
          class="w-96 h-96 rounded-full"
          style="background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,215,0,0.6) 30%, rgba(255,165,0,0.3) 60%, transparent 70%);"
        />
      </div>
    </div>

    <!-- Expanding Rings -->
    <div
      v-if="showRings"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <div
        v-for="i in 4"
        :key="`ring-${i}`"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 animate-ring-expand"
        :style="{
          borderColor: colors[(i - 1) % colors.length],
          animationDelay: `${(i - 1) * 0.15}s`,
          opacity: 0
        }"
      />
    </div>

    <!-- Sparkle Burst -->
    <div
      v-if="showSparkles"
      class="absolute top-1/2 left-1/2"
    >
      <div
        v-for="sparkle in sparkles"
        :key="`sparkle-${sparkle.id}`"
        class="absolute animate-sparkle-fly"
        :style="{
          '--end-x': `${sparkle.x}px`,
          '--end-y': `${sparkle.y}px`,
          animationDelay: `${sparkle.delay}s`,
          animationDuration: `${sparkle.duration}s`
        }"
      >
        <svg
          :width="sparkle.size * 2"
          :height="sparkle.size * 2"
          viewBox="0 0 24 24"
          class="animate-sparkle-spin"
        >
          <path
            :fill="sparkle.color"
            d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
          />
        </svg>
      </div>
    </div>

    <!-- Confetti Explosion -->
    <div class="absolute top-1/2 left-1/2">
      <div
        v-for="piece in confettiPieces"
        :key="`confetti-${piece.id}`"
        class="absolute animate-confetti-burst"
        :style="{
          '--vx': piece.vx,
          '--vy': piece.vy,
          '--rotation': `${piece.rotationSpeed}deg`,
          width: `${piece.size}px`,
          height: piece.shape === 'rect' ? `${piece.size * 0.6}px` : `${piece.size}px`,
          backgroundColor: piece.color,
          borderRadius: piece.shape === 'circle' ? '50%' : '2px',
          animationDelay: `${piece.delay}s`,
          animationDuration: `${piece.duration}s`
        }"
      />
    </div>

    <!-- Floating Stars Background -->
    <div class="absolute inset-0">
      <div
        v-for="i in 20"
        :key="`star-${i}`"
        class="absolute animate-float-star"
        :style="{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${3 + Math.random() * 2}s`
        }"
      >
        <span class="text-2xl opacity-60">✨</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Burst flash animation */
.animate-burst-flash {
  animation: burst-flash 0.6s ease-out forwards;
}

@keyframes burst-flash {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(3);
    opacity: 0;
  }
}

/* Ring expand animation */
.animate-ring-expand {
  animation: ring-expand 1.2s ease-out forwards;
}

@keyframes ring-expand {
  0% {
    width: 0;
    height: 0;
    opacity: 0.8;
    border-width: 8px;
  }
  100% {
    width: 400px;
    height: 400px;
    opacity: 0;
    border-width: 1px;
  }
}

/* Sparkle fly animation */
.animate-sparkle-fly {
  animation: sparkle-fly ease-out forwards;
}

@keyframes sparkle-fly {
  0% {
    transform: translate(0, 0) scale(0);
    opacity: 1;
  }
  20% {
    transform: translate(calc(var(--end-x) * 0.2), calc(var(--end-y) * 0.2)) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translate(var(--end-x), var(--end-y)) scale(0);
    opacity: 0;
  }
}

/* Sparkle spin */
.animate-sparkle-spin {
  animation: sparkle-spin 0.8s linear infinite;
}

@keyframes sparkle-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(180deg); }
}

/* Confetti burst animation */
.animate-confetti-burst {
  animation: confetti-burst ease-out forwards;
}

@keyframes confetti-burst {
  0% {
    transform: translate(0, 0) rotate(0deg) scale(1);
    opacity: 1;
  }
  100% {
    transform:
      translate(
        calc(var(--vx) * 100px),
        calc(var(--vy) * 100px + 200px)
      )
      rotate(var(--rotation))
      scale(0.5);
    opacity: 0;
  }
}

/* Floating star animation */
.animate-float-star {
  animation: float-star ease-in-out infinite;
}

@keyframes float-star {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-20px) scale(1.2);
    opacity: 0.7;
  }
}
</style>
