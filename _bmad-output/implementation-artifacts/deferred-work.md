# Deferred Work

## 2026-05-26

- Source: spec-render-catalog-markdown review (edge-case hunter)
- Item: Handle duplicate section anchors when generated markdown contains repeated section ids/titles (for example duplicate beleidskompas entries), to avoid duplicate DOM ids and ambiguous hash navigation.
- Suggested scope: normalize/suffix duplicate anchors during parse and add regression tests.

- Source: spec-render-catalog-markdown review (edge-case hunter)
- Item: Make section extraction more tolerant to minor format drift in section tags and add fallback tests for zero-sections behavior.
- Suggested scope: harden parser or use a safer structural parser for section boundaries.
