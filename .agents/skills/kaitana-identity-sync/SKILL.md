---
name: kaitana-identity-sync
description: >-
  Use this skill when designing or maintaining multi-source identity synchronization,
  resolving conflicts between user-editable profiles and document workspaces (like the Journal),
  managing debounced autosaves, or preventing state clobbering in complex React applications.
---

# Multi-Source Identity Synchronization & Conflict Resolution

This skill captures the core architectural patterns developed in Kaitana for maintaining a unified, authoritative candidate identity across multiple disparate components (Sidebar Identity Modal, User Profile Questionnaire, in-app Document Workspace, and Top Bar controls).

## 1. The Core Rule: Strict Source of Truth Hierarchy

When an AI assistant or application has multiple data sources (e.g. uploaded PDFs/CVs vs. a user's self-authored Journal):
1. **User Journal / Explicit Profile takes strict precedence** over uploaded documents or static resumes.
2. If an uploaded document claims different dates, degree titles, or employment history, the structured Journal overrides it.
3. Timestamping (`updatedAt: ISO string`) must be attached to every profile and journal mutation to allow deterministic conflict resolution.

## 2. Preventing State Clashing Between Components

In Kaitana, identity could be edited in two separate places:
- **Sidebar Quick Edit ("Edit Profile Identity")**: Modifies `user.name`, `title`, `bio`, `skills`.
- **Journal Workspace Questionnaire**: Modifies `journal.profile.firstName`, `surname`, etc.

### The Pitfall Discovered
If one component updates `user.name` but leaves `journal.profile.firstName` and `surname` untouched, a debounced autosave or server hydration from the Journal will immediately overwrite `user.name` back to the old value!

### The Pattern: Bidirectional Atomic Synchronization

Whenever `user` is updated, the associated `journal.profile` must be synchronized in the exact same state transition:

```typescript
const syncJournalWithUser = (journal: JournalData, user: UserProfile): JournalData => {
  const trimmed = (user.name || '').trim();
  const nameParts = trimmed.split(/\s+/);
  const firstName = nameParts[0] || '';
  const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  const existing = journal?.profile || ({} as any);

  return {
    ...journal,
    profile: {
      ...existing,
      firstName,
      surname,
      updatedAt: new Date().toISOString()
    }
  };
};
```

And in the state update handler:
```typescript
const handleUpdateUser = (updatedUser: UserProfile) => {
  const updater = (prev: CandidateState) => {
    const updatedJournal = syncJournalWithUser(prev.journal, updatedUser);

    // Synchronously initiate backend persistence so server never holds stale identity
    fetch('/api/journal/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: activeProfileId, journal: updatedJournal })
    }).catch(err => console.warn('Journal sync error:', err));

    return {
      ...prev,
      user: updatedUser,
      journal: updatedJournal
    };
  };

  setState(updater);
};
```

## 3. Functional State Updates for Asynchronous Workflows

Never spread state directly from closure in asynchronous or frequently triggered event handlers:
- ❌ **Anti-pattern**: `setState({ ...currentState, user: updatedUser })` (causes stale closure bugs during concurrent tab switches or debounce cycles).
- ✅ **Best Practice**: `setState(prev => ({ ...prev, user: updatedUser }))`.

## 4. Input State Synchronization in Nested Modals

When a component contains its own internal form draft state (like `useState(user.name)`):
- Always add an explicit synchronization effect:
  ```typescript
  useEffect(() => {
    setEditName(user.name || '');
    setEditTitle(user.title || '');
    setEditBio(user.bio || '');
    setEditSkills((user.skills || []).join(', '));
  }, [user.name, user.title, user.bio, user.skills]);
  ```
- This ensures desktop sidebars, mobile drawers, and background profile switches always render the live, verified data.
