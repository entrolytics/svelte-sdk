<div align="center">
  <img src="https://raw.githubusercontent.com/entrolytics/.github/main/media/entrov2.png" alt="Entrolytics" width="64" height="64">

  [![npm](https://img.shields.io/npm/v/@entrolytics/svelte-sdk.svg?logo=npm)](https://www.npmjs.com/package/@entrolytics/svelte-sdk)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Svelte](https://img.shields.io/badge/Svelte-5+-FF3E00.svg?logo=svelte&logoColor=white)](https://svelte.dev/)

</div>

---

## Overview

**@entrolytics/svelte-sdk** is the official SvelteKit SDK for Entrolytics - first-party growth analytics for the edge. Add powerful analytics to your Svelte 5 and SvelteKit applications with minimal configuration.

**Why use this SDK?**
- Zero-config setup with automatic environment detection
- Svelte actions for declarative click tracking
- Svelte stores for reactive state management
- Edge-optimized with sub-50ms response times globally

## Key Features

<table>
<tr>
<td width="50%">

### Analytics
- Automatic page view tracking
- Custom event tracking
- User identification
- SvelteKit navigation support

</td>
<td width="50%">

### Developer Experience
- `use:trackClick` Svelte action
- `$isLoaded` reactive store
- SvelteKit `$page` store integration
- Full TypeScript support

</td>
</tr>
</table>

## Quick Start

<table>
<tr>
<td align="center" width="25%">
<img src="https://api.iconify.design/lucide:download.svg?color=%236366f1" width="48"><br>
<strong>1. Install</strong><br>
<code>npm i @entrolytics/svelte-sdk</code>
</td>
<td align="center" width="25%">
<img src="https://api.iconify.design/lucide:code.svg?color=%236366f1" width="48"><br>
<strong>2. Initialize</strong><br>
<code>initEntrolytics()</code>
</td>
<td align="center" width="25%">
<img src="https://api.iconify.design/lucide:settings.svg?color=%236366f1" width="48"><br>
<strong>3. Configure</strong><br>
Set Website ID in <code>.env</code>
</td>
<td align="center" width="25%">
<img src="https://api.iconify.design/lucide:bar-chart-3.svg?color=%236366f1" width="48"><br>
<strong>4. Track</strong><br>
View analytics in dashboard
</td>
</tr>
</table>

## Installation

```bash
npm install @entrolytics/svelte-sdk
# or
pnpm add @entrolytics/svelte-sdk
```

```svelte
<!-- +layout.svelte -->
<script>
  import { initEntrolytics } from '@entrolytics/svelte-sdk';

  // Zero-config: automatically reads from .env
  initEntrolytics();
</script>

<slot />
```

Add to your `.env` file:

```bash
VITE_ENTROLYTICS_NG_WEBSITE_ID=your-website-id
VITE_ENTROLYTICS_HOST=https://ng.entrolytics.click

# Or for SvelteKit static
PUBLIC_ENTROLYTICS_NG_WEBSITE_ID=your-website-id
PUBLIC_ENTROLYTICS_HOST=https://ng.entrolytics.click
```

## Configuration Options

### Zero-Config (Recommended)

```svelte
<script>
  initEntrolytics(); // Reads from env
</script>
```

### Explicit Configuration

```ts
initEntrolytics({
  // Required: Your Entrolytics website ID
  websiteId: 'your-website-id',

  // Optional: Custom host (for self-hosted)
  host: 'https://ng.entrolytics.click',

  // Optional: Auto-track page views (default: true)
  autoTrack: true,

  // Optional: Use edge-optimized endpoints (default: true)
  useEdgeRuntime: true,

  // Optional: Respect Do Not Track (default: false)
  respectDnt: false,

  // Optional: Cross-domain tracking
  domains: ['example.com', 'blog.example.com'],
});
```

### Runtime Configuration

The `useEdgeRuntime` option controls which collection endpoint is used:

**Edge Runtime (default)** - Optimized for speed and global distribution:

```ts
initEntrolytics({
  websiteId: 'your-website-id',
  useEdgeRuntime: true // or omit (default)
});
```

- **Latency**: Sub-50ms response times globally
- **Best for**: Production Svelte/SvelteKit apps, globally distributed users
- **Endpoint**: Uses `/api/send-native` for edge-to-edge communication
- **Limitations**: No ClickHouse export, basic geo data

**Node.js Runtime** - Full-featured with advanced capabilities:

```ts
initEntrolytics({
  websiteId: 'your-website-id',
  useEdgeRuntime: false
});
```

- **Features**: ClickHouse export, MaxMind GeoIP (city-level accuracy)
- **Best for**: Self-hosted deployments, advanced analytics requirements
- **Endpoint**: Uses `/api/send` for Node.js runtime
- **Latency**: 50-150ms (regional)

**When to use Node.js runtime**:
- Self-hosted Svelte/SvelteKit deployments without edge runtime support
- Applications requiring ClickHouse data export
- Need for advanced geo-targeting with MaxMind
- Custom server-side analytics workflows

## Tracking Events

### trackEvent

```svelte
<script>
  import { trackEvent } from '@entrolytics/svelte';

  function handlePurchase() {
    trackEvent('purchase', {
      revenue: 99.99,
      currency: 'USD'
    });
  }
</script>

<button on:click={handlePurchase}>Buy Now</button>
```

### trackClick Action

Use the Svelte action for declarative click tracking:

```svelte
<script>
  import { trackClick } from '@entrolytics/svelte';
</script>

<button use:trackClick={{ event: 'cta_click', data: { variant: 'hero' } }}>
  Get Started
</button>
```

## Page View Tracking

### Automatic (with SvelteKit)

```svelte
<!-- +layout.svelte -->
<script>
  import { page } from '$app/stores';
  import { initEntrolytics, usePageView } from '@entrolytics/svelte';

  initEntrolytics({ websiteId: 'your-website-id' });
  usePageView(page);
</script>

<slot />
```

### Manual

```svelte
<script>
  import { trackPageView } from '@entrolytics/svelte';

  // Track current page
  trackPageView();

  // Track specific URL
  trackPageView('/custom-path', 'https://referrer.com');
</script>
```

## User Identification

```svelte
<script>
  import { identify } from '@entrolytics/svelte';

  // When user logs in
  function handleLogin(user) {
    identify(user.id, {
      email: user.email,
      plan: user.subscription
    });
  }
</script>
```

## Stores

### isLoaded

Check if the tracking script is loaded:

```svelte
<script>
  import { isLoaded } from '@entrolytics/svelte';
</script>

{#if $isLoaded}
  <p>Analytics loaded!</p>
{/if}
```

## TypeScript

Full TypeScript support with exported types:

```ts
import type { EntrolyticsOptions } from '@entrolytics/svelte';
```

## License

MIT License - see [LICENSE](LICENSE) file for details.
