# smart-brain — General Usage

One-page guide to run and publish the demo site. No coding knowledge needed.

## What you need
- Any OS with Deno (or any static file server) and a modern browser.

## Run
`deno run -A jsr:@std/http/file-server -p 8080 .`
Expected: the site opens at http://localhost:8080 with an animated terminal on the first screen.

## Publish
1. Commit and push to `main`.
2. GitHub Pages rebuilds the site in about a minute.

## Addresses
| What | Address |
|---|---|
| Public site | https://c3scoodev.github.io/smart-brain/ |

## Common problems
- **Public site not updated?** → Check the Pages build in the repo's Actions tab.
- **Blank page when opening the file directly?** → Use the server above: ES modules do not load from `file://`.
