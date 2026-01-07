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

function App() {
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  // Parse all blocks
  const blocks = useMemo(() => {
    const parser = new BasicPipeParser();
    return parser.parse(content);
  }, [content]);

  // Handle updates from Visual Editor (both Table and Text) via ID
  const handleBlockUpdate = useCallback((id: string, updatedData: any) => {
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
      editor={
        <SourceEditor 
          value={content} 
          onChange={setContent} 
        />
      }
      preview={
        <DocPreview 
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
