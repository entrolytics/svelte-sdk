import { onMount } from 'svelte';
import { get, type Writable, writable } from 'svelte/store';

const DEFAULT_HOST = 'https://ng.entrolytics.click';
const SCRIPT_ID = 'entrolytics-script';

export interface EventData {
  [key: string]: string | number | boolean | EventData | string[] | number[] | EventData[];
}

export interface EntrolyticsOptions {
  websiteId: string;
  host?: string;
  autoTrack?: boolean;
  respectDnt?: boolean;
  domains?: string[];
  /** Use edge runtime endpoints for faster response times (default: true) */
  useEdgeRuntime?: boolean;
  /** Custom tag for A/B testing */
  tag?: string;
  /** Strip query parameters from URLs */
  excludeSearch?: boolean;
  /** Strip hash from URLs */
  excludeHash?: boolean;
  /** Callback before sending data */
  beforeSend?: (type: string, payload: unknown) => unknown | null;
}

declare global {
  interface Window {
    entrolytics?: {
      track: (eventName?: string | object, eventData?: Record<string, unknown>) => void;
      identify: (data: Record<string, unknown>) => void;
    };
  }
}

// Store for tracking if script is loaded
export const isLoaded: Writable<boolean> = writable(false);
export const isReady: Writable<boolean> = writable(false);

let initialized = false;
let currentOptions: EntrolyticsOptions | null = null;
let currentTag: string | undefined;

function waitForTracker(callback: () => void): void {
  if (typeof window === 'undefined') return;

  const tryExecute = () => {
    if (window.entrolytics) {
      callback();
    } else {
      setTimeout(tryExecute, 100);
    }
  };

  tryExecute();
}

/**
 * Initialize Entrolytics tracking
 *
 * Call this in your root +layout.svelte
 *
 * @example
 * Zero-config (reads from env):
 * ```svelte
 * <script>
 *   import { initEntrolytics } from '@entrolytics/svelte';
 *   initEntrolytics();
 * </script>
 * ```
 *
 * @example
 * Explicit config:
 * ```svelte
 * <script>
 *   import { initEntrolytics } from '@entrolytics/svelte';
 *   initEntrolytics({ websiteId: 'your-website-id' });
 * </script>
 * ```
 */
export function initEntrolytics(options: Partial<EntrolyticsOptions> = {}): void {
  if (typeof window === 'undefined') return;
  if (initialized) return;

  // Auto-read from environment variables (SvelteKit)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (import.meta as any).env || {};
  const websiteId =
    options.websiteId || env.VITE_ENTROLYTICS_NG_WEBSITE_ID || env.PUBLIC_ENTROLYTICS_NG_WEBSITE_ID;

  const host = options.host || env.VITE_ENTROLYTICS_HOST || env.PUBLIC_ENTROLYTICS_HOST;

  if (!websiteId) {
    if (env.DEV) {
      console.warn(
        '[@entrolytics/svelte] Missing websiteId. Add VITE_ENTROLYTICS_NG_WEBSITE_ID or PUBLIC_ENTROLYTICS_NG_WEBSITE_ID to your .env file.',
      );
    }
    throw new Error('[@entrolytics/svelte] websiteId is required');
  }

  const finalOptions: EntrolyticsOptions = {
    ...options,
    websiteId,
    host: host || DEFAULT_HOST,
  } as EntrolyticsOptions;

  initialized = true;
  currentOptions = finalOptions;
  currentTag = finalOptions.tag;

  const {
    websiteId: finalWebsiteId,
    host: finalHost = DEFAULT_HOST,
    autoTrack = true,
    respectDnt = false,
    domains,
    useEdgeRuntime = true,
    tag,
    excludeSearch = false,
    excludeHash = false,
  } = finalOptions;

  if (document.getElementById(SCRIPT_ID)) {
    isLoaded.set(true);
    isReady.set(true);
    return;
  }

  const script = document.createElement('script');
  script.id = SCRIPT_ID;

  // Use edge runtime script if enabled
  const scriptPath = useEdgeRuntime ? '/script-edge.js' : '/script.js';
  script.src = `${finalHost.replace(/\/$/, '')}${scriptPath}`;
  script.defer = true;
  script.dataset.websiteId = finalWebsiteId;

  if (!autoTrack) {
    script.dataset.autoTrack = 'false';
  }
  if (respectDnt) {
    script.dataset.doNotTrack = 'true';
  }
  if (domains && domains.length > 0) {
    script.dataset.domains = domains.join(',');
  }
  if (tag) {
    script.dataset.tag = tag;
  }
  if (excludeSearch) {
    script.dataset.excludeSearch = 'true';
  }
  if (excludeHash) {
    script.dataset.excludeHash = 'true';
  }

  script.onload = () => {
    isLoaded.set(true);
    isReady.set(true);
  };

  document.head.appendChild(script);
}

/**
 * Track a custom event
 *
 * @example
 * ```svelte
 * <script>
 *   import { trackEvent } from '@entrolytics/svelte';
 *
 *   function handleClick() {
 *     trackEvent('button_click', { variant: 'primary' });
 *   }
 * </script>
 *
 * <button on:click={handleClick}>Click me</button>
 * ```
 */
export function trackEvent(eventName: string, eventData?: EventData): void {
  waitForTracker(() => {
    let payload: unknown = { name: eventName, data: eventData };

    if (currentOptions?.beforeSend) {
      payload = currentOptions.beforeSend('event', payload);
      if (payload === null) return;
    }

    if (currentTag) {
      (payload as Record<string, unknown>).tag = currentTag;
    }

    window.entrolytics?.track(eventName, eventData);
  });
}

/**
 * Track revenue event
 *
 * @example
 * ```svelte
 * <script>
 *   import { trackRevenue } from '@entrolytics/svelte';
 *
 *   async function handlePurchase(product) {
 *     await processPayment();
 *     trackRevenue('purchase', product.price, 'USD', {
 *       productId: product.id,
 *       productName: product.name
 *     });
 *   }
 * </script>
 * ```
 */
export function trackRevenue(
  eventName: string,
  revenue: number,
  currency = 'USD',
  data?: EventData,
): void {
  waitForTracker(() => {
    const eventData: EventData = {
      ...data,
      revenue,
      currency,
    };

    if (currentTag) {
      eventData.tag = currentTag;
    }

    window.entrolytics?.track(eventName, eventData);
  });
}

/**
 * Track outbound link click
 *
 * @example
 * ```svelte
 * <script>
 *   import { trackOutboundLink } from '@entrolytics/svelte';
 *
 *   function handleExternalClick(url: string) {
 *     trackOutboundLink(url, { placement: 'sidebar' });
 *   }
 * </script>
 * ```
 */
export function trackOutboundLink(url: string, data?: EventData): void {
  waitForTracker(() => {
    window.entrolytics?.track('outbound-link-click', {
      ...data,
      url,
    });
  });
}

/**
 * Identify with custom data
 *
 * @example
 * ```svelte
 * <script>
 *   import { identify } from '@entrolytics/svelte';
 *
 *   identify({ company: 'Acme Corp', plan: 'enterprise' });
 * </script>
 * ```
 */
export function identify(data: EventData): void {
  waitForTracker(() => {
    window.entrolytics?.identify(data);
  });
}

/**
 * Identify a user by ID
 *
 * @example
 * ```svelte
 * <script>
 *   import { identifyUser } from '@entrolytics/svelte';
 *
 *   // When user logs in
 *   identifyUser(user.id, { email: user.email, plan: user.plan });
 * </script>
 * ```
 */
export function identifyUser(userId: string, traits?: EventData): void {
  waitForTracker(() => {
    window.entrolytics?.identify({ id: userId, ...traits });
  });
}

/**
 * Set tag for A/B testing
 */
export function setTag(tag: string): void {
  currentTag = tag;
}

/**
 * Track page view manually
 * Useful for SPA navigation
 */
export function trackPageView(url?: string, referrer?: string): void {
  waitForTracker(() => {
    const payload: Record<string, unknown> = {};
    if (url) payload.url = url;
    if (referrer) payload.referrer = referrer;
    if (currentTag) payload.tag = currentTag;

    window.entrolytics?.track(payload);
  });
}

/**
 * Svelte action for tracking clicks
 *
 * @example
 * ```svelte
 * <script>
 *   import { trackClick } from '@entrolytics/svelte';
 * </script>
 *
 * <button use:trackClick={{ event: 'cta_click', data: { variant: 'hero' } }}>
 *   Click me
 * </button>
 * ```
 */
export function trackClick(node: HTMLElement, params: { event: string; data?: EventData }) {
  const handleClick = () => {
    trackEvent(params.event, params.data);
  };

  node.addEventListener('click', handleClick);

  return {
    update(newParams: { event: string; data?: EventData }) {
      params = newParams;
    },
    destroy() {
      node.removeEventListener('click', handleClick);
    },
  };
}

/**
 * Svelte action for tracking outbound links
 *
 * @example
 * ```svelte
 * <a href="https://example.com" use:outboundLink={{ data: { placement: 'footer' } }}>
 *   Visit Example
 * </a>
 * ```
 */
export function outboundLink(node: HTMLAnchorElement, params?: { data?: EventData }) {
  const handleClick = () => {
    const url = node.href;
    if (url) {
      trackOutboundLink(url, params?.data);
    }
  };

  node.addEventListener('click', handleClick);

  return {
    update(newParams?: { data?: EventData }) {
      params = newParams;
    },
    destroy() {
      node.removeEventListener('click', handleClick);
    },
  };
}

/**
 * Hook for tracking page views in SvelteKit
 *
 * Use in +layout.svelte to auto-track navigation
 *
 * @example
 * ```svelte
 * <script>
 *   import { page } from '$app/stores';
 *   import { usePageView } from '@entrolytics/svelte';
 *
 *   usePageView(page);
 * </script>
 * ```
 */
export function usePageView(pageStore: {
  subscribe: (fn: (value: { url: URL }) => void) => () => void;
}): void {
  let lastPath = '';

  onMount(() => {
    const unsubscribe = pageStore.subscribe($page => {
      const currentPath = $page.url.pathname;
      if (currentPath !== lastPath) {
        lastPath = currentPath;
        // First page view is handled by auto-track
        if (lastPath !== '') {
          trackPageView(currentPath);
        }
      }
    });

    return unsubscribe;
  });
}

// ============================================================================
// PHASE 2: Web Vitals Tracking
// ============================================================================

export type WebVitalMetric = 'LCP' | 'INP' | 'CLS' | 'TTFB' | 'FCP';
export type WebVitalRating = 'good' | 'needs-improvement' | 'poor';
export type NavigationType =
  | 'navigate'
  | 'reload'
  | 'back-forward'
  | 'back-forward-cache'
  | 'prerender'
  | 'restore';

export interface WebVitalData {
  metric: WebVitalMetric;
  value: number;
  rating: WebVitalRating;
  delta?: number;
  id?: string;
  navigationType?: NavigationType;
  attribution?: Record<string, unknown>;
}

/**
 * Track a Web Vital metric
 *
 * @example
 * ```svelte
 * <script>
 *   import { onLCP, onINP, onCLS } from 'web-vitals';
 *   import { trackVital } from '@entrolytics/svelte';
 *
 *   onMount(() => {
 *     onLCP((metric) => trackVital({
 *       metric: 'LCP',
 *       value: metric.value,
 *       rating: metric.rating
 *     }));
 *   });
 * </script>
 * ```
 */
export async function trackVital(data: WebVitalData): Promise<void> {
  if (typeof window === 'undefined' || !currentOptions) return;

  const payload = {
    website: currentOptions.websiteId,
    metric: data.metric,
    value: data.value,
    rating: data.rating,
    delta: data.delta,
    id: data.id,
    navigationType: data.navigationType,
    attribution: data.attribution,
    url: window.location.href,
    path: window.location.pathname,
  };

  const host = currentOptions.host || DEFAULT_HOST;

  try {
    await fetch(`${host}/api/collect/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (err) {
    console.error('[Entrolytics] Failed to track vital:', err);
  }
}

/**
 * Initialize automatic Web Vitals tracking
 * Call this in your root +layout.svelte
 *
 * @example
 * ```svelte
 * <script>
 *   import { initWebVitals } from '@entrolytics/svelte';
 *   import { onMount } from 'svelte';
 *
 *   onMount(() => {
 *     initWebVitals();
 *   });
 * </script>
 * ```
 */
export async function initWebVitals(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import('web-vitals');

    onLCP(m =>
      trackVital({
        metric: 'LCP',
        value: m.value,
        rating: m.rating,
        delta: m.delta,
        id: m.id,
        navigationType: m.navigationType as NavigationType,
        attribution: m.attribution as Record<string, unknown>,
      }),
    );

    onINP(m =>
      trackVital({
        metric: 'INP',
        value: m.value,
        rating: m.rating,
        delta: m.delta,
        id: m.id,
        navigationType: m.navigationType as NavigationType,
        attribution: m.attribution as Record<string, unknown>,
      }),
    );

    onCLS(m =>
      trackVital({
        metric: 'CLS',
        value: m.value,
        rating: m.rating,
        delta: m.delta,
        id: m.id,
        navigationType: m.navigationType as NavigationType,
        attribution: m.attribution as Record<string, unknown>,
      }),
    );

    onFCP(m =>
      trackVital({
        metric: 'FCP',
        value: m.value,
        rating: m.rating,
        delta: m.delta,
        id: m.id,
        navigationType: m.navigationType as NavigationType,
        attribution: m.attribution as Record<string, unknown>,
      }),
    );

    onTTFB(m =>
      trackVital({
        metric: 'TTFB',
        value: m.value,
        rating: m.rating,
        delta: m.delta,
        id: m.id,
        navigationType: m.navigationType as NavigationType,
        attribution: m.attribution as Record<string, unknown>,
      }),
    );
  } catch {
    console.debug('[Entrolytics] web-vitals not installed. Use trackVital() for manual tracking.');
  }
}

// ============================================================================
// PHASE 2: Form Tracking
// ============================================================================

export type FormEventType =
  | 'start'
  | 'field_focus'
  | 'field_blur'
  | 'field_error'
  | 'submit'
  | 'abandon';

export interface FormEventData {
  eventType: FormEventType;
  formId: string;
  formName?: string;
  urlPath?: string;
  fieldName?: string;
  fieldType?: string;
  fieldIndex?: number;
  timeOnField?: number;
  timeSinceStart?: number;
  errorMessage?: string;
  success?: boolean;
}

/**
 * Track a form event
 *
 * @example
 * ```svelte
 * <script>
 *   import { trackFormEvent } from '@entrolytics/svelte';
 *
 *   async function handleSubmit() {
 *     const success = await submitForm();
 *     trackFormEvent({
 *       eventType: 'submit',
 *       formId: 'contact-form',
 *       success
 *     });
 *   }
 * </script>
 * ```
 */
export async function trackFormEvent(data: FormEventData): Promise<void> {
  if (typeof window === 'undefined' || !currentOptions) return;

  const host = currentOptions.host || DEFAULT_HOST;

  const payload = {
    website: currentOptions.websiteId,
    eventType: data.eventType,
    formId: data.formId,
    formName: data.formName,
    urlPath: data.urlPath || window.location.pathname,
    fieldName: data.fieldName,
    fieldType: data.fieldType,
    fieldIndex: data.fieldIndex,
    timeOnField: data.timeOnField,
    timeSinceStart: data.timeSinceStart,
    errorMessage: data.errorMessage,
    success: data.success,
  };

  try {
    await fetch(`${host}/api/collect/forms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (err) {
    console.error('[Entrolytics] Failed to track form event:', err);
  }
}

/**
 * Create a form tracker for a specific form
 *
 * @example
 * ```svelte
 * <script>
 *   import { createFormTracker } from '@entrolytics/svelte';
 *
 *   const tracker = createFormTracker('signup-form', 'Signup Form');
 *
 *   function handleSubmit() {
 *     const success = await submit();
 *     tracker.trackSubmit(success);
 *   }
 * </script>
 *
 * <form on:submit|preventDefault={handleSubmit}>
 *   <input
 *     name="email"
 *     on:focus={() => tracker.trackFieldFocus('email', 'email', 0)}
 *     on:blur={() => tracker.trackFieldBlur('email', 'email', 0)}
 *   />
 * </form>
 * ```
 */
export function createFormTracker(formId: string, formName?: string) {
  let startTime: number | null = null;
  const fieldStartTimes = new Map<string, number>();

  return {
    trackStart: () => {
      startTime = Date.now();
      trackFormEvent({ eventType: 'start', formId, formName });
    },

    trackFieldFocus: (fieldName: string, fieldType?: string, fieldIndex?: number) => {
      if (!startTime) {
        startTime = Date.now();
        trackFormEvent({ eventType: 'start', formId, formName });
      }
      fieldStartTimes.set(fieldName, Date.now());
      trackFormEvent({
        eventType: 'field_focus',
        formId,
        formName,
        fieldName,
        fieldType,
        fieldIndex,
        timeSinceStart: Date.now() - startTime,
      });
    },

    trackFieldBlur: (fieldName: string, fieldType?: string, fieldIndex?: number) => {
      const fieldStart = fieldStartTimes.get(fieldName);
      trackFormEvent({
        eventType: 'field_blur',
        formId,
        formName,
        fieldName,
        fieldType,
        fieldIndex,
        timeOnField: fieldStart ? Date.now() - fieldStart : undefined,
        timeSinceStart: startTime ? Date.now() - startTime : undefined,
      });
    },

    trackFieldError: (
      fieldName: string,
      errorMessage: string,
      fieldType?: string,
      fieldIndex?: number,
    ) => {
      trackFormEvent({
        eventType: 'field_error',
        formId,
        formName,
        fieldName,
        fieldType,
        fieldIndex,
        errorMessage,
        timeSinceStart: startTime ? Date.now() - startTime : undefined,
      });
    },

    trackSubmit: (success: boolean) => {
      trackFormEvent({
        eventType: 'submit',
        formId,
        formName,
        success,
        timeSinceStart: startTime ? Date.now() - startTime : undefined,
      });
      startTime = null;
      fieldStartTimes.clear();
    },

    trackAbandon: () => {
      trackFormEvent({
        eventType: 'abandon',
        formId,
        formName,
        timeSinceStart: startTime ? Date.now() - startTime : undefined,
      });
    },
  };
}

/**
 * Svelte action for automatic form tracking
 *
 * @example
 * ```svelte
 * <script>
 *   import { trackForm } from '@entrolytics/svelte';
 * </script>
 *
 * <form use:trackForm={{ formId: 'contact', formName: 'Contact Form' }}>
 *   <input name="email" type="email" />
 *   <button type="submit">Send</button>
 * </form>
 * ```
 */
export function trackForm(node: HTMLFormElement, params: { formId: string; formName?: string }) {
  const tracker = createFormTracker(params.formId, params.formName);
  let hasInteracted = false;

  const handleFocus = (e: FocusEvent) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (!target.name && !target.id) return;

    const fieldName = target.name || target.id;
    const fieldType = target.type || target.tagName.toLowerCase();
    const fields = Array.from(node.elements);
    const fieldIndex = fields.indexOf(target);

    if (!hasInteracted) {
      hasInteracted = true;
    }

    tracker.trackFieldFocus(fieldName, fieldType, fieldIndex >= 0 ? fieldIndex : undefined);
  };

  const handleBlur = (e: FocusEvent) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (!target.name && !target.id) return;

    const fieldName = target.name || target.id;
    const fieldType = target.type || target.tagName.toLowerCase();
    const fields = Array.from(node.elements);
    const fieldIndex = fields.indexOf(target);

    tracker.trackFieldBlur(fieldName, fieldType, fieldIndex >= 0 ? fieldIndex : undefined);
  };

  const handleSubmit = () => {
    tracker.trackSubmit(true);
    hasInteracted = false;
  };

  const handleBeforeUnload = () => {
    if (hasInteracted) {
      tracker.trackAbandon();
    }
  };

  node.addEventListener('focusin', handleFocus);
  node.addEventListener('focusout', handleBlur);
  node.addEventListener('submit', handleSubmit);
  window.addEventListener('beforeunload', handleBeforeUnload);

  return {
    update(newParams: { formId: string; formName?: string }) {
      params = newParams;
    },
    destroy() {
      node.removeEventListener('focusin', handleFocus);
      node.removeEventListener('focusout', handleBlur);
      node.removeEventListener('submit', handleSubmit);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    },
  };
}
