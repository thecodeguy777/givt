import { ref } from 'vue'

export function useProductSearch() {
  const isLoading = ref(false)
  const error = ref(null)

  // Extract product metadata from a Lazada/Shopee URL
  async function extractMetadata(url) {
    if (!url) {
      error.value = 'Please enter a URL'
      return null
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/.netlify/functions/extract-product-meta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to extract product data')
      }

      const data = await response.json()
      return data
    } catch (e) {
      error.value = e.message
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Validate if URL is from supported platforms
  function isValidProductUrl(url) {
    if (!url) return false

    try {
      const urlObj = new URL(url)
      const supportedDomains = [
        'lazada.com.ph',
        'www.lazada.com.ph',
        'shopee.ph',
        'www.shopee.ph',
        'shopee.com',
        'www.shopee.com',
      ]

      return supportedDomains.some(domain =>
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      )
    } catch {
      return false
    }
  }

  // Get platform name from URL
  function getPlatformFromUrl(url) {
    if (!url) return null

    try {
      const urlObj = new URL(url)
      if (urlObj.hostname.includes('lazada')) return 'lazada'
      if (urlObj.hostname.includes('shopee')) return 'shopee'
      return null
    } catch {
      return null
    }
  }

  return {
    isLoading,
    error,
    extractMetadata,
    isValidProductUrl,
    getPlatformFromUrl,
  }
}
