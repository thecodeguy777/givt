import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/userStore'

export function useAuth() {
  const router = useRouter()
  const userStore = useUserStore()

  const isLoading = ref(false)
  const error = ref(null)

  async function signInWithGoogle() {
    isLoading.value = true
    error.value = null

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) throw authError
    } catch (e) {
      error.value = e.message
      console.error('Google sign in error:', e)
    } finally {
      isLoading.value = false
    }
  }

  async function signOut() {
    isLoading.value = true
    error.value = null

    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError

      userStore.$reset()
      router.push('/login')
    } catch (e) {
      error.value = e.message
      console.error('Sign out error:', e)
    } finally {
      isLoading.value = false
    }
  }

  async function handleAuthCallback() {
    isLoading.value = true
    error.value = null

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) throw sessionError

      if (session?.user) {
        // Check if profile exists, create if not
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single()

        if (!existingProfile) {
          // Create profile from Google data
          const googleName = session.user.user_metadata?.full_name
            || session.user.user_metadata?.name
            || session.user.email?.split('@')[0]
            || 'User'

          await supabase.from('profiles').insert({
            id: session.user.id,
            display_name: googleName,
            avatar_emoji: '🎁',
          })
        }

        await userStore.fetchProfile()

        // Check if there's a pending join code
        const pendingJoinCode = sessionStorage.getItem('pendingJoinCode')
        if (pendingJoinCode) {
          sessionStorage.removeItem('pendingJoinCode')
          router.push(`/join/${pendingJoinCode}`)
        } else {
          router.push('/parties')
        }
      }
    } catch (e) {
      error.value = e.message
      console.error('Auth callback error:', e)
      router.push('/login')
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    signInWithGoogle,
    signOut,
    handleAuthCallback,
  }
}
