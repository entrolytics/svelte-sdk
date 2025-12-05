# @entrolytics/svelte

SvelteKit integration for [Entrolytics](https://ng.entrolytics.click) - First-party growth analytics for the edge.

## Installation

```bash
npm install @entrolytics/svelte
# or
pnpm add @entrolytics/svelte
```

## Quick Start

```svelte
<!-- +layout.svelte -->
<script>
  import { initEntrolytics } from '@entrolytics/svelte';

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
