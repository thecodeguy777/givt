<script setup>
import { ref, onMounted } from 'vue'

const confettiPieces = ref([])

const colors = [
  '#e11d48', // primary red
  '#059669', // secondary green
  '#f59e0b', // accent yellow
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
]

const shapes = ['square', 'circle', 'triangle']

onMounted(() => {
  // Generate confetti pieces
  for (let i = 0; i < 100; i++) {
    confettiPieces.value.push({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      size: 8 + Math.random() * 8,
      rotation: Math.random() * 360,
    })
  }
})
</script>

<template>
  <div class="fixed inset-0 pointer-events-none z-50 overflow-hidden">
    <div
      v-for="piece in confettiPieces"
      :key="piece.id"
      class="confetti-piece absolute"
      :style="{
        left: `${piece.left}%`,
        top: '-20px',
        width: `${piece.size}px`,
        height: `${piece.size}px`,
        backgroundColor: piece.shape !== 'triangle' ? piece.color : 'transparent',
        borderRadius: piece.shape === 'circle' ? '50%' : '0',
        borderLeft: piece.shape === 'triangle' ? `${piece.size / 2}px solid transparent` : 'none',
        borderRight: piece.shape === 'triangle' ? `${piece.size / 2}px solid transparent` : 'none',
        borderBottom: piece.shape === 'triangle' ? `${piece.size}px solid ${piece.color}` : 'none',
        animationDelay: `${piece.delay}s`,
        animationDuration: `${piece.duration}s`,
        transform: `rotate(${piece.rotation}deg)`,
      }"
    ></div>
  </div>
</template>

<style scoped>
.confetti-piece {
  animation: confetti-fall linear forwards;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
</style>
