/**
 * Vercel Serverless Function - Play Store Scraper
 * Scrapes app info (name, publisher, category) from Google Play Store
 */

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parsePlayStoreHTML(html, packageName) {
  let appName = '';
  let publisherName = '';
  let category = '';

  // ===== APP NAME =====
  const ogTitleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i) 
    || html.match(/content="([^"]+)"\s+(?:property|name)="og:title"/i);
  if (ogTitleMatch) {
    appName = ogTitleMatch[1]
      .replace(/\s*-\s*Apps on Google Play$/i, '')
      .replace(/\s*-\s*Games on Google Play$/i, '')
      .trim();
  }
  
  if (!appName) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      appName = titleMatch[1]
        .replace(/\s*-\s*Apps on Google Play$/i, '')
        .replace(/\s*-\s*Games on Google Play$/i, '')
        .trim();
    }
  }

  if (!appName) {
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      appName = h1Match[1].trim();
    }
  }

  // ===== PUBLISHER/DEVELOPER NAME =====
  const devLinkMatch = html.match(/<a[^>]+href="\/store\/apps\/developer\?id=[^"]*"[^>]*>([^<]+)<\/a>/i);
  if (devLinkMatch) {
    publisherName = devLinkMatch[1].trim();
  }

  if (!publisherName) {
    const devNameMatch = html.match(/"developer_name"\s*:\s*"([^"]+)"/);
    if (devNameMatch) {
      publisherName = devNameMatch[1];
    }
  }

  if (!publisherName) {
    const devMatch2 = html.match(/developer\?id=[^"]*"[^>]*>([^<]{2,})</);
    if (devMatch2) {
      publisherName = devMatch2[1].trim();
    }
  }

  // ===== CATEGORY =====
  const catLinkMatch = html.match(/\/store\/apps\/category\/[A-Z_]+"[^>]*>([^<]+)</i);
  if (catLinkMatch) {
    category = catLinkMatch[1].trim();
  }

  if (!category) {
    const catMatch = html.match(/"category"\s*:\s*"([^"]+)"/);
    if (catMatch) {
      category = catMatch[1];
    }
  }

  if (!category) {
    const catLabelMatch = html.match(/"category_label"\s*:\s*"([^"]+)"/);
    if (catLabelMatch) {
      category = catLabelMatch[1];
    }
  }

  if (!category) {
    const catUrlMatch = html.match(/\/store\/apps\/category\/([A-Z_]+)/);
    if (catUrlMatch) {
      category = catUrlMatch[1].replace(/_/g, ' ');
    }
  }

  return {
    packageName,
    appName: appName || 'Unknown',
    publisherName: publisherName || 'Not found',
    category: category || 'Not found',
  };
}

async function scrapePlayStore(packageName) {
  const url = `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageName)}&hl=en&gl=us`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          packageName,
          appName: '',
          publisherName: '',
          category: '',
          error: 'App not found (404)',
        };
      }
      return {
        packageName,
        appName: '',
        publisherName: '',
        category: '',
        error: `HTTP ${response.status}`,
      };
    }

    const html = await response.text();
    return parsePlayStoreHTML(html, packageName);
  } catch (error) {
    return {
      packageName,
      appName: '',
      publisherName: '',
      category: '',
      error: error.message || 'Unknown error',
    };
  }
}

module.exports = async function handler(req, res) {
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

  const { packageNames } = req.body;

  if (!packageNames || !Array.isArray(packageNames)) {
    return res.status(400).json({ error: 'packageNames array is required' });
  }

  if (packageNames.length > 50) {
    return res.status(400).json({ error: 'Maximum 50 packages per request' });
  }

  const results = [];

  for (let i = 0; i < packageNames.length; i++) {
    const packageName = packageNames[i];
    if (!packageName || typeof packageName !== 'string') continue;
    
    const result = await scrapePlayStore(packageName.trim());
    results.push(result);
    
    // Delay between requests to avoid rate limiting
    if (i < packageNames.length - 1) {
      await delay(1500);
    }
  }

  return res.status(200).json({ results });
};
