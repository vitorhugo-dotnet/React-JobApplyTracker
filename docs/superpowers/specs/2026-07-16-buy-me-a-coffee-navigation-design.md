# Buy Me a Coffee navigation design

Date: 2026-07-16

## Goal

Expose the existing Buy Me a Coffee destination in Applywell without disrupting the responsive navigation or the monochrome design system.

## Behavior

- Use `https://www.buymeacoffee.com/vitorhugo1207`, matching the SpringAPI_EspacoGeek README.
- Open the destination in a new browser tab.
- Protect the opener context with `rel="noopener noreferrer"`.
- Provide accessible English labels consistent with the current interface.

## Desktop

Add an icon-only action to `Topbar`, beside the existing theme and sign-out actions. It uses the same 30px bordered monochrome button style and is visible only at the `md` breakpoint and above.

## Mobile

Add a labeled `Buy me a coffee` external link to the existing expandable `MobileNav` menu. It follows the same pill styling as navigation items and closes the menu when selected. No additional floating action button is introduced.

## Components

- Add a reusable `CoffeeIcon` to `src/components/ui/icons.tsx`.
- Centralize the external URL in a small exported constant so desktop and mobile cannot drift.
- Update `Topbar.tsx` and `MobileNav.tsx` to consume the shared icon and URL.

## Verification

- TypeScript typecheck and production build pass.
- Desktop action is absent below the `md` breakpoint.
- Mobile menu link is available below `md`.
- Both links have the correct URL, new-tab behavior, accessible labels, and safe `rel` attributes.
