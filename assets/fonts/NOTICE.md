# Fonts used for server-rendered gift cards

These files are vendored so a minimal server in Hong Kong or mainland China can
draw Chinese and English text without calling a font CDN.

- `DroidSansFallbackFull.ttf` — Droid Sans Fallback, Copyright Google Inc.
  Licensed under the Apache License, Version 2.0.
- `LiberationSerif-Regular.ttf`, `LiberationSerif-Bold.ttf`,
  `LiberationSerif-Italic.ttf` — Liberation Serif, Copyright Red Hat, Inc.
  Licensed under the SIL Open Font License, Version 1.1.

The web interface uses separate self-hosted families installed from
`@fontsource` (Source Serif 4, Source Sans 3, Noto Serif SC/TC, Noto Sans SC/TC).
Those files are served by this application. They are not loaded from Google Fonts.
