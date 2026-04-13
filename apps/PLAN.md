# Phase planning for Legal Technoloy Project

## Phase 0: Analyze ontology changes
- Analyze the changes in the `ontology/legel technology.ttl`
- Based on the analysis make a list of changes need in the current modules
- Per module (api, dashboard)
    - Change code and tests
    - Run tests
    - When tests are green, go to the next module

## Phase 1: Core Structure & Navigation
- Set up main layout and navigation (sidebar/topbar if needed).
- Integrate all planned components in the main App (already scaffolded):
    LegalTechnologyList
    LegalTechnologyForm
    StatisticsPanel
    EnumerationsFilter
    AssistantPanel
    ColorLegend
## Phase 2: API Integration & CRUD
- Implement API calls for:
    Listing/searching legal technologies (/api/legaltechnologies/search)
    Adding/editing/deleting legal technologies (/api/legaltechnologies, /api/legaltechnologies/{id})
    Fetching enumerations (/api/legaltechnologies/enumerations)
    Fetching statistics (/api/stats)
- Connect LegalTechnologyList to display and search technologies.
- Connect LegalTechnologyForm for add/edit (with validation and feedback).
- Enable delete functionality with confirmation.

## Phase 3: Filtering, Insights & Statistics
- Implement EnumerationsFilter to filter/search by enumeration values.
- Implement color-coding in LegalTechnologyList and ColorLegend for technology types.
- Implement StatisticsPanel to show:
    Newly added technologies
    Last edited technologies
    Number of different kinds of legal technologies

## Phase 4: Assistant & UX Enhancements
- Implement AssistantPanel for natural language actions (search, add, edit, delete) in Dutch and English (start with simple command parsing, expand as needed).
- Add user feedback, error handling, and loading states throughout the UI.
- Polish UI/UX for accessibility and responsiveness.

## Phase 5: Testing & Documentation
- Add unit and integration tests for all components (Vitest, Testing Library).
- Document all components and flows (JSDoc, README updates).
- Ensure code quality with ESLint and Prettier.