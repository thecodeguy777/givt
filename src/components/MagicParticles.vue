<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  },
  intensity: {
    type: String,
    default: 'normal', // 'subtle', 'normal', 'intense', 'explosion'
    validator: (v) => ['subtle', 'normal', 'intense', 'explosion'].includes(v)
  },
  color: {
    type: String,
    default: 'gold' // 'gold', 'rainbow', 'christmas'
  }
})

const particles = ref([])
const containerRef = ref(null)
let animationFrame = null
let particleId = 0

const colorPalettes = {
  gold: ['#FFD700', '#FFA500', '#FFEC8B', '#DAA520', '#F0E68C', '#FFFACD'],
  rainbow: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'],
  christmas: ['#C41E3A', '#228B22', '#FFD700', '#FFFFFF', '#DC143C', '#006400']
}

const intensityConfig = {
  subtle: { count: 12, speed: 0.4, size: [4, 10], spread: 100 },
  normal: { count: 20, speed: 0.6, size: [5, 14], spread: 130 },
  intense: { count: 35, speed: 1, size: [6, 16], spread: 160 },
  explosion: { count: 60, speed: 2.5, size: [8, 20], spread: 200 }
}

// Container dimensions (will be 256x256 to match gift box)
const WIDTH = 256
const HEIGHT = 256
const CENTER_X = WIDTH / 2
const CENTER_Y = HEIGHT / 2

function createParticle(explosion = false) {
  const config = intensityConfig[props.intensity]
  const colors = colorPalettes[props.color]
  const id = particleId++

  let x, y, vx, vy

  if (explosion) {
    // Explosion: burst outward from center
    const angle = Math.random() * Math.PI * 2
    const force = 3 + Math.random() * 5
    x = CENTER_X
    y = CENTER_Y
    vx = Math.cos(angle) * force
    vy = Math.sin(angle) * force
  } else {
    // Floating: orbit around center
    const angle = Math.random() * Math.PI * 2
    const radius = 40 + Math.random() * 60
    x = CENTER_X + Math.cos(angle) * radius
    y = CENTER_Y + Math.sin(angle) * radius
    vx = (Math.random() - 0.5) * config.speed
    vy = -0.3 - Math.random() * config.speed * 0.5
  }

  return {
    id,
    x,
    y,
    vx,
    vy,
    size: config.size[0] + Math.random() * (config.size[1] - config.size[0]),
    color: colors[Math.floor(Math.random() * colors.length)],
    opacity: 0.7 + Math.random() * 0.3,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 8,
    life: 1,
    decay: explosion ? 0.012 : 0.006,
    type: Math.random() > 0.6 ? 'star' : (Math.random() > 0.5 ? 'circle' : 'diamond')
  }
}

function updateParticles() {
  if (!props.active && particles.value.length === 0) {
    animationFrame = null
    return
  }

  // Update existing particles
  particles.value = particles.value
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.03, // gravity
      rotation: p.rotation + p.rotationSpeed,
      life: p.life - p.decay,
      opacity: Math.max(0, p.opacity * (p.life > 0.4 ? 1 : p.life / 0.4))
    }))
    .filter(p => p.life > 0 && p.x > -50 && p.x < WIDTH + 50 && p.y < HEIGHT + 50)

  // Add new particles if active
  if (props.active && props.intensity !== 'explosion') {
    const config = intensityConfig[props.intensity]
    const maxParticles = config.count

    if (particles.value.length < maxParticles && Math.random() > 0.5) {
      particles.value.push(createParticle(false))
    }
  }

  animationFrame = requestAnimationFrame(updateParticles)
}

function triggerExplosion() {
  const config = intensityConfig.explosion
  for (let i = 0; i < config.count; i++) {
    particles.value.push(createParticle(true))
  }
  if (!animationFrame) {
    updateParticles()
  }
}

watch(() => props.active, (newVal) => {
  if (newVal && !animationFrame) {
    updateParticles()
  }
})

watch(() => props.intensity, (newVal) => {
  if (newVal === 'explosion') {
    triggerExplosion()
  }
})

onMounted(() => {
  if (props.active) {
    updateParticles()
  }
})

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
})

defineExpose({ triggerExplosion })
</script>

<template>
  <div
    ref="containerRef"
    class="absolute inset-0 pointer-events-none overflow-visible"
    :style="{ width: WIDTH + 'px', height: HEIGHT + 'px' }"
  >
    <div
      v-for="particle in particles"
      :key="particle.id"
      class="absolute"
      :style="{
        left: particle.x + 'px',
        top: particle.y + 'px',
        width: particle.size + 'px',
        height: particle.size + 'px',
        opacity: particle.opacity,
        transform: `translate(-50%, -50%) rotate(${particle.rotation}deg)`,
        transition: 'none'
      }"
    >
      <!-- Star -->
      <svg
        v-if="particle.type === 'star'"
        :width="particle.size"
        :height="particle.size"
        viewBox="0 0 24 24"
        class="drop-shadow-sm"
      >
        <path
          :fill="particle.color"
          d="M12 2L14.09 8.26L20.18 9.27L15.54 13.14L16.81 19.02L12 16.27L7.19 19.02L8.46 13.14L3.82 9.27L9.91 8.26L12 2Z"
        />
      </svg>

      <!-- Circle -->
      <div
        v-else-if="particle.type === 'circle'"
        class="w-full h-full rounded-full"
        :style="{
          backgroundColor: particle.color,
          boxShadow: `0 0 ${particle.size / 2}px ${particle.color}40`
        }"
      />

      <!-- Diamond -->
      <div
        v-else
        class="w-full h-full"
        :style="{
          backgroundColor: particle.color,
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          boxShadow: `0 0 ${particle.size / 2}px ${particle.color}40`
        }"
      />
    </div>
  </div>
</template>
