export interface SourceInfo {
  version?: string;
  appName?: string;
  publisherName?: string;
  category?: string;
  appGalleryAppId?: string;
  appGalleryUrl?: string;
  playStoreUrl?: string;
  downloadCount?: string | number;
  /** Winning scraping method, e.g. 'GooglePlayScraper', 'Uptodown', 'Aptoide' */
  source?: string;
  error?: string;
}

export interface AppInfo {
  packageName: string;
  appName: string;
  publisherName: string;
  category: string;
  version: string;
  source?: string;
  error?: string;
  googlePlay?: SourceInfo;
  huaweiAppGallery?: SourceInfo;
  debug_steps?: Record<string, string>;
}
