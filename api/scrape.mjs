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

  // AppBrain slug - derived from the "See on APPBRAIN" link on the Play page,
  // used later by the AppBrain fallback (appbrain.com/app/{slug})
  let appBrainSlug = '';
  const appBrainMatch = html.match(/appbrain\.com\/app\/([a-z0-9][a-z0-9\-]*)/i);
  if (appBrainMatch) appBrainSlug = appBrainMatch[1];

  return {
    packageName,
    appName: appName || 'Unknown',
    publisherName: publisherName || 'Not found',
    category: category || 'Not found',
    version: version || 'Varies with device',
    appBrainSlug,
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
 * Normalize a scraped version string; return null if it is useless
 * (empty, "Varies with device", or implausibly long).
 */
function normalizeVersion(raw) {
  if (!raw) return null;
  const v = String(raw).trim();
  if (!v || v === 'Varies with device') return null;
  if (v.length > 30 || !/\d/.test(v)) return null;
  return v;
}

/**
 * Method: Aptoide API (JSON, no HTML parsing needed)
 * Primary endpoint (as specified): https://ws75.aptoide.com/api/7/app/search/query={packageName}&limit=1
 * Alternate path form:              https://ws75.aptoide.com/api/7/apps/search/q={packageName}/limit=1
 * Extracts datalist.list[0].version_name after validating the package name matches.
 */
async function scrapeFromAptoide(packageName) {
  const endpoints = [
    `https://ws75.aptoide.com/api/7/app/search/query=${encodeURIComponent(packageName)}&limit=1`,
    `https://ws75.aptoide.com/api/7/apps/search/q=${encodeURIComponent(packageName)}/limit=1`,
  ];

  let lastError = null;
  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': DESKTOP_UA,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      const list = data?.datalist?.list || [];
      // Prefer an exact package match among the results
      const app = list.find(a => a.package === packageName) || list[0];
      if (!app) {
        lastError = new Error('No results in datalist');
        continue;
      }

      // Validate the returned package actually matches what we searched for
      if (app.package !== packageName) {
        lastError = new Error(`Package mismatch: got "${app.package}"`);
        continue;
      }

      const version = normalizeVersion(app.version_name);
      if (!version) {
        lastError = new Error('No usable version_name');
        continue;
      }

      return {
        packageName,
        appName: app.name || 'Unknown',
        publisherName: app.store?.name || 'Not found',
        category: app.tags?.[0] || 'Not found',
        version,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Aptoide failed');
}

/**
 * Method: AppBrain
 * URL pattern derived from Play Store page ("See on APPBRAIN" link) with a
 * direct-package fallback: https://www.appbrain.com/app/{packageName}
 * Extracts <meta property="og:app_version"> or <span itemprop="softwareVersion">.
 */
async function scrapeFromAppBrain(packageName, appSlug = '') {
  const candidates = [];
  if (appSlug) candidates.push(`https://www.appbrain.com/app/${appSlug}`);
  candidates.push(`https://www.appbrain.com/app/${packageName}`);

  let lastError = null;
  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': DESKTOP_UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }

      const html = await response.text();

      // Pattern 1: og:app_version meta tag
      const ogMatch = html.match(/<meta[^>]*property=["']og:app_version["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/content=["']([^"']+)["'][^>]*property=["']og:app_version["']/i);
      let version = ogMatch ? normalizeVersion(ogMatch[1]) : null;

      // Pattern 2: <span itemprop="softwareVersion">...</span>
      if (!version) {
        const spanMatch = html.match(/itemprop=["']softwareVersion["'][^>]*>([^<]+)</i);
        version = spanMatch ? normalizeVersion(spanMatch[1]) : null;
      }

      if (version) {
        return {
          packageName,
          appName: 'Unknown',
          publisherName: 'Not found',
          category: 'Not found',
          version,
        };
      }
      lastError = new Error('Version not found in HTML');
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('AppBrain failed');
}

/**
 * Method: Uptodown - search endpoint, extract version from first result.
 * Strategy (verified against live HTML):
 *   1. Search page lists app result links like https://{app-slug}.en.uptodown.com/android
 *   2. Fetch the first matching app page; validate package name appears in it
 *   3. Extract <span class="version">X.Y.Z</span> from the versions list
 */
async function scrapeFromUptodownSearch(packageName) {
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

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const html = await response.text();
  if (html.includes('cloudflare') || html.includes('Attention Required')) {
    throw new Error('Blocked by Cloudflare');
  }

  // App result links on the search page: https://{slug}.en.uptodown.com/android
  const appLinks = [...new Set(
    [...html.matchAll(/href="(https:\/\/[a-z0-9\-]+\.en\.uptodown\.com\/android)"/gi)].map(m => m[1])
  )].slice(0, 3);

  let lastError = null;
  for (const appUrl of appLinks) {
    try {
      const pageResp = await fetch(appUrl, {
        headers: {
          'User-Agent': DESKTOP_UA,
          'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });
      if (!pageResp.ok) {
        lastError = new Error(`HTTP ${pageResp.status} on app page`);
        continue;
      }

      const pageHtml = await pageResp.text();

      // Validate this page is actually about our package
      if (!pageHtml.includes(packageName)) {
        lastError = new Error(`Package "${packageName}" not referenced on ${appUrl}`);
        continue;
      }

      // Version patterns: span.version inside versions list, JSON-LD softwareVersion, itemprop
      const versionPatterns = [
        /<span[^>]*class="[^"]*version[^"]*"[^>]*>([^<]+)<\/span>/i,
        /"softwareVersion"\s*:\s*"([^"]+)"/i,
        /itemprop="softwareVersion"[^>]*>([^<]+)</i,
        /Version\s+(\d+\.\d+[.\d\w\-]*)/i,
        /data-version="([^"]+)"/i,
      ];

      for (const pattern of versionPatterns) {
        const match = pageHtml.match(pattern);
        if (match && match[1]) {
          const version = normalizeVersion(match[1]);
          if (version) {
            return {
              packageName,
              appName: 'Unknown',
              publisherName: 'Not found',
              category: 'Not found',
              version,
            };
          }
        }
      }
      lastError = new Error('Version not found on app page');
    } catch (error) {
      lastError = error;
    }
  }

  // Fallback: try to read a version directly from the search results markup
  const directPatterns = [
    /<span[^>]*class="[^"]*version[^"]*"[^>]*>([^<]+)</i,
    /Version\s+(\d+\.\d+[.\d\w\-]*)/i,
    /data-version="([^"]+)"/i,
  ];
  for (const pattern of directPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const version = normalizeVersion(match[1]);
      if (version) {
        return {
          packageName,
          appName: 'Unknown',
          publisherName: 'Not found',
          category: 'Not found',
          version,
        };
      }
    }
  }

  throw lastError || new Error('Version not found on Uptodown');
}

/**
 * Method: APKCombo - search endpoint, extract version from badge/link.
 */
async function scrapeFromAPKComboSearch(packageName) {
  const searchUrl = `https://apkcombo.com/search/?q=${encodeURIComponent(packageName)}`;

  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': DESKTOP_UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const html = await response.text();

  const versionPatterns = [
    /class="[^"]*version[^"]*"[^>]*>([^<]+)</i,
    /itemprop="softwareVersion"[^>]*>([^<]+)</i,
    /data-version="([^"]+)"/i,
    /Version:\s*([^<\n]+)/i,
    /<span[^>]*>(\d+\.\d+[.\d\w\-]*)<\/span>/i,
  ];

  for (const pattern of versionPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const version = normalizeVersion(match[1]);
      if (version) {
        return {
          packageName,
          appName: 'Unknown',
          publisherName: 'Not found',
          category: 'Not found',
          version,
        };
      }
    }
  }

  throw new Error('Version not found on APKCombo');
}

/**
 * GitHub owner/repo mapping for known open-source Android apps.
 * Keyed by package name so "Varies with device" apps can still be resolved.
 */
const GITHUB_REPO_MAP = {
  'org.thoughtcrime.securesms': 'signalapp/Signal-Android',
  'org.videolan.vlc': 'videolan/vlc-android',
  'org.newpipe': 'TeamNewPipe/NewPipe',
  'com.teamnewpipe.newpipe': 'TeamNewPipe/NewPipe',
  'org.mozilla.firefox': 'mozilla-mobile/firefox-android',
  'com.ichi2.anki': 'ankidroid/Anki-Android',
};

/**
 * Method: GitHub Releases (open-source apps only)
 * GET https://api.github.com/repos/{owner}/{repo}/releases/latest -> tag_name
 */
async function scrapeFromGithubReleases(packageName) {
  const repo = GITHUB_REPO_MAP[packageName];
  if (!repo) throw new Error('No GitHub mapping for this package');

  const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: {
      'User-Agent': DESKTOP_UA,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    redirect: 'follow',
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  const rawTag = data?.tag_name;
  if (!rawTag) throw new Error('No tag_name in release');

  // Strip common release-tag prefixes: v, version-, releases/, etc.
  const version = normalizeVersion(String(rawTag).replace(/^(?:v|version[-_]|releases\/)/i, ''));
  if (!version) throw new Error(`Unusable tag_name "${rawTag}"`);

  return {
    packageName,
    appName: data.name || 'Unknown',
    publisherName: repo,
    category: 'Open Source',
    version,
  };
}

/**
 * Method: Try different countries with library
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
 * Huawei AppGallery edge API endpoints (regional load balancers).
 * POST /webedge/appinfo with JSON body { pkgName, appId } returns app metadata as JSON.
 * Discovered from the official AppGallery web frontend (appgallery.huawei.com).
 */
const APPGALLERY_EDGE_BASES = [
  'https://web-dra.hispace.dbankcloud.com', // Singapore (oversea default)
  'https://web-dre.hispace.dbankcloud.com', // Europe
  'https://web-drcn.hispace.dbankcloud.com', // China
  'https://web-drru.hispace.dbankcloud.com', // Russia
];

// AppGallery language codes: "10118" = English, "64" = Chinese
const APPGALLERY_LANG_MAP = { en: '10118', id: '10123', zh: '64' };

/**
 * Map numeric AppGallery localeId to a readable language code.
 */
function agLangFromLocale(localeId) {
  if (!localeId) return 'en';
  return String(localeId) === '10118' ? 'en' : String(localeId) === '64' ? 'zh' : String(localeId);
}

/**
 * Convert raw AppGallery /webedge/appinfo JSON into our result shape.
 */
function mapAppGalleryData(data, packageName) {
  const appName = data.name || 'Unknown';
  const publisherName = data.developerName || data.supplier || 'Not found';
  const category = data.kindName || 'Not found';
  const version = data.version || 'Not found';

  return {
    packageName,
    appName,
    publisherName,
    category,
    version,
    source: 'huawei-appgallery',
    appGalleryAppId: data.appId || '',
    appGalleryUrl: data.appId ? `https://appgallery.huawei.com/app/${data.appId}` : '',
    downloadCount: data.downCount || '',
    size: data.size || 0,
    releaseDate: data.releaseDate || null,
    lang: agLangFromLocale(data.localeId),
  };
}

/**
 * Scrape app info from Huawei AppGallery via its internal edge API.
 * Works directly with package name (pkgName) - no App ID needed.
 * Tries multiple regional edge bases until one returns valid data.
 */
async function scrapeWithAppGallery(packageName) {
  const errors = [];

  for (const base of APPGALLERY_EDGE_BASES) {
    try {
      const response = await fetch(`${base}/webedge/appinfo`, {
        method: 'POST',
        headers: {
          'User-Agent': DESKTOP_UA,
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://appgallery.huawei.com',
          'Referer': 'https://appgallery.huawei.com/',
        },
        body: JSON.stringify({
          pkgName: packageName,
          appId: '',
          serviceType: 20,
          clientVersion: '10.4.1.300',
          language: APPGALLERY_LANG_MAP.en,
        }),
        redirect: 'follow',
      });

      if (!response.ok) {
        errors.push(`${new URL(base).hostname}: HTTP ${response.status}`);
        continue;
      }

      const text = await response.text();
      if (!text || text.length === 0) {
        // Empty 200 response = app not available on this region, try next
        errors.push(`${new URL(base).hostname}: empty response`);
        continue;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        errors.push(`${new URL(base).hostname}: invalid JSON`);
        continue;
      }

      // Not-found responses have no pkgName/name fields
      if (!data || (!data.pkgName && !data.name)) {
        errors.push(`${new URL(base).hostname}: app not found`);
        continue;
      }

      console.log(`[${packageName}] AppGallery (${new URL(base).hostname}): Got "${data.name}" v${data.version}`);
      return mapAppGalleryData(data, packageName);
    } catch (error) {
      errors.push(`${new URL(base).hostname}: ${error.message}`);
      continue;
    }
  }

  throw new Error(`AppGallery failed - ${errors.join('; ')}`);
}

/**
 * Main scraping function - tries ALL methods to get version
 * Order: Library -> Device Simulation -> Desktop -> APKMirror -> APKCombo -> Uptodown -> Multi-Country -> AppGallery
 * Now includes debug_steps to track which methods succeeded/failed
 */
async function scrapeApp(packageName, source = 'both') {
  // === HUAWEI APPGALLERY SOURCE ONLY ===
  if (source === 'huawei-appgallery') {
    const debug_steps = {};
    console.log(`\n========== Starting AppGallery scrape for ${packageName} ==========`);
    try {
      const result = await scrapeWithAppGallery(packageName);
      debug_steps.appgallery = `Success: ${result.version}`;
      console.log(`[AppGallery] Final result for ${packageName}: version=${result.version}\n`);
      return {
        ...result,
        huaweiAppGallery: {
          version: result.version,
          appName: result.appName,
          publisherName: result.publisherName,
          category: result.category,
          appGalleryAppId: result.appGalleryAppId,
          appGalleryUrl: result.appGalleryUrl,
          downloadCount: result.downloadCount,
        },
        debug_steps,
      };
    } catch (error) {
      debug_steps.appgallery = `Failed: ${error.message}`;
      console.log(`[AppGallery] Failed for ${packageName}: ${error.message}\n`);
      return {
        packageName,
        appName: '',
        publisherName: '',
        category: '',
        version: '',
        source: 'huawei-appgallery',
        error: error.message,
        debug_steps,
      };
    }
  }

  // === SCRAPE BOTH SOURCES (Play Store + Huawei AppGallery) ===
  if (source === 'both') {
    const [playSettled, agSettled] = await Promise.allSettled([
      scrapePlayStore(packageName),
      scrapeWithAppGallery(packageName),
    ]);

    const debug_steps = {};
    const play = playSettled.status === 'fulfilled' ? playSettled.value : null;
    const ag = agSettled.status === 'fulfilled' ? agSettled.value : null;

    if (play) {
      debug_steps.playstore = play.error
        ? `Failed: ${play.error}`
        : `Success: ${play.version}`;
    } else {
      debug_steps.playstore = `Failed: ${playSettled.reason?.message || 'unknown error'}`;
    }
    if (ag) {
      debug_steps.appgallery = `Success: ${ag.version}`;
    } else {
      debug_steps.appgallery = `Failed: ${agSettled.reason?.message || 'unknown error'}`;
    }

    // Primary data from Play Store; fall back to AppGallery if Play failed
    const primary = play && !play.error ? play : ag ? {
      packageName,
      appName: ag.appName,
      publisherName: ag.publisherName,
      category: ag.category,
      version: ag.version,
    } : {
      packageName,
      appName: '',
      publisherName: '',
      category: '',
      version: '',
      error: play?.error || 'Both Google Play and Huawei AppGallery scraping failed',
    };

    const merged = {
      ...primary,
      googlePlay: play && !play.error
        ? { version: play.version, appName: play.appName, publisherName: play.publisherName, category: play.category, source: play.source || 'GooglePlayScraper', playStoreUrl: `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageName)}` }
        : { error: play?.error || playSettled.reason?.message || 'Not available' },
      huaweiAppGallery: ag
        ? {
            version: ag.version,
            appName: ag.appName,
            publisherName: ag.publisherName,
            category: ag.category,
            appGalleryAppId: ag.appGalleryAppId,
            appGalleryUrl: ag.appGalleryUrl,
            downloadCount: ag.downloadCount,
          }
        : { error: agSettled.reason?.message || 'Not available' },
      debug_steps,
    };

    console.log(`========== Both-sources result for ${packageName}: Play=${merged.googlePlay.version || 'fail'}, AppGallery=${merged.huaweiAppGallery.version || 'fail'} ==========\n`);
    return merged;
  }

  // === GOOGLE PLAY ONLY (default pipeline) ===
  const play = await scrapePlayStore(packageName);
  if (!play.error) {
    play.playStoreUrl = `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageName)}`;
    play.googlePlay = {
      version: play.version,
      appName: play.appName,
      publisherName: play.publisherName,
      category: play.category,
      source: play.source || 'GooglePlayScraper',
      playStoreUrl: play.playStoreUrl,
    };
  }
  return play;
}

/**
 * Google Play scraping pipeline (sequential fallback chain):
 *   1. google-play-scraper library
 *   2. Play Store device simulation
 *   3. Play Store desktop fetch
 *   4. Aptoide API          (NEW - JSON, stable)
 *   5. AppBrain             (NEW - og:app_version meta)
 *   6. Uptodown search      (NEW)
 *   7. APKMirror search     (fixed - appRowVersion)
 *   8. APKCombo search      (fixed - version badge)
 *   9. GitHub Releases      (NEW - open-source mapping)
 *  10. Multi-country library retry
 *
 * Stops as soon as a real version (not "Varies with device") is found.
 * Every step logs: [packageName] MethodName: Status - detail
 * The winning method is reported in the `source` field of the result.
 */
async function scrapePlayStore(packageName) {
  let finalResult = null;
  let lastError = null;
  const debug_steps = {};

  const hasVersion = () => !!(finalResult && finalResult.version && finalResult.version !== 'Varies with device');

  // Adopt a fallback's version into the result (keeping richer metadata we may already have)
  const adopt = (r, sourceName) => {
    if (!finalResult) {
      finalResult = { ...r, source: sourceName };
    } else {
      finalResult.version = r.version;
      finalResult.source = sourceName;
      if (finalResult.appName === 'Unknown' && r.appName && r.appName !== 'Unknown') finalResult.appName = r.appName;
      if (finalResult.publisherName === 'Not found' && r.publisherName && r.publisherName !== 'Not found') finalResult.publisherName = r.publisherName;
      if (finalResult.category === 'Not found' && r.category && r.category !== 'Not found') finalResult.category = r.category;
    }
  };

  const attempt = async (stepKey, methodName, fn) => {
    await randomDelay(200, 600);
    try {
      const r = await fn();
      if (r && r.version && r.version !== 'Varies with device') {
        console.log(`[${packageName}] ${methodName}: Success - Got version ${r.version}`);
        debug_steps[stepKey] = `Success: ${r.version}`;
        adopt(r, methodName);
        return true;
      }
      console.log(`[${packageName}] ${methodName}: Failed - No usable version (Varies with device)`);
      debug_steps[stepKey] = 'Failed: Varies with device';
      if (!finalResult && r) finalResult = { ...r, source: methodName };
      return false;
    } catch (error) {
      console.log(`[${packageName}] ${methodName}: Failed - ${error.message}`);
      debug_steps[stepKey] = `Failed: ${error.message}`;
      lastError = error;
      return false;
    }
  };

  console.log(`\n========== Starting scrape for ${packageName} ==========`);

  // === STEP 1: google-play-scraper library ===
  try {
    const r = await scrapeWithLibrary(packageName);
    if (r.version && r.version !== 'Varies with device') {
      console.log(`[${packageName}] GooglePlayScraper: Success - Got version ${r.version}`);
      debug_steps.library = `Success: ${r.version}`;
      adopt(r, 'GooglePlayScraper');
    } else {
      console.log(`[${packageName}] GooglePlayScraper: Failed - Varies with device`);
      debug_steps.library = 'Varies';
      finalResult = { ...r, source: 'GooglePlayScraper' };
    }
  } catch (error) {
    console.log(`[${packageName}] GooglePlayScraper: Failed - ${error.message}`);
    debug_steps.library = `Failed: ${error.message}`;
    lastError = error;
  }

  // === STEP 2: Device Simulation ===
  if (!hasVersion()) {
    try {
      const r = await scrapeWithDeviceSimulation(packageName);
      if (r.version !== 'Varies with device') {
        console.log(`[${packageName}] DeviceSimulation: Success - Got version ${r.version}`);
        debug_steps.device = `Success: ${r.version}`;
        adopt(r, 'DeviceSimulation');
      } else {
        console.log(`[${packageName}] DeviceSimulation: Failed - Varies with device`);
        debug_steps.device = 'Varies';
        if (!finalResult) finalResult = { ...r, source: 'DeviceSimulation' };
      }
    } catch (error) {
      console.log(`[${packageName}] DeviceSimulation: Failed - ${error.message}`);
      debug_steps.device = `Failed: ${error.message}`;
      lastError = error;
    }
  }

  // === STEP 3: Desktop fetch ===
  if (!hasVersion()) {
    try {
      const r = await scrapeWithDesktop(packageName);
      if (r.version !== 'Varies with device') {
        console.log(`[${packageName}] PlayStoreDesktop: Success - Got version ${r.version}`);
        debug_steps.desktop = `Success: ${r.version}`;
        adopt(r, 'PlayStoreDesktop');
      } else {
        console.log(`[${packageName}] PlayStoreDesktop: Failed - Varies with device`);
        debug_steps.desktop = 'Varies';
        if (!finalResult) finalResult = { ...r, source: 'PlayStoreDesktop' };
      }
    } catch (error) {
      console.log(`[${packageName}] PlayStoreDesktop: Failed - ${error.message}`);
      debug_steps.desktop = `Failed: ${error.message}`;
      lastError = error;
    }
  }

  // From here on, every external site gets a polite random delay between requests.
  // Stop the chain immediately once we have a concrete version.

  // === STEP 4: Aptoide API ===
  if (!hasVersion()) await attempt('aptoide', 'Aptoide', () => scrapeFromAptoide(packageName));

  // === STEP 5: AppBrain ===
  if (!hasVersion()) await attempt('appbrain', 'AppBrain', () => scrapeFromAppBrain(packageName, finalResult?.appBrainSlug || ''));

  // === STEP 6: Uptodown ===
  if (!hasVersion()) await attempt('uptodown', 'Uptodown', () => scrapeFromUptodownSearch(packageName));

  // === STEP 7: APKMirror ===
  if (!hasVersion()) await attempt('apkmirror', 'APKMirror', () => scrapeFromAPKMirror(packageName));

  // === STEP 8: APKCombo ===
  if (!hasVersion()) await attempt('apkcombo', 'APKCombo', () => scrapeFromAPKComboSearch(packageName));

  // === STEP 9: GitHub Releases (open-source apps) ===
  if (!hasVersion()) await attempt('github', 'GitHubReleases', () => scrapeFromGithubReleases(packageName));

  // === STEP 10: Different countries via library (last resort) ===
  if (!hasVersion()) await attempt('countries', 'MultiCountry', () => scrapeWithDifferentCountry(packageName));

  console.log(`========== Final result for ${packageName}: version=${finalResult?.version || 'ERROR'} (source=${finalResult?.source || 'none'}) ==========\n`);

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

  const { packageName, source } = req.body;

  if (!packageName || typeof packageName !== 'string') {
    return res.status(400).json({ error: 'packageName is required' });
  }

  const validSources = ['google-play', 'huawei-appgallery', 'both'];
  const requestedSource = typeof source === 'string' && validSources.includes(source)
    ? source
    : 'both'; // Default: scrape both Play Store and Huawei AppGallery

  const result = await scrapeApp(packageName.trim(), requestedSource);

  return res.status(200).json({ result });
}
