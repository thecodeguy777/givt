import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const profile = ref(null)
  const isLoading = ref(true)
  const error = ref(null)

  const isAuthenticated = computed(() => !!user.value)
  const displayName = computed(() => profile.value?.display_name || user.value?.email?.split('@')[0] || 'Guest')
  const avatarEmoji = computed(() => profile.value?.avatar_emoji || '🎁')

  async function initialize() {
    isLoading.value = true
    error.value = null

    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) throw sessionError

      if (session?.user) {
        user.value = session.user
        await fetchProfile()
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        user.value = session?.user || null

        if (session?.user) {
          await fetchProfile()
        } else {
          profile.value = null
        }
      })
    } catch (e) {
      error.value = e.message
      console.error('Auth initialization error:', e)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProfile() {
    if (!user.value) return

    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist - create it
      console.log('Profile not found, creating...')
      await createProfile()
      return
    }

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return
    }

    profile.value = data
  }

  async function createProfile() {
    if (!user.value) return

    const displayName = user.value.user_metadata?.full_name ||
                        user.value.user_metadata?.name ||
                        user.value.email?.split('@')[0] ||
                        'User'

    const { data, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.value.id,
        display_name: displayName,
        avatar_emoji: '🎁'
      })
      .select()
      .single()

    if (createError) {
      console.error('Profile creation error:', createError)
      error.value = createError.message
      return
    }

    console.log('Profile created:', data)
    profile.value = data
  }

  async function updateProfile(updates) {
    if (!user.value) return { error: 'Not authenticated' }

    const { data, error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: user.value.id,
        ...updates,
      })
      .select()
      .single()

    if (updateError) {
      error.value = updateError.message
      return { error: updateError }
    }

    profile.value = data
    return { data }
  }

  function $reset() {
    user.value = null
    profile.value = null
    error.value = null
    isLoading.value = false
  }

  return {
    // State
    user,
    profile,
    isLoading,
    error,
    // Computed
    isAuthenticated,
    displayName,
    avatarEmoji,
    // Actions
    initialize,
    fetchProfile,
    updateProfile,
    $reset,
  }
})
