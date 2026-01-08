import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { SourceEditor } from './components/Editor/SourceEditor';
import { DocPreview } from './components/Preview/DocPreview';
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

// ... (previous imports)

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

  // Sync Scroll State
  const [syncScroll, setSyncScroll] = useState(true);
  const [theme, setTheme] = useState<'light'|'dark'>('dark');
  const previewRef = React.useRef<HTMLDivElement>(null);

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

  // ... (edit handlers remain same)
  const handleEditBlock = useCallback((id: string, type: 'table' | 'text') => {
      setActiveBlockId(id);
  }, []);

  const handleCancelEdit = useCallback(() => {
      setActiveBlockId(null);
  }, []);

  // ... (scroll handlers remain same)
  const handleEditorScroll = useCallback((scrollTop: number, ratio: number) => {
      if (syncScroll && previewRef.current) {
          const previewEl = previewRef.current;
          const targetScroll = ratio * (previewEl.scrollHeight - previewEl.clientHeight);
          previewEl.scrollTop = targetScroll;
      }
  }, [syncScroll]);


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

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
        <MainLayout
            isSyncScroll={syncScroll}
            onToggleSyncScroll={() => setSyncScroll(!syncScroll)}
            theme={theme}
            onThemeChange={setTheme}
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
          value={content} 
          onChange={(newVal) => activeFile && updateFileContent(activeFile, newVal)} 
          lintErrors={lintErrors}
          onScroll={handleEditorScroll}
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
        />
      }
    />
    </div>
  );
}

export default App;
