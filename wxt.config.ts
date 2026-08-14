import { defineConfig } from 'wxt';
import path from 'path';

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite: () => ({
    resolve: {
      alias: {
        '@writefix/core': path.resolve(__dirname, './packages/core/src/index.ts')
      }
    }
  }),
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'WriteFix AI',
    description: 'Instantly improve selected text anywhere on the web',
    version: '1.0.0',
    icons: {
      '16': 'icon-16.png',
      '32': 'icon-32.png',
      '48': 'icon-48.png',
      '128': 'icon-128.png'
    },
    action: {
      default_icon: {
        '16': 'icon-16.png',
        '32': 'icon-32.png',
        '48': 'icon-48.png',
        '128': 'icon-128.png'
      },
      default_title: 'WriteFix AI'
    },
    permissions: [
      'activeTab',
      'storage',
      'contextMenus',
      'commands',
      'scripting'
    ],
    host_permissions: [
      'https://api.languagetool.org/*',
      'https://generativelanguage.googleapis.com/*',
      'https://api.groq.com/*',
      'https://openrouter.ai/*',
      'https://api.openai.com/*',
      'https://api.anthropic.com/*'
    ],
    commands: {
      'improve-writing': {
        suggested_key: {
          default: 'Ctrl+Shift+G',
          mac: 'Command+Shift+G'
        },
        description: 'Improve selected text'
      }
    }
  }
});
