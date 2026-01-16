# Agent Knowledge Base for Ember Native

This document contains important information for AI agents working on the Ember Native project.

## Project Overview

Ember Native is a framework that enables running Ember.js applications on NativeScript, allowing developers to build native mobile apps using Ember.

## WarpDrive (Ember Data v5) Integration

### Official Documentation
- **Main Docs**: https://warp-drive.io/
- **Guides**: https://warp-drive.io/guides/
- **Migration Guide**: https://raw.githubusercontent.com/warp-drive-data/warp-drive/refs/heads/main/guides/migrating/index.md
- **Requests Guide**: https://warp-drive.io/guides/the-manual/requests
- **Signals/Reactivity**: https://github.com/warp-drive-data/warp-drive/blob/main/guides/the-manual/misc/reactivity/signals.md

read https://warp-drive.io/llms-full.txt to work with warp-drive!!!

### Key Concepts

#### Modern WarpDrive (v5) - No Legacy Support
```typescript
// Store Configuration
import { useRecommendedStore } from '@warp-drive/core';
import { JSONAPICache } from '@warp-drive/json-api';

export default class StoreService extends useRecommendedStore({
  cache: JSONAPICache,
  schemas: [UserSchema],
}) {}
```

#### Schema Definition
```typescript
import { Type } from '@warp-drive/core-types/symbols';

export interface User {
  [Type]: 'user';
  id: string | null;
  name: string;
  email: string;
}

export const UserSchema = {
  type: 'user',
  identity: { name: 'id', kind: '@id' },  // Required!
  fields: [
    { name: 'name', kind: 'attribute', type: null },
    { name: 'email', kind: 'attribute', type: null },
  ],
} as const;
```

**Important**: The `identity` field is required in WarpDrive v5 schemas.

#### Using store.request() (Recommended)
```typescript
// Instead of fetch() + store.push()
const { content } = await this.store.request<{ data: User[] }>({
  url: 'https://api.example.com/users',
  method: 'GET',
  cacheOptions: {
    reload: false,           // Use cache if available
    backgroundReload: true,  // Refresh in background
    types: ['user']
  }
});

// Data is automatically cached
this.users = content.data;
```

### Signal Hooks Configuration (Ember Octane)

WarpDrive requires signal hooks for reactivity. Configure in `app/configure-signals.ts`:

```typescript
import { tagForProperty } from '@ember/-internals/metal';
import { _backburner } from '@ember/runloop';
import { consumeTag, createCache, dirtyTag, getValue } from '@glimmer/validator';
import { setupSignals } from '@warp-drive/core/configure';
import type { SignalHooks } from '@warp-drive/core/configure';

type Tag = ReturnType<typeof tagForProperty>;
const emberDirtyTag = dirtyTag as unknown as (tag: Tag) => void;

export function buildSignalConfig(): SignalHooks {
  return {
    createSignal(obj: object, key: string | symbol): Tag {
      return tagForProperty(obj, key);
    },
    
    consumeSignal(signal: Tag) {
      consumeTag(signal);
    },
    
    notifySignal(signal: Tag) {
      emberDirtyTag(signal);
    },
    
    createMemo: <F>(object: object, key: string | symbol, fn: () => F): (() => F) => {
      const memo = createCache(fn);
      return () => getValue(memo);
    },
    
    willSyncFlushWatchers: () => {
      return !!_backburner.currentInstance && _backburner._autorun !== true;
    }
  } satisfies SignalHooks;
}

setupSignals(buildSignalConfig);
```

Import in `app/app.js`:
```javascript
import './configure-signals';
```

## NativeScript Environment Polyfills

NativeScript lacks many Web APIs. Add these polyfills in `ember-native/src/setup.ts`:

### Required Polyfills
1. **queueMicrotask** - Microtask scheduling
2. **EventTarget** - Event handling
3. **AbortController/AbortSignal** - Request cancellation
4. **ReadableStream** - Stream reading
5. **WritableStream** - Stream writing
6. **TransformStream** - Stream transformation

Example implementation:
```typescript
// queueMicrotask
if (typeof globalThis.queueMicrotask === 'undefined') {
  globalThis.queueMicrotask = (callback: () => void) => {
    Promise.resolve().then(callback).catch(err => {
      setTimeout(() => { throw err; }, 0);
    });
  };
}

// EventTarget
if (typeof globalThis.EventTarget === 'undefined') {
  class EventTarget {
    private _listeners: Map<string, Set<Function>> = new Map();
    
    addEventListener(type: string, listener: Function) {
      if (!this._listeners.has(type)) {
        this._listeners.set(type, new Set());
      }
      this._listeners.get(type)!.add(listener);
    }
    
    removeEventListener(type: string, listener: Function) {
      const listeners = this._listeners.get(type);
      if (listeners) {
        listeners.delete(listener);
      }
    }
    
    dispatchEvent(event: any) {
      const listeners = this._listeners.get(event.type);
      if (listeners) {
        listeners.forEach(listener => listener(event));
      }
      return true;
    }
  }
  
  globalThis.EventTarget = EventTarget as any;
}
```

## Common Issues & Solutions

### CSS Import Errors
**Problem**: `Failed to find '~@nativescript/theme/css/core.css'`

**Solution**: 
1. Remove `~` prefix from imports in SCSS files
2. Create `postcss.config.js` with custom resolver:
```javascript
module.exports = {
  plugins: {
    'postcss-import': {
      resolve: (id, basedir) => {
        if (id.startsWith('@nativescript/theme/')) {
          const path = require('path');
          const themePath = path.dirname(require.resolve('@nativescript/theme/package.json'));
          return path.join(themePath, id.replace('@nativescript/theme/', ''));
        }
        return id;
      }
    }
  }
};
```

### Babel/Embroider Macros Error
**Problem**: `Cannot read properties of undefined (reading 'env')`

**Solution**: Add `env` property to babel config:
```javascript
const warpDriveMacros = babelPlugin({
  compatWith: '5.6',
  env: {
    DEBUG: process.env.DEBUG || false,
  },
});
```

### TypeScript Schema Errors
**Problem**: `Type 'LegacyResourceSchema' is not assignable`

**Solution**: Use modern WarpDrive schemas without legacy support (see Schema Definition above).

## Development Workflow

### Running the Demo App
```bash
cd demo-app
pnpm run run  # Runs on Android
```

### Building Ember Native Package
```bash
cd ember-native
pnpm build
```

### Testing Changes
The demo-app links to the local ember-native package, so changes are reflected immediately after rebuilding.

## Project Structure

```
ember-native/
├── ember-native/          # Main package
│   ├── src/              # Source code
│   │   ├── setup.ts      # Polyfills and environment setup
│   │   ├── components/   # Ember components
│   │   └── dom/          # DOM implementation
│   └── dist/             # Built package
├── demo-app/             # Demo application
│   ├── app/              # Ember app code
│   │   ├── routes/       # Route components
│   │   ├── schemas/      # WarpDrive schemas
│   │   └── services/     # Ember services
│   └── sample-data/      # Sample JSON data
└── docs-app/             # Documentation site
```

## Best Practices

1. **Always use absolute paths** in tool calls
2. **Use `store.request()`** instead of `fetch()` + `store.push()`
3. **Include `identity` field** in all WarpDrive schemas
4. **Configure signal hooks** before app initialization
5. **Add polyfills** for missing Web APIs in setup.ts
6. **Use modern WarpDrive (v5)** without legacy dependencies
7. **Test in NativeScript environment** as Web APIs differ significantly

## Useful Commands

```bash
# Install dependencies
pnpm install

# Run demo app
cd demo-app && pnpm run run

# Build ember-native
cd ember-native && pnpm build

# Run tests
cd demo-app && pnpm test

# Lint code
pnpm lint
```

## Additional Resources

- **Ember.js Docs**: https://guides.emberjs.com/
- **NativeScript Docs**: https://docs.nativescript.org/
- **Glimmer Components**: https://guides.emberjs.com/release/components/
- **TypeScript**: https://www.typescriptlang.org/docs/

## Notes for AI Agents

- This project combines Ember.js with NativeScript, requiring knowledge of both ecosystems
- WarpDrive (Ember Data v5) is significantly different from older versions
- NativeScript environment requires extensive polyfills for Web APIs
- Always check official WarpDrive documentation for latest patterns
- The demo-app serves as a reference implementation
