/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { GoogleDriveFile, GoogleWorkspaceUser } from '../types';

// Initialize Firebase App instance safely without duplicates
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure Google OAuth Provider with Workspace Scopes
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/documents');
provider.addScope('https://www.googleapis.com/auth/documents.readonly');
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.compose');

// In-Memory Token Caching (Strict Security: Never in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initializes the Auth State Listener
 */
export const initWorkspaceAuth = (
  onSuccess?: (user: GoogleWorkspaceUser, token: string) => void,
  onSignedOut?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      onSuccess?.({
        email: user.email || '',
        displayName: user.displayName,
        photoURL: user.photoURL
      }, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        onSignedOut?.();
      }
    }
  });
};

/**
 * Triggers interactive Google Workspace sign-in popup
 */
export const signInWithWorkspace = async (): Promise<{
  user: GoogleWorkspaceUser;
  token: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not retrieve access token from Google identity provider.');
    }

    cachedAccessToken = credential.accessToken;
    const userPayload: GoogleWorkspaceUser = {
      email: result.user.email || '',
      displayName: result.user.displayName,
      photoURL: result.user.photoURL
    };

    return { user: userPayload, token: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

/**
 * Signs out from Google Workspace
 */
export const signOutWorkspace = async (): Promise<void> => {
  cachedAccessToken = null;
  await auth.signOut();
};

/**
 * Retrieves the currently cached in-memory access token
 */
export const getWorkspaceAccessToken = (): string | null => {
  return cachedAccessToken;
};

// -------------------------------------------------------------
// Google Drive API Helpers
// -------------------------------------------------------------

export interface ListDriveFilesOptions {
  query?: string;
  categoryFilter?: 'ALL' | 'DOCS' | 'PDFS' | 'SHEETS';
}

/**
 * Lists files from user's Google Drive
 */
export const listDriveFiles = async (
  token: string, 
  options: ListDriveFilesOptions = {}
): Promise<GoogleDriveFile[]> => {
  const queryConditions: string[] = ['trashed = false'];

  if (options.categoryFilter === 'DOCS') {
    queryConditions.push("mimeType = 'application/vnd.google-apps.document'");
  } else if (options.categoryFilter === 'PDFS') {
    queryConditions.push("mimeType = 'application/pdf'");
  } else if (options.categoryFilter === 'SHEETS') {
    queryConditions.push("mimeType = 'application/vnd.google-apps.spreadsheet'");
  }

  if (options.query && options.query.trim().length > 0) {
    const sanitized = options.query.replace(/['\\]/g, '');
    queryConditions.push(`name contains '${sanitized}'`);
  }

  const q = encodeURIComponent(queryConditions.join(' and '));
  const fields = encodeURIComponent('files(id, name, mimeType, modifiedTime, size, iconLink, webViewLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=30&orderBy=modifiedTime desc`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    modifiedTime: f.modifiedTime,
    size: f.size ? `${(parseInt(f.size) / (1024 * 1024)).toFixed(1)} MB` : undefined,
    iconLink: f.iconLink,
    webViewLink: f.webViewLink
  }));
};

/**
 * Fetches content from a Google Doc or Drive file
 */
export const fetchDriveFileContent = async (
  token: string, 
  fileId: string, 
  mimeType: string
): Promise<{ text: string; rawSnippet?: string }> => {
  if (mimeType === 'application/vnd.google-apps.document') {
    // Export Google Doc as plain text
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
    const res = await fetch(exportUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      const text = await res.text();
      return { text };
    }

    // Fallback: Query Google Docs API
    const docsUrl = `https://docs.googleapis.com/v1/documents/${fileId}`;
    const docRes = await fetch(docsUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (docRes.ok) {
      const docData = await docRes.json();
      let docText = '';
      if (docData.body?.content) {
        for (const item of docData.body.content) {
          if (item.paragraph?.elements) {
            for (const el of item.paragraph.elements) {
              if (el.textRun?.content) {
                docText += el.textRun.content;
              }
            }
          }
        }
      }
      return { text: docText || `[Document content: ${docData.title}]` };
    }

    throw new Error('Unable to extract content from Google Document.');
  }

  if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('csv')) {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const text = await res.text();
      return { text };
    }
  }

  // For PDF and binary documents, fetch metadata and generate an indexing descriptor
  const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,description,properties`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (metaRes.ok) {
    const meta = await metaRes.json();
    return {
      text: `[Google Drive Indexed Asset: ${meta.name}]\nImported from Google Drive for Kaitana verified credential vault.\nFile Type: ${mimeType}\nFile ID: ${fileId}`
    };
  }

  return { text: `[Imported Google Drive Asset ${fileId}]` };
};

// -------------------------------------------------------------
// Google Docs API Helpers
// -------------------------------------------------------------

/**
 * Creates a new Google Doc and writes initial content to it
 */
export const createGoogleDocument = async (
  token: string, 
  title: string, 
  content: string
): Promise<{ documentId: string; url: string }> => {
  // Step 1: Create empty document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title })
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create Google Doc (${createRes.status}): ${err}`);
  }

  const createdDoc = await createRes.json();
  const documentId = createdDoc.documentId;

  // Step 2: Insert text content via batchUpdate
  if (content && content.trim().length > 0) {
    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content
            }
          }
        ]
      })
    });

    if (!updateRes.ok) {
      console.warn('BatchUpdate warning:', await updateRes.text());
    }
  }

  return {
    documentId,
    url: `https://docs.google.com/document/d/${documentId}/edit`
  };
};

// -------------------------------------------------------------
// Gmail API Helpers
// -------------------------------------------------------------

export interface SendGmailPayload {
  to: string;
  subject: string;
  body: string;
  candidateName?: string;
}

/**
 * Sends an email via Gmail API
 */
export const sendGmailMessage = async (
  token: string, 
  payload: SendGmailPayload
): Promise<{ messageId: string }> => {
  const cleanSubject = payload.subject.replace(/(\r\n|\n|\r)/gm, ' ');
  const emailLines = [
    `To: ${payload.to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(cleanSubject)))}?=`,
    '',
    payload.body
  ];

  const rawMime = emailLines.join('\r\n');
  const encodedRaw = btoa(unescape(encodeURIComponent(rawMime)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw: encodedRaw })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gmail API dispatch failed (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return { messageId: result.id };
};
