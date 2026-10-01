import gplay from 'google-play-scraper';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(min = 2000, max = 5000) {
  return delay(Math.floor(Math.random() * (max - min + 1)) + min);
}

// Rotating user agents
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Method 1: Use google-play-scraper library
 */
async function scrapeWithLibrary(packageName) {
  try {
    const appData = await gplay.app({
      appId: packageName,
      lang: 'en',
      country: 'us'
    });

    return {
      packageName: packageName,
      appName: appData.title || 'Unknown',
      publisherName: appData.developer || 'Not found',
      category: appData.genre || 'Not found',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Method 2: Direct fetch with better parsing
 */
async function scrapeWithFetch(packageName) {
  const url = `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageName)}&hl=en&gl=us`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Cache-Control': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // Check if we got CAPTCHA or blocked
    if (html.includes('captcha') || html.includes('unusual traffic') || html.length < 5000) {
      throw new Error('Blocked by Google (CAPTCHA/rate limit)');
    }

    // Parse app name
    let appName = '';
    const ogTitleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i)
      || html.match(/content="([^"]+)"\s+(?:property|name)="og:title"/i);
    if (ogTitleMatch) {
      appName = ogTitleMatch[1]
        .replace(/\s*[-–—]\s*Apps on Google Play$/i, '')
        .replace(/\s*[-–—]\s*Games on Google Play$/i, '')
        .replace(/\s*[-–—]\s*Google Play$/i, '')
        .trim();
    }
    if (!appName) {
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) {
        appName = titleMatch[1]
          .replace(/\s*[-–—]\s*Apps on Google Play$/i, '')
          .replace(/\s*[-–—]\s*Games on Google Play$/i, '')
          .trim();
      }
    }

    // Parse developer/publisher
    let publisherName = '';
    const devLinkMatch = html.match(/href="\/store\/apps\/developer\?id=[^"]*"[^>]*>([^<]+)</i);
    if (devLinkMatch) {
      publisherName = devLinkMatch[1].trim();
    }
    if (!publisherName) {
      const devNameMatch = html.match(/"developer_name"\s*:\s*"([^"]+)"/);
      if (devNameMatch) {
        publisherName = devNameMatch[1];
      }
    }

    // Parse category
    let category = '';
    const catLinkMatch = html.match(/href="\/store\/apps\/category\/([A-Z_]+)"[^>]*>([^<]+)</i);
    if (catLinkMatch) {
      const catText = catLinkMatch[2].trim();
      const catSlug = catLinkMatch[1];
      if (catSlug !== 'FAMILY' && catSlug !== 'GAME' && catSlug !== 'APPLICATION') {
        category = catText || catSlug.replace(/_/g, ' ');
      }
    }
    if (!category || category === 'Family') {
      const catMatch = html.match(/"category"\s*:\s*"([^"]+)"/);
      if (catMatch && catMatch[1] !== 'Family') {
        category = catMatch[1];
      }
    }

    return {
      packageName: packageName,
      appName: appName || 'Unknown',
      publisherName: publisherName || 'Not found',
      category: category || 'Not found',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Method 3: Try with different country codes
 */
async function scrapeWithDifferentCountry(packageName) {
  const countries = ['us', 'gb', 'id', 'sg', 'au'];
  
  for (const country of countries) {
    try {
      const appData = await gplay.app({
        appId: packageName,
        lang: 'en',
        country: country
      });

      return {
        packageName: packageName,
        appName: appData.title || 'Unknown',
        publisherName: appData.developer || 'Not found',
        category: appData.genre || 'Not found',
      };
    } catch (error) {
      // Try next country
      continue;
    }
  }
  
  throw new Error('All countries failed');
}

/**
 * Main scraping function with retry and fallback
 */
async function scrapeApp(packageName, maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${packageName}] Attempt ${attempt}/${maxRetries}`);
      
      // Try Method 1: Library
      try {
        const result = await scrapeWithLibrary(packageName);
        console.log(`[${packageName}] Success with library`);
        return result;
      } catch (error) {
        console.log(`[${packageName}] Library failed: ${error.message}`);
        lastError = error;
      }

      // Wait before trying next method
      await randomDelay(1000, 2000);

      // Try Method 2: Direct fetch
      try {
        const result = await scrapeWithFetch(packageName);
        console.log(`[${packageName}] Success with fetch`);
        return result;
      } catch (error) {
        console.log(`[${packageName}] Fetch failed: ${error.message}`);
        lastError = error;
      }

      // Wait before trying next method
      await randomDelay(1000, 2000);

      // Try Method 3: Different countries
      try {
        const result = await scrapeWithDifferentCountry(packageName);
        console.log(`[${packageName}] Success with different country`);
        return result;
      } catch (error) {
        console.log(`[${packageName}] Different countries failed: ${error.message}`);
        lastError = error;
      }

      // If all methods failed, wait longer before retry
      if (attempt < maxRetries) {
        const waitTime = attempt * 3000 + Math.random() * 2000;
        console.log(`[${packageName}] All methods failed, waiting ${Math.round(waitTime/1000)}s before retry...`);
        await delay(waitTime);
      }
      
    } catch (error) {
      console.error(`[${packageName}] Unexpected error on attempt ${attempt}:`, error.message);
      lastError = error;
    }
  }

  // All retries failed
  console.error(`[${packageName}] All ${maxRetries} attempts failed`);
  return {
    packageName: packageName,
    appName: '',
    publisherName: '',
    category: '',
    error: lastError?.message || 'All scraping methods failed',
  };
}

/**
 * API Handler - Process SINGLE package per request
 * Frontend will call this endpoint multiple times for batch processing
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { packageName } = req.body;

  if (!packageName || typeof packageName !== 'string') {
    return res.status(400).json({ error: 'packageName is required' });
  }

  // Process single package with retry mechanism
  const result = await scrapeApp(packageName.trim());

  return res.status(200).json({ result });
}
