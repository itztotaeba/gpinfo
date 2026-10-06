import gplay from 'google-play-scraper';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(min = 200, max = 600) {
  return delay(Math.floor(Math.random() * (max - min + 1)) + min);
}

// Multiple Android device profiles
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
 * Extract version from HTML elements - IMPROVED WITH MORE PATTERNS
 * Now captures versions with letters, hyphens, meta tags, and div classes
 */
function extractVersionFromHTML(html) {
  // Pattern 1: Meta tag with itemprop="softwareVersion"
  const metaVersionMatch = html.match(/<meta[^>]*itemprop="softwareVersion"[^>]*content="([^"]+)"/i)
    || html.match(/content="([^"]+)"[^>]*itemprop="softwareVersion"/i);
  if (metaVersionMatch && metaVersionMatch[1] && metaVersionMatch[1] !== 'Varies with device') {
    return metaVersionMatch[1].trim();
  }

  // Pattern 2: Current Version label with flexible pattern
  const blockPattern = /Current\s+Version[\s\S]{0,300}?>([\d\.a-zA-Z\-]+)</i;
  const match = html.match(blockPattern);
  if (match && match[1]) {
    const version = match[1].trim();
    if (/\d/.test(version) && version.length < 30) {
      return version;
    }
  }

  // Pattern 3: div with class "hAyfc" containing version info
  const hAyfcPattern = /<div[^>]*class="[^"]*hAyfc[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*htlgb[^"]*"[^>]*>([\d\.a-zA-Z\-]+)</i;
  const hAyfcMatch = html.match(hAyfcPattern);
  if (hAyfcMatch && hAyfcMatch[1]) {
    const version = hAyfcMatch[1].trim();
    if (/\d/.test(version) && version.length < 30) {
      return version;
    }
  }

  // Pattern 4: div with class "BgcNfc" (label) followed by version value
  const bgcNfcPattern = /<div[^>]*class="[^"]*BgcNfc[^"]*"[^>]*>Current\s+Version<\/div>[\s\S]{0,200}?<div[^>]*class="[^"]*htlgb[^"]*"[^>]*>([\d\.a-zA-Z\-]+)</i;
  const bgcNfcMatch = html.match(bgcNfcPattern);
  if (bgcNfcMatch && bgcNfcMatch[1]) {
    const version = bgcNfcMatch[1].trim();
    if (/\d/.test(version) && version.length < 30) {
      return version;
    }
  }

  // Pattern 5: Fallback - look for htlgb class elements
  const htlgbPattern = /htlgb[^>]*>([\d\.a-zA-Z\-]+)</g;
  const versions = [];
  let m;
  while ((m = htlgbPattern.exec(html)) !== null) {
    const version = m[1].trim();
    if (version && version.length < 30 && /\d/.test(version)) {
      versions.push(version);
    }
  }
  
  if (versions.length > 0) {
    versions.sort((a, b) => b.length - a.length);
    return versions[0];
  }

  return null;
}

/**
 * Extract version from meta tags
 */
function extractVersionFromMeta(html) {
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
    || extractVersionFromHTML(html);

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
 */
async function scrapeWithDeviceSimulation(packageName) {
  let bestResult = null;
  let bestVersion = '';
  let lastError = null;

  for (const device of DEVICE_PROFILES) {
    try {
      const html = await fetchPlayStoreWithDevice(packageName, device);
      const result = extractAllData(html, packageName);
      
      if (result.version !== 'Varies with device' && result.version.length > 0) {
        console.log(`[${packageName}] ${device.name}: Got version ${result.version}`);
        if (result.version.length > bestVersion.length) {
          bestResult = result;
          bestVersion = result.version;
        }
        if (bestVersion.length > 5) {
          return bestResult;
        }
      }
      
      if (!bestResult) {
        bestResult = result;
      }
    } catch (error) {
      lastError = error;
      continue;
    }
    
    await delay(200);
  }

  if (bestResult && bestResult.version !== 'Varies with device') {
    return bestResult;
  }

  throw lastError || new Error('All device profiles failed');
}

/**
 * Method 3: Desktop fetch
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
 * Method 5: Scrape from APKMirror - using search endpoint
 */
async function scrapeFromAPKMirror(packageName) {
  try {
    const searchUrl = `https://www.apkmirror.com/?post_type=app_release&searchtype=app&s=${encodeURIComponent(packageName)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': DESKTOP_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`APKMirror HTTP ${response.status}`);
    }

    const html = await response.text();
    
    const versionPatterns = [
      /appRowVersion[^>]*>([^<]+)</i,
      /class="[^"]*version[^"]*"[^>]*>([^<]+)</i,
      /Version:\s*([^<\n]+)/i,
      /<span[^>]*>(\d+\.\d+[\.\d\w\-]*)<\/span>/i,
    ];
    
    for (const pattern of versionPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const version = match[1].trim();
        if (version && version.length < 30 && /\d/.test(version)) {
          console.log(`[${packageName}] APKMirror: Got version ${version}`);
          return {
            packageName,
            appName: 'Unknown',
            publisherName: 'Not found',
            category: 'Not found',
            version: version,
          };
        }
      }
    }

    throw new Error('Version not found on APKMirror');
  } catch (error) {
    throw error;
  }
}

/**
 * Method 6: Scrape from APKCombo
 */
async function scrapeFromAPKCombo(packageName) {
  try {
    const searchUrl = `https://apkcombo.com/search/?q=${encodeURIComponent(packageName)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': DESKTOP_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`APKCombo HTTP ${response.status}`);
    }

    const html = await response.text();
    
    const versionPatterns = [
      /class="[^"]*version[^"]*"[^>]*>([^<]+)</i,
      /itemprop="softwareVersion"[^>]*>([^<]+)</i,
      /Version:\s*([^<\n]+)/i,
      /data-version="([^"]+)"/i,
      /<span[^>]*>(\d+\.\d+[\.\d\w\-]*)<\/span>/i,
    ];
    
    for (const pattern of versionPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const version = match[1].trim();
        if (version && version.length < 30 && /\d/.test(version)) {
          console.log(`[${packageName}] APKCombo: Got version ${version}`);
          return {
            packageName,
            appName: 'Unknown',
            publisherName: 'Not found',
            category: 'Not found',
            version: version,
          };
        }
      }
    }

    throw new Error('Version not found on APKCombo');
  } catch (error) {
    throw error;
  }
}

/**
 * Method 7: Scrape from Uptodown - NEW FALLBACK
 * Uses Uptodown search endpoint to find app version
 */
async function scrapeFromUptodown(packageName) {
  try {
    const searchUrl = `https://en.uptodown.com/android/search?query=${encodeURIComponent(packageName)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': DESKTOP_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Uptodown HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // Check if blocked by Cloudflare
    if (html.includes('cloudflare') || html.includes('Attention Required')) {
      throw new Error('Blocked by Cloudflare');
    }
    
    // Extract version from search results
    // Pattern 1: Look for version badge or text near app name
    const versionPatterns = [
      /<span[^>]*class="[^"]*version[^"]*"[^>]*>([^<]+)</i,
      /Version\s+(\d+\.\d+[\.\d\w\-]*)/i,
      /data-version="([^"]+)"/i,
      /<div[^>]*class="[^"]*app-version[^"]*"[^>]*>([^<]+)</i,
      /<span[^>]*>(\d+\.\d+\.\d+[\.\d\w\-]*)<\/span>/i,
    ];
    
    for (const pattern of versionPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const version = match[1].trim();
        if (version && version.length < 30 && /\d/.test(version)) {
          console.log(`[${packageName}] Uptodown: Got version ${version}`);
          return {
            packageName,
            appName: 'Unknown',
            publisherName: 'Not found',
            category: 'Not found',
            version: version,
          };
        }
      }
    }

    throw new Error('Version not found on Uptodown');
  } catch (error) {
    throw error;
  }
}

/**
 * Main scraping function - tries ALL methods to get version
 * Order: Library -> Device Simulation -> Desktop -> APKMirror -> APKCombo -> Uptodown -> Multi-Country
 * Now includes debug_steps to track which methods succeeded/failed
 */
async function scrapeApp(packageName) {
  let finalResult = null;
  let lastError = null;
  const debug_steps = {};

  console.log(`\n========== Starting scrape for ${packageName} ==========`);

  // === STEP 1: Library ===
  try {
    finalResult = await scrapeWithLibrary(packageName);
    debug_steps.library = finalResult.version === 'Varies with device' ? 'Varies' : `Success: ${finalResult.version}`;
    console.log(`[Step 1] Library: version=${finalResult.version}`);
  } catch (error) {
    debug_steps.library = `Failed: ${error.message}`;
    console.log(`[Step 1] Library failed: ${error.message}`);
    lastError = error;
  }

  // === STEP 2: Device Simulation (if version is "Varies with device") ===
  if (!finalResult || finalResult.version === 'Varies with device') {
    try {
      console.log(`[Step 2] Trying device simulation...`);
      const deviceResult = await scrapeWithDeviceSimulation(packageName);
      debug_steps.device = deviceResult.version === 'Varies with device' ? 'Varies' : `Success: ${deviceResult.version}`;
      console.log(`[Step 2] Device simulation: version=${deviceResult.version}`);
      
      if (deviceResult.version !== 'Varies with device') {
        if (finalResult) finalResult.version = deviceResult.version;
        else finalResult = deviceResult;
      } else if (!finalResult) finalResult = deviceResult;
    } catch (error) {
      debug_steps.device = `Failed: ${error.message}`;
      console.log(`[Step 2] Device simulation failed: ${error.message}`);
      lastError = error;
    }
  }

  // === STEP 3: Desktop fetch (if still "Varies with device") ===
  if (finalResult && finalResult.version === 'Varies with device') {
    try {
      console.log(`[Step 3] Trying desktop fetch...`);
      await randomDelay();
      const desktopResult = await scrapeWithDesktop(packageName);
      debug_steps.desktop = desktopResult.version === 'Varies with device' ? 'Varies' : `Success: ${desktopResult.version}`;
      console.log(`[Step 3] Desktop: version=${desktopResult.version}`);
      
      if (desktopResult.version !== 'Varies with device') {
        finalResult.version = desktopResult.version;
      }
    } catch (error) {
      debug_steps.desktop = `Failed: ${error.message}`;
      console.log(`[Step 3] Desktop fetch failed: ${error.message}`);
      lastError = error;
    }
  }

  // === STEP 4: APKMirror (if still "Varies with device") ===
  if (finalResult && finalResult.version === 'Varies with device') {
    try {
      console.log(`[Step 4] Trying APKMirror...`);
      await randomDelay();
      const apkMirrorResult = await scrapeFromAPKMirror(packageName);
      debug_steps.apkmirror = apkMirrorResult.version === 'Varies with device' ? 'Varies' : `Success: ${apkMirrorResult.version}`;
      console.log(`[Step 4] APKMirror: version=${apkMirrorResult.version}`);
      
      if (apkMirrorResult.version !== 'Varies with device') {
        finalResult.version = apkMirrorResult.version;
      }
    } catch (error) {
      debug_steps.apkmirror = `Failed: ${error.message}`;
      console.log(`[Step 4] APKMirror failed: ${error.message}`);
      lastError = error;
    }
  }

  // === STEP 5: APKCombo (if still "Varies with device") ===
  if (finalResult && finalResult.version === 'Varies with device') {
    try {
      console.log(`[Step 5] Trying APKCombo...`);
      await randomDelay();
      const apkComboResult = await scrapeFromAPKCombo(packageName);
      debug_steps.apkcombo = apkComboResult.version === 'Varies with device' ? 'Varies' : `Success: ${apkComboResult.version}`;
      console.log(`[Step 5] APKCombo: version=${apkComboResult.version}`);
      
      if (apkComboResult.version !== 'Varies with device') {
        finalResult.version = apkComboResult.version;
      }
    } catch (error) {
      debug_steps.apkcombo = `Failed: ${error.message}`;
      console.log(`[Step 5] APKCombo failed: ${error.message}`);
      lastError = error;
    }
  }

  // === STEP 6: Uptodown (if still "Varies with device") ===
  if (finalResult && finalResult.version === 'Varies with device') {
    try {
      console.log(`[Step 6] Trying Uptodown...`);
      await randomDelay();
      const uptodownResult = await scrapeFromUptodown(packageName);
      debug_steps.uptodown = uptodownResult.version === 'Varies with device' ? 'Varies' : `Success: ${uptodownResult.version}`;
      console.log(`[Step 6] Uptodown: version=${uptodownResult.version}`);
      
      if (uptodownResult.version !== 'Varies with device') {
        finalResult.version = uptodownResult.version;
      }
    } catch (error) {
      debug_steps.uptodown = `Failed: ${error.message}`;
      console.log(`[Step 6] Uptodown failed: ${error.message}`);
      lastError = error;
    }
  }

  // === STEP 7: Different countries (if still no data) ===
  if (!finalResult) {
    try {
      console.log(`[Step 7] Trying different countries...`);
      finalResult = await scrapeWithDifferentCountry(packageName);
      debug_steps.countries = finalResult.version === 'Varies with device' ? 'Varies' : `Success: ${finalResult.version}`;
      console.log(`[Step 7] Country: version=${finalResult.version}`);
    } catch (error) {
      debug_steps.countries = `Failed: ${error.message}`;
      console.log(`[Step 7] Different countries failed: ${error.message}`);
      lastError = error;
    }
  }

  console.log(`========== Final result for ${packageName}: version=${finalResult?.version || 'ERROR'} ==========\n`);

  // === FINAL: Return result or error ===
  if (finalResult) {
    return {
      ...finalResult,
      debug_steps,
    };
  }

  return {
    packageName,
    appName: '',
    publisherName: '',
    category: '',
    version: '',
    error: lastError?.message || 'All scraping methods failed',
    debug_steps,
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
