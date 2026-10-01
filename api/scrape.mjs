import gplay from 'google-play-scraper';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeApp(packageName) {
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
    console.error(`Error scraping ${packageName}:`, error.message);
    return {
      packageName: packageName,
      appName: '',
      publisherName: '',
      category: '',
      error: error.message || 'Unknown error',
    };
  }
}

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
    
    const result = await scrapeApp(packageName.trim());
    results.push(result);
    
    // Delay between requests to avoid rate limiting
    if (i < packageNames.length - 1) {
      await delay(1500);
    }
  }

  return res.status(200).json({ results });
}
