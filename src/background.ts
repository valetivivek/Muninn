// Minimal MV3 service worker. Muninn has no backend and does no background
// work beyond running storage migrations when the extension is installed or
// updated. It makes no network calls.

import { runMigrations } from './lib/storage';

chrome.runtime.onInstalled.addListener(() => {
  void runMigrations();
});
