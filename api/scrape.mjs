import gplay from 'google-play-scraper';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(min = 300, max = 800) {
  return delay(Math.floor(Math.random() * (max - min + 1)) + min);
}

// Multiple Android device profiles - each may return different version
const DEVICE_PROFILES = [
  {
    name: 'Samsung Galaxy S23',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36',
    secChUaPlatform: '"Android"',
    secChUaMobile: '?1',
    secChUa: '"Chromium";v="124", "Google Chrome";v="124"',
  },
  {
    name: 'Google Pixel 8',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36',
    secChUaPlatform: '"Android"',
    secChUaMobile: '?1',
    secChUa: '"Chromium";v="124", "Google Chrome";v="124"',
  },
  {
    name: 'Samsung Galaxy A54',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36',
    secChUaPlatform: '"Android"',
    secChUaMobile: '?1',
    secChUa: '"Chromium";v="124", "Google Chrome";v="124"',
  },
  {
    name: 'Xiaomi 13',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; 2211133G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36',
    secChUaPlatform: '"Android"',
    secChUaMobile: '?1',
    secChUa: '"Chromium";v="124", "Google Chrome";v="124"',
  },
  {
    name: 'OnePlus 11',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; CPH2449) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36',
    secChUaPlatform: '"Android"',
    secChUaMobile: '?1',
    secChUa: '"Chromium";v="124", "Google Chrome";v="124"',
  },
];

const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Extract version from JSON-LD script tag
 */
function extractVersionFromJsonLd(html) {
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (!jsonLdMatch) return null;

  for (const script of jsonLdMatch) {
    const content = script.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
    try {
      const data = JSON.parse(content);
      const candidates = Array.isArray(data) ? data : [data];
      for (const item of candidates) {
        if (item.softwareVersion && item.softwareVersion !== 'Varies with device') {
          return item.softwareVersion;
        }
        if (item.version && item.version !== 'Varies with device') {
          return item.version;
        }
      }
    } catch {
      // ignore JSON parse errors
    }
  }
  return null;
}

/**
 * Extract version from AF_initDataCallback data
 */
function extractVersionFromDataCallbacks(html) {
  // Find all AF_initDataCallback calls
  const callbackMatches = html.match(/AF_initDataCallback\(\{[^}]*data:([\s\S]*?)\}\);/g);
  if (!callbackMatches) return null;

  for (const callback of callbackMatches) {
    // Extract the data portion
    const dataMatch = callback.match(/data:([\s\S]*?)\}\);/);
    if (!dataMatch) continue;

    const dataStr = dataMatch[1];
    
    // Look for version-like strings in the data
    // Version numbers typically look like: "1.2.3", "2.24.3.76", etc.
    const versionPattern = /"(\d+\.\d+[\.\d]*)"/g;
    let match;
    const versions = [];
    
    while ((match = versionPattern.exec(dataStr)) !== null) {
      const v = match[1];
      // Filter reasonable version strings
      if (v.length < 30 && v.length > 2 && !v.endsWith('.0.0.0')) {
        versions.push(v);
      }
    }
    
    // Return the longest version found (most specific)
    if (versions.length > 0) {
      versions.sort((a, b) => b.length - a.length);
      return versions[0];
    }
  }
  return null;
}

/**
 * Extract version from HTML elements (hAyfc blocks)
 */
function extractVersionFromHTMLBlocks(html) {
  // Pattern: "Current Version" label followed by version value
  const blockPattern = /Current [Vv]ersion[\s\S]{0,200}?>(\d+[\d\.]+)</i;
  const match = html.match(blockPattern);
  if (match && match[1]) {
    return match[1].trim();
  }

  // Alternative: look for htlgb class elements
  const htlgbPattern = /htlgb[^>]*>(\d+\.\d+[\d\.]*)</g;
  const versions = [];
  let m;
  while ((m = htlgbPattern.exec(html)) !== null) {
    if (m[1] && m[1].length < 30) {
      versions.push(m[1]);
    }
  }
  
  if (versions.length > 0) {
    // Return the longest version (most specific)
    versions.sort((a, b) => b.length - a.length);
    return versions[0];
  }

  return null;
}

/**
 * Extract version from meta tags
 */
function extractVersionFromMeta(html) {
  // Look for softwareVersion meta
  const metaMatch = html.match(/itemprop="softwareVersion"[^>]*content="([^"]+)"/i)
    || html.match(/content="([^"]+)"[^>]*itemprop="softwareVersion"/i);
  if (metaMatch && metaMatch[1] && metaMatch[1] !== 'Varies with device') {
    return metaMatch[1];
  }
  return null;
}

/**
 * Extract all app data from HTML
 */
function extractAllData(html, packageName) {
  let appName = '';
  let publisherName = '';
  let category = '';
  let version = '';

  // App Name
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

  // Publisher Name
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

  // Category
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

  // Version - try multiple extraction methods
  version = extractVersionFromJsonLd(html)
    || extractVersionFromMeta(html)
    || extractVersionFromHTMLBlocks(html)
    || extractVersionFromDataCallbacks(html);

  return {
    packageName,
    appName: appName || 'Unknown',
    publisherName: publisherName || 'Not found',
    category: category || 'Not found',
    version: version || 'Varies with device',
  };
}

/**
 * Fetch Play Store page with specific device profile
 */
async function fetchPlayStoreWithDevice(packageName, deviceProfile) {
  const url = `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageName)}&hl=en&gl=us`;
  
  const headers = {
    'User-Agent': deviceProfile.userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'identity',
    'Cache-Control': 'no-cache',
    'Sec-Ch-Ua': deviceProfile.secChUa,
    'Sec-Ch-Ua-Mobile': deviceProfile.secChUaMobile,
    'Sec-Ch-Ua-Platform': deviceProfile.secChUaPlatform,
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  };

  const response = await fetch(url, { headers, redirect: 'follow' });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  
  if (html.includes('captcha') || html.includes('unusual traffic') || html.length < 5000) {
    throw new Error('Blocked by Google (CAPTCHA/rate limit)');
  }

  return html;
}

/**
 * Method 1: google-play-scraper library
 */
async function scrapeWithLibrary(packageName) {
  const appData = await gplay.app({
    appId: packageName,
    lang: 'en',
    country: 'us'
  });

  return {
    packageName,
    appName: appData.title || 'Unknown',
    publisherName: appData.developer || 'Not found',
    category: appData.genre || 'Not found',
    version: appData.version || 'Varies with device',
  };
}

/**
 * Method 2: Device Simulation - try multiple Android devices
 * Each device may return different version info
 */
async function scrapeWithDeviceSimulation(packageName) {
  let bestResult = null;
  let bestVersion = '';
  let lastError = null;

  // Try each device profile
  for (const device of DEVICE_PROFILES) {
    try {
      const html = await fetchPlayStoreWithDevice(packageName, device);
      const result = extractAllData(html, packageName);
      
      // If we got a real version number (not "Varies with device"), use it
      if (result.version !== 'Varies with device' && result.version.length > 0) {
        console.log(`[${packageName}] ${device.name}: Got version ${result.version}`);
        // Prefer longer/more specific versions
        if (result.version.length > bestVersion.length) {
          bestResult = result;
          bestVersion = result.version;
        }
        // If we got a good version, no need to try more devices
        if (bestVersion.length > 5) {
          return bestResult;
        }
      }
      
      // Keep the first result as fallback
      if (!bestResult) {
        bestResult = result;
      }
    } catch (error) {
      lastError = error;
      continue;
    }
    
    // Small delay between device attempts
    await delay(200);
  }

  if (bestResult && bestResult.version !== 'Varies with device') {
    return bestResult;
  }

  throw lastError || new Error('All device profiles failed');
}

/**
 * Method 3: Desktop fetch (sometimes has different data)
 */
async function scrapeWithDesktop(packageName) {
  const url = `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageName)}&hl=en&gl=us`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': DESKTOP_UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity',
      'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
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

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const html = await response.text();
  if (html.includes('captcha') || html.includes('unusual traffic') || html.length < 5000) {
    throw new Error('Blocked by Google');
  }

  return extractAllData(html, packageName);
}

/**
 * Method 4: Try different countries with library
 */
async function scrapeWithDifferentCountry(packageName) {
  const countries = ['id', 'us', 'gb', 'sg', 'au', 'jp', 'kr', 'de', 'br', 'in'];
  
  for (const country of countries) {
    try {
      const appData = await gplay.app({
        appId: packageName,
        lang: 'en',
        country: country
      });

      const result = {
        packageName,
        appName: appData.title || 'Unknown',
        publisherName: appData.developer || 'Not found',
        category: appData.genre || 'Not found',
        version: appData.version || 'Varies with device',
      };

      // If we got a real version, return immediately
      if (result.version !== 'Varies with device') {
        return result;
      }
    } catch {
      continue;
    }
  }
  
  throw new Error('All countries failed');
}

/**
 * Main scraping function
 * Strategy: 
 * 1. Library (fast, get basic data)
 * 2. Device Simulation (try 5 Android devices for real version)
 * 3. Desktop fetch (alternative parsing)
 * 4. Different countries (last resort)
 */
async function scrapeApp(packageName) {
  let finalResult = null;
  let lastError = null;

  // === STEP 1: Library (get basic data) ===
  try {
    finalResult = await scrapeWithLibrary(packageName);
    console.log(`[${packageName}] Library: version=${finalResult.version}`);
  } catch (error) {
    console.log(`[${packageName}] Library failed: ${error.message}`);
    lastError = error;
  }

  // === STEP 2: If version is "Varies with device", try device simulation ===
  if (!finalResult || finalResult.version === 'Varies with device') {
    try {
      console.log(`[${packageName}] Trying device simulation...`);
      const deviceResult = await scrapeWithDeviceSimulation(packageName);
      console.log(`[${packageName}] Device simulation: version=${deviceResult.version}`);
      
      if (deviceResult.version !== 'Varies with device') {
        // Got real version from device simulation!
        if (finalResult) {
          finalResult.version = deviceResult.version;
        } else {
          finalResult = deviceResult;
        }
      } else if (!finalResult) {
        finalResult = deviceResult;
      }
    } catch (error) {
      console.log(`[${packageName}] Device simulation failed: ${error.message}`);
      lastError = error;
    }
  }

  // === STEP 3: If still "Varies with device", try desktop fetch ===
  if (finalResult && finalResult.version === 'Varies with device') {
    try {
      console.log(`[${packageName}] Trying desktop fetch...`);
      await randomDelay();
      const desktopResult = await scrapeWithDesktop(packageName);
      console.log(`[${packageName}] Desktop: version=${desktopResult.version}`);
      
      if (desktopResult.version !== 'Varies with device') {
        finalResult.version = desktopResult.version;
      }
    } catch (error) {
      console.log(`[${packageName}] Desktop fetch failed: ${error.message}`);
      lastError = error;
    }
  }

  // === STEP 4: If still no data at all, try different countries ===
  if (!finalResult) {
    try {
      console.log(`[${packageName}] Trying different countries...`);
      finalResult = await scrapeWithDifferentCountry(packageName);
      console.log(`[${packageName}] Country: version=${finalResult.version}`);
    } catch (error) {
      console.log(`[${packageName}] Different countries failed: ${error.message}`);
      lastError = error;
    }
  }

  // === FINAL: Return result or error ===
  if (finalResult) {
    return finalResult;
  }

  return {
    packageName,
    appName: '',
    publisherName: '',
    category: '',
    version: '',
    error: lastError?.message || 'All scraping methods failed',
  };
}

export default async function handler(req, res) {
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

  const result = await scrapeApp(packageName.trim());

  return res.status(200).json({ result });
}
