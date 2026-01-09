import React, { useState, useMemo, useCallback, useEffect, useDeferredValue } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { SourceEditor, type SourceEditorHandle } from './components/Editor/SourceEditor';
import { DocPreview, type DocPreviewHandle } from './components/Preview/DocPreview';
import { BasicPipeParser } from './core/TableParser';
import { BasicTableSerializer } from './core/TableSerializer';

// Sample AsciiDoc with a table
const INITIAL_CONTENT = `= Project Title

This is a sample document with a table.

|===
| Header 1 | Header 2
| Row 1 Col 1 | Row 1 Col 2
| Row 2 Col 1 | Row 2 Col 2
|===

Here is some text between tables.

|===
| A | B
| 1 | 2
|===
`;

import { AsciiDocLinter } from './core/Linter';
import { FileExplorer } from './components/Explorer/FileExplorer';
import { applyTheme } from './core/theme/themeConfig';
import { useHistory } from './hooks/useHistory';

function App() {
  console.time('App Render Total');
  useEffect(() => {
      console.timeEnd('App Render Total');
  });

  // Multi-File State with History
  const {
      state: files,
      set: setFiles,
      undo: undoFiles,
      redo: redoFiles,
      canUndo,
      canRedo
  } = useHistory<Record<string, string>>({
      'example.adoc': INITIAL_CONTENT
  }, 2000);

  const [activeFile, setActiveFile] = useState<string | null>('example.adoc');
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  // Derived current content (fallback to empty if no file)
  const content = activeFile ? (files[activeFile] || '') : '';
  
  // Defer content for expensive operations (Parsing, Linting, Preview)
  // This allows the Editor (Input) to remain responsive.
  const deferredContent = useDeferredValue(content);
  const deferredFiles = useDeferredValue(files);

  // Update a specific file's content
  const updateFileContent = useCallback((path: string, newContent: string, immediate: boolean = false) => {
      console.time('setFiles');
      setFiles(prevFiles => {
          // Optimization: If content hasn't changed, return prev (skip update)
          if (prevFiles[path] === newContent) return prevFiles; 
          
          return {
              ...prevFiles,
              [path]: newContent
          };
      }, immediate);
      console.timeEnd('setFiles');
  }, [setFiles]);

  const handleUndo = useCallback(() => {
      if (canUndo) undoFiles();
  }, [canUndo, undoFiles]);

  const handleRedo = useCallback(() => {
      if (canRedo) redoFiles();
  }, [canRedo, redoFiles]);


  // Parse all blocks of ACTIVE file using DEFERRED content
  const blocks = useMemo(() => {
    if (!deferredContent) return [];
    const parser = new BasicPipeParser();
    return parser.parse(deferredContent);
  }, [deferredContent]);

  // Lint Content using DEFERRED content
  const lintErrors = useMemo(() => {
    if (!deferredContent) return [];  
    const linter = new AsciiDocLinter();
    return linter.lint(deferredContent);
  }, [deferredContent]);

  // Sync Scroll State - Independent
  const [syncSourceToPreview, setSyncSourceToPreview] = useState(true);
  const [syncPreviewToSource, setSyncPreviewToSource] = useState(true);
  const [showBlockHighlight, setShowBlockHighlight] = useState(true);
  const [autoReveal, setAutoReveal] = useState(true);
  
  const [theme, setTheme] = useState<'light'|'dark'>('dark');
  const previewRef = React.useRef<DocPreviewHandle>(null);
  const sourceEditorRef = React.useRef<SourceEditorHandle>(null);
  
  // Mutex for loop prevention
  const isSyncingFromSource = React.useRef(false);
  const isSyncingFromPreview = React.useRef(false);
  const syncTimeoutRef = React.useRef<number | null>(null);

  // Scroll Handlers
  
  // Apply Theme Variables
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Handle updates from Visual Editor (both Table and Text) via ID
  const handleBlockUpdate = useCallback((id: string, updatedData: any) => {
      if (!activeFile) return;
      
      const targetBlock = blocks.find(b => b.id === id);
      if (!targetBlock) return;
      
      let newBlockContent = '';

      if (targetBlock.type === 'table') {
           const serializer = new BasicTableSerializer();
           newBlockContent = serializer.serialize(updatedData);
      } else if (targetBlock.type === 'text') {
           newBlockContent = updatedData;
      } else {
           return;
      }

      // Split content into lines to replace the exact block
      const currentContent = files[activeFile] || '';
      const lines = currentContent.split('\n');
      
      const preBlock = lines.slice(0, targetBlock.startLine);
      const postBlock = lines.slice(targetBlock.endLine + 1);
      
      const newContent = [
          ...preBlock,
          newBlockContent,
          ...postBlock
      ].join('\n');

      updateFileContent(activeFile, newContent);
  }, [files, activeFile, blocks, updateFileContent]);

  const handleEditBlock = useCallback((id: string, type: 'table' | 'text') => {
      setActiveBlockId(id);
  }, []);

  const handleCancelEdit = useCallback(() => {
      setActiveBlockId(null);
  }, []);

  // Source -> Preview
  const handleEditorScroll = useCallback((scrollTop: number, ratio: number) => {
      // If we are currently processing a scroll initiated by Preview, ignore this echo
      if (isSyncingFromPreview.current) return;

      if (syncSourceToPreview && previewRef.current) {
           isSyncingFromSource.current = true;
           previewRef.current.scrollToRatio(ratio);
           
           if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
           syncTimeoutRef.current = window.setTimeout(() => { 
               isSyncingFromSource.current = false; 
           }, 100);
      }
  }, [syncSourceToPreview]);

  // Preview -> Source
  const handlePreviewScroll = useCallback((scrollTop: number, ratio: number) => {
      // If we are currently processing a scroll initiated by Source, ignore this echo
      if (isSyncingFromSource.current) return;

      if (syncPreviewToSource && sourceEditorRef.current) {
           isSyncingFromPreview.current = true;
           sourceEditorRef.current.scrollTo(ratio);
           
           if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
           syncTimeoutRef.current = window.setTimeout(() => { 
               isSyncingFromPreview.current = false; 
           }, 100);
      }
  }, [syncPreviewToSource]);

  // ESC key handler to exit edit mode
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
              setActiveBlockId(null);
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFilesUpload = (uploadedFiles: { path: string, content: string }[]) => {
      if (uploadedFiles.length === 0) return;

      const newFiles = { ...files };
      uploadedFiles.forEach(f => {
          newFiles[f.path] = f.content;
      });
      
      setFiles(newFiles);
      
      // Auto-select the first newly uploaded file
      if (uploadedFiles.length > 0) {
          setActiveFile(uploadedFiles[0].path);
      }
  };

  // Highlight state
  const [highlightedBlockIds, setHighlightedBlockIds] = useState<string[]>([]);
  const [selectedText, setSelectedText] = useState<string>('');

  const handleSelectionChange = useCallback((selection: { startLine: number, endLine: number, text: string }) => {
      const { startLine, endLine, text } = selection;
      const ids = blocks
          .filter(b => b.startLine <= endLine && b.endLine >= startLine)
          .map(b => b.id);
      
      // console.log('[Selection]', { ids, text });

      setHighlightedBlockIds(prevIds => {
          if (prevIds.length === ids.length && prevIds.every((id, i) => id === ids[i])) {
              return prevIds;
          }
          return ids;
      });
      setSelectedText(text);

      // Auto-reveal block in preview
      if (ids.length > 0 && previewRef.current && autoReveal) {
           // If we are currently processing a scroll initiated by Preview, ignore this (unlikely to happen during selection but safe)
           // Also check if we are already syncing to prevent re-triggering
           if (!isSyncingFromPreview.current && !isSyncingFromSource.current) {
                isSyncingFromSource.current = true;
                previewRef.current.scrollToBlock(ids[0]);
                
                // Give it sufficient time for smooth scroll to complete (prevent feedback loop)
                if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
                syncTimeoutRef.current = window.setTimeout(() => { 
                    isSyncingFromSource.current = false; 
                }, 1000);
           }
      }
  }, [blocks, autoReveal]);

  // Derive ranges for Source Editor highlighting
  const activeRanges = useMemo(() => {
      if (!showBlockHighlight) return [];
      
      return blocks
          .filter(b => highlightedBlockIds.includes(b.id))
          .map(b => ({ startLine: b.startLine, endLine: b.endLine }));
  }, [blocks, highlightedBlockIds, showBlockHighlight]);

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
        <MainLayout
            isSyncSourceToPreview={syncSourceToPreview}
            onToggleSyncSourceToPreview={() => setSyncSourceToPreview(!syncSourceToPreview)}
            isSyncPreviewToSource={syncPreviewToSource}
            onToggleSyncPreviewToSource={() => setSyncPreviewToSource(!syncPreviewToSource)}
            theme={theme}
            onThemeChange={setTheme}
            showBlockHighlight={showBlockHighlight}
            onToggleBlockHighlight={() => setShowBlockHighlight(!showBlockHighlight)}
            autoReveal={autoReveal}
            onToggleAutoReveal={() => setAutoReveal(!autoReveal)}
            explorer={
                <FileExplorer 
                    files={files}
                    activeFile={activeFile}
                    onSelectFile={setActiveFile}
                    onUpload={handleFilesUpload}
                />
            }
            editor={
        <SourceEditor 
          ref={sourceEditorRef}
          value={content} 
          onChange={(newVal, immediate) => activeFile && updateFileContent(activeFile, newVal, immediate)} 
          lintErrors={lintErrors}
          onScroll={handleEditorScroll}
          onSelectionChange={handleSelectionChange}
          highlightedRanges={activeRanges}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      }
      preview={
        <DocPreview 
            ref={previewRef}
            blocks={blocks}
            blocks={blocks} // Warning: duplicate prop
            onEditBlock={handleEditBlock}
            onUpdateBlock={handleBlockUpdate}
            onCancelEdit={handleCancelEdit}
            activeBlockId={activeBlockId}
            highlightedBlockIds={highlightedBlockIds}
            highlightText={selectedText}
            onScroll={handlePreviewScroll}
            files={deferredFiles}
        />
      }
    />
    </div>
  );
}

export default App;
