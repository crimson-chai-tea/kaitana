/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Lightweight, dependency-free rich text editor (Word/Canva-style) built on
 * contentEditable. Supports headings, inline formatting, lists, alignment,
 * colour highlights, links, image upload / drag-and-drop, and document import.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Pilcrow,
  List, ListOrdered, Quote, AlignLeft, AlignCenter, AlignRight,
  Link2, Image as ImageIcon, Highlighter, Undo2, Redo2, Minus, Eraser,
  FileUp, Loader2
} from 'lucide-react';

interface RichTextEditorProps {
  /** Changing this key resets the editor contents (e.g. switching documents). */
  docKey: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  compact?: boolean;
  allowMedia?: boolean;
  allowDocImport?: boolean;
  onNotify?: (msg: string, kind?: 'info' | 'success' | 'warning') => void;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function RichTextEditor({
  docKey,
  value,
  onChange,
  placeholder = 'Start writing…',
  minHeight = 320,
  compact = false,
  allowMedia = true,
  allowDocImport = true,
  onNotify
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [isEmpty, setIsEmpty] = useState(!value);
  const [isBusy, setIsBusy] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Load content only when switching documents (prevents caret jumping while typing)
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
      setIsEmpty(!editorRef.current.textContent?.trim() && !editorRef.current.querySelector('img'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey]);

  const emitChange = () => {
    const el = editorRef.current;
    if (!el) return;
    setIsEmpty(!el.textContent?.trim() && !el.querySelector('img'));
    onChange(el.innerHTML);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const exec = (command: string, arg?: string) => {
    restoreSelection();
    document.execCommand(command, false, arg);
    saveSelection();
    emitChange();
  };

  const insertHtml = (html: string) => {
    restoreSelection();
    document.execCommand('insertHTML', false, html);
    saveSelection();
    emitChange();
  };

  const handleLink = () => {
    saveSelection();
    const url = window.prompt('Enter a link URL (https://…)');
    if (!url) return;
    const safe = /^(https?:|mailto:)/i.test(url) ? url : `https://${url}`;
    exec('createLink', safe);
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onNotify?.(`"${file.name}" is not an image.`, 'warning');
      return;
    }
    setIsBusy(true);
    try {
      const dataUrl = await fileToBase64(file);
      let src = dataUrl;
      try {
        const res = await fetch('/api/media/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileBase64: dataUrl, fileName: file.name, mimeType: file.type })
        });
        const data = await res.json();
        if (res.ok && data.url) src = data.url;
      } catch {
        /* fall back to inline data URL */
      }
      const alt = escapeHtml(file.name.replace(/\.[^.]+$/, ''));
      insertHtml(`<figure class="kj-figure"><img src="${src}" alt="${alt}" /><figcaption>${alt}</figcaption></figure><p><br/></p>`);
      onNotify?.(`Image "${file.name}" added.`, 'success');
    } catch (e) {
      onNotify?.('Image upload failed.', 'warning');
    } finally {
      setIsBusy(false);
    }
  };

  const importDocument = async (file: File) => {
    setIsBusy(true);
    try {
      const dataUrl = await fileToBase64(file);
      const res = await fetch('/api/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          fileBase64: dataUrl.split(',')[1] || ''
        })
      });
      const data = await res.json();
      const text: string = data.extractedText || '';
      if (!text.trim()) throw new Error('No text extracted');
      const html = text
        .split(/\n{2,}/)
        .map(block => `<p>${escapeHtml(block).replace(/\n/g, '<br/>')}</p>`)
        .join('');
      insertHtml(`<h2>Imported: ${escapeHtml(file.name)}</h2>${html}`);
      onNotify?.(`Imported text from "${file.name}".`, 'success');
    } catch (e: any) {
      onNotify?.(`Could not import "${file.name}".`, 'warning');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files: File[] = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;
    // Place caret at drop point when supported
    const anyDoc = document as any;
    if (anyDoc.caretRangeFromPoint) {
      const r = anyDoc.caretRangeFromPoint(e.clientX, e.clientY);
      if (r) savedRange.current = r;
    }
    for (const f of files) {
      if (f.type.startsWith('image/') && allowMedia) await uploadImage(f);
      else if (allowDocImport) await importDocument(f);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items: DataTransferItem[] = Array.from(e.clipboardData?.items || []);
    const imageItem = items.find(i => i.type.startsWith('image/'));
    if (imageItem && allowMedia) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        saveSelection();
        uploadImage(file);
        return;
      }
    }
    // Paste as clean text to avoid importing foreign styles
    const text = e.clipboardData.getData('text/plain');
    if (text) {
      e.preventDefault();
      document.execCommand('insertText', false, text);
      emitChange();
    }
  };

  const Btn = ({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
  const Sep = () => <span className="w-px h-5 bg-white/10 mx-1" />;
  const ic = 'w-3.5 h-3.5';

  return (
    <div className={`rounded-xl border bg-[#0F0F12] overflow-hidden transition-colors ${isDragOver ? 'border-indigo-500/70' : 'border-white/10'}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-white/10 bg-[#141418] sticky top-0 z-10">
        <Btn title="Undo" onClick={() => exec('undo')}><Undo2 className={ic} /></Btn>
        <Btn title="Redo" onClick={() => exec('redo')}><Redo2 className={ic} /></Btn>
        <Sep />
        {!compact && (
          <>
            <Btn title="Heading 1" onClick={() => exec('formatBlock', '<h1>')}><Heading1 className={ic} /></Btn>
            <Btn title="Heading 2" onClick={() => exec('formatBlock', '<h2>')}><Heading2 className={ic} /></Btn>
            <Btn title="Paragraph" onClick={() => exec('formatBlock', '<p>')}><Pilcrow className={ic} /></Btn>
            <Sep />
          </>
        )}
        <Btn title="Bold (Ctrl+B)" onClick={() => exec('bold')}><Bold className={ic} /></Btn>
        <Btn title="Italic (Ctrl+I)" onClick={() => exec('italic')}><Italic className={ic} /></Btn>
        <Btn title="Underline (Ctrl+U)" onClick={() => exec('underline')}><Underline className={ic} /></Btn>
        {!compact && <Btn title="Strikethrough" onClick={() => exec('strikeThrough')}><Strikethrough className={ic} /></Btn>}
        <Btn title="Highlight" onClick={() => exec('hiliteColor', '#4f46e5')}><Highlighter className={ic} /></Btn>
        <Sep />
        <Btn title="Bulleted list" onClick={() => exec('insertUnorderedList')}><List className={ic} /></Btn>
        <Btn title="Numbered list" onClick={() => exec('insertOrderedList')}><ListOrdered className={ic} /></Btn>
        {!compact && (
          <>
            <Btn title="Quote" onClick={() => exec('formatBlock', '<blockquote>')}><Quote className={ic} /></Btn>
            <Btn title="Divider" onClick={() => insertHtml('<hr/><p><br/></p>')}><Minus className={ic} /></Btn>
            <Sep />
            <Btn title="Align left" onClick={() => exec('justifyLeft')}><AlignLeft className={ic} /></Btn>
            <Btn title="Align centre" onClick={() => exec('justifyCenter')}><AlignCenter className={ic} /></Btn>
            <Btn title="Align right" onClick={() => exec('justifyRight')}><AlignRight className={ic} /></Btn>
          </>
        )}
        <Sep />
        <Btn title="Insert link" onClick={handleLink}><Link2 className={ic} /></Btn>
        {allowMedia && (
          <Btn title="Insert image" onClick={() => { saveSelection(); imageInputRef.current?.click(); }}>
            <ImageIcon className={ic} />
          </Btn>
        )}
        {allowDocImport && (
          <Btn title="Import document text (PDF, DOCX, TXT, MD)" onClick={() => { saveSelection(); docInputRef.current?.click(); }}>
            <FileUp className={ic} />
          </Btn>
        )}
        <Btn title="Clear formatting" onClick={() => exec('removeFormat')}><Eraser className={ic} /></Btn>
        {isBusy && <Loader2 className="w-3.5 h-3.5 ml-2 animate-spin text-indigo-400" />}
      </div>

      {/* Editable page */}
      <div className="relative">
        {isEmpty && (
          <div className="absolute top-0 left-0 px-6 py-5 text-sm text-white/25 pointer-events-none select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={() => { saveSelection(); emitChange(); }}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onPaste={handlePaste}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className="kaitana-doc px-6 py-5 text-sm text-[#E0E0E6] leading-relaxed focus:outline-none"
          style={{ minHeight }}
        />
        {isDragOver && (
          <div className="absolute inset-0 bg-indigo-500/10 border-2 border-dashed border-indigo-500/60 rounded-b-xl flex items-center justify-center text-xs font-mono text-indigo-300 pointer-events-none">
            Drop images or documents to add them to this page
          </div>
        )}
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (e) => {
          const files: File[] = Array.from(e.target.files || []);
          for (const f of files) await uploadImage(f);
          e.target.value = '';
        }}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.md,.rtf,.csv,.json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) await importDocument(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
