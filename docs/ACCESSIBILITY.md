# Accessibility

The app is designed for older users, so accessibility is a core requirement rather than an extra.

## Visual design
- **Palette:** high-contrast monochrome slate blue, defined once as theme tokens in `client/src/index.css`.
  Midnight `#101F33` (dark surfaces, headings), deep blue `#173B65` (primary actions on light),
  ice blue `#BBD6F3` (primary actions on dark), blue mist `#F1F5F9` (page), white (cards), slate `#445873` (secondary text).
- **Type:** Atkinson Hyperlegible body text (designed by the Braille Institute for low vision) and Fraunces headings.
  15px base, with **Normal / Large / Extra large** text sizes in the header (remembered per device).
- **Status is never colour-only:** every state shows a text label (for example "Waiting period — we have not heard from you").

## Contrast (WCAG 2.1, normal text needs ≥ 4.5:1)

| Pair | Ratio |
|---|---|
| White text on midnight | 16.6 : 1 |
| Midnight text on ice blue (dark-panel buttons, active menu item) | 11.1 : 1 |
| Midnight on ice blue hover | 12.9 : 1 |
| White text on deep blue (primary buttons on light) | 11.4 : 1 |
| White on deep blue hover (midnight) | 16.6 : 1 |
| Midnight headings on blue mist | 15.1 : 1 |
| Slate secondary text on white / on mist | 7.3 : 1 / 6.6 : 1 |
| Deep blue links on white / on mist | 11.4 : 1 / 10.4 : 1 |
| Sidebar menu text (white 80%) on midnight | ≥ 10 : 1 |
| Focus ring (#2F6DB3) against white / mist | 5.3 : 1 / 4.8 : 1 (non-text needs 3 : 1) |
| Focus ring outer halo (ice) against midnight | 11.1 : 1 |
| Status badges: ok / warning / danger | 6.6 / 5.3 / 6.8 : 1 |

## Interaction
- Every control has a visible text label; icons are decorative.
- Keyboard: skip link, logical tab order, double focus ring visible on light and dark surfaces, Esc closes dialogs.
- Forms ask one question per screen for complex tasks (adding an asset).
- "Read aloud" reads the current page using the browser's speech synthesis.
- Respects "reduce motion" settings.
