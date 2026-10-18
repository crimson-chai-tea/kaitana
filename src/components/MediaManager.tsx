import React, { useState, useRef, useEffect } from 'react';
import { 
  MediaImage, 
  MediaSelection 
} from '../types';
import { uploadMediaToFirebase } from '../services/firebase';
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Tag as TagIcon, 
  FolderPlus, 
  Layers, 
  Search, 
  Upload, 
  Link as LinkIcon, 
  X, 
  Check, 
  Sparkles, 
  Eye, 
  Folder,
  SlidersHorizontal,
  Maximize2,
  Loader2,
  CloudUpload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MediaManagerProps {
  images: MediaImage[];
  selections: MediaSelection[];
  onUpdateImages: (images: MediaImage[]) => void;
  onUpdateSelections: (selections: MediaSelection[]) => void;
  onAddLog: (action: string, details: string, status: 'info' | 'success' | 'warning') => void;
  userName?: string;
  profileId?: string;
}

// Client-side image compressor: scales down large files to max 1280px and compressed JPEG/WebP
const compressImageFile = (file: File, maxDim = 1280, quality = 0.82): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          resolve(canvas.toDataURL(mime, quality));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

export default function MediaManager({
  images,
  selections,
  onUpdateImages,
  onUpdateSelections,
  onAddLog,
  userName = 'Creator',
  profileId = 'custom'
}: MediaManagerProps) {
  // Navigation & Filtering
  const [activeSelectionFilter, setActiveSelectionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Upload & Creation Modal / Drawer State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [uploadedServerUrl, setUploadedServerUrl] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newSelectedSelectionIds, setNewSelectedSelectionIds] = useState<string[]>([]);
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Inline Selection Creation inside Upload & Edit Modals
  const [isInlineCreatingSelection, setIsInlineCreatingSelection] = useState(false);
  const [inlineSelectionName, setInlineSelectionName] = useState('');

  // Selection CRUD States
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [editingSelection, setEditingSelection] = useState<MediaSelection | null>(null);
  const [selectionName, setSelectionName] = useState('');
  const [selectionDesc, setSelectionDesc] = useState('');

  // Image Edit Modal
  const [editingImage, setEditingImage] = useState<MediaImage | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editSelectionIds, setEditSelectionIds] = useState<string[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState('');
  const [isEditInlineCreatingSelection, setIsEditInlineCreatingSelection] = useState(false);
  const [editInlineSelectionName, setEditInlineSelectionName] = useState('');

  // Lightbox Preview Modal
  const [lightboxImage, setLightboxImage] = useState<MediaImage | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync media data to persistent server storage
  const syncMediaToServer = async (imgs: MediaImage[], sels: MediaSelection[]) => {
    try {
      await fetch('/api/media/save-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          images: imgs,
          selections: sels
        })
      });
    } catch (e) {
      console.warn('Sync media to server warning:', e);
    }
  };

  // Load any server-persisted media for this profile on mount
  useEffect(() => {
    const loadServerMedia = async () => {
      try {
        const res = await fetch(`/api/media/all/${profileId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            let hasNewImages = false;
            let mergedImages = [...images];
            if (data.images && data.images.length > 0) {
              const existingIds = new Set(images.map(i => i.id));
              const missingImages = data.images.filter((i: MediaImage) => !existingIds.has(i.id));
              if (missingImages.length > 0) {
                mergedImages = [...missingImages, ...images];
                onUpdateImages(mergedImages);
                hasNewImages = true;
              }
            }

            let mergedSels = [...selections];
            if (data.selections && data.selections.length > 0) {
              const existingSelIds = new Set(selections.map(s => s.id));
              const missingSels = data.selections.filter((s: MediaSelection) => !existingSelIds.has(s.id));
              if (missingSels.length > 0) {
                mergedSels = [...selections, ...missingSels];
                onUpdateSelections(mergedSels);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Could not load server media:', err);
      }
    };
    loadServerMedia();
  }, [profileId]);

  // All unique tags across all images
  const allUniqueTags = Array.from(
    new Set(images.flatMap(img => img.tags || []))
  ).filter(Boolean);

  // Filtered images
  const filteredImages = images.filter(img => {
    // Selection filter
    if (activeSelectionFilter !== 'all') {
      if (!img.selectionIds || !img.selectionIds.includes(activeSelectionFilter)) {
        return false;
      }
    }
    // Tag filter
    if (selectedTagFilter) {
      if (!img.tags || !img.tags.some(t => t.toLowerCase() === selectedTagFilter.toLowerCase())) {
        return false;
      }
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCaption = img.caption.toLowerCase().includes(q);
      const matchTag = img.tags && img.tags.some(t => t.toLowerCase().includes(q));
      const matchSel = selections.some(
        s => img.selectionIds?.includes(s.id) && s.name.toLowerCase().includes(q)
      );
      if (!matchCaption && !matchTag && !matchSel) {
        return false;
      }
    }
    return true;
  });

  // Handle local file selection with client compression + server upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingFile(true);
      try {
        // 1. Create compressed base64 data URL for instant responsive preview
        const compressedBase64 = await compressImageFile(file);
        setNewImagePreview(compressedBase64);
        setNewImageUrl(compressedBase64);

        if (!newCaption) {
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setNewCaption(nameWithoutExt);
        }

        // 2. Upload directly to Firebase Storage first; fall back to /api/media/upload if restricted
        try {
          const firebaseUrl = await uploadMediaToFirebase(profileId, file);
          setUploadedServerUrl(firebaseUrl);
          setNewImageUrl(firebaseUrl);
        } catch {
          const response = await fetch('/api/media/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: compressedBase64,
              fileName: file.name,
              mimeType: file.type || 'image/jpeg'
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.url) {
              setUploadedServerUrl(data.url);
              setNewImageUrl(data.url);
            }
          }
        }
      } catch (err) {
        console.warn('Upload fallback to compressed base64:', err);
      } finally {
        setIsUploadingFile(false);
      }
    }
  };

  // Quick Create Selection inside Upload Form
  const handleQuickCreateSelection = () => {
    if (!inlineSelectionName.trim()) return;
    const newSel: MediaSelection = {
      id: `sel-${Date.now()}`,
      name: inlineSelectionName.trim(),
      description: 'Custom curated visual collection'
    };
    const updatedSels = [...selections, newSel];
    onUpdateSelections(updatedSels);
    syncMediaToServer(images, updatedSels);
    onAddLog('Selection Created', `Created new selection: "${newSel.name}" during upload`, 'success');

    // Automatically assign to the currently uploading image
    if (!newSelectedSelectionIds.includes(newSel.id)) {
      setNewSelectedSelectionIds([...newSelectedSelectionIds, newSel.id]);
    }

    setInlineSelectionName('');
    setIsInlineCreatingSelection(false);
  };

  // Quick Create Selection inside Edit Form
  const handleQuickCreateSelectionForEdit = () => {
    if (!editInlineSelectionName.trim()) return;
    const newSel: MediaSelection = {
      id: `sel-${Date.now()}`,
      name: editInlineSelectionName.trim(),
      description: 'Custom curated visual collection'
    };
    const updatedSels = [...selections, newSel];
    onUpdateSelections(updatedSels);
    syncMediaToServer(images, updatedSels);
    onAddLog('Selection Created', `Created new selection: "${newSel.name}" during edit`, 'success');

    if (!editSelectionIds.includes(newSel.id)) {
      setEditSelectionIds([...editSelectionIds, newSel.id]);
    }

    setEditInlineSelectionName('');
    setIsEditInlineCreatingSelection(false);
  };

  // Tag chip helper for creation
  const handleAddTagToNew = (tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/^#/, '');
    if (clean && !newTags.includes(clean)) {
      setNewTags([...newTags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTagFromNew = (tagToRemove: string) => {
    setNewTags(newTags.filter(t => t !== tagToRemove));
  };

  // Toggle selection for new image
  const toggleSelectionForNew = (id: string) => {
    if (newSelectedSelectionIds.includes(id)) {
      setNewSelectedSelectionIds(newSelectedSelectionIds.filter(sId => sId !== id));
    } else {
      setNewSelectedSelectionIds([...newSelectedSelectionIds, id]);
    }
  };

  // Save New Image (retention guaranteed via server sync & compressed URLs)
  const handleSaveNewImage = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = uploadedServerUrl || newImageUrl.trim() || newImagePreview;
    if (!finalUrl) {
      alert('Please upload an image file or provide a valid image URL');
      return;
    }

    const newImg: MediaImage = {
      id: `img-${Date.now()}`,
      url: finalUrl,
      caption: newCaption.trim() || 'Untitled Visual Showcase Item',
      created_at: new Date().toISOString().split('T')[0],
      selectionIds: newSelectedSelectionIds,
      tags: newTags
    };

    const updatedImages = [newImg, ...images];
    onUpdateImages(updatedImages);

    // Guaranteed persistence: sync full catalog to server storage
    syncMediaToServer(updatedImages, selections);

    onAddLog(
      'Media Image Uploaded',
      `Added "${newImg.caption}" to showcase with ${newImg.selectionIds.length} selections and ${newImg.tags.length} tags.`,
      'success'
    );

    // Reset Form
    setIsUploadModalOpen(false);
    setNewImagePreview(null);
    setNewImageUrl('');
    setUploadedServerUrl(null);
    setNewCaption('');
    setNewSelectedSelectionIds([]);
    setNewTags([]);
    setTagInput('');
    setIsInlineCreatingSelection(false);
    setInlineSelectionName('');
  };

  // Selection CRUD Handlers
  const handleOpenCreateSelection = () => {
    setEditingSelection(null);
    setSelectionName('');
    setSelectionDesc('');
    setIsSelectionModalOpen(true);
  };

  const handleOpenEditSelection = (sel: MediaSelection) => {
    setEditingSelection(sel);
    setSelectionName(sel.name);
    setSelectionDesc(sel.description || '');
    setIsSelectionModalOpen(true);
  };

  const handleSaveSelection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectionName.trim()) return;

    let updatedSels: MediaSelection[];
    if (editingSelection) {
      // Update existing
      updatedSels = selections.map(s => 
        s.id === editingSelection.id 
          ? { ...s, name: selectionName.trim(), description: selectionDesc.trim() } 
          : s
      );
      onUpdateSelections(updatedSels);
      onAddLog('Selection Updated', `Renamed selection to "${selectionName.trim()}"`, 'info');
    } else {
      // Create new
      const newSel: MediaSelection = {
        id: `sel-${Date.now()}`,
        name: selectionName.trim(),
        description: selectionDesc.trim()
      };
      updatedSels = [...selections, newSel];
      onUpdateSelections(updatedSels);
      onAddLog('Selection Created', `Created new visual selection: "${newSel.name}"`, 'success');
      setActiveSelectionFilter(newSel.id);
    }

    // Persist to server
    syncMediaToServer(images, updatedSels);

    setIsSelectionModalOpen(false);
    setEditingSelection(null);
    setSelectionName('');
    setSelectionDesc('');
  };

  const handleDeleteSelection = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the Selection "${name}"? Images in this collection will not be deleted, but unassigned from this selection.`)) {
      return;
    }

    const updatedSels = selections.filter(s => s.id !== id);
    onUpdateSelections(updatedSels);

    // Unassign this selection ID from all images
    const updatedImages = images.map(img => ({
      ...img,
      selectionIds: (img.selectionIds || []).filter(sId => sId !== id)
    }));
    onUpdateImages(updatedImages);

    // Persist to server
    syncMediaToServer(updatedImages, updatedSels);

    if (activeSelectionFilter === id) {
      setActiveSelectionFilter('all');
    }

    onAddLog('Selection Removed', `Removed visual selection "${name}"`, 'warning');
  };

  // Image Delete
  const handleDeleteImage = (img: MediaImage) => {
    if (!confirm(`Are you sure you want to remove "${img.caption}" from your showcase?`)) {
      return;
    }
    const updatedImages = images.filter(i => i.id !== img.id);
    onUpdateImages(updatedImages);
    syncMediaToServer(updatedImages, selections);
    onAddLog('Media Removed', `Removed image "${img.caption}" from showcase`, 'warning');
  };

  // Open Image Edit Modal
  const handleOpenEditImage = (img: MediaImage) => {
    setEditingImage(img);
    setEditCaption(img.caption);
    setEditSelectionIds([...(img.selectionIds || [])]);
    setEditTags([...(img.tags || [])]);
    setEditTagInput('');
    setIsEditInlineCreatingSelection(false);
    setEditInlineSelectionName('');
  };

  const handleSaveEditImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImage) return;

    const updated = images.map(i => {
      if (i.id === editingImage.id) {
        return {
          ...i,
          caption: editCaption.trim() || i.caption,
          selectionIds: editSelectionIds,
          tags: editTags
        };
      }
      return i;
    });

    onUpdateImages(updated);
    syncMediaToServer(updated, selections);
    onAddLog('Media Updated', `Updated metadata for "${editCaption.trim()}"`, 'info');
    setEditingImage(null);
  };

  const toggleSelectionForEdit = (id: string) => {
    if (editSelectionIds.includes(id)) {
      setEditSelectionIds(editSelectionIds.filter(sId => sId !== id));
    } else {
      setEditSelectionIds([...editSelectionIds, id]);
    }
  };

  const handleAddTagToEdit = (tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/^#/, '');
    if (clean && !editTags.includes(clean)) {
      setEditTags([...editTags, clean]);
    }
    setEditTagInput('');
  };

  const handleRemoveTagFromEdit = (tagToRemove: string) => {
    setEditTags(editTags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0C] text-[#E0E0E6] overflow-y-auto">
      
      {/* Upper Header Section */}
      <div className="border-b border-white/5 bg-[#0F0F12] p-5 md:p-6 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider">
              <ImageIcon className="w-4 h-4" />
              Visual Media Showcase & Retrieval Layer
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white mt-1">
              Visual Work & Selection Studio
            </h1>
            <p className="text-xs text-white/50 mt-1 max-w-2xl">
              Upload and organize visual portfolio evidence into Selections and search Tags. When recruiters ask for visual proof during shadow interviews, your AI clone dynamically retrieves and showcases these verified items.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenCreateSelection}
              className="px-3.5 py-2 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              title="Create new selection collection"
            >
              <FolderPlus className="w-4 h-4 text-purple-400" />
              <span>New Selection</span>
            </button>

            <button
              onClick={() => {
                if (activeSelectionFilter !== 'all') {
                  setNewSelectedSelectionIds([activeSelectionFilter]);
                } else {
                  setNewSelectedSelectionIds([]);
                }
                setIsUploadModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Image</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full p-5 md:p-6 space-y-6 flex-1">
        
        {/* ========================================================================= */}
        {/* Selections Horizontal Tabs & Management Bar ("Broad Category Collections") */}
        {/* ========================================================================= */}
        <div className="bg-[#141418] border border-white/5 rounded-2xl p-3 md:p-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-white/60">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Visual Selections ({selections.length})</span>
            </div>
            
            {/* Direct Header Button in "Broad Category Collections" Tab */}
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] text-white/40 font-mono hidden md:inline">
                Broad Category Collections for AI Recruiter Retrieval
              </span>
              <button
                type="button"
                onClick={handleOpenCreateSelection}
                className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Create a new collection for broad category queries"
              >
                <Plus className="w-3.5 h-3.5 text-purple-400" />
                <span>New Selection</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {/* All Images Filter Tab */}
            <button
              onClick={() => {
                setActiveSelectionFilter('all');
                setSelectedTagFilter(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium shrink-0 flex items-center gap-2 transition-all cursor-pointer ${
                activeSelectionFilter === 'all'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>All Media</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                {images.length}
              </span>
            </button>

            {/* Individual Selections */}
            {selections.map(sel => {
              const count = images.filter(img => img.selectionIds?.includes(sel.id)).length;
              const isActive = activeSelectionFilter === sel.id;
              return (
                <div key={sel.id} className="relative group shrink-0 flex items-center">
                  <button
                    onClick={() => {
                      setActiveSelectionFilter(sel.id);
                      setSelectedTagFilter(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 pr-8'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-purple-300" />
                    <span>{sel.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                      {count}
                    </span>
                  </button>

                  {/* Actions for selection (Edit/Delete) */}
                  <div className="flex items-center gap-1 ml-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditSelection(sel)}
                      className="p-1 hover:text-indigo-400 text-white/40 rounded transition-colors"
                      title="Edit selection"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteSelection(sel.id, sel.name)}
                      className="p-1 hover:text-rose-400 text-white/40 rounded transition-colors"
                      title="Delete selection"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Button to allow creation of new selections in the Broad Category Collections tab */}
            <button
              type="button"
              onClick={handleOpenCreateSelection}
              className="px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-white border border-dashed border-purple-500/30 hover:border-purple-500/60 transition-all cursor-pointer"
              title="Add a new selection collection to tab bar"
            >
              <Plus className="w-3.5 h-3.5 text-purple-400" />
              <span>New Selection</span>
            </button>
          </div>

          {/* Active Selection Description banner if one is selected */}
          {activeSelectionFilter !== 'all' && (() => {
            const currentSel = selections.find(s => s.id === activeSelectionFilter);
            if (!currentSel || !currentSel.description) return null;
            return (
              <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/50 flex items-center gap-2">
                <span className="text-purple-400 font-mono uppercase text-[10px]">Context:</span>
                <span>{currentSel.description}</span>
              </div>
            );
          })()}
        </div>

        {/* Filter Controls Bar: Search & Tag Chips */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by caption, tag, or collection..."
              className="w-full bg-[#141418] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Tag Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <TagIcon className="w-3.5 h-3.5 text-white/40 shrink-0 mr-1" />
            {selectedTagFilter && (
              <button
                onClick={() => setSelectedTagFilter(null)}
                className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono flex items-center gap-1 shrink-0 cursor-pointer"
              >
                Clear #{selectedTagFilter} <X className="w-2.5 h-2.5" />
              </button>
            )}
            {allUniqueTags.map(tag => {
              const isSelected = selectedTagFilter?.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTagFilter(isSelected ? null : tag)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white font-bold shadow'
                      : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gallery Grid of Showcase Images */}
        {filteredImages.length === 0 ? (
          <div className="bg-[#141418] border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-white">No Visual Items Match Current Filter</h3>
            <p className="text-xs text-white/40 max-w-sm">
              {searchQuery || selectedTagFilter || activeSelectionFilter !== 'all'
                ? 'Try clearing the search query or changing active tags to see other visual assets.'
                : 'Upload your first design mockups, architectural schematics, or fieldwork photos.'}
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Visual Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredImages.map((img) => {
              const assignedSelections = selections.filter(s => img.selectionIds?.includes(s.id));

              return (
                <div
                  key={img.id}
                  className="group bg-[#141418] border border-white/5 hover:border-indigo-500/30 rounded-2xl overflow-hidden shadow-xl transition-all flex flex-col relative"
                >
                  {/* Image Thumbnail Container */}
                  <div className="relative aspect-[16/10] bg-black/40 overflow-hidden cursor-pointer" onClick={() => setLightboxImage(img)}>
                    <img
                      src={img.url}
                      alt={img.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141418] via-transparent to-black/30 opacity-70 group-hover:opacity-90 transition-opacity" />

                    {/* Expand icon pill */}
                    <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white/70 group-hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>

                    {/* Date Badge */}
                    <div className="absolute bottom-2.5 left-2.5 text-[10px] font-mono text-white/60 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                      {img.created_at}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Caption */}
                      <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                        {img.caption}
                      </h4>

                      {/* Selections Membership Badges */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {assignedSelections.length === 0 ? (
                          <span className="text-[10px] text-white/30 italic">No assigned selection</span>
                        ) : (
                          assignedSelections.map(sel => (
                            <span
                              key={sel.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSelectionFilter(sel.id);
                              }}
                              className="text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 hover:bg-purple-500/20 cursor-pointer"
                            >
                              <Folder className="w-2.5 h-2.5" /> {sel.name}
                            </span>
                          ))
                        )}
                      </div>

                      {/* Tags Badges */}
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {img.tags && img.tags.map(tag => (
                          <span
                            key={tag}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTagFilter(tag);
                            }}
                            className="text-[10px] font-mono bg-white/5 text-white/60 hover:text-white border border-white/5 px-1.5 py-0.5 rounded hover:bg-white/10 cursor-pointer"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                      <span className="text-[10px] font-mono">
                        {img.tags?.length || 0} tags • {img.selectionIds?.length || 0} collections
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditImage(img)}
                          className="p-1.5 hover:text-indigo-300 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                          title="Edit image details & tags"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteImage(img)}
                          className="p-1.5 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                          title="Delete image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* 1. UPLOAD IMAGE MODAL (WITH BUTTON TO CREATE NEW SELECTION)*/}
      {/* ========================================================= */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Add Showcase Visual Asset</h3>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-white/40 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveNewImage} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Mode Selector: File or URL */}
                <div className="flex rounded-xl bg-white/5 p-1 border border-white/5">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      uploadMode === 'file'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Upload Local File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      uploadMode === 'url'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Direct Image URL
                  </button>
                </div>

                {uploadMode === 'file' ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/10 hover:border-indigo-500/40 rounded-xl p-6 text-center cursor-pointer transition-colors bg-white/[0.01]"
                    >
                      {newImagePreview ? (
                        <div className="space-y-2">
                          <img
                            src={newImagePreview}
                            alt="Preview"
                            className="max-h-40 mx-auto rounded-lg object-contain shadow"
                          />
                          <div className="flex items-center justify-center gap-2">
                            {isUploadingFile ? (
                              <span className="text-[11px] text-indigo-400 font-mono flex items-center gap-1">
                                <Loader2 className="w-3 h-3 animate-spin" /> Persisting image to server storage...
                              </span>
                            ) : uploadedServerUrl ? (
                              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                                <Check className="w-3 h-3" /> Stored & compressed for account retention
                              </span>
                            ) : (
                              <p className="text-[11px] text-indigo-400 font-mono">Click to select different image</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto text-white/50">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-white/80 font-medium">Click to select image file</p>
                          <p className="text-[10px] text-white/40">Auto-compressed and stored on server for zero-loss retention</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs text-white/60 block">Image URL</label>
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={newImageUrl}
                        onChange={(e) => {
                          setNewImageUrl(e.target.value);
                          setNewImagePreview(e.target.value);
                          setUploadedServerUrl(null);
                        }}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full bg-[#0F0F12] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    {newImageUrl && (
                      <img
                        src={newImageUrl}
                        alt="Preview"
                        className="max-h-36 mx-auto rounded-lg object-contain mt-2 border border-white/10"
                        onError={() => console.warn('Preview error')}
                      />
                    )}
                  </div>
                )}

                {/* Caption Input */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/80 font-medium block">
                    Caption & Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                    placeholder="e.g. Highbush Blueberry Cultivar Ripening in Organic Orchard"
                    className="w-full bg-[#0F0F12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* ========================================================================= */}
                {/* Multi-Selection Assign WITH BUTTON TO CREATE NEW SELECTIONS IN UPLOAD      */}
                {/* ========================================================================= */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-white/80 font-medium block">
                      Assign to Selections (Many-to-Many)
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsInlineCreatingSelection(!isInlineCreatingSelection)}
                      className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/30 text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Create a new selection right here during upload"
                    >
                      <Plus className="w-3 h-3 text-purple-400" />
                      <span>New Selection</span>
                    </button>
                  </div>

                  {/* Inline Creation Input Field during Upload */}
                  {isInlineCreatingSelection && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={inlineSelectionName}
                          onChange={(e) => setInlineSelectionName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleQuickCreateSelection();
                            }
                          }}
                          placeholder="New selection name (e.g. Fieldwork, Robotics)..."
                          className="flex-1 bg-[#0F0F12] border border-purple-500/40 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleQuickCreateSelection}
                          disabled={!inlineSelectionName.trim()}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-xs font-medium text-white transition-all cursor-pointer shrink-0"
                        >
                          Create & Assign
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsInlineCreatingSelection(false);
                            setInlineSelectionName('');
                          }}
                          className="p-1 text-white/40 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-purple-300/70 font-mono">
                        Creates the collection immediately and automatically assigns this image to it.
                      </p>
                    </motion.div>
                  )}

                  {/* Selections List Pills */}
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-[#0F0F12] border border-white/5 rounded-xl">
                    {selections.map(sel => {
                      const isSelected = newSelectedSelectionIds.includes(sel.id);
                      return (
                        <button
                          type="button"
                          key={sel.id}
                          onClick={() => toggleSelectionForNew(sel.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600 text-white font-medium shadow-sm'
                              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/5'
                          }`}
                        >
                          <Folder className="w-3 h-3" />
                          <span>{sel.name}</span>
                          {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                        </button>
                      );
                    })}

                    {/* Button inside the pill list to allow creation of new selections */}
                    <button
                      type="button"
                      onClick={() => setIsInlineCreatingSelection(true)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-white border border-dashed border-purple-500/30 transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-purple-400" />
                      <span>New Selection</span>
                    </button>
                  </div>
                </div>

                {/* Tags Input */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/80 font-medium block">
                    Image Tags (Search & Retrieval Keywords)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <TagIcon className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTagToNew(tagInput);
                          }
                        }}
                        placeholder="Type tag (e.g. blueberry) and press Enter..."
                        className="w-full bg-[#0F0F12] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddTagToNew(tagInput)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {/* Active Tags Chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {newTags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono flex items-center gap-1"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTagFromNew(tag)}
                          className="hover:text-rose-400"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400/80 flex items-center gap-1">
                    <CloudUpload className="w-3 h-3" /> Auto-sync enabled
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploadingFile}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-medium text-xs shadow-lg shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5"
                    >
                      {isUploadingFile && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>Save to Showcase</span>
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 2. SELECTION CRUD MODAL (CREATE / EDIT)                    */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isSelectionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <FolderPlus className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">
                    {editingSelection ? 'Edit Selection' : 'Create New Selection'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsSelectionModalOpen(false)}
                  className="text-white/40 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSelection} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/80 font-medium block">
                    Selection Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={selectionName}
                    onChange={(e) => setSelectionName(e.target.value)}
                    placeholder="e.g. Farming Projects, Artwork, Architecture"
                    className="w-full bg-[#0F0F12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/80 font-medium block">
                    Description & Narrative Context (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={selectionDesc}
                    onChange={(e) => setSelectionDesc(e.target.value)}
                    placeholder="Brief description of this collection to guide AI concierge retrieval..."
                    className="w-full bg-[#0F0F12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSelectionModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-lg shadow-purple-500/20 cursor-pointer"
                  >
                    {editingSelection ? 'Update Selection' : 'Create Selection'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 3. EDIT IMAGE METADATA & TAGS MODAL                        */}
      {/* ========================================================= */}
      <AnimatePresence>
        {editingImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Edit Showcase Image</h3>
                </div>
                <button
                  onClick={() => setEditingImage(null)}
                  className="text-white/40 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditImage} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="aspect-[16/9] max-h-48 rounded-xl overflow-hidden bg-black/50 border border-white/10">
                  <img
                    src={editingImage.url}
                    alt={editingImage.caption}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/80 font-medium block">
                    Caption
                  </label>
                  <input
                    type="text"
                    required
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    className="w-full bg-[#0F0F12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Selections multi-assignment in Edit Modal */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-white/80 font-medium block">
                      Assigned Selections
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsEditInlineCreatingSelection(!isEditInlineCreatingSelection)}
                      className="px-2 py-0.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-purple-400" />
                      <span>New Selection</span>
                    </button>
                  </div>

                  {isEditInlineCreatingSelection && (
                    <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center gap-2">
                      <input
                        type="text"
                        value={editInlineSelectionName}
                        onChange={(e) => setEditInlineSelectionName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleQuickCreateSelectionForEdit();
                          }
                        }}
                        placeholder="New selection name..."
                        className="flex-1 bg-[#0F0F12] border border-purple-500/40 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleQuickCreateSelectionForEdit}
                        disabled={!editInlineSelectionName.trim()}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 text-xs text-white cursor-pointer"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditInlineCreatingSelection(false);
                          setEditInlineSelectionName('');
                        }}
                        className="p-1 text-white/40 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 p-2 bg-[#0F0F12] border border-white/5 rounded-xl max-h-32 overflow-y-auto">
                    {selections.map(sel => {
                      const isSelected = editSelectionIds.includes(sel.id);
                      return (
                        <button
                          type="button"
                          key={sel.id}
                          onClick={() => toggleSelectionForEdit(sel.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600 text-white font-medium'
                              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/5'
                          }`}
                        >
                          <Folder className="w-3 h-3" />
                          <span>{sel.name}</span>
                          {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setIsEditInlineCreatingSelection(true)}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 bg-purple-500/10 text-purple-300 border border-dashed border-purple-500/30 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-purple-400" />
                      <span>New Selection</span>
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/80 font-medium block">
                    Tags (Keywords)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editTagInput}
                      onChange={(e) => setEditTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTagToEdit(editTagInput);
                        }
                      }}
                      placeholder="Add tag and press Enter..."
                      className="flex-1 bg-[#0F0F12] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTagToEdit(editTagInput)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {editTags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono flex items-center gap-1"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTagFromEdit(tag)}
                          className="hover:text-rose-400"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingImage(null)}
                    className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* 4. LIGHTBOX PREVIEW MODAL                                 */}
      {/* ========================================================= */}
      <AnimatePresence>
        {lightboxImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-lg"
            onClick={() => setLightboxImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full bg-[#141418] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Close Button */}
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Main Image View */}
              <div className="flex-1 bg-black/60 flex items-center justify-center overflow-hidden p-2 min-h-[300px]">
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.caption}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg"
                />
              </div>

              {/* Image Info Footer */}
              <div className="p-4 md:p-6 bg-[#0F0F12] border-t border-white/5 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <h3 className="text-sm md:text-base font-semibold text-white">
                    {lightboxImage.caption}
                  </h3>
                  <span className="text-xs font-mono text-white/40">
                    Uploaded: {lightboxImage.created_at}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Selections */}
                  {selections
                    .filter(s => lightboxImage.selectionIds?.includes(s.id))
                    .map(s => (
                      <span
                        key={s.id}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-mono flex items-center gap-1.5"
                      >
                        <Folder className="w-3 h-3" />
                        {s.name}
                      </span>
                    ))}

                  {/* Tags */}
                  {lightboxImage.tags?.map(tag => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-white/5 text-white/70 border border-white/10 text-xs font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
