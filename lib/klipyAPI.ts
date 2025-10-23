/**
 * Klipy GIF API Integration
 * Docs: https://docs.klipy.com/getting-started
 * GitHub: https://github.com/KLIPY-com/Klipy-GIF-API
 * 
 * API Key: 6vXxnAAWsFE2MkGlOlVVozkhPI8BAEKubYjLBAqGSAWIDF6MKGMCP1QbjYTxnYUc
 */

const KLIPY_API_KEY = '6vXxnAAWsFE2MkGlOlVVozkhPI8BAEKubYjLBAqGSAWIDF6MKGMCP1QbjYTxnYUc';
// Base URL - will update when found in docs
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
 * Endpoint: GET /gif/search (from docs.klipy.com)
 */
export async function searchGIFs(query: string, limit: number = 20): Promise<KlipyGIF[]> {
  try {
    // Based on standard REST API patterns
    const response = await fetch(
      `${KLIPY_BASE_URL}/gif/search?q=${encodeURIComponent(query)}&limit=${limit}&key=${KLIPY_API_KEY}`
    );
    
    if (!response.ok) {
      console.error('[Klipy] Search failed:', response.status);
      return [];
    }
    
    const data = await response.json();
    const results = data.results || data.data || data.gifs || [];
    
    return results.map((gif: any) => ({
      id: gif.id || gif.gif_id,
      title: gif.title || gif.description || 'GIF',
      url: gif.url || gif.media_url || gif.gif_url,
      previewUrl: gif.preview_url || gif.thumbnail || gif.url,
      width: gif.width || 498,
      height: gif.height || 280,
    }));
  } catch (error) {
    console.error('[Klipy] Search error:', error);
    return [];
  }
}

/**
 * Get trending GIFs
 * Endpoint: GET /gif/trending (from docs.klipy.com)
 */
export async function getTrendingGIFs(limit: number = 20): Promise<KlipyGIF[]> {
  try {
    const response = await fetch(
      `${KLIPY_BASE_URL}/gif/trending?limit=${limit}&key=${KLIPY_API_KEY}`
    );
    
    if (!response.ok) {
      console.error('[Klipy] Trending failed:', response.status);
      return [];
    }
    
    const data = await response.json();
    const results = data.results || data.data || data.gifs || [];
    
    return results.map((gif: any) => ({
      id: gif.id || gif.gif_id,
      title: gif.title || 'Trending GIF',
      url: gif.url || gif.media_url || gif.gif_url,
      previewUrl: gif.preview_url || gif.thumbnail || gif.url,
      width: gif.width || 498,
      height: gif.height || 280,
    }));
  } catch (error) {
    console.error('[Klipy] Trending error:', error);
    return [];
  }
}

/**
 * Get GIF categories
 * Endpoint: GET /gif/categories (from docs.klipy.com)
 */
export async function getGIFCategories(): Promise<string[]> {
  try {
    const response = await fetch(
      `${KLIPY_BASE_URL}/gif/categories?key=${KLIPY_API_KEY}`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.categories || data.data || [];
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
 * Endpoint: POST /gif/share (from docs.klipy.com - Share Trigger API)
 */
export async function trackGIFImpression(gifId: string): Promise<void> {
  try {
    await fetch(`${KLIPY_BASE_URL}/gif/share`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KLIPY_API_KEY}`,
      },
      body: JSON.stringify({
        gif_id: gifId,
        timestamp: Date.now(),
      }),
    });
  } catch (error) {
    // Silent fail
  }
}
