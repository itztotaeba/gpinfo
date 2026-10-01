import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';

interface AppInfo {
  packageName: string;
  appName: string;
  publisherName: string;
  category: string;
  error?: string;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapePlayStore(packageName: string): Promise<AppInfo> {
  const url = `https://play.google.com/store/apps/details?id=${encodeURIComponent(packageName)}&hl=en&gl=us`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
      },
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
    const $ = cheerio.load(html);

    let appName = '';
    let publisherName = '';
    let category = '';

    // ===== APP NAME =====
    // Method 1: og:title meta
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    if (ogTitle) {
      appName = ogTitle.replace(/\s*-\s*Apps on Google Play$/i, '').replace(/\s*-\s*Games on Google Play$/i, '').trim();
    }
    // Method 2: h1 element
    if (!appName) {
      appName = $('h1').first().text().trim();
    }
    // Method 3: title tag
    if (!appName) {
      const titleText = $('title').text();
      appName = titleText.replace(/\s*-\s*Apps on Google Play$/i, '').replace(/\s*-\s*Games on Google Play$/i, '').trim();
    }

    // ===== PUBLISHER/DEVELOPER NAME =====
    // Method 1: Developer link in page
    const devLinks = $('a[href*="/store/apps/developer"]');
    if (devLinks.length > 0) {
      publisherName = devLinks.first().text().trim();
    }
    
    // Method 2: Look for developer name in various selectors
    if (!publisherName) {
      const devSelectors = [
        'a.Vbfug.auoIOc',
        'a[href*="developer?id="]',
        '.Vbfug a',
        '[itemprop="author"] [itemprop="name"]',
        '[itemprop="author"]',
      ];
      for (const selector of devSelectors) {
        const el = $(selector).first();
        if (el.length && el.text().trim()) {
          publisherName = el.text().trim();
          break;
        }
      }
    }

    // Method 3: Extract from script data
    if (!publisherName) {
      const allScripts = $('script').toArray();
      for (const script of allScripts) {
        const content = $(script).html() || '';
        
        // Pattern: "developer_name":"..."
        const devMatch1 = content.match(/"developer_name"\s*:\s*"([^"]+)"/);
        if (devMatch1) {
          publisherName = devMatch1[1];
          break;
        }
        
        // Pattern: developer URL with name
        const devMatch2 = content.match(/\/store\/apps\/developer\?id=[^"]*"[^>]*>([^<]+)</);
        if (devMatch2) {
          publisherName = devMatch2[1].trim();
          break;
        }
      }
    }

    // Method 4: Regex on full HTML
    if (!publisherName) {
      const htmlDevMatch = html.match(/<a[^>]+href="\/store\/apps\/developer\?id=[^"]*"[^>]*>([^<]+)<\/a>/);
      if (htmlDevMatch) {
        publisherName = htmlDevMatch[1].trim();
      }
    }

    // ===== CATEGORY =====
    // Method 1: Category link
    const catLinks = $('a[href*="/store/apps/category/"]');
    if (catLinks.length > 0) {
      category = catLinks.first().text().trim();
    }

    // Method 2: From script data
    if (!category) {
      const allScripts = $('script').toArray();
      for (const script of allScripts) {
        const content = $(script).html() || '';
        
        // Pattern: "category":"..."
        const catMatch1 = content.match(/"category"\s*:\s*"([^"]+)"/);
        if (catMatch1) {
          category = catMatch1[1];
          break;
        }
        
        // Pattern: "category_label":"..."
        const catMatch2 = content.match(/"category_label"\s*:\s*"([^"]+)"/);
        if (catMatch2) {
          category = catMatch2[1];
          break;
        }
      }
    }

    // Method 3: From URL pattern in HTML
    if (!category) {
      const catUrlMatch = html.match(/\/store\/apps\/category\/([A-Z_]+)/);
      if (catUrlMatch) {
        category = catUrlMatch[1].replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
    }

    // Method 4: Look for category in breadcrumb or specific elements
    if (!category) {
      const breadcrumbCat = $('nav[aria-label="Breadcrumb"] a, [class*="breadcrumb"] a').filter('[href*="/category/"]');
      if (breadcrumbCat.length > 0) {
        category = breadcrumbCat.last().text().trim();
      }
    }

    return {
      packageName,
      appName: appName || 'Unknown',
      publisherName: publisherName || 'Not found',
      category: category || 'Not found',
    };
  } catch (error: any) {
    return {
      packageName,
      appName: '',
      publisherName: '',
      category: '',
      error: error.message || 'Unknown error',
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const { packageNames } = req.body as { packageNames: string[] };

  if (!packageNames || !Array.isArray(packageNames)) {
    return res.status(400).json({ error: 'packageNames array is required' });
  }

  if (packageNames.length > 50) {
    return res.status(400).json({ error: 'Maximum 50 packages per request' });
  }

  const results: AppInfo[] = [];

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

  res.status(200).json({ results });
}
