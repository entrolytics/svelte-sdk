# Changelog

All notable changes to this project are documented in this file. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Breaking

- `clientKey` is a required option of `initEntrolytics`, read from `VITE_ENTROLYTICS_CLIENT_KEY`
  or `PUBLIC_ENTROLYTICS_CLIENT_KEY` when it is not passed. Without one `initEntrolytics` throws,
  as it does for a missing `websiteId`.
- `trackVital`, `initWebVitals` and the types `WebVitalData`, `WebVitalMetric`, `WebVitalRating`
  and `NavigationType` are removed, and `web-vitals` is no longer an optional dependency. The
  tracker script reports Core Web Vitals itself when `autoTrack` is on, so a second sender in the
  SDK would count every metric twice. Remove the calls; there is no replacement to call.

### Fixed

- The injected tracker script had no `data-client-key`, and the tracker sends nothing without it,
  so no page view, event or identify call made through this SDK reached Entrolytics. The script
  tag now carries the configured `clientKey`.
- `trackVital` posted a payload `/api/collect/vitals` rejected with HTTP 400 and ignored the
  response. Web Vitals now come from the tracker script.

## [3.0.3] - 2026-11-26

### Changed

- Built and released with pnpm 12.24.0. No code changes.

[Unreleased]: https://github.com/entrolytics/svelte-sdk/compare/v3.0.3...HEAD
[3.0.3]: https://github.com/entrolytics/svelte-sdk/releases/tag/v3.0.3
