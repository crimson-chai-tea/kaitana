/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
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

  // 2. API: SHADOW INTERVIEW RAG CHATBOT
  app.post('/api/chat', async (req, res) => {
    const { profileName, userBio, messages, files } = req.body;

    if (!ai) {
      return res.status(200).json({
        answer: 'API key verification issue: The system is running in offline sandbox backup mode due to a missing GEMINI_API_KEY. To activate live AI-powered RAG testing, please configure your key in **Settings > Secrets**.',
        citations: ['Sandbox_Fallback_Notice.txt'],
        isUnavailable: true
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

      // Construct the structured prompt enforcing strict zero-hallucination policies
      const systemPrompt = `You are the verified digital AI "Shadow" representing ${profileName} in a job interview / recruitment discussion.
Their background, context, and philosophical statements: "${userBio}".

CRITICAL DISCIPLINE:
You must speak ONLY on behalf of ${profileName} and answer recruiter questions conversationally using ONLY the provided verified database below.
- DO NOT hallucinate.
- DO NOT invent, assume, extrapolate, or embellish achievements, projects, or background.
- If the recruiter's prompt asks for details not directly verified in the databases below, or if you cannot find a clear factual reference to back it up, you must immediately return an isUnavailable flag set to true and output exactly: "The user has not provided verified information on that topic."
- Do not make up answers even if they seem minor or logical (e.g., standard tools, specific libraries) unless they are in the database.
- You must reference real file sources in your answer when available.

DATABASE OF VERIFIED DOCUMENTS:
==================================
${dbContext}
==================================`;

      // Map conversation logs to text representation or use direct chat formatting
      const lastUserMsg = messages[messages.length - 1]?.text || '';
      const conversationHistory = messages.slice(0, -1).map((m: any) => `${m.role === 'user' ? 'Recruiter' : 'AI Shadow'}: ${m.text}`).join('\n');

      const promptText = `CONVERSATION RECORD SO FAR:
${conversationHistory}

Recruiter is asking now: "${lastUserMsg}"

Examine the database carefully. Return a JSON structure containing:
1. "answer": Your helpful, professional, conversational response grounded ONLY in the database, written in 1st/3rd person representing ${profileName}. Or "The user has not provided verified information on that topic." if missing.
2. "citations": An array of file titles (e.g., ["Sarah_Vance_Resume_2026.pdf"]) which were actually scanned and verified to produce this answer. Leave empty if information is not found.
3. "isUnavailable": Boolean set to true if the question is unanswerable from the database.`;

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
            },
            required: ['answer', 'citations', 'isUnavailable'],
          },
        },
      });

      const resultText = response.text || '{}';
      const jsonParsed = JSON.parse(resultText.trim());
      return res.json(jsonParsed);

    } catch (error: any) {
      console.error('Gemini error during shadow interview:', error);
      return res.status(200).json({
        answer: `I encountered an unexpected issue processing the response (${error?.message || 'Verification service error'}).`,
        citations: [],
        isUnavailable: true
      });
    }
  });

  // 3. API: SMART PORTFOLIO RECOMMENDER / AUDIT
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
