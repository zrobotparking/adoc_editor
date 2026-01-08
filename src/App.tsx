import React, { useState, useMemo, useCallback, useEffect } from 'react';
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

function App() {
  // Multi-File State
  const [files, setFiles] = useState<Record<string, string>>({
      'example.adoc': INITIAL_CONTENT
  });
  const [activeFile, setActiveFile] = useState<string | null>('example.adoc');
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  // Derived current content (fallback to empty if no file)
  const content = activeFile ? (files[activeFile] || '') : '';

  // Update a specific file's content
  const updateFileContent = useCallback((path: string, newContent: string) => {
      setFiles(prev => ({
          ...prev,
          [path]: newContent
      }));
  }, []);

  // Parse all blocks of ACTIVE file
  const blocks = useMemo(() => {
    if (!content) return [];
    const parser = new BasicPipeParser();
    return parser.parse(content);
  }, [content]);

  // Lint Content
  const lintErrors = useMemo(() => {
    if (!content) return [];  
    const linter = new AsciiDocLinter();
    return linter.lint(content);
  }, [content]);

  // Sync Scroll State - Independent
  const [syncSourceToPreview, setSyncSourceToPreview] = useState(true);
  const [syncPreviewToSource, setSyncPreviewToSource] = useState(true);
  const [showBlockHighlight, setShowBlockHighlight] = useState(true);
  const [autoReveal, setAutoReveal] = useState(true);
  
  const [theme, setTheme] = useState<'light'|'dark'>('dark');
  const previewRef = React.useRef<DocPreviewHandle>(null);
  const sourceEditorRef = React.useRef<SourceEditorHandle>(null);
  
  // Mutex for loop prevention
  const isScrollingRef = React.useRef(false);

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

  // Scroll Handlers
  
  // Source -> Preview
  const handleEditorScroll = useCallback((scrollTop: number, ratio: number) => {
      if (syncSourceToPreview && previewRef.current) {
          if (!isScrollingRef.current) {
               isScrollingRef.current = true;
               previewRef.current.scrollToRatio(ratio);
               
               // Debounce/Timeout reset
               setTimeout(() => { isScrollingRef.current = false; }, 50);
          }
      }
  }, [syncSourceToPreview]);

  // Preview -> Source
  const handlePreviewScroll = useCallback((scrollTop: number, ratio: number) => {
      if (syncPreviewToSource && sourceEditorRef.current) {
          if (!isScrollingRef.current) {
               isScrollingRef.current = true;
               sourceEditorRef.current.scrollTo(ratio);
               setTimeout(() => { isScrollingRef.current = false; }, 50);
          }
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
      
      setHighlightedBlockIds(ids);
      setSelectedText(text);

      // Auto-reveal block in preview
      if (ids.length > 0 && previewRef.current && autoReveal) {
           if (!isScrollingRef.current) {
                isScrollingRef.current = true;
                previewRef.current.scrollToBlock(ids[0]);
                // Give it sufficient time for smooth scroll to complete (prevent feedback loop)
                setTimeout(() => { isScrollingRef.current = false; }, 1200);
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
          onChange={(newVal) => activeFile && updateFileContent(activeFile, newVal)} 
          lintErrors={lintErrors}
          onScroll={handleEditorScroll}
          onSelectionChange={handleSelectionChange}
          highlightedRanges={activeRanges}
        />
      }
      preview={
        <DocPreview 
            ref={previewRef}
            blocks={blocks}
            blocks={blocks}
            onEditBlock={handleEditBlock}
            onUpdateBlock={handleBlockUpdate}
            onCancelEdit={handleCancelEdit}
            activeBlockId={activeBlockId}
            highlightedBlockIds={highlightedBlockIds}
            highlightText={selectedText}
            onScroll={handlePreviewScroll}
            files={files}
        />
      }
    />
    </div>
  );
}

export default App;
