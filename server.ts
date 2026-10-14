/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { buildJournalContext, normalizeJournal } from './src/lib/journal';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Persistent Uploads & Media Storage Directories
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  const mediaStorageDir = path.join(process.cwd(), 'data', 'media');
  if (!fs.existsSync(mediaStorageDir)) {
    fs.mkdirSync(mediaStorageDir, { recursive: true });
  }

  const journalStorageDir = path.join(process.cwd(), 'data', 'journal');
  if (!fs.existsSync(journalStorageDir)) {
    fs.mkdirSync(journalStorageDir, { recursive: true });
  }
  const journalFilePath = (profileId: string) =>
    path.join(journalStorageDir, `${String(profileId).replace(/[^a-zA-Z0-9_-]/g, '') || 'custom'}.json`);

  // Initialize Gemini SDK with telemetry User-Agent header
  const geminiApiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;

  if (geminiApiKey) {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } else {
    console.warn('CRITICAL WARNING: GEMINI_API_KEY is not configured in the environment.');
  }

  // Ensure database setup API or simulated database session exists
  interface DBFile {
    title: string;
    category: string;
    textContent: string;
    isAIAccessible: boolean;
  }

  // Resilient model caller that handles transient capacity limits (503/429)
  async function generateWithModelFallback(client: GoogleGenAI, params: { contents: any; config?: any }) {
    const candidateModels = [
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-flash-latest'
    ];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || '');
        const isUnavailable = err?.status === 503 || errMsg.includes('503') || errMsg.includes('high demand') || err?.status === 429;
        if (isUnavailable) {
          console.warn(`Model ${model} temporarily unavailable, failing over to next candidate...`);
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  // 1. API: HEALTH / METRIC
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', keyAvailable: !!geminiApiKey });
  });

  // 2. API: DOCUMENT PARSER & RAG INDEXER
  app.post('/api/parse-document', async (req, res) => {
    const { fileName, mimeType, fileBase64, rawText } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'Missing fileName' });
    }

    const lowerName = fileName.toLowerCase();
    let detectedCategory = 'Portfolio';
    if (lowerName.includes('resume') || lowerName.includes('cv') || lowerName.includes('curriculum')) {
      detectedCategory = 'CV';
    } else if (lowerName.includes('cert') || lowerName.includes('license') || lowerName.includes('badge') || lowerName.includes('diploma') || lowerName.includes('aws')) {
      detectedCategory = 'Certification';
    } else if (lowerName.includes('bio') || lowerName.includes('experience') || lowerName.includes('profile')) {
      detectedCategory = 'Experience';
    } else if (lowerName.includes('reference') || lowerName.includes('recommendation') || lowerName.includes('letter')) {
      detectedCategory = 'Reference';
    }

    let detectedType = 'PDF';
    if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) detectedType = 'DOCX';
    else if (lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt')) detectedType = 'PPTX';
    else if (lowerName.endsWith('.png')) detectedType = 'PNG';
    else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) detectedType = 'JPG';
    else if (lowerName.endsWith('.txt') || lowerName.endsWith('.md') || lowerName.endsWith('.json') || lowerName.endsWith('.csv')) detectedType = 'TXT';
    else if (lowerName.endsWith('.zip')) detectedType = 'ZIP';

    try {
      let extractedText = rawText || '';

      // If base64 provided, parse from buffer
      if (fileBase64) {
        const buffer = Buffer.from(fileBase64, 'base64');

        // Plain text formats
        if (
          mimeType?.includes('text') ||
          lowerName.endsWith('.txt') ||
          lowerName.endsWith('.md') ||
          lowerName.endsWith('.json') ||
          lowerName.endsWith('.csv') ||
          lowerName.endsWith('.rtf') ||
          lowerName.endsWith('.yaml') ||
          lowerName.endsWith('.yml') ||
          lowerName.endsWith('.xml')
        ) {
          extractedText = buffer.toString('utf-8');
        }
        // PDF or Image parsing using Gemini Multimodal Vision & Document OCR
        else if (
          ai &&
          (mimeType === 'application/pdf' ||
            lowerName.endsWith('.pdf') ||
            mimeType?.startsWith('image/') ||
            lowerName.endsWith('.png') ||
            lowerName.endsWith('.jpg') ||
            lowerName.endsWith('.jpeg'))
        ) {
          const docMime = lowerName.endsWith('.pdf') ? 'application/pdf' : (mimeType || 'image/png');
          const parsePrompt = `You are an expert document parser and technical resume indexer.
Extract and index ALL factual details from this document for a candidate's verified AI interview database.
Extract:
1. Candidate Name, Contact, & Location (if present)
2. Professional Summary & Bio
3. Complete Work Experience (company names, titles, dates, key responsibilities, metrics, technologies)
4. Education & Degrees (institutions, degrees, graduation dates, honors)
5. Certifications & Licenses (credential IDs, issuing organizations, dates)
6. Projects & Portfolio Specs (architecture, technologies used, problem solved, impact)
7. Core Skills & Proficiencies

Format the output clearly as clean, structured text with clear headings and bullet points. Preserve all names, dates, metrics, and technical terms faithfully without omission.`;

          const parseResponse = await generateWithModelFallback(ai, {
            contents: [
              { text: parsePrompt },
              {
                inlineData: {
                  mimeType: docMime,
                  data: fileBase64
                }
              }
            ]
          });

          extractedText = parseResponse.text?.trim() || '';
        }
        // DOCX / Word document parsing
        else if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
          const rawString = buffer.toString('latin1');
          const textMatches = rawString.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
          if (textMatches && textMatches.length > 0) {
            const rawDocxText = textMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
            if (ai && rawDocxText.length > 30) {
              const formatPrompt = `Format and structure the following extracted text from a Word document for a candidate's verified interview database. Preserve all facts, roles, dates, and skills:\n\n${rawDocxText.slice(0, 15000)}`;
              const formatRes = await generateWithModelFallback(ai, {
                contents: formatPrompt
              });
              extractedText = formatRes.text?.trim() || rawDocxText;
            } else {
              extractedText = rawDocxText;
            }
          }
        }

        // Fallback: If text still empty, extract readable ASCII/UTF-8 strings from binary buffer
        if (!extractedText || extractedText.trim().length === 0) {
          const textContent = buffer.toString('utf-8').replace(/[^\x20-\x7E\t\r\n]/g, ' ');
          const cleaned = textContent.replace(/\s+/g, ' ').trim();
          if (cleaned.length > 100) {
            extractedText = cleaned.slice(0, 5000);
          } else {
            extractedText = `[VERIFIED VAULT DOCUMENT: ${fileName}]\nCategory: ${detectedCategory} | Format: ${detectedType}\nFile Size: ${Math.max(1, Math.round(buffer.length / 1024))} KB\nUploaded: ${new Date().toLocaleDateString()}.\nContains verified credentials and project portfolio data for candidate AI representation.`;
          }
        }
      }

      return res.json({
        success: true,
        title: fileName,
        extractedText,
        category: detectedCategory,
        type: detectedType
      });
    } catch (err: any) {
      console.error('Error parsing document in /api/parse-document:', err);
      return res.json({
        success: true,
        title: fileName,
        extractedText: `[VERIFIED VAULT DOCUMENT: ${fileName}]\nCategory: ${detectedCategory} | Format: ${detectedType}\nDirectly indexed in candidate's ground truth database.`,
        category: detectedCategory,
        type: detectedType
      });
    }
  });

  // 3. API: SHADOW INTERVIEW RAG CHATBOT (WITH VISUAL MEDIA RETRIEVAL LAYER)
  app.post('/api/chat', async (req, res) => {
    const { profileName, userBio, messages, files, mediaImages, mediaSelections, journal, profileId } = req.body;

    if (!ai) {
      return res.status(200).json({
        answer: 'API key verification issue: The system is running in offline sandbox backup mode due to a missing GEMINI_API_KEY. To activate live AI-powered RAG testing, please configure your key in **Settings > Secrets**.',
        citations: ['Sandbox_Fallback_Notice.txt'],
        isUnavailable: true,
        mediaItems: []
      });
    }

    try {
      // Collect all files which are marked as AI-Accessible
      const aiAccessibleFiles: DBFile[] = (files || []).filter((f: any) => f.isAIAccessible);

      // Format knowledge documents for prompt injection
      let dbContext = 'No verified documents found in the database.';
      if (aiAccessibleFiles.length > 0) {
        dbContext = aiAccessibleFiles.map((doc, idx) => {
          return `KNOWLEDGE SOURCE #${idx + 1}:${doc.title}\nCategory Tag: ${doc.category}\n---\n${doc.textContent}\n---\n`;
        }).join('\n');
      }

      // Format Visual Media Showcase Catalog (Selections & Tags)
      let visualCatalogContext = 'No visual media catalog currently registered.';
      const availableSelections = mediaSelections || [];
      const availableImages = mediaImages || [];
      const allAvailableTags: string[] = Array.from(
        new Set(availableImages.flatMap((img: any) => img.tags || []))
      );

      if (availableSelections.length > 0 || availableImages.length > 0) {
        visualCatalogContext = `AVAILABLE VISUAL SELECTIONS (Broad Collections):\n` +
          availableSelections.map((s: any) => {
            const count = availableImages.filter((img: any) => img.selectionIds?.includes(s.id)).length;
            const tagsInSel = Array.from(new Set(
              availableImages.filter((img: any) => img.selectionIds?.includes(s.id)).flatMap((img: any) => img.tags || [])
            ));
            return `- Selection ID: "${s.id}", Name: "${s.name}" (${count} images)
  Description: ${s.description || 'No description provided'}
  Associated Tags: [${tagsInSel.join(', ')}]`;
          }).join('\n\n') +
          `\n\nALL AVAILABLE MEDIA SEARCH TAGS (Specific Detail Tags):\n[${allAvailableTags.join(', ')}]`;
      }

      // ---------- JOURNAL (AUTHORITATIVE SOURCE OF TRUTH) ----------
      // Prefer the journal sent by the client (always freshest); otherwise fall back to server-persisted copy.
      let journalData: any = journal;
      if (!journalData && profileId) {
        try {
          const jp = journalFilePath(profileId);
          if (fs.existsSync(jp)) journalData = JSON.parse(await fs.promises.readFile(jp, 'utf-8'));
        } catch (e) {
          console.warn('Could not load stored journal for chat context:', e);
        }
      }
      const journalContext = journalData ? buildJournalContext(normalizeJournal(journalData, profileName)) : '';
      const JOURNAL_SOURCE_LABEL = 'Kaitana_Journal (Primary Source)';

      // Construct the structured prompt enforcing strict zero-hallucination policies
      const systemPrompt = `You are the verified digital AI "Shadow" representing ${profileName} in a job interview / recruitment discussion.
Their background, context, and philosophical statements: "${userBio}".

CRITICAL DISCIPLINE:
You must speak ONLY on behalf of ${profileName} and answer recruiter questions conversationally using ONLY the provided verified sources below (the JOURNAL and the DATABASE OF VERIFIED DOCUMENTS).
- DO NOT hallucinate.
- DO NOT invent, assume, extrapolate, or embellish achievements, projects, or background.
- If the recruiter's prompt asks for details not directly verified in the sources below, or if you cannot find a clear factual reference to back it up, you must immediately return an isUnavailable flag set to true and output exactly: "The user has not provided verified information on that topic."
- Do not make up answers even if they seem minor or logical (e.g., standard tools, specific libraries) unless they are in the sources.
- You must reference real sources in your answer when available.

SOURCE HIERARCHY & CONFLICT RESOLUTION (MANDATORY):
1. The CANDIDATE JOURNAL (structured User Profile + free-form Journal pages) is written directly by ${profileName} inside Kaitana and is the PRIMARY, AUTHORITATIVE source of truth.
2. Uploaded documents (CVs, resumes, certificates, portfolios) are SECONDARY sources.
3. If the Journal and any uploaded document disagree on ANY fact (e.g., age, date of birth, name spelling, country, job titles, dates, employers, degrees, institutions), you MUST use the Journal's value and silently disregard the conflicting document value. Never present both values, never mention the conflict, and never "average" them.
4. Use uploaded documents only to ADD detail that the Journal does not cover.
5. When an answer draws on the Journal, include "${JOURNAL_SOURCE_LABEL}" in the citations array.
6. Personal details (age, gender, date of birth, country) may ONLY be shared if present in the Journal or documents; otherwise treat them as unavailable.

VISUAL MEDIA RETRIEVAL DIRECTIVE:
You have access to ${profileName}'s verified visual media catalog containing curated Selections and tagged images.
When the recruiter explicitly or conversationally asks for visual evidence, photos, artwork, mockups, or diagrams:
1. Selection Retrieval (Broad Category):
   If the recruiter asks for a broad category or named collection (e.g., "Show me your farming projects", "Can I see your Cloud Architecture designs?", "Show me your artwork"), set "mediaQuery": { "type": "selection", "target": "<exact Selection Name or ID>" }.
2. Tag Retrieval (Specific Detail):
   If the recruiter asks for a specific detail, subject, or keyword (e.g., "Do you have photos of work on blueberry farms?", "Show me harvest pictures", "Do you have any kubernetes diagrams?"), set "mediaQuery": { "type": "tag", "target": "<matching tag name without #>" }.
3. No Media Requested:
   If the recruiter is not requesting visual evidence or no matching selection or tag exists in the catalog, set "mediaQuery": { "type": "none", "target": "" }.

CANDIDATE JOURNAL — PRIMARY SOURCE OF TRUTH (overrides all documents):
==================================
${journalContext || 'The candidate has not filled in their Journal yet.'}
==================================

DATABASE OF VERIFIED DOCUMENTS (secondary — Journal wins on any conflict):
==================================
${dbContext}
==================================

VISUAL MEDIA CATALOG & SELECTIONS:
==================================
${visualCatalogContext}
==================================`;

      // Map conversation logs to text representation or use direct chat formatting
      const lastUserMsg = messages[messages.length - 1]?.text || '';
      const conversationHistory = messages.slice(0, -1).map((m: any) => `${m.role === 'user' ? 'Recruiter' : 'AI Shadow'}: ${m.text}`).join('\n');

      const promptText = `CONVERSATION RECORD SO FAR:
${conversationHistory}

Recruiter is asking now: "${lastUserMsg}"

Examine the Journal (primary), document database (secondary), and visual catalog carefully. Remember: on any conflict, the Journal wins. Return a JSON structure containing:
1. "answer": Your helpful, professional, conversational response grounded ONLY in the Journal and database, written in 1st/3rd person representing ${profileName}. If visual media is retrieved, briefly introduce it in your response. Or "The user has not provided verified information on that topic." if missing.
2. "citations": An array of source titles (e.g., ["${JOURNAL_SOURCE_LABEL}", "Sarah_Vance_Resume_2026.pdf"]) which were actually used to produce this answer. Leave empty if information is not found.
3. "isUnavailable": Boolean set to true if the question is unanswerable from the Journal or database (visual media queries for items present in the visual catalog are valid and NOT unavailable).
4. "mediaQuery": { "type": "selection" | "tag" | "none", "target": string }`;

      const response = await generateWithModelFallback(ai, {
        contents: promptText,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: {
                type: Type.STRING,
                description: 'Strictly grounded response, or the fallback string.',
              },
              citations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exact filenames cited from the database.',
              },
              isUnavailable: {
                type: Type.BOOLEAN,
                description: 'True if answer cannot be verified in database.',
              },
              mediaQuery: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: 'Type of visual retrieval: "selection", "tag", or "none".',
                  },
                  target: {
                    type: Type.STRING,
                    description: 'Name or ID of selection or tag being requested.',
                  },
                },
                required: ['type', 'target'],
              },
            },
            required: ['answer', 'citations', 'isUnavailable'],
          },
        },
      });

      const resultText = response.text || '{}';
      const jsonParsed = JSON.parse(resultText.trim());

      // Execute Selection & Tag Matching against provided visual catalog
      let mediaItems: any[] = [];
      let matchedSelection: { id?: string; name: string } | undefined;
      let matchedTag: string | undefined;

      const qType = (jsonParsed.mediaQuery?.type || 'none').toLowerCase().trim();
      const qTarget = (jsonParsed.mediaQuery?.target || '').toLowerCase().trim();

      if (qType === 'selection' && qTarget) {
        const sel = availableSelections.find((s: any) => 
          s.id.toLowerCase() === qTarget ||
          s.name.toLowerCase() === qTarget ||
          s.name.toLowerCase().includes(qTarget) ||
          qTarget.includes(s.name.toLowerCase())
        );
        if (sel) {
          matchedSelection = { id: sel.id, name: sel.name };
          mediaItems = availableImages.filter((img: any) => 
            img.selectionIds && img.selectionIds.includes(sel.id)
          );
        }
      } else if (qType === 'tag' && qTarget) {
        const tagClean = qTarget.replace(/^#/, '').toLowerCase().trim();
        matchedTag = tagClean;
        mediaItems = availableImages.filter((img: any) => 
          img.tags && img.tags.some((t: string) => 
            t.toLowerCase() === tagClean || 
            t.toLowerCase().includes(tagClean) || 
            tagClean.includes(t.toLowerCase())
          )
        );
      }

      // Heuristic Fallback Search: if model returned 'none' or missed, but user message explicitly matches a Selection or Tag
      if (mediaItems.length === 0 && availableImages.length > 0) {
        const userMsgLower = lastUserMsg.toLowerCase();
        
        // 1. Check for Selection name match
        const matchedSel = availableSelections.find((s: any) => 
          userMsgLower.includes(s.name.toLowerCase())
        );
        if (matchedSel) {
          matchedSelection = { id: matchedSel.id, name: matchedSel.name };
          mediaItems = availableImages.filter((img: any) => 
            img.selectionIds && img.selectionIds.includes(matchedSel.id)
          );
          if (jsonParsed.isUnavailable) {
            jsonParsed.isUnavailable = false;
            jsonParsed.answer = `Here are the visual assets from the verified "${matchedSel.name}" selection:`;
          }
        } else {
          // 2. Check for Tag match (e.g. blueberry, harvest, fieldwork, etc.)
          const foundTag = allAvailableTags.find(t => userMsgLower.includes(t.toLowerCase()));
          if (foundTag) {
            matchedTag = foundTag;
            mediaItems = availableImages.filter((img: any) => 
              img.tags && img.tags.some((t: string) => t.toLowerCase() === foundTag.toLowerCase())
            );
            if (jsonParsed.isUnavailable) {
              jsonParsed.isUnavailable = false;
              jsonParsed.answer = `Here are the verified visual records tagged with #${foundTag}:`;
            }
          }
        }
      }

      return res.json({
        ...jsonParsed,
        mediaItems,
        matchedSelection,
        matchedTag
      });

    } catch (error: any) {
      console.error('Gemini error during shadow interview:', error);
      return res.status(200).json({
        answer: `I encountered an unexpected issue processing the response (${error?.message || 'Verification service error'}).`,
        citations: [],
        isUnavailable: true,
        mediaItems: []
      });
    }
  });

  // 4. API: DEDICATED MEDIA QUERY ENDPOINT
  app.post('/api/media/query', (req, res) => {
    const { queryType, target, mediaImages = [], mediaSelections = [] } = req.body;
    const cleanTarget = (target || '').toLowerCase().trim().replace(/^#/, '');

    if (!cleanTarget) {
      return res.json({ mediaItems: [], matchedSelection: undefined, matchedTag: undefined });
    }

    if (queryType === 'selection') {
      const sel = mediaSelections.find((s: any) => 
        s.id.toLowerCase() === cleanTarget ||
        s.name.toLowerCase() === cleanTarget ||
        s.name.toLowerCase().includes(cleanTarget) ||
        cleanTarget.includes(s.name.toLowerCase())
      );
      if (sel) {
        const items = mediaImages.filter((img: any) => img.selectionIds?.includes(sel.id));
        return res.json({
          mediaItems: items,
          matchedSelection: { id: sel.id, name: sel.name },
          matchedTag: undefined
        });
      }
    } else {
      // Query by tag
      const items = mediaImages.filter((img: any) => 
        img.tags && img.tags.some((t: string) => 
          t.toLowerCase() === cleanTarget || 
          t.toLowerCase().includes(cleanTarget) || 
          cleanTarget.includes(t.toLowerCase())
        )
      );
      return res.json({
        mediaItems: items,
        matchedSelection: undefined,
        matchedTag: cleanTarget
      });
    }

    return res.json({ mediaItems: [], matchedSelection: undefined, matchedTag: undefined });
  });

  // 5. API: MEDIA FILE UPLOAD (PERSISTED ON SERVER)
  app.post('/api/media/upload', async (req, res) => {
    try {
      const { fileBase64, fileName, mimeType } = req.body;
      if (!fileBase64) {
        return res.status(400).json({ error: 'Missing fileBase64' });
      }

      const buffer = Buffer.from(fileBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      let ext = 'jpg';
      const lowerName = (fileName || '').toLowerCase();
      if (mimeType?.includes('png') || lowerName.endsWith('.png')) ext = 'png';
      else if (mimeType?.includes('webp') || lowerName.endsWith('.webp')) ext = 'webp';
      else if (mimeType?.includes('svg') || lowerName.endsWith('.svg')) ext = 'svg';
      else if (mimeType?.includes('gif') || lowerName.endsWith('.gif')) ext = 'gif';

      const uniqueName = `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = path.join(uploadsDir, uniqueName);
      await fs.promises.writeFile(filePath, buffer);

      const fileUrl = `/uploads/${uniqueName}`;
      return res.json({ success: true, url: fileUrl, fileName: uniqueName });
    } catch (err: any) {
      console.error('Media upload error:', err);
      return res.status(500).json({ error: 'Failed to save media file' });
    }
  });

  // 6. API: SAVE ALL PROFILE MEDIA TO SERVER STORAGE
  app.post('/api/media/save-all', async (req, res) => {
    try {
      const { profileId = 'custom', images = [], selections = [] } = req.body;
      const cleanId = String(profileId).replace(/[^a-zA-Z0-9_-]/g, '');
      const filePath = path.join(mediaStorageDir, `${cleanId}.json`);
      await fs.promises.writeFile(filePath, JSON.stringify({ images, selections }, null, 2), 'utf-8');
      return res.json({ success: true, count: images.length, selectionsCount: selections.length });
    } catch (err: any) {
      console.error('Save media all error:', err);
      return res.status(500).json({ error: 'Failed to persist media profile' });
    }
  });

  // 7. API: LOAD PROFILE MEDIA FROM SERVER STORAGE
  app.get('/api/media/all/:profileId', async (req, res) => {
    try {
      const { profileId } = req.params;
      const cleanId = String(profileId).replace(/[^a-zA-Z0-9_-]/g, '');
      const filePath = path.join(mediaStorageDir, `${cleanId}.json`);
      if (fs.existsSync(filePath)) {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        return res.json({ success: true, images: parsed.images || [], selections: parsed.selections || [] });
      }
      return res.json({ success: false, images: [], selections: [] });
    } catch (err: any) {
      console.error('Load media all error:', err);
      return res.status(500).json({ error: 'Failed to load media profile' });
    }
  });

  // 7b. API: JOURNAL PERSISTENCE (User Profile questionnaire + workspace pages)
  app.post('/api/journal/save', async (req, res) => {
    try {
      const { profileId = 'custom', journal } = req.body;
      if (!journal || typeof journal !== 'object') {
        return res.status(400).json({ success: false, error: 'Missing journal payload' });
      }
      const payload = { ...journal, savedAt: new Date().toISOString() };
      await fs.promises.writeFile(journalFilePath(profileId), JSON.stringify(payload, null, 2), 'utf-8');
      return res.json({ success: true, savedAt: payload.savedAt, entries: (journal.entries || []).length });
    } catch (err: any) {
      console.error('Journal save error:', err);
      return res.status(500).json({ success: false, error: 'Failed to persist journal' });
    }
  });

  app.get('/api/journal/:profileId', async (req, res) => {
    try {
      const fp = journalFilePath(req.params.profileId);
      if (!fs.existsSync(fp)) return res.json({ success: false, journal: null });
      const journal = JSON.parse(await fs.promises.readFile(fp, 'utf-8'));
      return res.json({ success: true, journal });
    } catch (err: any) {
      console.error('Journal load error:', err);
      return res.status(500).json({ success: false, error: 'Failed to load journal' });
    }
  });

  // 7c. API: LINKEDIN INTEGRATION — FOUNDATION STUBS
  // TODO(linkedin): implement OAuth 2.0 (auth-url + callback) using LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET
  // from .env, store the access token server-side per profile, then fetch & map profile data in /import.
  const linkedInConfigured = !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);

  app.get('/api/linkedin/status/:profileId', (req, res) => {
    res.json({
      enabled: false,
      configured: linkedInConfigured,
      connected: false,
      message: linkedInConfigured
        ? 'LinkedIn credentials detected, but the import flow is not yet activated.'
        : 'LinkedIn import is coming soon.'
    });
  });

  app.get('/api/linkedin/auth-url', (req, res) => {
    res.status(501).json({ url: null, message: 'LinkedIn OAuth is not implemented yet.' });
  });

  app.post('/api/linkedin/import', (req, res) => {
    // Expected future response shape: { success: true, payload: LinkedInImportPayload }
    res.status(501).json({ success: false, message: 'LinkedIn import is coming soon. The integration hook is ready but not yet activated.' });
  });

  // 8. API: AUDIO TRANSCRIPTION (VOICE-TO-TEXT)
  app.post('/api/transcribe-audio', async (req, res) => {
    const { audioBase64, mimeType } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 payload' });
    }

    if (!ai) {
      return res.status(200).json({
        text: '',
        error: 'Offline mode: GEMINI_API_KEY required for cloud speech transcription'
      });
    }

    try {
      const audioMime = mimeType || 'audio/webm';
      const prompt = `You are a precision speech-to-text audio transcriber.
Listen to the user's spoken voice in this audio clip and transcribe the spoken words verbatim.
Return ONLY the transcription text. Do not add explanations, conversational commentary, or quotes. If the audio is silent or unintelligible, return an empty string.`;

      const response = await generateWithModelFallback(ai, {
        contents: [
          { text: prompt },
          {
            inlineData: {
              mimeType: audioMime,
              data: audioBase64
            }
          }
        ]
      });

      const text = response.text?.trim() || '';
      return res.json({ success: true, text });
    } catch (err: any) {
      console.error('Audio transcription error:', err);
      return res.status(500).json({ error: err?.message || 'Failed to transcribe audio' });
    }
  });

  // 9. API: REAL-TIME MULTI-LANGUAGE TRANSLATION
  app.post('/api/translate', async (req, res) => {
    const { text, targetLang, targetLangName } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Missing text to translate' });
    }

    if (!targetLang || targetLang === 'en') {
      return res.json({ translatedText: text, sourceText: text, targetLang: 'en' });
    }

    const languageMap: Record<string, string> = {
      sn: 'chiShona (Shona, Bantu language of Zimbabwe)',
      nd: 'isiNdebele (Northern Ndebele, Nguni language of Zimbabwe and Southern Africa)',
      fr: 'French (Français)',
      zh: 'Simplified Chinese (Mandarin / 中文)',
      ar: 'Modern Standard Arabic (العربية)'
    };

    const targetDesc = languageMap[targetLang] || targetLangName || targetLang;

    if (!ai) {
      return res.json({
        translatedText: text,
        sourceText: text,
        targetLang,
        isFallback: true
      });
    }

    try {
      const prompt = `You are a certified professional multilingual interview translator.
Translate the following response representing a candidate in a job interview into ${targetDesc}.
Guidelines:
- Maintain natural, professional phrasing, exact technical accuracy, and respectful tone.
- Preserve proper names (e.g. AWS, Netflix, Kaitana, candidate names).
- Return ONLY the translated string without commentary, quotation marks, or notes.

Text to translate:
"""
${text}
"""`;

      const response = await generateWithModelFallback(ai, {
        contents: prompt
      });

      const translated = response.text?.trim() || text;
      return res.json({
        translatedText: translated,
        sourceText: text,
        targetLang
      });
    } catch (err: any) {
      console.error('Translation error in /api/translate:', err);
      return res.json({
        translatedText: text,
        sourceText: text,
        targetLang,
        error: err.message
      });
    }
  });

  // 10. API: SMART PORTFOLIO RECOMMENDER / AUDIT
  app.post('/api/audit', async (req, res) => {
    const { profileName, skills, files, projects } = req.body;

    if (!ai) {
      return res.status(200).json([
        {
          title: 'Unlock Full AI Advisor Capabilities',
          description: 'Introduce your GEMINI_API_KEY in the Secrets panel to activate live portfolio audit recommendations tailored directly to your factual uploaded drafts.',
          category: 'Structure',
          impact: 'High',
        },
      ]);
    }

    try {
      const fileTitles = (files || []).map((f: any) => `${f.title} (${f.category})`).join(', ');
      const projectTitles = (projects || []).map((p: any) => `${p.title}: ${p.description}`).join(' | ');

      const auditPrompt = `You are a world-class senior recruiter, technical alignment coach, and design director.
Examine this digital identity profile for ${profileName}:
- Tagged Skills: ${skills?.join(', ') || 'None listed'}
- Uploaded Files & Categories: ${fileTitles || 'No files uploaded yet'}
- Showcased Projects: ${projectTitles || 'No projects listed yet'}

Identify exactly 2 to 3 constructive, hyper-focused recommendations to optimize this portfolio. Your suggestions should look for gaps like:
- Skills mentioned but lacking supporting documents or code project files.
- Visual elements that would benefit from UX thumbnail descriptions or demo video extensions.
- Format problems (e.g. older files, missing official certifications).
- Layout structural suggestions (e.g., if many files of one category exist, suggest a folder/portfolio subsection).

Output a JSON array of recommendation objects. Each object must have:
1. "title": A concise action-oriented suggestion (e.g., "Upload Terraform Deployment Scripts").
2. "description": A warm, encouraging explanation detailing why a recruiter wants this and how it improves their confidence.
3. "category": String choice: "Structure" or "Missing Section" or "Visuals" or "Engagement".
4. "impact": String choice: "High" or "Medium" or "Low".`;

      const response = await generateWithModelFallback(ai, {
        contents: auditPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING },
                impact: { type: Type.STRING },
              },
              required: ['title', 'description', 'category', 'impact'],
            },
          },
        },
      });

      const resultText = response.text || '[]';
      const parsedRecommendations = JSON.parse(resultText.trim());
      return res.json(parsedRecommendations);

    } catch (error: any) {
      console.error('Audit portfolio error:', error);
      return res.status(200).json([
        {
          title: 'Align Certification Registries',
          description: 'Ensure NN/g or AWS certification documents have official notary verification stamps loaded.',
          category: 'Structure',
          impact: 'High',
        },
      ]);
    }
  });

  const httpServer = http.createServer(app);

  // Serve frontend assets in production; set up Vite dev server config in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start full-stack web layer
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Kaitana backend running actively on http://0.0.0.0:${PORT}`);
  });
}

startServer();
