# Project Overview

This project is an article-style data visualization piece about NASA, Artemis II, and private industry. The final framing question is:

What does the Artemis mission, and specifically a successful Artemis II mission, reveal about NASA's relationship to private industry, and how has that relationship changed over time?

The Artemis route at `src/pages/artemis.astro` now points to the main project workspace at `src/final-project/artemis/page/ArtemisPage.astro`. In its current state it functions as an interactive rocket dashboard plus supporting graphics. In its final state it should become a narrative article with these elements interleaved through the story:

- explanatory text blocks
- the Artemis / Apollo rocket comparison graphic
- supporting quantitative graphics
- a final swipeable panel that lets the reader move through all completed graphics together

# Core Story

The page is not just a catalog of parts and contractors. Every graphic should support the larger argument about how NASA's industrial relationships have changed across Apollo and Artemis:

- what NASA builds directly versus what it buys
- how risk, responsibility, and integration are distributed
- how legacy aerospace primes persist, merge, or reappear across eras
- how cost visibility changes when the state contracts through large subsystem programs rather than discrete in-house builds

When adding new graphics, labels, or interactions, prefer choices that sharpen that comparison instead of adding generic space-history detail.

# Current Primary Page

- Route entry: `src/pages/artemis.astro`
- Main project workspace: `src/final-project/artemis/`
- Page implementation: `src/final-project/artemis/page/ArtemisPage.astro`
- Project docs: `src/final-project/artemis/docs/`
- Project overview: `src/final-project/artemis/docs/overview.md`
- Project outline: `src/final-project/artemis/docs/final-project-outline.txt`
- Rocket source assets: `public/final-project/artemis/rockets/`
- Artemis rocket assets: `public/final-project/artemis/rockets/artemis/`
- Apollo rocket assets: `public/final-project/artemis/rockets/apollo/`
- Main Artemis SVG: `public/final-project/artemis/rockets/artemis/sls-diagram-02.svg`
- Main Apollo SVG: `public/final-project/artemis/rockets/apollo/saturn-v-diagram-01.svg`
- Apollo contractor source text: `public/final-project/artemis/rockets/apollo/Apollo Contractors.txt`

The current page includes:

- a rocket slider for Artemis II and Apollo Saturn V
- a mode toggle for `contractors` and `prices`
- a universal hover card that always shows part, contractor, and price
- a left-side details panel that shows the selected part's function and notes
- a data bibliography
- an article intro area above the rocket dashboard

Preservation rule:

- The current rocket dashboard in `src/final-project/artemis/page/ArtemisPage.astro` is the stable reference implementation and should be preserved while article copy is developed around it.
- During article-writing passes, default to editing only the article text above the dashboard unless a diagram change is explicitly requested.
- Do not restyle, replace, or restructure the current dashboard as part of article drafting work.

# Hardcoded Diagram Rules

These rules are intentional and should be preserved unless there is a specific reason to change them.

## Artemis diagram

- The right-side solid rocket booster must remain visible and encoded.
- In the SVG this right-side booster is the mirrored element `solid-rocket-booster-2`, which resolves through the shared part key `solid-rocket-booster`.
- The left-side exterior booster is intentionally hidden by exact SVG id: `solid-rocket-booster`.
- This is a hardcoded design choice so one side reads as exterior shell while the other side reads as an exposed internal/cutaway hover surface.
- Do not convert the booster hide rule back into a normalized group hide, or the right-side cutaway booster will disappear too.
- `foward-skirt-avionics` and `nozzle` are currently intentionally hidden as normalized part groups to reduce overlap and visual clutter on both sides.
- Mirrored `-2` Artemis SVG ids depend on the `normalizeId()` logic in `src/final-project/artemis/page/ArtemisPage.astro`. Do not remove that normalization unless the SVG mapping system is rewritten.

## Apollo diagram

- Apollo part prices are currently grouped proxies, not stage-by-stage procurement facts.
- `apollo-csm`, `apollo-lm`, and `apollo-saturn-v` are inflation-adjusted mission hardware proxies used to compare Apollo against Artemis on the same scale.
- If Apollo gets more granular stage prices later, they must be clearly labeled as modeled or derived unless directly sourced from NASA primary material.

# SVG Design Pipeline

The rocket diagrams follow a specific pipeline. Keep this stable.

1. Start with a manually prepared SVG in `public/final-project/artemis/rockets/<rocket-name>/...`.
2. Ensure meaningful shape or group ids exist for each interactive region.
3. Map SVG ids to part metadata in `src/final-project/artemis/page/ArtemisPage.astro`.
4. Use `normalizeId()` so mirrored or numbered ids like `part-2` resolve to the same metadata entry when appropriate.
5. Inject interactivity at render time with `renderRocketSvg()`.
6. Drive both contractor mode and price mode from the same mapped part metadata.

Implementation notes:

- Group-level SVG nodes like `g` may need interaction if the child paths do not carry their own ids.
- Price highlighting uses shared `priceGroup` keys, so grouped-cost subsystems should highlight together.
- Tooltip text and left-panel detail text should remain confined to the dashboard component and wrap safely.
- Long part names, contractor labels, price labels, descriptions, and notes in the diagram panel must never overflow their container.
- Preserve the existing text-wrap safeguards in `src/final-project/artemis/page/ArtemisPage.astro`, including `min-width: 0`, `max-width: 100%`, and `overflow-wrap: anywhere` on the detail and tooltip text blocks.
- If an element is omitted, check `hiddenParts`, then SVG ids, then the part mapping object.
- The page now distinguishes between exact hidden SVG ids and normalized hidden part groups. Use exact-id hiding when only one mirrored side should disappear.
- When translating visual spacing or offsets into code, account for the real rendered width of nearby components like keys, toggles, and diagrams so they do not overlap or overflow.

# Research Rules

Research quality matters because the page makes a substantive historical argument.

- Prefer NASA primary sources whenever possible.
- NASA OIG material is acceptable when it is the clearest source for contract values or program cost structure.
- For historical Apollo material, NASA historical documents and NTRS records are preferred.
- Use non-NASA sources only when a primary NASA source does not exist or is materially weaker, and call that out explicitly.
- Every numeric price shown in the graphic must be sourced or clearly labeled as an estimate.
- If a price is estimated, the hover and detail text must say so.
- If a part only has subsystem or mission-level pricing, group the relevant parts under a shared `priceGroup` rather than inventing fake granularity.
- For cross-era comparisons, normalize dollars to a common basis and cite the conversion source.

# Design Choices

The current visual language is deliberate.

- Artemis branding remains in the left panel for now, even when the Apollo rocket is active. This is temporary and should not be treated as the final article framing.
- Contractor colors are categorical and stable across views.
- Merged or lineage companies use lighter shades of their parent company's color in the key.
- In the contractor key, merged companies are indented under their modern parent.
- Price mode uses a green saturation scale so the user can compare relative cost intensity quickly.
- Hover behavior should feel analytical, not decorative: the point is to compare ownership, function, and cost at the part level.
- Explanatory text should stay concise and read like editorial support for the chart, not like raw engineering documentation.

# Reusable Inline Diagram Pattern

The current inline article diagram treatment in `src/final-project/artemis/page/ArtemisPage.astro` should be reused for future diagrams in this article unless there is a specific reason to break pattern.

- Center the rocket itself on the article reading axis.
- Place the key or price scale on the left side of the rocket.
- If a toggle is needed, place it on the right side of the rocket and align it as a counterpart to the left-side key.
- Keep the inline figure stripped down relative to the master dashboard.
- Use the master dashboard below as the reference implementation for data, hover behavior, and mapping logic, but not for inline spacing density.
- Inline diagrams may selectively simplify hover content depending on the article need.
- Future outline instructions can specify whether an inline diagram includes a toggle, but the default article figure should follow this same centered key-diagram-toggle structure.

# Data Model Notes

Within `src/final-project/artemis/page/ArtemisPage.astro`, the main structures currently are:

- `contractorStyles`
- `contractorKeyOrder`
- `priceGroups`
- `priceBibliography`
- `artemisParts`
- `apolloParts`
- `rockets`

If extending the page, prefer adding to these structures rather than scattering ad hoc constants through the script.

# Interaction Rules

- The hover card should be universal across graphic views.
- The left details panel should show function first, with contractor and price as supporting context.
- Switching between `contractors` and `prices` should not change the underlying part selection model.
- Rocket switching should preserve the same interaction grammar so comparisons feel direct.
- Shared-cost price groups should highlight all linked parts in price mode.

# Implementation Guardrails

- Do not remove source attribution from the page when adding new data.
- Do not replace sourced values with visually convenient guesses.
- Do not silently change scale logic without updating the legend copy.
- Do not let long labels or notes overflow outside the rocket dashboard component.
- If text starts spilling out again, fix the panel CSS first rather than shortening sourced copy to force it to fit.
- Before assuming an SVG element is missing, inspect the source SVG and the hide list.

# Near-Term Build Direction

The next development phase should move the page toward the final article structure:

- convert the current dashboard into one major section of a larger narrative page
- stitch in transitions between graphics with short analytical copy
- sharpen the Apollo-versus-Artemis comparison around outsourcing, contractor concentration, and cost visibility
- build the final end-panel carousel that lets readers swipe through the full set of finished graphics

# Open Questions For The Final Project

These are the main product questions still worth settling as implementation continues:

- Should the final article argue primarily that Artemis reflects deeper privatization, or that NASA has always depended on industry but now exposes that dependence differently?
- Do you want the article voice to stay mostly analytical and neutral, or make a stronger thesis about political economy and procurement?
- Will the final swipeable panel contain only finished graphics from this page, or should it also include graphics that appear elsewhere in the site?
- Should Apollo remain the sole historical comparison point, or do you want Shuttle / Commercial Crew / CLPS to appear later as intermediate stages in the NASA-industry relationship?
