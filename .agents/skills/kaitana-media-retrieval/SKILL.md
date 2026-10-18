---
name: kaitana-media-retrieval
description: >-
  Use this skill when developing media management layers for conversational AI,
  implementing broad collection vs granular tag visual retrieval, or rendering
  interactive media cards within streaming chat interfaces.
---

# Visual Media Retrieval & Showcase Architecture for AI Agents

This skill provides the data model, retrieval logic, and rendering patterns developed in Kaitana for allowing conversational AI clones to showcase verified visual work (agricultural telemetry, design portfolios, engineering diagrams) during interviews.

## 1. Data Schema & Relationships

```typescript
export interface MediaImage {
  id: string;
  url: string;
  caption: string;
  created_at: string;
  selectionIds: string[];  // Belongs to one or more selections (Many-to-Many)
  tags: string[];          // Granular labels: ['blueberry', 'harvest', 'fieldwork']
}

export interface MediaSelection {
  id: string;
  name: string;            // Broad category: 'Farming Projects', 'Artwork'
  description?: string;
}
```

## 2. Dual-Tier Retrieval Logic in Conversational AI

When a recruiter or user asks for visual evidence, the AI clone evaluates whether to retrieve a **Broad Collection** or **Specific Tagged Items**:

### Tier A: Selection Retrieval (Broad Category)
- **Trigger**: Recruiter asks for an entire domain or high-level category (e.g., *"Show me your farming projects"* or *"Let me see your artwork"*).
- **Execution**:
  1. Match query intent against `selections.find(s => s.name.toLowerCase().includes(term))`.
  2. Retrieve all images where `image.selectionIds.includes(selection.id)`.
  3. Return the collection header with interactive gallery cards.

### Tier B: Tag Retrieval (Specific Detail)
- **Trigger**: Recruiter asks about a specific technique, tool, or crop (e.g., *"Do you have photos of work on blueberry farms?"* or *"Show me your soil sensor setup"*).
- **Execution**:
  1. Extract keywords/tags from user query (`tags: ['blueberry']`).
  2. Query images where `image.tags.some(t => t.toLowerCase() === tag.toLowerCase())`.
  3. Return only the precisely targeted images matching the tag.

## 3. Inline Chat Rendering Pattern

Images retrieved by the AI clone must not be raw markdown links. They should render as rich, interactive media cards directly in the chat stream:
- **Thumbnail Card**: Clean aspect ratio, title/caption overlay, and tag badges.
- **Lightbox / Expand Modal**: Clicking any card opens a full-resolution modal with navigation between related images in the collection.
- **Accessible Fallback**: Clean alt text and fallback placeholder if the image URL fails to load.

## 4. Dual-Layer Resilient Persistence

To prevent user uploaded images from being lost on page refresh or browser cache clears:
1. **Local State**: Instant UI updates via React state and `localStorage` caching.
2. **Permanent Backend Sync**:
   ```typescript
   fetch('/api/media/save-all', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       profileId: activeProfileId,
       images: updatedImages,
       selections: updatedSelections
     })
   }).catch(e => console.warn('Permanent media sync failed:', e));
   ```
3. Always support on-the-fly selection creation in both the Upload dialog and the Collections management tab.
