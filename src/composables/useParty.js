import { ref, shallowRef } from 'vue'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/userStore'

// Simple cache for party data
const partyCache = new Map()
const myPartiesCache = shallowRef(null)
const myPartiesCacheTime = ref(0)
const CACHE_TTL = 30000 // 30 seconds

export function useParty() {
  const userStore = useUserStore()
  const isLoading = ref(false)
  const error = ref(null)

  // Generate a random 6-character join code
  function generateJoinCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid confusing characters
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  // Create a new party
  async function createParty({ name, description, date, budget }) {
    if (!userStore.user) return { error: 'Not authenticated' }

    isLoading.value = true
    error.value = null

    try {
      // Generate unique join code
      let joinCode = generateJoinCode()
      let attempts = 0

      // Try to create party, regenerate code if it already exists
      while (attempts < 5) {
        const { data: party, error: createError } = await supabase
          .from('parties')
          .insert({
            name,
            description,
            date,
            budget,
            join_code: joinCode,
            created_by: userStore.user.id,
          })
          .select()
          .single()

        if (!createError) {
          // Add creator as a member with 'creator' role
          await supabase.from('party_members').insert({
            party_id: party.id,
            user_id: userStore.user.id,
            role: 'creator',
          })

          // Invalidate my parties cache
          invalidateMyPartiesCache()

          return { data: party }
        }

        // If error is unique constraint violation on join_code, try again
        if (createError.code === '23505') {
          joinCode = generateJoinCode()
          attempts++
        } else {
          throw createError
        }
      }

      throw new Error('Failed to generate unique join code')
    } catch (e) {
      error.value = e.message
      return { error: e }
    } finally {
      isLoading.value = false
    }
  }

  // Fetch all parties the user is a member of
  async function fetchMyParties(forceRefresh = false) {
    if (!userStore.user) return { data: [] }

    // Return cached data if fresh
    const now = Date.now()
    if (!forceRefresh && myPartiesCache.value && (now - myPartiesCacheTime.value) < CACHE_TTL) {
      return { data: myPartiesCache.value, cached: true }
    }

    isLoading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('party_members')
        .select(`
          role,
          has_drawn,
          assigned_to,
          assigned_user:profiles!party_members_assigned_to_fkey (
            id,
            display_name,
            avatar_emoji
          ),
          party:parties (
            id,
            name,
            description,
            date,
            budget,
            join_code,
            draw_complete,
            created_at,
            created_by
          )
        `)
        .eq('user_id', userStore.user.id)
        .order('joined_at', { ascending: false })

      if (fetchError) throw fetchError

      // Flatten the data structure
      const parties = data.map(item => ({
        ...item.party,
        role: item.role,
        hasDrawn: item.has_drawn,
        assignedUser: item.assigned_user,
      }))

      // Update cache
      myPartiesCache.value = parties
      myPartiesCacheTime.value = now

      return { data: parties }
    } catch (e) {
      error.value = e.message
      return { error: e, data: [] }
    } finally {
      isLoading.value = false
    }
  }

  // Invalidate my parties cache (call after joining/leaving/creating)
  function invalidateMyPartiesCache() {
    myPartiesCache.value = null
    myPartiesCacheTime.value = 0
  }

  // Fetch a single party with members
  async function fetchParty(partyId, forceRefresh = false) {
    // Check cache first
    const cacheKey = `party_${partyId}`
    const cached = partyCache.get(cacheKey)
    const now = Date.now()

    if (!forceRefresh && cached && (now - cached.time) < CACHE_TTL) {
      return { data: cached.data, cached: true }
    }

    isLoading.value = true
    error.value = null

    try {
      // Fetch party and members in parallel
      const [partyResult, membersResult] = await Promise.all([
        supabase
          .from('parties')
          .select('*')
          .eq('id', partyId)
          .single(),
        supabase
          .from('party_members')
          .select(`
            id,
            role,
            has_drawn,
            assigned_to,
            joined_at,
            user_id,
            user:profiles!party_members_user_id_fkey (
              id,
              display_name,
              avatar_emoji
            )
          `)
          .eq('party_id', partyId)
          .order('joined_at', { ascending: true })
      ])

      if (partyResult.error) throw partyResult.error
      if (membersResult.error) throw membersResult.error

      const partyData = {
        ...partyResult.data,
        members: membersResult.data.map(m => ({
          id: m.id,
          role: m.role,
          hasDrawn: m.has_drawn,
          assignedTo: m.assigned_to,
          joinedAt: m.joined_at,
          userId: m.user.id,
          displayName: m.user.display_name,
          avatarEmoji: m.user.avatar_emoji,
        })),
      }

      // Update cache
      partyCache.set(cacheKey, { data: partyData, time: now })

      return { data: partyData }
    } catch (e) {
      error.value = e.message
      return { error: e }
    } finally {
      isLoading.value = false
    }
  }

  // Invalidate party cache
  function invalidatePartyCache(partyId) {
    if (partyId) {
      partyCache.delete(`party_${partyId}`)
    } else {
      partyCache.clear()
    }
  }

  // Join a party using join code
  async function joinParty(joinCode) {
    if (!userStore.user) return { error: 'Not authenticated' }

    isLoading.value = true
    error.value = null

    try {
      // Find party by join code
      const { data: party, error: findError } = await supabase
        .from('parties')
        .select('id, name')
        .eq('join_code', joinCode.toUpperCase())
        .single()

      if (findError) {
        if (findError.code === 'PGRST116') {
          throw new Error('Party not found. Check the code and try again.')
        }
        throw findError
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('party_members')
        .select('id')
        .eq('party_id', party.id)
        .eq('user_id', userStore.user.id)
        .single()

      if (existingMember) {
        // Already a member, just return the party
        return { data: party, alreadyMember: true }
      }

      // Add as member
      const { error: joinError } = await supabase
        .from('party_members')
        .insert({
          party_id: party.id,
          user_id: userStore.user.id,
          role: 'member',
        })

      if (joinError) throw joinError

      // Invalidate caches
      invalidateMyPartiesCache()
      invalidatePartyCache(party.id)

      return { data: party }
    } catch (e) {
      error.value = e.message
      return { error: e }
    } finally {
      isLoading.value = false
    }
  }

  // Leave a party
  async function leaveParty(partyId) {
    if (!userStore.user) return { error: 'Not authenticated' }

    isLoading.value = true
    error.value = null

    try {
      const { error: leaveError } = await supabase
        .from('party_members')
        .delete()
        .eq('party_id', partyId)
        .eq('user_id', userStore.user.id)

      if (leaveError) throw leaveError

      // Invalidate caches
      invalidateMyPartiesCache()
      invalidatePartyCache(partyId)

      return { success: true }
    } catch (e) {
      error.value = e.message
      return { error: e }
    } finally {
      isLoading.value = false
    }
  }

  // Delete a party (creator only)
  async function deleteParty(partyId) {
    if (!userStore.user) return { error: 'Not authenticated' }

    isLoading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('parties')
        .delete()
        .eq('id', partyId)
        .eq('created_by', userStore.user.id) // Only creator can delete

      if (deleteError) throw deleteError

      // Invalidate caches
      invalidateMyPartiesCache()
      invalidatePartyCache(partyId)

      return { success: true }
    } catch (e) {
      error.value = e.message
      return { error: e }
    } finally {
      isLoading.value = false
    }
  }

  // Perform the draw
  async function performDraw(partyId) {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: drawError } = await supabase
        .rpc('perform_party_draw', { p_party_id: partyId })

      if (drawError) throw drawError

      // Invalidate caches after draw
      invalidateMyPartiesCache()
      invalidatePartyCache(partyId)

      return { success: data }
    } catch (e) {
      error.value = e.message
      return { error: e }
    } finally {
      isLoading.value = false
    }
  }

  // Get current user's membership in a party
  async function getMyMembership(partyId) {
    if (!userStore.user) return { data: null }

    try {
      const { data, error: fetchError } = await supabase
        .from('party_members')
        .select(`
          id,
          role,
          has_drawn,
          assigned_to,
          assigned_user:profiles!party_members_assigned_to_fkey (
            id,
            display_name,
            avatar_emoji
          )
        `)
        .eq('party_id', partyId)
        .eq('user_id', userStore.user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

      return { data }
    } catch (e) {
      error.value = e.message
      return { error: e }
    }
  }

  // Reveal draw (mark as drawn and get assigned person)
  async function revealDraw(partyId) {
    if (!userStore.user) return { error: 'Not authenticated' }

    isLoading.value = true
    error.value = null

    try {
      // Mark as drawn
      const { error: updateError } = await supabase
        .from('party_members')
        .update({ has_drawn: true })
        .eq('party_id', partyId)
        .eq('user_id', userStore.user.id)

      if (updateError) throw updateError

      // Get the assigned person with their wishlist
      const { data: membership } = await getMyMembership(partyId)

      if (!membership?.assigned_to) {
        throw new Error('No assignment found. Has the draw been performed?')
      }

      // Fetch assigned person's profile
      const { data: assignedPerson, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_emoji')
        .eq('id', membership.assigned_to)
        .single()

      if (profileError) throw profileError

      // Fetch their wishlist for this party
      const { data: wishlist, error: wishlistError } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', membership.assigned_to)
        .eq('party_id', partyId)
        .order('sort_order', { ascending: true })

      if (wishlistError) throw wishlistError

      return {
        data: {
          ...assignedPerson,
          wishlist,
        },
      }
    } catch (e) {
      error.value = e.message
      return { error: e }
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    generateJoinCode,
    createParty,
    fetchMyParties,
    fetchParty,
    joinParty,
    leaveParty,
    deleteParty,
    performDraw,
    getMyMembership,
    revealDraw,
    invalidateMyPartiesCache,
    invalidatePartyCache,
  }
}
