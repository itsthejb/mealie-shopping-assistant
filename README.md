# Mealie Shopping Assistant

A Chrome Manifest V3 side-panel extension for shopping through a Mealie shopping list while keeping your chosen supermarket open in a separate tab. The extension opens product searches for you; you choose the exact products and add them to your cart yourself.

The panel uses a random, curated Unsplash photo from the default **supermarket, food** theme as a lightly blurred background. Its attribution includes links to Unsplash and the selected photo source. No Unsplash API key, search setting, or account is required.

## Install

1. Download or clone this repository.
2. In Chrome, open `chrome://extensions`, enable **Developer mode**, and choose **Load unpacked**.
3. Select this repository folder. Click the extension icon to open its side panel beside your current tab.

## Configure

In the side panel, enter:

- Your Mealie base URL, such as `https://mealie.example.com`.
- A Mealie API token. Create one in your Mealie account's API-token settings.
- A supermarket name for display.
- A search URL with exactly one `%s` or `{query}` placeholder, for example `https://www.ocado.com/search?q=%s`.

Save settings and grant access to the Mealie host when Chrome asks. The extension uses the Mealie API token as a Bearer token. It remembers your last selected shopping list locally and restores it when available. If there is no saved selection, it selects the only list automatically when there is exactly one; otherwise, choose a list before starting. The list selector remains available so you can switch lists.

The manifest declares optional HTTP and HTTPS host patterns as a permission ceiling so you can use arbitrary self-hosted Mealie origins. Chrome does not grant those wildcard patterns: when settings are saved, the extension requests only the exact configured Mealie origin (including its port), and Chrome asks for approval. Changing Mealie origins removes the prior exact-origin grant. The extension does not request access to the supermarket site; it only opens search URLs in a new tab.

## Shop

**Start shopping** loads unchecked items and opens a supermarket search for the current item. Later item and substitution searches reuse that same tab; its ID is kept in `chrome.storage.session` across side-panel and service-worker restarts. If you close the search tab, the next search opens a replacement. The Mealie tab is never repurposed. After you select and add a product yourself, **Got it** marks the item checked in Mealie and opens the next search. When every list item is checked, the background briefly celebrates; this animation respects reduced-motion preferences. **Skip it** leaves the item unchecked and moves on. **Done** ends the session without changing remaining items.

## Security and privacy

The API token and configuration are stored only in `chrome.storage.local`; the token is not stored in Chrome sync storage, embedded in the source, or logged, and is sent only to the configured Mealie instance. The extension's `storage` and `sidePanel` permissions support local settings and the persistent panel. It requests no `tabs` or supermarket host permission. A selected background image is requested directly from `images.unsplash.com`; the curated image URLs are in the extension source, with no API key or search endpoint. If an image cannot load, the panel falls back to its normal solid background and remains usable. Supermarket searches are opened as normal tabs and are never embedded in a frame. The extension does not select products, add products to a cart, or make purchases.

## Development

Run the focused helper tests with `npm test`. No build step is needed; Chrome loads the extension's JavaScript modules directly.

## Asset attribution

The browser toolbar uses the bundled [32×32 Mealie favicon](https://github.com/mealie-recipes/mealie/blob/mealie-next/frontend/public/icons/favicon-32x32.png). The sidebar header uses the supplied transparent 512×512 version of the [Mealie maskable icon](https://github.com/mealie-recipes/mealie/blob/mealie-next/frontend/public/icons/android-chrome-maskable-512x512.png). The upstream repository is licensed under [AGPL-3.0](https://github.com/mealie-recipes/mealie/blob/mealie-next/LICENSE).
