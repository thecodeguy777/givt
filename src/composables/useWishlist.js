import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/userStore'

export function useWishlist(partyId) {
  const userStore = useUserStore()
  const items = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Fetch wishlist items for current user in this party
  async function fetchItems() {
    if (!userStore.user || !partyId) return

    isLoading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', userStore.user.id)
        .eq('party_id', partyId)
        .order('sort_order', { ascending: true })

      if (fetchError) throw fetchError

      items.value = data || []
    } catch (e) {
      error.value = e.message
    } finally {
      isLoading.value = false
    }
  }

  // Fetch wishlist for a specific user (for viewing assigned person's wishlist)
  async function fetchUserWishlist(userId) {
    if (!userId || !partyId) return []

    try {
      const { data, error: fetchError } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', userId)
        .eq('party_id', partyId)
        .order('sort_order', { ascending: true })

      if (fetchError) throw fetchError

      return data || []
    } catch (e) {
      error.value = e.message
      return []
    }
  }

  // Add a new wishlist item
  async function addItem(item) {
    if (!userStore.user || !partyId) return { error: 'Not authenticated' }

    isLoading.value = true
    error.value = null

    try {
      const { data, error: insertError } = await supabase
        .from('wishlist_items')
        .insert({
          user_id: userStore.user.id,
          party_id: partyId,
          title: item.title,
          url: item.url || null,
          image_url: item.imageUrl || null,
          price: item.price || null,
          currency: item.currency || 'PHP',
          source: item.source || 'manual',
          notes: item.notes || null,
          sort_order: items.value.length,
        })
        .select()
        .single()

      if (insertError) throw insertError

      items.value.push(data)
      return { data }
    } catch (e) {
      error.value = e.message
      return { error: e }
    } finally {
      isLoading.value = false
    }
  }

  // Update a wishlist item
  async function updateItem(itemId, updates) {
    isLoading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('wishlist_items')
        .update(updates)
        .eq('id', itemId)
        .eq('user_id', userStore.user.id) // Ensure user owns this item
        .select()
        .single()

      if (updateError) throw updateError

      // Update local state
      const index = items.value.findIndex(i => i.id === itemId)
      if (index !== -1) {
        items.value[index] = data
      }

      return { data }
    } catch (e) {
      error.value = e.message
      return { error: e }
    } finally {
      isLoading.value = false
    }
  }

  // Remove a wishlist item
  async function removeItem(itemId) {
    isLoading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userStore.user.id) // Ensure user owns this item

      if (deleteError) throw deleteError

      items.value = items.value.filter(i => i.id !== itemId)
      return { success: true }
    } catch (e) {
      error.value = e.message
      return { error: e }
    } finally {
      isLoading.value = false
    }
  }

  // Mark item as purchased (called by the gifter)
  async function markPurchased(itemId, isPurchased = true) {
    if (!userStore.user) return { error: 'Not authenticated' }

    try {
      const { data, error: updateError } = await supabase
        .from('wishlist_items')
        .update({
          is_purchased: isPurchased,
          purchased_by: isPurchased ? userStore.user.id : null,
        })
        .eq('id', itemId)
        .select()
        .single()

      if (updateError) throw updateError

      return { data }
    } catch (e) {
      error.value = e.message
      return { error: e }
    }
  }

  // Reorder items
  async function reorderItems(newOrder) {
    if (!userStore.user) return { error: 'Not authenticated' }

    try {
      // Update each item's sort_order
      const updates = newOrder.map((itemId, index) =>
        supabase
          .from('wishlist_items')
          .update({ sort_order: index })
          .eq('id', itemId)
          .eq('user_id', userStore.user.id)
      )

      await Promise.all(updates)

      // Update local state
      items.value.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id))

      return { success: true }
    } catch (e) {
      error.value = e.message
      return { error: e }
    }
  }

  return {
    items,
    isLoading,
    error,
    fetchItems,
    fetchUserWishlist,
    addItem,
    updateItem,
    removeItem,
    markPurchased,
    reorderItems,
  }
}
