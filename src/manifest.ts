import { defineManifest } from '@crxjs/vite-plugin';
import pkg from '../package.json';

// Muninn Manifest V3.
// Every permission below is the minimum required for a stated feature and is
// justified inline. Notably absent: <all_urls>, broad "tabs", analytics hosts,
// and any remote-config endpoint. Muninn is fully client-side.
export default defineManifest({
  manifest_version: 3,
  name: 'Muninn',
  version: pkg.version,
  description:
    "Memory for your AI chats — save reusable context cards and upgrade rough prompts. Fully client-side.",
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Muninn',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
    },
  },
  options_page: 'src/options/index.html',
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  permissions: [
    // "storage": persist cards, settings, and the locally-stored API key in
    // chrome.storage.local (never sync). This is Muninn's only data store.
    'storage',
    // "activeTab": lets the popup act on the tab the user is currently looking
    // at when they choose to inject/insert — granted transiently on click.
    'activeTab',
    // "scripting": insert text into the active tab's input when the user clicks
    // "insert into page" from the popup / upgrade view.
    'scripting',
  ],
  // Host permissions are limited to exactly the four supported AI sites. The
  // content script (launcher + capture) only ever runs on these origins.
  host_permissions: [
    'https://claude.ai/*',
    'https://chatgpt.com/*',
    'https://chat.openai.com/*',
    'https://gemini.google.com/*',
  ],
  // Provider API endpoints are NOT requested up front. They are requested at
  // runtime via chrome.permissions.request only if the user enables BYOK and
  // saves a key. A user who never uses BYOK never grants these.
  optional_host_permissions: [
    'https://api.anthropic.com/*',
    'https://api.openai.com/*',
  ],
  content_scripts: [
    {
      // Launcher + explicit capture, injected only on the four AI sites.
      matches: [
        'https://claude.ai/*',
        'https://chatgpt.com/*',
        'https://chat.openai.com/*',
        'https://gemini.google.com/*',
      ],
      js: ['src/content/main.tsx'],
      run_at: 'document_idle',
    },
  ],
});
