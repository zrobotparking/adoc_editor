import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { SourceEditor } from './components/Editor/SourceEditor';
import { VisualTableEditor } from './components/Editor/VisualTableEditor';
import { VisualTextEditor } from './components/Editor/VisualTextEditor';
import { DocPreview } from './components/Preview/DocPreview';
import { BasicPipeParser } from './core/TableParser';
import { BasicTableSerializer } from './core/TableSerializer';
import { type Table, type Block } from './core/types';

// Sample AsciiDoc with a table
// Sample AsciiDoc with multiple tables
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
  // Interaction Modes: 'preview', 'visual-table', 'visual-text'
  const [editMode, setEditMode] = useState<'preview' | 'visual-table' | 'visual-text'>('preview');
  const [activeBlockIndex, setActiveBlockIndex] = useState<number>(-1);

  // Parse all blocks
  const blocks = useMemo(() => {
    const parser = new BasicPipeParser();
    return parser.parse(content);
  }, [content]);

  // Handle updates from Visual Editor (both Table and Text)
  const handleBlockUpdate = useCallback((updatedData: Table | string) => {
      if (activeBlockIndex === -1 || !blocks[activeBlockIndex]) return;
      
      const currentBlock = blocks[activeBlockIndex];
      let newBlockContent = '';

      if (currentBlock.type === 'image' || currentBlock.type === 'other') { 
          // Not implemented yet
          return;
      }
      
      if (typeof updatedData === 'object' && 'rows' in updatedData) {
           // It's a table
           const serializer = new BasicTableSerializer();
           newBlockContent = serializer.serialize(updatedData);
      } else if (typeof updatedData === 'string') {
           // It's text
           newBlockContent = updatedData;
      } else {
           return;
      }

      // Split content into lines to replace the exact block
      const lines = content.split('\n');
      
      const preBlock = lines.slice(0, currentBlock.startLine);
      const postBlock = lines.slice(currentBlock.endLine + 1);
      
      const newContent = [
          ...preBlock,
          newBlockContent,
          ...postBlock
      ].join('\n');

      setContent(newContent);
  }, [content, activeBlockIndex, blocks]);

  // Handle Table Click (Index is strictly index of the <table> in DOM)
  const enterTableEdit = useCallback((tableDOMIndex: number) => {
      let currentTableCount = 0;
      let targetBlockIndex = -1;
      
      for (let i = 0; i < blocks.length; i++) {
          if (blocks[i].type === 'table') {
              if (currentTableCount === tableDOMIndex) {
                  targetBlockIndex = i;
                  break;
              }
              currentTableCount++;
          }
      }

      if (targetBlockIndex !== -1) {
          console.log(`[App] Table DOM Index ${tableDOMIndex} mapped to Block ${targetBlockIndex}`);
          setActiveBlockIndex(targetBlockIndex);
          setEditMode('visual-table');
      } else {
          console.error(`[App] Could not map DOM Table Index ${tableDOMIndex} to a block.`);
      }
  }, [blocks]);

  const enterTextZoneEdit = useCallback((zoneIndex: number) => {
      // ... (Existing implementation, assuming it is correct for now)
      // Zone Index mapping:
      // 0 -> Text before first table
      // 1 -> Text between Table 1 and 2
      
      let tableCount = 0;
      let targetBlockIndex = -1;

      // Special case: Zone 0. Look for text before first table.
      if (zoneIndex === 0) {
          const firstTableIndex = blocks.findIndex(b => b.type === 'table');
          if (firstTableIndex === -1) {
              targetBlockIndex = blocks.findIndex(b => b.type === 'text');
          } else {
              if (firstTableIndex > 0 && blocks[firstTableIndex - 1].type === 'text') {
                  targetBlockIndex = firstTableIndex - 1;
              } else if (blocks[0].type === 'text') {
                  targetBlockIndex = 0;
              }
          }
      } else {
          for (let i = 0; i < blocks.length; i++) {
              if (blocks[i].type === 'table') {
                  tableCount++;
                  if (tableCount === zoneIndex) {
                      if (i + 1 < blocks.length && blocks[i + 1].type === 'text') {
                          targetBlockIndex = i + 1;
                      }
                      break;
                  }
              }
          }
      }

      if (targetBlockIndex !== -1) {
          console.log(`[App] Text Zone ${zoneIndex} mapped to Block ${targetBlockIndex}`);
          setActiveBlockIndex(targetBlockIndex);
          setEditMode('visual-text');
      }
  }, [blocks]);

  const currentBlock = activeBlockIndex !== -1 ? blocks[activeBlockIndex] : null;
  
  // Calculate which DOM Table index is currently active (for Portal placement)
  const activeTableDOMIndex = useMemo(() => {
      if (activeBlockIndex === -1 || !currentBlock || currentBlock.type !== 'table') {
          return -1;
      }
      // Count tables before the active block
      let count = 0;
      for (let i = 0; i < activeBlockIndex; i++) {
          if (blocks[i].type === 'table') count++;
      }
      return count;
  }, [activeBlockIndex, currentBlock, blocks]);

  /* Inline Editor Node construction */
  let inlineEditor: React.ReactNode = null;

  // ESC key handler to exit edit mode
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
              if (editMode !== 'preview') {
                  setEditMode('preview');
                  setActiveBlockIndex(-1);
              }
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editMode]);

  if (activeBlockIndex !== -1 && currentBlock) {
      if (editMode === 'visual-table' && 'table' in currentBlock) {
          inlineEditor = (
              <div className="border border-blue-500 shadow-xl my-4">
                  <div className="flex justify-between items-center p-2 bg-blue-50 border-b border-blue-200">
                      <span className="text-xs font-bold text-blue-800">EDITING TABLE</span>
                      <button 
                          onClick={() => setEditMode('preview')}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                          Done
                      </button>
                  </div>
                  <VisualTableEditor 
                      data={currentBlock.table} 
                      onUpdate={(t) => handleBlockUpdate(t)}
                  />
              </div>
          );
      } else if (editMode === 'visual-text' && currentBlock.type === 'text') {
           inlineEditor = (
              <div className="border border-green-500 shadow-xl my-4">
                  <div className="flex justify-between items-center p-2 bg-green-50 border-b border-green-200">
                      <span className="text-xs font-bold text-green-800">EDITING TEXT</span>
                      <button 
                          onClick={() => setEditMode('preview')}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                      >
                          Done
                      </button>
                  </div>
                  <VisualTextEditor 
                      initialContent={currentBlock.content} 
                      onUpdate={(s) => handleBlockUpdate(s)}
                  />
              </div>
          );
      }
  }

  // Calculate activeTextZoneIndex
  const activeTextZoneIndex = useMemo(() => {
      if (activeBlockIndex === -1 || !currentBlock || currentBlock.type !== 'text') {
          return -1;
      }
      // Count tables before active block
      let count = 0;
      for (let i = 0; i < activeBlockIndex; i++) {
          if (blocks[i].type === 'table') count++;
      }
      // If active block is Text, its Zone Index is roughly equal to number of tables before it?
      // Block[0] (Text) -> Tables before = 0 -> Zone 0. Correct.
      // Block[Text After Table 0] -> Tables before = 1 -> Zone 1. Correct.
      return count;
  }, [activeBlockIndex, currentBlock, blocks]);

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
            content={content} 
            onEditTable={enterTableEdit}
            onEditTextZone={enterTextZoneEdit} 
            activeTableIndex={activeTableDOMIndex}
            activeTextZoneIndex={activeTextZoneIndex}
            isEditing={editMode !== 'preview'}
            editorNode={inlineEditor}
        />
      }
    />
  );
}

export default App;
