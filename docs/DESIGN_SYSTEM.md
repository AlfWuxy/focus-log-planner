# Design system

Focus Log uses a quiet, platform-inspired workspace: a persistent navigation rail, one daily planning column, and a secondary rail for upcoming notes and reflection. On phones, section navigation becomes a bottom bar and the secondary content follows the daily plan.

## Tokens

| Role | Light | Dark |
| --- | --- | --- |
| Navigation canvas | `#f5f5f7` | `#171719` |
| Content surface | `#ffffff` | `#202023` |
| Primary text | `#1d1d1f` | `#f5f5f7` |
| Secondary text | `#6e6e73` | `#a1a1aa` |
| Divider | `#e5e5ea` | `#36363d` |
| Accent | `#0066df` | `#66aaff` |
| Next-action surface | `#edf4ff` | `#202e43` |

The platform UI font stack starts with `-apple-system`; fonts do not require network access. Daily titles use 35–40 px type, section titles 15–17 px, task text 14 px, and secondary chrome 10–13 px. Primary content remains code-native text and controls. Grouped lists and sections use 16 px corners; modal sheets use 22 px corners. Shadows are reserved for menus and sheets.

## Components and behavior

- Section links navigate to Today, This week, and Upcoming. The selected link follows URL hash changes, including reload and browser history. These are sections of the existing sample workspace, not a new day-history system.
- Big 3 remains a grouped list with native checkbox semantics, explicit reorder buttons, and a completion count derived from the actual task state.
- Next action receives the only tinted content surface, keeping the first useful step easy to find.
- Focus hours can be adjusted with an accessible range input or half-hour steppers. The numeric value, progress bar, and percentage share the same state.
- Weekly states retain text labels and distinct marks; meaning never depends only on color. The strip scrolls inside its own container on very narrow screens.
- Edit, note, blocker, connection, and settings sheets trap keyboard focus, support Escape, and restore the launching control. The source picker uses ordinary button semantics and closes on Escape or outside click.
- Optional Notion mode retains read-only controls. Local browser data and the existing local pairing mechanism are unchanged.

## Responsive and accessibility rules

Desktop uses the left navigation rail above 760 px. Secondary content stacks below the daily plan at intermediate widths; at 760 px and below, the top header becomes compact and navigation stays at the bottom with safe-area padding. Mobile numeric steppers and menu controls have 44 px touch targets. Focus outlines remain visible, and system dark mode and reduced motion preferences are respected.

Production reference images are the actual browser captures [desktop](images/app-desktop.png) and [mobile](images/app-mobile.png). The legacy `concept-*.png` images document the earlier visual direction and are not current implementation references.

## Design comparison

The implementation follows the generated Apple-like primary-screen direction: a gray left rail, white primary canvas, large Today title, compact toolbar, grouped checklist, blue next-action surface, focus summary, weekly strip, and secondary notes/reflection rail. The existing fictional task text, August 31 sample date, four-hour goal, explicit weekly state legend, and accessible controls are intentional product-preserving differences from concept illustration data. The sample workspace label makes the fixed date explicit. Mobile and dark variants extend this same system.
