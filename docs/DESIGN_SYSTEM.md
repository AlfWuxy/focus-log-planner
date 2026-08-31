# Design system

Focus Log uses an editorial planner layout rather than a generic card grid. The visual signature is a thin logbook rule connecting the four parts of the day: Big 3, Next action, Focus hours, and This week.

## Tokens

| Role | Value |
| --- | --- |
| Background | `#ffffff` |
| Primary text | `#071936` |
| Muted text | `#66758f` |
| Divider | `#d9dee6` |
| Coral action | `#ff533f` |
| Coral hover | `#e94332` |
| Completed | `#27966a` |
| Soft surface | `#f7f9fb` |
| Base radius | `8px` |

The spacing rhythm uses 4, 8, 12, 16, 24, 32, 48, and 64 pixel steps. Surfaces remain almost flat; shadow is reserved for temporary overlays.

## Typography

The interface uses `Inter`, then the platform UI font stack. Headings are compact and strongly weighted. Body and control text stay at readable native sizes; small labels never carry primary meaning alone.

## Component families

- Quiet app header with data-source, connection, and editing controls.
- Numbered checklist rows with native checkbox semantics.
- A single next-action row and focus-hour stepper.
- Seven-day execution strip with four explicit status shapes.
- Open right rail for upcoming notes, friction bars, and data-source state.
- Native modal forms for editing, settings, notes, and blockers.

## Responsive rules

At narrow widths the right rail follows the weekly strip in document order, the full header controls collapse into one menu, and the primary Edit day action remains next to the date. All touch targets are at least 44 pixels.

## Copy lock

The first viewport preserves these product strings from the accepted concept: `Focus Log`, `Plan the day. Learn from the week.`, `Demo data`, `Connect Notion`, `Edit day`, `Today`, `Big 3`, `Next action`, `Focus hours`, `This week`, `Upcoming notes`, `What got in the way`, and `Saved locally`.

The source concepts are [desktop](images/concept-desktop.png) and [mobile](images/concept-mobile.png). Production screenshots live beside them after browser verification.

## Fidelity ledger

| Reference decision | Production result |
| --- | --- |
| Quiet brand block with three primary controls | Preserved on desktop; collapsed into one 53 px menu target on mobile. |
| Coral logbook rule connecting the day | Preserved through Big 3, Next action, and Focus hours, then changes to slate for This week. |
| Open two-column desktop canvas | Preserved with planning on the left and notes, blockers, and source state on the right. |
| One highlighted primary action | `Edit day` remains the only filled coral button in both responsive layouts. |
| Seven-day execution strip | Preserved with complete, partial, not-started, and no-entry states; narrow screens scroll the strip locally. |
| Sidebar follows the plan on mobile | Preserved in document order without page-level horizontal overflow. |
