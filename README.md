# Mealie Shopping Assistant

A Chrome Manifest V3 side-panel extension for shopping through a Mealie shopping list while keeping your chosen supermarket open in a separate tab. The extension opens product searches for you; you choose the exact products and add them to your cart yourself.

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

## Shop

**Start shopping** loads unchecked items and opens a supermarket search for the current item. Use **Search** beside a Mealie substitution to search for that alternative. After you select and add a product yourself, **Got it** marks the item checked in Mealie and opens the next search. **Skip it** leaves the item unchecked and moves on. **Done** ends the session without changing remaining items.

## Security and privacy

The API token and configuration are stored only in `chrome.storage.local`; they are not stored in Chrome sync storage, embedded in the source, logged, or sent to any service other than the configured Mealie instance. The extension requests optional host access only for the configured Mealie origin. Supermarket searches are opened as normal tabs and are never embedded in a frame. The extension does not select products, add products to a cart, or make purchases.

## Development

Run the focused helper tests with `npm test`. No build step is needed; Chrome loads the extension's JavaScript modules directly.
