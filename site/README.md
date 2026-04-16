# AIPrompter marketing site

## Commands

- `pnpm install`
- `pnpm --dir site dev`
- `pnpm --dir site build`
- `pnpm --dir site test`

## Scope

This app owns `aiprompter.run` marketing pages only. Do not move the existing remote Worker flow into this app.

## Verification

- `pnpm --dir site test`
- `pnpm --dir site build`

The Astro app is for `aiprompter.run` only.
Do not change `src/index.ts` when updating the marketing site unless the task explicitly includes the remote control Worker.
