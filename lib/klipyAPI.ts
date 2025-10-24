/**
 * Klipy GIF API Integration
 * Docs: https://docs.klipy.com/gifs-api
 * API Key: 6vXxnAAWsFE2MkGlOlVVozkhPI8BAEKubYjLBAqGSAWIDF6MKGMCP1QbjYTxnYUc
 * 
 * Based on Klipy API documentation structure
 */

const KLIPY_API_KEY = '6vXxnAAWsFE2MkGlOlVVozkhPI8BAEKubYjLBAqGSAWIDF6MKGMCP1QbjYTxnYUc';
// Klipy uses api.klipy.com for GIF API endpoints (verified with curl)
const KLIPY_BASE_URL = 'https://api.klipy.com';

export interface KlipyGIF {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
}

/**
 * Search for GIFs
 * Endpoint: GET /v1/gifs/search
 * Docs: https://docs.klipy.com/gifs-api#getgif-search-api
 */
export async function searchGIFs(query: string, limit: number = 20): Promise<KlipyGIF[]> {
  try {
    const response = await fetch(
      `${KLIPY_BASE_URL}/v1/gifs/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: {
          'api-key': KLIPY_API_KEY,
        },
      }
    );
    
    if (!response.ok) {
      console.error('[Klipy] Search failed:', response.status, await response.text());
      return [];
    }
    
    const data = await response.json();
    console.log('[Klipy] Search response:', data);
    
    // Parse Klipy response structure
    const results = data.results || data.data || [];
    
    return results.map((item: any) => ({
      id: item.id || item.itemid,
      title: item.title || item.content_description || 'GIF',
      url: item.media?.[0]?.gif?.url || item.url || item.gif_url,
      previewUrl: item.media?.[0]?.tinygif?.url || item.media?.[0]?.gif?.url || item.preview_url || item.url,
      width: item.media?.[0]?.gif?.dims?.[0] || item.width || 498,
      height: item.media?.[0]?.gif?.dims?.[1] || item.height || 280,
    }));
  } catch (error) {
    console.error('[Klipy] Search error:', error);
    return [];
  }
}

/**
 * Get trending GIFs
 * Endpoint: GET /v1/gifs/trending
 * Docs: https://docs.klipy.com/gifs-api#getgif-trending-api
 */
export async function getTrendingGIFs(limit: number = 20): Promise<KlipyGIF[]> {
  try {
    const response = await fetch(
      `${KLIPY_BASE_URL}/v1/gifs/trending?limit=${limit}`,
      {
        headers: {
          'api-key': KLIPY_API_KEY,
        },
      }
    );
    
    if (!response.ok) {
      console.error('[Klipy] Trending failed:', response.status, await response.text());
      return [];
    }
    
    const data = await response.json();
    console.log('[Klipy] Trending response:', data);
    
    const results = data.results || data.data || [];
    
    return results.map((item: any) => ({
      id: item.id || item.itemid,
      title: item.title || item.content_description || 'Trending GIF',
      url: item.media?.[0]?.gif?.url || item.url || item.gif_url,
      previewUrl: item.media?.[0]?.tinygif?.url || item.media?.[0]?.gif?.url || item.preview_url || item.url,
      width: item.media?.[0]?.gif?.dims?.[0] || item.width || 498,
      height: item.media?.[0]?.gif?.dims?.[1] || item.height || 280,
    }));
  } catch (error) {
    console.error('[Klipy] Trending error:', error);
    return [];
  }
}

/**
 * Get GIF categories
 * Endpoint: GET /v1/gifs/categories
 * Docs: https://docs.klipy.com/gifs-api#getgif-categories-api
 */
export async function getGIFCategories(): Promise<string[]> {
  try {
    const response = await fetch(
      `${KLIPY_BASE_URL}/v1/gifs/categories`,
      {
        headers: {
          'api-key': KLIPY_API_KEY,
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('[Klipy] Categories response:', data);
      return data.results || data.categories || data.data || [];
    }
  } catch (error) {
    console.log('[Klipy] Using default categories');
  }
  
  // Fallback categories
  return [
    'Happy', 'Love', 'Funny', 'Excited', 'Thinking',
    'Wow', 'Sad', 'Confused', 'Dancing', 'Agree',
  ];
}

/**
 * Track GIF share for Klipy monetization
 * Endpoint: POST /v1/gifs/{id}/share
 * Docs: https://docs.klipy.com/gifs-api#postgif-share-trigger-api
 */
export async function trackGIFImpression(gifId: string): Promise<void> {
  try {
    await fetch(`${KLIPY_BASE_URL}/v1/gifs/${gifId}/share`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'api-key': KLIPY_API_KEY,
      },
      body: JSON.stringify({
        action: 'share',
        timestamp: new Date().toISOString(),
      }),
    });
    console.log('[Klipy] Tracked GIF share:', gifId);
  } catch (error) {
    console.error('[Klipy] Failed to track impression:', error);
    // Silent fail - don't block user experience
  }
}
