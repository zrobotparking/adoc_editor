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
import { IncludeResolver } from './core/IncludeResolver';

import { TableTestPage } from './components/Playground/TableTestPage';
import { OutlineView } from './components/Explorer/OutlineView';
import { SearchView, type SearchResult } from './components/Search/SearchView';
import { GitView } from './components/Git/GitView';
import { GitImportDialog } from './components/Git/GitImportDialog';

function App() {
  console.time('App Render Total');
  useEffect(() => {
      console.timeEnd('App Render Total');
  });

  // Persistence Helper
  const STORAGE_KEY = 'adoc_editor_state';
  const getInitialState = () => {
      try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
              const parsed = JSON.parse(saved);
              // Validate structure roughly
              if (parsed.files && typeof parsed.files === 'object') {
                  return parsed;
              }
          }
      } catch (e) {
          console.error('Failed to load state', e);
      }
      return {
          files: { 'example.adoc': INITIAL_CONTENT },
          activeFile: 'example.adoc'
      };
  };

  const initialState = useMemo(() => getInitialState(), []);

  const [showTestPage, setShowTestPage] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(50);



  // Multi-File State with History
  const {
      state: files,
      set: setFiles,
      undo: undoFiles,
      redo: redoFiles,
      canUndo,
      canRedo
  } = useHistory<Record<string, string>>(initialState.files, 2000, historyLimit);

  const [activeFile, setActiveFile] = useState<string | null>(initialState.activeFile);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  // Persist State Changes
  useEffect(() => {
      const stateToSave = {
          files,
          activeFile
      };
      // Debounce saving slightly to avoid heavy IO on every keystroke if files are huge?
      // For now, simple save is likely fine for this scale.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [files, activeFile]);

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
  const [highlightSourceOnPreviewClick, setHighlightSourceOnPreviewClick] = useState(true);
  
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
      } else if (targetBlock.type === 'code') {
           // Reconstruct the full block including delimiters and attributes
           // updatedData is the inner content
           const attributes = targetBlock.attributes ? targetBlock.attributes.join('\n') + '\n' : '';
           newBlockContent = `${attributes}----\n${updatedData}\n----`;
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

  const handleEditBlock = useCallback((id: string, type: 'table' | 'text' | 'code') => {
      if (highlightSourceOnPreviewClick) {
          // Just highlight source w/o scrolling or changing focus
          setHighlightedBlockIds([id]);
          // Continue to set Active Block (Trigger Edit) as requested
      }

      setActiveBlockId(id);
  }, [highlightSourceOnPreviewClick, files, activeFile, blocks]); // Added deps

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

  // Global Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
              setActiveBlockId(null);
          }
          // Ctrl+Alt+T to toggle Test Page
          if (e.ctrlKey && e.altKey && (e.key === 't' || e.key === 'T')) {
              setShowTestPage(prev => !prev);
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
  
  // Collapse State (New)
  const [collapsedBlockIds, setCollapsedBlockIds] = useState<string[]>([]);
  
  const handleToggleCollapse = useCallback((id: string) => {
      setCollapsedBlockIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

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
           // AND check if block is collapsed? Maybe auto-expand?
           // For now, respect collapse state or auto-expand if needed.
           // Let's auto-expand if user selects text in source?
           // setCollapsedBlockIds(prev => prev.filter(pid => pid !== ids[0])); // Auto-expand? maybe annoying.

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

  // PDF Generation Handler
  const handleGeneratePdf = async () => {
      if (!content) return;
      
      try {
          // Notify user (optional toast could go here)
          console.log('Generating PDF...');

          // Resolve Includes client-side before sending to server
          const resolvedContent = IncludeResolver.resolve(content, activeFile || 'document.adoc', files);
          
          const response = await fetch('/api/generate-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain' },
              body: resolvedContent
          });

          if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error || 'Failed to generate PDF');
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = (activeFile || 'document').replace(/\.adoc$/, '') + '.pdf';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
      } catch (error) {
          console.error('PDF Generation Failed:', error);
          alert('Failed to generate PDF. Make sure asciidoctor-pdf is installed in your system PATH.');
      }
  };

  // Derive ranges for Source Editor highlighting
  const activeRanges = useMemo(() => {
      if (!showBlockHighlight) return [];
      
      return blocks
          .filter(b => highlightedBlockIds.includes(b.id))
          .map(b => ({ startLine: b.startLine, endLine: b.endLine }));
  }, [blocks, highlightedBlockIds, showBlockHighlight]);

  // Search Logic
  const performSearch = useCallback((query: string): SearchResult[] => {
      if (!query.trim()) return [];
      
      const results: SearchResult[] = [];
      const lowerQuery = query.toLowerCase();

      // Search across all files
      Object.entries(files).forEach(([path, fileContent]) => {
          const lines = fileContent.split('\n');
          const fileMatches: any[] = [];

          lines.forEach((line, lineIdx) => {
              let searchIndex = 0;
              // Find all occurrences in the line
              while (true) {
                  const idx = line.toLowerCase().indexOf(lowerQuery, searchIndex);
                  if (idx === -1) break;

                  fileMatches.push({
                      line: lineIdx,
                      text: line,
                      startCol: idx,
                      endCol: idx + query.length
                  });
                  searchIndex = idx + 1;
              }
          });

          if (fileMatches.length > 0) {
              results.push({
                  file: path,
                  matches: fileMatches
              });
          }
      });

      return results;
  }, [files]);

  const handleSearchNavigate = useCallback((file: string, line: number) => {
      // 1. Switch File
      setActiveFile(file);
      
      // 2. Scroll Editor
      // Use setTimeout to allow editor to render new file content before scrolling
      setTimeout(() => {
          if (sourceEditorRef.current) {
               sourceEditorRef.current.scrollToLine(line + 1); // 1-based index for API? check implementation. SourceEditor checks seems to implied 1-based or 0-based? Let's assume 1-based from UI, but check SourceEditor implementation.
               // SourceEditor scrollToLine usually expects 1-based.
               // The search result line is 0-based index from split.
          }
      }, 50);
  }, [setActiveFile]);

  // Lazy load SearchView import? No, direct import is fine.
  // We need to import SearchView and SearchResult types at top of file.
  // But inside this function block we can just render it.

  const [isGitImportOpen, setIsGitImportOpen] = useState(false);

  const handleGitImport = async (repoUrl: string, token?: string) => {
      try {
          const response = await fetch('/api/git-clone', {
              method: 'POST',
              body: JSON.stringify({ repoUrl, token })
          });
          
          if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error || 'Git clone failed');
          }

          const data = await response.json();
          // data.files is array of { path, content }
          handleFilesUpload(data.files);
          
          setIsGitImportOpen(false);
          // Optional: switch to explorer?
          // But maybe not, user might want to see git view status?
          // For now, auto-switching to first file in handleFilesUpload handles activation.
      } catch (e: any) {
          console.error('Git Import Failed', e);
          alert('Git Import Failed: ' + e.message);
          throw e; // Propagate to dialog
      }
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
        {showTestPage && <TableTestPage onClose={() => setShowTestPage(false)} />}
        <GitImportDialog 
            isOpen={isGitImportOpen}
            onClose={() => setIsGitImportOpen(false)}
            onImport={handleGitImport}
        />
        
        <button 
            onClick={() => setShowTestPage(true)}
            className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-2 rounded-full shadow-lg opacity-50 hover:opacity-100 transition-opacity"
            title="Open Table Playground"
        >
            🐞
        </button>

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
            onGeneratePdf={handleGeneratePdf}
            highlightSourceOnPreviewClick={highlightSourceOnPreviewClick}
            onToggleHighlightSourceOnPreviewClick={() => setHighlightSourceOnPreviewClick(prev => !prev)}
            historyLimit={historyLimit}
            onHistoryLimitChange={setHistoryLimit}
            explorer={
                <FileExplorer 
                    files={files}
                    activeFile={activeFile}
                    onSelectFile={setActiveFile}
                    onUpload={handleFilesUpload}
                />
            }
            search={
                <SearchView
                    onSearch={performSearch}
                    onNavigate={handleSearchNavigate}
                />
            }
            git={
                <GitView 
                    onOpenImportDialog={() => setIsGitImportOpen(true)}
                />
            }
            outline={
                <OutlineView 
                    blocks={blocks}
                    activeBlockId={activeBlockId} // Optional: Highlight if it matches
                    onNavigate={(blockId) => {
                        // 1. Scroll Preview
                        if (previewRef.current) {
                            previewRef.current.scrollToBlock(blockId);
                        }
                        
                        // 2. Scroll Source
                        const block = blocks.find(b => b.id === blockId);
                        if (block && sourceEditorRef.current) {
                            // Use newly exposed scrollToLine to navigate without setting active block (Editing Frame)
                            sourceEditorRef.current.scrollToLine(block.startLine);
                        }
                    }}
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
          // Collapse Props
          blocks={blocks}
          collapsedBlockIds={collapsedBlockIds}
          onToggleCollapse={handleToggleCollapse}
        />
      }
      preview={
        <DocPreview 
            ref={previewRef}
            blocks={blocks}
            onEditBlock={handleEditBlock}
            onUpdateBlock={handleBlockUpdate}
            onCancelEdit={handleCancelEdit}
            activeBlockId={activeBlockId}
            highlightedBlockIds={highlightedBlockIds}
            highlightText={selectedText}
            onScroll={handlePreviewScroll}
            files={deferredFiles}
            // Collapse Props
            collapsedBlockIds={collapsedBlockIds}
            onToggleCollapse={handleToggleCollapse}
        />
      }
    />
    </div>
  );
}

export default App;
