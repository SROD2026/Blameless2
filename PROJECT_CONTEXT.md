# Project: Philippians 4:8 Emotions Wheel

I’m continuing a project. Please read and use this project context carefully before responding.

[PASTE PROJECT_CONTEXT.md HERE]

I’ll upload files as needed.


## Goal
A web app that:
- lets users select emotions via a 3-ring circular wheel (core → branch → word)
- acknowledges emotions without blame
- redirects toward Philippians 4:8 traits
- shows next steps + scripture in a modal popup
- uses structured JSON as the source of truth

## Stack
- React (Vite)
- SVG for the wheel
- No routing yet (modal-based UX)
- JSON loaded from /public/data/unified_wheels_schema.json

## Key Files
- src/App.jsx (main logic, modal, matching)
- public/data/unified_wheels_schema.json (unified schema)
- PROJECT_CONTEXT.md (this file)

## Current State (as of YYYY-MM-DD)
- Wheel renders correctly and is centered
- Inner ring = core emotions
- Middle ring = branches (changes when core changes)
- Outer ring = expressions (clickable)
- Clicking outer word opens modal
- Modal UI works
- Matching logic uses:
  - core label
  - branch label
  - expression label
  - next_steps_wheel.outer_emotions[].match_words
- Trust core now populated with next steps

## Known Issues / In Progress
- Verifying all branches populate next steps
- Some cores need additional outer_emotions groups
- JSON cache busting required during dev (?v=2)

## Matching Logic (summary)
findNextSteps(schema, coreLabel, branchLabel, expressionLabel):
- normalize strings
- prefer matches in branch label
- fallback to expression matches
- uses group.match_words when present

## What NOT to change
- Wheel interaction model
- Modal-based UX (no routing yet)
- JSON as single source of truth

## Next Planned Tasks
1. Finish coverage for all cores (missing next steps report)
2. Visual highlighting of Philippians 4:8 trait
3. Gentle animation for modal
4. Optional: zoom / focus mode for dense outer rings
