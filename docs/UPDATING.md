# Updating Guide

Use this guide after every relevant change so docs stay synchronized with the product.

## Mandatory checklist per change
1. Update docs/CHANGELOG.md:
   - Added for new features.
   - Changed for behavior updates.
   - Fixed for bug fixes.
2. Update README.md when any of these change:
   - Setup steps.
   - Environment variables.
   - Scripts.
   - Main behavior visible to users.
3. Update docs/ARCHITECTURE.md when any of these change:
   - Data flow.
   - Feature boundaries.
   - State ownership.
   - Real-time integration.
4. Validate project:
   - npm run build
   - npm run lint (if required by the change)

## Suggested commit convention
- feat: new functionality
- fix: bug fix
- refactor: internal structure without behavior change
- docs: documentation-only updates
- chore: tooling or infra updates

## Release note template
Date:
Scope:
Main user impact:
Technical impact:
Validation done:
