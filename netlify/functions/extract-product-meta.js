// Netlify function to extract product metadata from Lazada/Shopee URLs
// This runs server-side to avoid CORS issues

export async function handler(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const { url } = JSON.parse(event.body || '{}')

    if (!url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'URL is required' }),
      }
    }

    // Validate URL is from allowed domains
    const urlObj = new URL(url)
    const allowedDomains = ['lazada.com.ph', 'shopee.ph', 'shopee.com']
    const isAllowed = allowedDomains.some(
      domain => urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    )

    if (!isAllowed) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'URL must be from Lazada or Shopee Philippines' }),
      }
    }

    // Fetch the page with browser-like headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`)
    }

    const html = await response.text()

    // Extract metadata using regex (since we can't use cheerio in edge functions easily)
    const extractMeta = (name) => {
      // Try og: prefix first
      const ogMatch = html.match(new RegExp(`<meta[^>]*property=["']og:${name}["'][^>]*content=["']([^"']+)["']`, 'i'))
      if (ogMatch) return ogMatch[1]

      // Try name attribute
      const nameMatch = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i'))
      if (nameMatch) return nameMatch[1]

      // Try content first then property/name
      const reverseOgMatch = html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${name}["']`, 'i'))
      if (reverseOgMatch) return reverseOgMatch[1]

      return null
    }

    // Extract title
    let title = extractMeta('title')
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      title = titleMatch ? titleMatch[1] : null
    }

    // Clean up title (remove site name suffix)
    if (title) {
      title = title
        .replace(/\s*[-|]\s*Lazada.*$/i, '')
        .replace(/\s*[-|]\s*Shopee.*$/i, '')
        .trim()
    }

    // Extract image
    let imageUrl = extractMeta('image')

    // Extract price from various sources
    let price = null
    let currency = 'PHP'

    // Try JSON-LD
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    if (jsonLdMatch) {
      for (const match of jsonLdMatch) {
        try {
          const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '')
          const data = JSON.parse(jsonContent)

          // Handle array of objects
          const items = Array.isArray(data) ? data : [data]
          for (const item of items) {
            if (item['@type'] === 'Product' && item.offers) {
              const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers
              if (offers.price) {
                price = parseFloat(offers.price)
                currency = offers.priceCurrency || 'PHP'
                break
              }
            }
          }
        } catch (e) {
          // JSON parse error, continue
        }
      }
    }

    // Try extracting price from common patterns in HTML
    if (!price) {
      // Lazada price pattern
      const lazadaPriceMatch = html.match(/["']price["']\s*:\s*(\d+(?:\.\d+)?)/i)
      if (lazadaPriceMatch) {
        price = parseFloat(lazadaPriceMatch[1])
      }

      // Shopee price pattern (prices in cents)
      const shopeePriceMatch = html.match(/["']price["']\s*:\s*(\d+)/i)
      if (shopeePriceMatch && urlObj.hostname.includes('shopee')) {
        const rawPrice = parseInt(shopeePriceMatch[1])
        // Shopee stores prices in cents (100000 = 1000.00 PHP)
        price = rawPrice > 100000 ? rawPrice / 100000 : rawPrice
      }
    }

    // Determine source
    const source = urlObj.hostname.includes('lazada') ? 'lazada' : 'shopee'

    const result = {
      title: title || 'Unknown Product',
      imageUrl: imageUrl || null,
      price: price,
      currency: currency,
      source: source,
      url: url,
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    }
  } catch (error) {
    console.error('Extract product meta error:', error)

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Failed to extract product data',
      }),
    }
  }
}
