# Feature Development Workflow

## 🎯 Overview

This guide outlines the standard process for developing new features in the INGRD codebase. Following this workflow ensures consistency, maintainability, and proper documentation.

## 📋 Feature Development Process

### Phase 1: Research & Discovery

#### 1.1 Understand Requirements
- [ ] Review feature requirements with stakeholders
- [ ] Identify user stories and acceptance criteria
- [ ] Define success metrics
- [ ] Consider edge cases and error scenarios

#### 1.2 Research Existing Codebase
```bash
# Search for similar patterns
grep -r "similar_feature" --include="*.tsx" --include="*.ts"

# Check existing routers
ls -la server/routers/

# Review existing providers
ls -la app/providers/

# Check for related types
grep -r "interface.*Feature" types/
```

#### 1.3 Technical Research
- [ ] Identify required dependencies
- [ ] Research best practices for similar features
- [ ] Check for existing libraries/solutions
- [ ] Review security implications

#### 1.4 Document Findings
Create a research summary including:
- Existing patterns found
- Dependencies needed
- Potential challenges
- Security considerations

### Phase 2: Proposal Creation

#### 2.1 Create Feature Proposal
Create a proposal document: `/docs/proposals/FEATURE_NAME_PROPOSAL.md`

```markdown
# [Feature Name] Proposal

## Executive Summary
Brief 2-3 sentence overview.

## Problem Statement
What problem does this solve?

## Proposed Solution

### Technical Approach
- Architecture decisions
- Technology choices
- Integration points

### Data Model
```typescript
// Type definitions
interface FeatureData {
  // ...
}
```

### API Design
```typescript
// TRPC endpoints
featureRouter = {
  getFeature: protectedProcedure...
  updateFeature: protectedProcedure...
}
```

### UI/UX Flow
- Screen mockups or descriptions
- User journey
- Navigation flow

## Implementation Plan

### Phase 1: Backend
- [ ] Create types in `/types/feature.ts`
- [ ] Implement TRPC router
- [ ] Add MongoDB collections
- [ ] Write tests

### Phase 2: Frontend
- [ ] Create provider if needed
- [ ] Implement hooks
- [ ] Build UI components
- [ ] Add screens

### Phase 3: Integration
- [ ] Connect frontend to backend
- [ ] Test end-to-end
- [ ] Handle edge cases

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| ... | High/Med/Low | ... |

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Estimated Effort
- Small/Medium/Large/Epic
- Complexity: Low/Medium/High

## Questions/Decisions Needed
1. Question 1?
2. Question 2?
```

#### 2.2 Review Checklist
- [ ] Does it follow existing patterns?
- [ ] Are all edge cases considered?
- [ ] Is the timeline realistic?
- [ ] Are dependencies identified?
- [ ] Is it backwards compatible?

### Phase 3: Approval Process

#### 3.1 Submit for Review
1. Create PR with proposal document
2. Tag relevant reviewers
3. Address feedback
4. Get approval from:
   - [ ] Technical lead
   - [ ] Product owner
   - [ ] Security review (if applicable)

#### 3.2 Refine Based on Feedback
- Update proposal with feedback
- Clarify any ambiguities
- Adjust timeline if needed

### Phase 4: Implementation

#### 4.1 Setup
```bash
# Create feature branch
git checkout -b feature/FEATURE_NAME

# Create necessary directories
mkdir -p server/routers/feature
mkdir -p app/components/features/feature
```

#### 4.2 Backend Implementation

##### Step 1: Define Types
```typescript
// types/feature.ts
import { z } from 'zod';

export interface Feature {
  id: string;
  // ...
}

export const createFeatureSchema = z.object({
  // ...
});
```

##### Step 2: Create Router
```typescript
// server/routers/feature/index.ts
import { router, protectedProcedure } from '@/trpc/trpc';
import { createFeatureSchema } from '@shared/feature';

export const featureRouter = router({
  create: protectedProcedure
    .input(createFeatureSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
});
```

##### Step 3: Register Router
```typescript
// server/trpc/app.ts
import { featureRouter } from '@/routers/feature';

export const appRouter = router({
  // existing...
  feature: featureRouter,
});
```

#### 4.3 Frontend Implementation

##### Step 1: Create Provider (if stateful)
```typescript
// app/providers/feature-provider.tsx
export function FeatureProvider({ children }) {
  // Provider implementation
}
```

##### Step 2: Create Hooks
```typescript
// app/hooks/useFeature.ts
export function useFeature() {
  // Hook implementation
}
```

##### Step 3: Build UI Components
```typescript
// app/components/features/FeatureName/index.tsx
export function FeatureName() {
  // Component implementation
}
```

##### Step 4: Add Screens
```typescript
// app/app/(tabs)/feature.tsx
export default function FeatureScreen() {
  // Screen implementation
}
```

#### 4.4 Testing Checklist
- [ ] Unit tests written
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Error handling verified
- [ ] Performance acceptable
- [ ] Security reviewed

### Phase 5: Documentation

#### 5.1 Create Feature Documentation
If the feature is significant, create: `/docs/features/FEATURE_NAME.md`

```markdown
# [Feature Name]

## Overview
What this feature does and why it exists.

## Architecture
How it fits into the system.

## Usage

### For Users
How end users interact with this feature.

### For Developers
How to work with this feature's code.

## API Reference

### TRPC Endpoints
- `feature.create` - Creates a new feature
- `feature.update` - Updates existing feature

### Hooks
- `useFeature()` - Main feature hook
- `useFeatureData()` - Data fetching hook

## Configuration
Any configuration options.

## Troubleshooting
Common issues and solutions.

## Examples
Working code examples.
```

#### 5.2 Update Existing Docs
- [ ] Update API reference if needed
- [ ] Add to architecture overview if significant
- [ ] Update getting started guide if affects setup
- [ ] Add to type documentation if complex types

### Phase 6: Cleanup

#### 6.1 Archive Proposal
```bash
# Move proposal to archive
mv docs/proposals/FEATURE_NAME_PROPOSAL.md docs/archive/proposals/

# Or delete if not needed for reference
rm docs/proposals/FEATURE_NAME_PROPOSAL.md
```

#### 6.2 Final Checklist
- [ ] Code reviewed and approved
- [ ] Tests passing
- [ ] Documentation complete
- [ ] Proposal archived/deleted
- [ ] Feature branch merged
- [ ] Deployment notes added

## 🚀 Quick Commands

### Start New Feature
```bash
# 1. Create proposal
touch docs/proposals/MY_FEATURE_PROPOSAL.md

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Create basic structure
mkdir -p server/routers/my-feature
mkdir -p app/components/features/MyFeature
touch types/my-feature.ts
```

### Check Existing Patterns
```bash
# Find similar features
grep -r "similar_pattern" . --include="*.ts" --include="*.tsx"

# List all routers
find server/routers -name "*.ts" | head -20

# List all providers
ls -la app/providers/

# Check hook patterns
ls -la app/hooks/
```

## 📊 Feature Complexity Guide

### Small Feature
- Single TRPC endpoint
- Simple UI component
- No new provider needed
- Minimal documentation

**Examples**: Adding a field, simple CRUD operation

### Medium Feature
- Multiple TRPC endpoints
- New screens/components
- May need a hook
- Feature documentation needed

**Examples**: User preferences, basic dashboard

### Large Feature
- Complex router with multiple endpoints
- New provider required
- Multiple screens
- Comprehensive documentation
- May affect existing features

**Examples**: Notifications system, admin panel

### Epic Feature
- Multiple routers
- System-wide changes
- Multiple providers/hooks
- Extensive documentation
- Migration required
- Security review needed

**Examples**: Authentication system, payment integration

## 🎯 Best Practices

### Research Phase
- **DO**: Spend time understanding existing patterns
- **DO**: Check for code reuse opportunities
- **DON'T**: Skip research to save time
- **DON'T**: Ignore existing conventions

### Proposal Phase
- **DO**: Be specific about implementation details
- **DO**: Include time estimates
- **DON'T**: Leave ambiguities
- **DON'T**: Underestimate complexity

### Implementation Phase
- **DO**: Follow existing patterns
- **DO**: Write tests as you go
- **DON'T**: Skip error handling
- **DON'T**: Ignore TypeScript errors

### Documentation Phase
- **DO**: Document while context is fresh
- **DO**: Include examples
- **DON'T**: Leave TODOs in docs
- **DON'T**: Skip documentation for "simple" features

## 📝 Templates

### Quick Proposal Template (Small Features)
```markdown
# [Feature] Quick Proposal

## What
[1-2 sentences describing the feature]

## Why
[Business/user value]

## How
- [ ] Add type to `/types/[domain].ts`
- [ ] Create endpoint in `[router].ts`
- [ ] Add UI in `[component].tsx`
- [ ] Test manually

## Estimated Effort
[Small/Medium/Large]
```

### Research Log Template
```markdown
# [Feature] Research Log

## Date: YYYY-MM-DD

### Findings
- Found similar pattern in: [file:line]
- Existing utility that can be reused: [function]
- Dependencies needed: [package]

### Decisions
- Will use [approach] because [reason]
- Won't use [alternative] because [reason]

### Questions
- [ ] How should we handle [edge case]?
- [ ] Should this integrate with [existing feature]?
```

## 🔄 Continuous Improvement

After each feature:
1. Review what went well
2. Identify pain points
3. Update this guide with learnings
4. Share knowledge with team

## 🚨 When to Deviate

This workflow can be adjusted for:
- **Hotfixes**: Skip proposal, fast-track implementation
- **Experiments**: Light proposal, focus on POC
- **Refactoring**: Technical proposal, no user-facing changes
- **Bug fixes**: Skip proposal, document in issue/PR

Remember: The goal is consistency and quality, not bureaucracy. Use judgment to adapt the process as needed.