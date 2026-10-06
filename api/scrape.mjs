import gplay from 'google-play-scraper';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(min = 500, max = 1500) {
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
      version: appData.version || 'Varies with device',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Method 2: Play Store with Android device simulation
 * Simulate Android device to get specific version
 */
async function scrapeWithDeviceSimulation(packageName) {
  const url = `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageName)}&hl=en&gl=us`;
  
  try {
    // Simulate Android device headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Cache-Control': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?1',
        'Sec-Ch-Ua-Platform': '"Android"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        // Simulate device capabilities
        'X-Requested-With': 'com.android.vending',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    if (html.includes('captcha') || html.includes('unusual traffic') || html.length < 5000) {
      throw new Error('Blocked by Google (CAPTCHA/rate limit)');
    }

    // Parse version with device-specific patterns
    let version = '';
    const versionPatterns = [
      /"version"\s*:\s*"([^"]+)"/,
      /Current Version[^>]*>[^<]*<[^>]*>([^<]+)</i,
      /softwareVersion[^>]*>[^<]*<[^>]*>([^<]+)</i,
      /itemprop="softwareVersion"[^>]*>([^<]+)</i,
      /"software_version"\s*:\s*"([^"]+)"/,
    ];
    
    for (const pattern of versionPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const v = match[1].trim();
        // Accept if it's not "Varies with device" and looks like a version number
        if (v && v !== 'Varies with device' && v.length < 30 && /\d/.test(v)) {
          version = v;
          break;
        }
      }
    }

    if (!version) {
      throw new Error('Version not found with device simulation');
    }

    // Also parse other data
    let appName = '';
    const ogTitleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i)
      || html.match(/content="([^"]+)"\s+(?:property|name)="og:title"/i);
    if (ogTitleMatch) {
      appName = ogTitleMatch[1]
        .replace(/\s*[-–—]\s*Apps on Google Play$/i, '')
        .replace(/\s*[-–—]\s*Games on Google Play$/i, '')
        .trim();
    }

    let publisherName = '';
    const devLinkMatch = html.match(/href="\/store\/apps\/developer\?id=[^"]*"[^>]*>([^<]+)</i);
    if (devLinkMatch) {
      publisherName = devLinkMatch[1].trim();
    }

    let category = '';
    const catLinkMatch = html.match(/href="\/store\/apps\/category\/([A-Z_]+)"[^>]*>([^<]+)</i);
    if (catLinkMatch) {
      const catText = catLinkMatch[2].trim();
      const catSlug = catLinkMatch[1];
      if (catSlug !== 'FAMILY' && catSlug !== 'GAME' && catSlug !== 'APPLICATION') {
        category = catText || catSlug.replace(/_/g, ' ');
      }
    }

    return {
      packageName: packageName,
      appName: appName || 'Unknown',
      publisherName: publisherName || 'Not found',
      category: category || 'Not found',
      version: version,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Method 3: APKMirror - Get version from APKMirror
 */
async function scrapeFromAPKMirror(packageName) {
  try {
    const url = `https://www.apkmirror.com/apk/${packageName.replace(/\./g, '-')}/`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`APKMirror HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // Parse latest version from APKMirror
    const versionMatch = html.match(/<span[^>]*class="[^"]*app-version[^"]*"[^>]*>([^<]+)</i)
      || html.match(/<div[^>]*class="[^"]*version[^"]*"[^>]*>([^<]+)</i)
      || html.match(/Version:\s*([^<\n]+)/i);
    
    if (versionMatch && versionMatch[1]) {
      const version = versionMatch[1].trim();
      if (version && version.length < 30 && /\d/.test(version)) {
        return {
          packageName: packageName,
          appName: 'Unknown',
          publisherName: 'Not found',
          category: 'Not found',
          version: version,
        };
      }
    }

    throw new Error('Version not found on APKMirror');
  } catch (error) {
    throw error;
  }
}

/**
 * Method 4: APKPure - Get version from APKPure
 */
async function scrapeFromAPKPure(packageName) {
  try {
    const url = `https://apkpure.com/${packageName.replace(/\./g, '-')}/${packageName}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`APKPure HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // Parse latest version from APKPure
    const versionMatch = html.match(/<div[^>]*class="[^"]*version[^"]*"[^>]*>([^<]+)</i)
      || html.match(/<span[^>]*itemprop="softwareVersion"[^>]*>([^<]+)</i)
      || html.match(/Version:\s*([^<\n]+)/i);
    
    if (versionMatch && versionMatch[1]) {
      const version = versionMatch[1].trim();
      if (version && version.length < 30 && /\d/.test(version)) {
        return {
          packageName: packageName,
          appName: 'Unknown',
          publisherName: 'Not found',
          category: 'Not found',
          version: version,
        };
      }
    }

    throw new Error('Version not found on APKPure');
  } catch (error) {
    throw error;
  }
}

/**
 * Method 5: Regular fetch without device simulation
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
    
    if (html.includes('captcha') || html.includes('unusual traffic') || html.length < 5000) {
      throw new Error('Blocked by Google (CAPTCHA/rate limit)');
    }

    // Parse all data
    let appName = '';
    const ogTitleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i)
      || html.match(/content="([^"]+)"\s+(?:property|name)="og:title"/i);
    if (ogTitleMatch) {
      appName = ogTitleMatch[1]
        .replace(/\s*[-–—]\s*Apps on Google Play$/i, '')
        .replace(/\s*[-–—]\s*Games on Google Play$/i, '')
        .trim();
    }

    let publisherName = '';
    const devLinkMatch = html.match(/href="\/store\/apps\/developer\?id=[^"]*"[^>]*>([^<]+)</i);
    if (devLinkMatch) {
      publisherName = devLinkMatch[1].trim();
    }

    let category = '';
    const catLinkMatch = html.match(/href="\/store\/apps\/category\/([A-Z_]+)"[^>]*>([^<]+)</i);
    if (catLinkMatch) {
      const catText = catLinkMatch[2].trim();
      const catSlug = catLinkMatch[1];
      if (catSlug !== 'FAMILY' && catSlug !== 'GAME' && catSlug !== 'APPLICATION') {
        category = catText || catSlug.replace(/_/g, ' ');
      }
    }

    let version = 'Varies with device';
    const versionPatterns = [
      /"version"\s*:\s*"([^"]+)"/,
      /Current Version[^>]*>[^<]*<[^>]*>([^<]+)</i,
      /softwareVersion[^>]*>[^<]*<[^>]*>([^<]+)</i,
      /itemprop="softwareVersion"[^>]*>([^<]+)</i,
    ];
    
    for (const pattern of versionPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const v = match[1].trim();
        if (v && v !== 'Varies with device' && v.length < 30) {
          version = v;
          break;
        }
      }
    }

    return {
      packageName: packageName,
      appName: appName || 'Unknown',
      publisherName: publisherName || 'Not found',
      category: category || 'Not found',
      version: version,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Method 6: Try with different country codes
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
        version: appData.version || 'Varies with device',
      };
    } catch (error) {
      continue;
    }
  }
  
  throw new Error('All countries failed');
}

/**
 * Main scraping function with retry and fallback
 * Optimized for speed: Library -> Device Simulation -> APKMirror -> Regular Fetch
 */
async function scrapeApp(packageName, maxRetries = 2) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${packageName}] Attempt ${attempt}/${maxRetries}`);
      
      // Method 1: Library (fastest, get all data)
      try {
        const result = await scrapeWithLibrary(packageName);
        console.log(`[${packageName}] Success with library, version: ${result.version}`);
        
        // If version is "Varies with device", try to get real version
        if (result.version === 'Varies with device') {
          console.log(`[${packageName}] Version is "Varies with device", trying device simulation...`);
          try {
            const deviceResult = await scrapeWithDeviceSimulation(packageName);
            if (deviceResult.version !== 'Varies with device') {
              result.version = deviceResult.version;
              console.log(`[${packageName}] Got real version from device simulation: ${result.version}`);
            }
          } catch (devError) {
            console.log(`[${packageName}] Device simulation failed: ${devError.message}`);
            // Try APKMirror as fallback for version
            try {
              const apkMirrorResult = await scrapeFromAPKMirror(packageName);
              result.version = apkMirrorResult.version;
              console.log(`[${packageName}] Got version from APKMirror: ${result.version}`);
            } catch (apkError) {
              console.log(`[${packageName}] APKMirror also failed: ${apkError.message}`);
            }
          }
        }
        
        return result;
      } catch (error) {
        console.log(`[${packageName}] Library failed: ${error.message}`);
        lastError = error;
      }

      await randomDelay(500, 1000);

      // Method 2: Device Simulation (get all data + real version)
      try {
        const result = await scrapeWithDeviceSimulation(packageName);
        console.log(`[${packageName}] Success with device simulation, version: ${result.version}`);
        return result;
      } catch (error) {
        console.log(`[${packageName}] Device simulation failed: ${error.message}`);
        lastError = error;
      }

      await randomDelay(500, 1000);

      // Method 3: APKMirror (get version only) + Regular Fetch (get other data)
      try {
        const apkMirrorResult = await scrapeFromAPKMirror(packageName);
        console.log(`[${packageName}] Got version from APKMirror: ${apkMirrorResult.version}`);
        
        try {
          const fullData = await scrapeWithFetch(packageName);
          return {
            ...fullData,
            version: apkMirrorResult.version,
          };
        } catch {
          return apkMirrorResult;
        }
      } catch (error) {
        console.log(`[${packageName}] APKMirror failed: ${error.message}`);
        lastError = error;
      }

      await randomDelay(500, 1000);

      // Method 4: Regular Fetch (get all data)
      try {
        const result = await scrapeWithFetch(packageName);
        console.log(`[${packageName}] Success with fetch, version: ${result.version}`);
        return result;
      } catch (error) {
        console.log(`[${packageName}] Fetch failed: ${error.message}`);
        lastError = error;
      }

      if (attempt < maxRetries) {
        const waitTime = attempt * 2000;
        console.log(`[${packageName}] All methods failed, waiting ${Math.round(waitTime/1000)}s before retry...`);
        await delay(waitTime);
      }
      
    } catch (error) {
      console.error(`[${packageName}] Unexpected error on attempt ${attempt}:`, error.message);
      lastError = error;
    }
  }

  console.error(`[${packageName}] All ${maxRetries} attempts failed`);
  return {
    packageName: packageName,
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
