import { useState, useMemo, useCallback } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { SourceEditor } from './components/Editor/SourceEditor';
import { VisualTableEditor } from './components/Editor/VisualTableEditor';
import { DocPreview } from './components/Preview/DocPreview';
import { BasicPipeParser } from './core/TableParser';
import { BasicTableSerializer } from './core/TableSerializer';
import { type Table } from './core/types';

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
  // Interaction Modes: 'preview', 'visual-table', 'source-focus'
  const [editMode, setEditMode] = useState<'preview' | 'visual-table'>('preview');
  const [activeTableIndex, setActiveTableIndex] = useState<number>(-1);

  // Parse all tables
  const tableBlocks = useMemo(() => {
    const parser = new BasicPipeParser();
    return parser.parse(content);
  }, [content]);

  // Handle updates from Visual Editor
  const handleTableUpdate = useCallback((updatedTable: Table) => {
      if (activeTableIndex === -1 || !tableBlocks[activeTableIndex]) return;
      
      const currentBlock = tableBlocks[activeTableIndex];
      const serializer = new BasicTableSerializer();
      const newTableAsciiDoc = serializer.serialize(updatedTable);
      
      // Split content into lines to replace the exact block
      const lines = content.split('\n');
      
      const preBlock = lines.slice(0, currentBlock.startLine);
      const postBlock = lines.slice(currentBlock.endLine + 1);
      
      const newContent = [
          ...preBlock,
          newTableAsciiDoc,
          ...postBlock
      ].join('\n');

      setContent(newContent);
  }, [content, activeTableIndex, tableBlocks]);

  const enterTableEdit = useCallback((index: number) => {
       if (tableBlocks[index]) {
           setActiveTableIndex(index);
           setEditMode('visual-table');
       }
  }, [tableBlocks]);

  const enterTextEdit = useCallback(() => {
      setEditMode('preview');
      setActiveTableIndex(-1);
  }, []);

  const currentTableData = activeTableIndex !== -1 && tableBlocks[activeTableIndex] 
      ? tableBlocks[activeTableIndex].table 
      : null;

  /* Inline Editor Node construction */
  const inlineEditor = editMode === 'visual-table' && currentTableData ? (
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
              data={currentTableData} 
              onUpdate={handleTableUpdate}
          />
      </div>
  ) : null;

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
            onEditText={enterTextEdit}
            activeTableIndex={activeTableIndex}
            isEditing={editMode === 'visual-table'}
            editorNode={inlineEditor}
        />
      }
    />
  );
}

export default App;
