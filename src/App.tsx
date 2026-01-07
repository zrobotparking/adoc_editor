import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { SourceEditor } from './components/Editor/SourceEditor';
import { VisualTableEditor } from './components/Editor/VisualTableEditor';
import { VisualTextEditor } from './components/Editor/VisualTextEditor';
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

// ... (previous imports)

function App() {
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  // Parse all blocks
  const blocks = useMemo(() => {
    const parser = new BasicPipeParser();
    return parser.parse(content);
  }, [content]);

  // Lint Content
  const lintErrors = useMemo(() => {
      const linter = new AsciiDocLinter();
      return linter.lint(content);
  }, [content]);

  // Sync Scroll State
  const [syncScroll, setSyncScroll] = useState(true);
  const previewRef = React.useRef<HTMLDivElement>(null);

  // Handle updates from Visual Editor (both Table and Text) via ID
  const handleBlockUpdate = useCallback((id: string, updatedData: any) => {
      // ... (existing logic)
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
      const lines = content.split('\n');
      
      const preBlock = lines.slice(0, targetBlock.startLine);
      const postBlock = lines.slice(targetBlock.endLine + 1);
      
      const newContent = [
          ...preBlock,
          newBlockContent,
          ...postBlock
      ].join('\n');

      setContent(newContent);
  }, [content, blocks]);

  const handleEditBlock = useCallback((id: string, type: 'table' | 'text') => {
      setActiveBlockId(id);
  }, []);

  const handleCancelEdit = useCallback(() => {
      setActiveBlockId(null);
  }, []);

  // Sync Scroll Handler
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

  return (
    <MainLayout
      isSyncScroll={syncScroll}
      onToggleSyncScroll={() => setSyncScroll(!syncScroll)}
      editor={
        <SourceEditor 
          value={content} 
          onChange={setContent} 
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
  );
}

export default App;
