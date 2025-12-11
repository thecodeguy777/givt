<script setup>
import { ref, computed, watch } from 'vue'
import MagicParticles from './MagicParticles.vue'

const props = defineProps({
  phase: {
    type: String,
    default: 'idle',
    validator: (v) => ['idle', 'hover', 'charging', 'shaking', 'opening', 'revealed'].includes(v)
  },
  revealedPerson: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['click'])
const particlesRef = ref(null)

const particleIntensity = computed(() => {
  switch (props.phase) {
    case 'idle': return 'subtle'
    case 'hover': return 'normal'
    case 'charging': return 'intense'
    case 'shaking': return 'intense'
    case 'opening': return 'explosion'
    case 'revealed': return 'normal'
    default: return 'subtle'
  }
})

const particlesActive = computed(() => {
  return ['hover', 'charging', 'shaking', 'opening', 'revealed'].includes(props.phase)
})

const isOpen = computed(() => props.phase === 'opening' || props.phase === 'revealed')

watch(() => props.phase, (newPhase) => {
  if (newPhase === 'opening' && particlesRef.value) {
    particlesRef.value.triggerExplosion()
  }
})

function handleClick() {
  if (props.phase === 'idle' || props.phase === 'hover') {
    emit('click')
  }
}
</script>

<template>
  <div
    class="relative w-72 h-64 mx-auto cursor-pointer select-none"
    :class="{ 'pointer-events-none': phase !== 'idle' && phase !== 'hover' }"
    @click="handleClick"
  >
    <!-- Magic Particles -->
    <MagicParticles
      ref="particlesRef"
      :active="particlesActive"
      :intensity="particleIntensity"
      :color="phase === 'revealed' ? 'christmas' : 'gold'"
    />

    <!-- Glow Effect -->
    <div
      class="absolute inset-0 rounded-3xl transition-all duration-500"
      :class="{
        'opacity-0': phase === 'idle',
        'opacity-40': phase === 'hover',
        'opacity-70': phase === 'charging' || phase === 'shaking',
        'opacity-100': phase === 'opening',
        'opacity-30': phase === 'revealed'
      }"
      :style="{
        background: 'radial-gradient(circle, rgba(255,215,0,0.5) 0%, rgba(220,38,38,0.2) 50%, transparent 70%)',
        filter: 'blur(20px)',
        transform: phase === 'opening' ? 'scale(1.5)' : 'scale(1.2)'
      }"
    />

    <!-- Envelope Container -->
    <div
      class="absolute inset-0 flex items-center justify-center transition-transform duration-300"
      :class="{
        'animate-float': phase === 'hover',
        'animate-shake': phase === 'shaking',
        'animate-pulse-soft': phase === 'charging'
      }"
    >
      <!-- Main Envelope -->
      <div class="relative w-56 h-40">

        <!-- Envelope Back (red) -->
        <div
          class="absolute inset-0 rounded-lg shadow-2xl"
          style="background: linear-gradient(145deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);"
        />

        <!-- Envelope Inner Shadow -->
        <div
          class="absolute inset-0 rounded-lg"
          style="box-shadow: inset 0 -20px 40px rgba(0,0,0,0.2), inset 0 2px 10px rgba(255,255,255,0.1);"
        />

        <!-- Gold Border/Trim -->
        <div
          class="absolute inset-[3px] rounded-md border-2 border-amber-400/40"
        />

        <!-- Envelope Flap (triangular) - behind seal when closed, behind everything when open -->
        <div
          class="absolute top-0 left-0 right-0 h-20 origin-top transition-all duration-500 z-0"
          :style="{
            transform: isOpen ? 'rotateX(180deg) translateY(-10px)' : 'rotateX(0deg)',
            transformStyle: 'preserve-3d',
            opacity: isOpen ? 0.3 : 1
          }"
        >
          <!-- Flap front (visible when closed) -->
          <div
            class="absolute inset-0"
            style="backface-visibility: hidden;"
          >
            <svg viewBox="0 0 224 80" class="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="flapGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#ef4444"/>
                  <stop offset="100%" stop-color="#dc2626"/>
                </linearGradient>
              </defs>
              <path d="M0,0 L112,70 L224,0 L224,10 L112,80 L0,10 Z" fill="url(#flapGrad)"/>
              <path d="M0,0 L112,70 L224,0" fill="none" stroke="#fbbf24" stroke-width="2" opacity="0.5"/>
            </svg>
          </div>

          <!-- Flap back (visible when open) -->
          <div
            class="absolute inset-0"
            style="backface-visibility: hidden; transform: rotateX(180deg);"
          >
            <svg viewBox="0 0 224 80" class="w-full h-full" preserveAspectRatio="none">
              <path d="M0,0 L112,70 L224,0 L224,10 L112,80 L0,10 Z" fill="#991b1b"/>
            </svg>
          </div>
        </div>

        <!-- Letter coming out (when opening/revealed) -->
        <div
          class="absolute left-1/2 -translate-x-1/2 w-48 rounded-md shadow-2xl transition-all duration-700 ease-out overflow-hidden z-20"
          :style="{
            background: 'linear-gradient(180deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)',
            height: isOpen ? '160px' : '0px',
            bottom: isOpen ? '50%' : '80%',
            opacity: isOpen ? 1 : 0,
            transitionDelay: isOpen ? '0.3s' : '0s'
          }"
        >
          <!-- Letter paper texture -->
          <div class="absolute inset-0 opacity-30" style="background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%224%22 height=%224%22><rect width=%224%22 height=%224%22 fill=%22%23f5f5dc%22/><rect width=%221%22 height=%221%22 fill=%22%23e5e5c3%22/></svg>');"></div>

          <!-- Letter Content -->
          <div
            class="relative p-4 pt-6 text-center transition-all duration-500"
            :style="{ transitionDelay: isOpen ? '0.6s' : '0s' }"
            :class="{ 'opacity-0 scale-90': !isOpen, 'opacity-100 scale-100': isOpen }"
          >
            <!-- Decorative header line -->
            <div class="flex justify-center items-center gap-2 mb-3">
              <div class="h-px w-8 bg-gradient-to-r from-transparent to-amber-400"></div>
              <span class="text-amber-500 text-lg">★</span>
              <div class="h-px w-8 bg-gradient-to-l from-transparent to-amber-400"></div>
            </div>

            <!-- Avatar -->
            <div v-if="revealedPerson" class="text-6xl mb-2 drop-shadow-lg">
              {{ revealedPerson.avatarEmoji || revealedPerson.avatar }}
            </div>

            <!-- Name -->
            <div v-if="revealedPerson" class="font-bold text-gray-800 text-xl tracking-wide">
              {{ revealedPerson.displayName || revealedPerson.name }}
            </div>

            <!-- Decorative footer -->
            <div class="flex justify-center items-center gap-1 mt-3">
              <span class="text-red-400 text-xs">♦</span>
              <span class="text-amber-400 text-xs">♦</span>
              <span class="text-red-400 text-xs">♦</span>
            </div>
          </div>

          <!-- Letter shadow at bottom -->
          <div class="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-amber-200/50 to-transparent" />
        </div>

        <!-- Wax Seal - always above flap -->
        <div
          class="absolute left-1/2 -translate-x-1/2 transition-all duration-500 z-10"
          :class="{
            'top-12 scale-100 opacity-100': !isOpen,
            '-top-4 scale-75 opacity-0': isOpen
          }"
        >
          <!-- Seal circle -->
          <div
            class="relative w-14 h-14 rounded-full shadow-lg"
            style="background: radial-gradient(circle at 30% 30%, #fde047 0%, #f59e0b 40%, #b45309 100%);"
          >
            <!-- Seal inner design -->
            <div class="absolute inset-2 rounded-full border-2 border-amber-300/50 flex items-center justify-center">
              <span class="text-amber-800 text-xl">🎁</span>
            </div>
            <!-- Seal highlight -->
            <div
              class="absolute top-1 left-2 w-4 h-3 rounded-full bg-white/40"
            />
          </div>

          <!-- Drip effects -->
          <div class="absolute -bottom-1 left-2 w-2 h-3 rounded-full bg-amber-600" />
          <div class="absolute -bottom-2 right-3 w-1.5 h-2 rounded-full bg-amber-700" />
        </div>

        <!-- Bottom envelope flap hint -->
        <div
          class="absolute bottom-0 left-0 right-0 h-16 rounded-b-lg overflow-hidden"
        >
          <svg viewBox="0 0 224 64" class="w-full h-full" preserveAspectRatio="none">
            <path d="M0,64 L112,10 L224,64 Z" fill="#7f1d1d" opacity="0.3"/>
          </svg>
        </div>

        <!-- Sparkle accents when hovering/charging -->
        <div
          v-if="phase === 'hover' || phase === 'charging' || phase === 'shaking'"
          class="absolute inset-0 pointer-events-none"
        >
          <span class="absolute -top-2 -left-2 text-xl animate-ping">✨</span>
          <span class="absolute -top-2 -right-2 text-xl animate-ping" style="animation-delay: 0.2s;">✨</span>
          <span class="absolute -bottom-2 left-4 text-lg animate-ping" style="animation-delay: 0.4s;">✨</span>
          <span class="absolute -bottom-2 right-4 text-lg animate-ping" style="animation-delay: 0.3s;">✨</span>
        </div>
      </div>
    </div>

    <!-- Light Rays on Reveal -->
    <div
      v-if="isOpen"
      class="absolute inset-0 pointer-events-none flex items-center justify-center"
    >
      <div class="relative">
        <div
          v-for="i in 12"
          :key="i"
          class="absolute w-1 h-24 origin-bottom"
          :style="{
            background: 'linear-gradient(to top, rgba(255,215,0,0.6), rgba(255,255,255,0.2), transparent)',
            transform: `rotate(${i * 30}deg)`,
            animation: `ray-pulse 2s ease-in-out ${i * 0.1}s infinite`
          }"
        />
      </div>
    </div>

    <!-- Click hint -->
    <div
      v-if="phase === 'idle' || phase === 'hover'"
      class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-base-content/60 whitespace-nowrap transition-all duration-300"
      :class="{ 'opacity-0 translate-y-2': phase === 'idle', 'opacity-100 translate-y-0': phase === 'hover' }"
    >
      ✨ Click to open! ✨
    </div>
  </div>
</template>

<style scoped>
.animate-float {
  animation: float 2s ease-in-out infinite;
}

.animate-shake {
  animation: shake 0.1s ease-in-out infinite;
}

.animate-pulse-soft {
  animation: pulse-soft 0.5s ease-in-out infinite;
}

.animate-bounce-slow {
  animation: bounce-slow 1s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50% { transform: translateY(-8px) rotate(1deg); }
}

@keyframes shake {
  0%, 100% { transform: translateX(-4px) rotate(-2deg); }
  25% { transform: translateX(4px) rotate(2deg); }
  50% { transform: translateX(-4px) rotate(-1deg); }
  75% { transform: translateX(4px) rotate(1deg); }
}

@keyframes pulse-soft {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes ray-pulse {
  0%, 100% { opacity: 0.3; transform: scaleY(0.8); }
  50% { opacity: 0.7; transform: scaleY(1.1); }
}
</style>
