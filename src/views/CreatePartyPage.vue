<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useParty } from '@/composables/useParty'
import Pikaday from 'pikaday'
import 'pikaday/css/pikaday.css'

const router = useRouter()
const { createParty, isLoading, error } = useParty()

// Pikaday setup
const datePickerRef = ref(null)
let picker = null

const currentStep = ref(1)
const totalSteps = 3

const form = ref({
  name: '',
  date: '',
  budget: 500,
  description: '',
})

const errors = ref({})

// Set default date to 2 weeks from now
const defaultDate = new Date()
defaultDate.setDate(defaultDate.getDate() + 14)
form.value.date = defaultDate.toISOString().split('T')[0]

const minDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
})

const budgetPresets = [300, 500, 1000, 1500, 2000]

const formattedBudget = computed(() => {
  if (!form.value.budget) return 'No limit'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
  }).format(form.value.budget)
})

const formattedDate = computed(() => {
  if (!form.value.date) return ''
  return new Date(form.value.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
})

function validateStep(step) {
  errors.value = {}

  if (step === 1) {
    if (!form.value.name.trim()) {
      errors.value.name = 'Party name is required'
      return false
    }
    if (form.value.name.length < 3) {
      errors.value.name = 'Name must be at least 3 characters'
      return false
    }
  }

  if (step === 2) {
    if (!form.value.date) {
      errors.value.date = 'Date is required'
      return false
    }
    if (new Date(form.value.date) < new Date()) {
      errors.value.date = 'Date must be in the future'
      return false
    }
  }

  return true
}

function nextStep() {
  if (validateStep(currentStep.value)) {
    currentStep.value++
  }
}

function prevStep() {
  currentStep.value--
}

async function handleSubmit() {
  if (!validateStep(1) || !validateStep(2)) return

  const { data, error: createError } = await createParty({
    name: form.value.name.trim(),
    date: form.value.date,
    budget: form.value.budget || null,
    description: form.value.description.trim() || null,
  })

  if (data) {
    router.push(`/party/${data.id}`)
  }
}

function selectBudget(amount) {
  form.value.budget = amount
}

// Initialize Pikaday when step 2 is shown
function initPikaday() {
  if (picker) return

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  picker = new Pikaday({
    field: datePickerRef.value,
    format: 'YYYY-MM-DD',
    minDate: tomorrow,
    defaultDate: form.value.date ? new Date(form.value.date) : new Date(defaultDate),
    setDefaultDate: true,
    firstDay: 0, // Sunday
    showDaysInNextAndPreviousMonths: true,
    enableSelectionDaysInNextAndPreviousMonths: true,
    numberOfMonths: 1,
    theme: 'pika-daisyui',
    i18n: {
      previousMonth: 'Previous',
      nextMonth: 'Next',
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      weekdaysShort: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    },
    onSelect: function(date) {
      form.value.date = date.toISOString().split('T')[0]
    }
  })
}

// Watch for step changes to initialize Pikaday
watch(currentStep, (newStep) => {
  if (newStep === 2) {
    // Use nextTick to ensure DOM is ready
    setTimeout(() => {
      initPikaday()
    }, 100)
  }
})

onUnmounted(() => {
  if (picker) {
    picker.destroy()
    picker = null
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-300">
    <!-- Header -->
    <header class="navbar bg-base-100/80 backdrop-blur-lg shadow-lg sticky top-0 z-50">
      <div class="flex-1">
        <RouterLink to="/parties" class="btn btn-ghost gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          <span class="hidden sm:inline">Back</span>
        </RouterLink>
      </div>
      <div class="flex-none">
        <div class="text-sm text-base-content/60">
          Step {{ currentStep }} of {{ totalSteps }}
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8 max-w-xl">
      <!-- Progress Steps -->
      <ul class="steps steps-horizontal w-full mb-8">
        <li class="step" :class="{ 'step-primary': currentStep >= 1 }">
          <span class="step-icon">🎁</span>
        </li>
        <li class="step" :class="{ 'step-primary': currentStep >= 2 }">
          <span class="step-icon">📅</span>
        </li>
        <li class="step" :class="{ 'step-primary': currentStep >= 3 }">
          <span class="step-icon">💰</span>
        </li>
      </ul>

      <!-- Error Alert -->
      <div v-if="error" class="alert alert-error mb-6 shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <!-- Step 1: Party Name -->
      <div v-show="currentStep === 1" class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="text-center mb-6">
            <div class="text-6xl mb-4">🎄</div>
            <h2 class="card-title text-2xl justify-center">Name Your Party</h2>
            <p class="text-base-content/60 mt-2">Give your gift exchange a memorable name</p>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-base font-medium">Party Name</legend>
            <input
              v-model="form.name"
              type="text"
              placeholder="e.g., Family Christmas 2024"
              class="input input-bordered input-lg w-full text-center"
              :class="{ 'input-error': errors.name }"
              @keyup.enter="nextStep"
              autofocus
            />
            <p v-if="errors.name" class="label text-error text-sm mt-1">
              {{ errors.name }}
            </p>
          </fieldset>

          <!-- Name Suggestions -->
          <div class="mt-4">
            <p class="text-xs text-base-content/50 mb-2 text-center">Quick suggestions:</p>
            <div class="flex flex-wrap gap-2 justify-center">
              <button
                v-for="suggestion in ['Office Secret Santa', 'Family Gift Exchange', 'Friends Holiday Party', 'Christmas Kris Kringle']"
                :key="suggestion"
                type="button"
                class="btn btn-xs btn-ghost"
                @click="form.name = suggestion"
              >
                {{ suggestion }}
              </button>
            </div>
          </div>

          <div class="card-actions justify-end mt-6">
            <button
              type="button"
              class="btn btn-primary btn-lg gap-2"
              :disabled="!form.name.trim()"
              @click="nextStep"
            >
              Continue
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Step 2: Date -->
      <div v-show="currentStep === 2" class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="text-center mb-6">
            <div class="text-6xl mb-4">📅</div>
            <h2 class="card-title text-2xl justify-center">When's the Exchange?</h2>
            <p class="text-base-content/60 mt-2">Pick the date for your gift exchange</p>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-base font-medium">Exchange Date</legend>
            <div class="relative">
              <input
                ref="datePickerRef"
                type="text"
                readonly
                placeholder="Click to select date"
                class="input input-bordered input-lg w-full text-center cursor-pointer pika-single"
                :class="{ 'input-error': errors.date }"
                :value="formattedDate || 'Click to select date'"
              />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <p v-if="errors.date" class="label text-error text-sm mt-1">
              {{ errors.date }}
            </p>
          </fieldset>

          <!-- Quick Date Options -->
          <div class="mt-4">
            <p class="text-xs text-base-content/50 mb-2 text-center">Quick picks:</p>
            <div class="flex flex-wrap gap-2 justify-center">
              <button
                v-for="(days, label) in { 'Next Week': 7, '2 Weeks': 14, 'Christmas': null, 'New Year': null }"
                :key="label"
                type="button"
                class="btn btn-sm btn-outline"
                @click="() => {
                  const d = new Date()
                  if (label === 'Christmas') {
                    d.setMonth(11); d.setDate(25)
                    if (d < new Date()) d.setFullYear(d.getFullYear() + 1)
                  } else if (label === 'New Year') {
                    d.setMonth(0); d.setDate(1)
                    d.setFullYear(d.getFullYear() + 1)
                  } else {
                    d.setDate(d.getDate() + days)
                  }
                  form.date = d.toISOString().split('T')[0]
                  if (picker) picker.setDate(d)
                }"
              >
                {{ label }}
              </button>
            </div>
          </div>

          <div class="card-actions justify-between mt-6">
            <button type="button" class="btn btn-ghost gap-2" @click="prevStep">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Back
            </button>
            <button
              type="button"
              class="btn btn-primary btn-lg gap-2"
              :disabled="!form.date"
              @click="nextStep"
            >
              Continue
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Step 3: Budget & Description -->
      <div v-show="currentStep === 3" class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="text-center mb-6">
            <div class="text-6xl mb-4">💰</div>
            <h2 class="card-title text-2xl justify-center">Set a Budget</h2>
            <p class="text-base-content/60 mt-2">Optional spending limit per gift</p>
          </div>

          <!-- Budget Presets -->
          <div class="grid grid-cols-5 gap-2 mb-4">
            <button
              v-for="amount in budgetPresets"
              :key="amount"
              type="button"
              class="btn btn-sm"
              :class="form.budget === amount ? 'btn-primary' : 'btn-outline'"
              @click="selectBudget(amount)"
            >
              ₱{{ amount }}
            </button>
          </div>

          <!-- Custom Budget -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-base font-medium">Custom Amount (PHP)</legend>
            <div class="join w-full">
              <span class="join-item btn btn-lg no-animation">₱</span>
              <input
                v-model.number="form.budget"
                type="number"
                placeholder="500"
                min="0"
                step="50"
                class="input input-bordered input-lg join-item w-full"
              />
            </div>
            <p class="label text-base-content/60 text-sm mt-1">
              Suggested: {{ formattedBudget }} per gift
            </p>
          </fieldset>

          <!-- Description -->
          <fieldset class="fieldset mt-4">
            <legend class="fieldset-legend text-base font-medium">
              Description
              <span class="badge badge-ghost badge-sm ml-2">Optional</span>
            </legend>
            <textarea
              v-model="form.description"
              placeholder="Any special instructions, theme, or notes for participants?"
              class="textarea textarea-bordered w-full h-24"
            ></textarea>
          </fieldset>

          <!-- Summary Card -->
          <div class="bg-base-200 rounded-xl p-4 mt-4">
            <h3 class="font-semibold text-sm text-base-content/70 mb-3">Summary</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-base-content/60">Party Name</span>
                <span class="font-medium">{{ form.name }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Date</span>
                <span class="font-medium">{{ formattedDate }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Budget</span>
                <span class="font-medium text-accent">{{ formattedBudget }}</span>
              </div>
            </div>
          </div>

          <div class="card-actions justify-between mt-6">
            <button type="button" class="btn btn-ghost gap-2" @click="prevStep">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Back
            </button>
            <button
              type="button"
              :disabled="isLoading"
              class="btn btn-primary btn-lg gap-2"
              @click="handleSubmit"
            >
              <span v-if="isLoading" class="loading loading-spinner"></span>
              <template v-else>
                Create Party
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </template>
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.step-icon {
  font-size: 1.25rem;
}
</style>

<style>
/* DaisyUI theme for Pikaday */
.pika-single {
  font-family: inherit;
  border: none;
  border-radius: var(--rounded-box, 1rem);
  background: oklch(var(--b1));
  color: oklch(var(--bc));
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  z-index: 9999;
}

.pika-single.is-hidden {
  display: none;
}

.pika-single.is-bound {
  position: absolute;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}

.pika-lendar {
  padding: 1rem;
}

.pika-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.pika-label {
  font-weight: 600;
  font-size: 1rem;
  color: oklch(var(--bc));
}

.pika-prev,
.pika-next {
  display: block;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: var(--rounded-btn, 0.5rem);
  background-color: oklch(var(--b2));
  background-position: center center;
  background-repeat: no-repeat;
  background-size: 60%;
  cursor: pointer;
  opacity: 0.7;
  text-indent: -9999px;
  transition: all 0.2s;
}

.pika-prev:hover,
.pika-next:hover {
  opacity: 1;
  background-color: oklch(var(--b3));
}

.pika-prev {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M15.75 19.5 8.25 12l7.5-7.5' /%3E%3C/svg%3E");
}

.pika-next {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m8.25 4.5 7.5 7.5-7.5 7.5' /%3E%3C/svg%3E");
}

.pika-prev.is-disabled,
.pika-next.is-disabled {
  cursor: not-allowed;
  opacity: 0.2;
}

.pika-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
}

.pika-table th {
  font-size: 0.75rem;
  font-weight: 500;
  color: oklch(var(--bc) / 0.5);
  text-align: center;
  padding: 0.5rem 0;
}

.pika-table td {
  padding: 2px;
}

.pika-table td.is-today .pika-button {
  color: oklch(var(--p));
  font-weight: 700;
}

.pika-table td.is-selected .pika-button {
  background: oklch(var(--p));
  color: oklch(var(--pc));
  border-radius: var(--rounded-btn, 0.5rem);
  box-shadow: 0 0 0 2px oklch(var(--p) / 0.2);
}

.pika-table td.is-disabled .pika-button {
  color: oklch(var(--bc) / 0.3);
  cursor: not-allowed;
}

.pika-table td.is-outside-current-month .pika-button {
  color: oklch(var(--bc) / 0.3);
}

.pika-button {
  display: block;
  width: 2.5rem;
  height: 2.5rem;
  line-height: 2.5rem;
  text-align: center;
  border: none;
  border-radius: var(--rounded-btn, 0.5rem);
  background: transparent;
  color: oklch(var(--bc));
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s;
}

.pika-button:hover {
  background: oklch(var(--b2));
}

.pika-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid oklch(var(--b3));
  border-radius: var(--rounded-btn, 0.5rem);
  background: oklch(var(--b1));
  color: oklch(var(--bc));
  font-size: 0.875rem;
}
</style>
