export interface AppInfo {
  packageName: string;
  appName: string;
  publisherName: string;
  category: string;
  version: string;
  error?: string;
  debug_steps?: Record<string, string>;
}
