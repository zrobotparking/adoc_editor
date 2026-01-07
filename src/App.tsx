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
      
      // We need to replace lines from currentBlock.startLine to currentBlock.endLine
      // with the new content.
      // Note: newTableAsciiDoc might have different number of lines
      
      const preBlock = lines.slice(0, currentBlock.startLine);
      const postBlock = lines.slice(currentBlock.endLine + 1);
      
      // Join to ensure clean newlines
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

  return (
    <MainLayout
      editor={
        <SourceEditor 
          value={content} 
          onChange={setContent} 
        />
      }
      preview={
        editMode === 'visual-table' && currentTableData ? (
            <div className="flex flex-col h-full bg-[#252526]">
                <div className="flex justify-between items-center p-2 bg-[#333333] border-b border-[#3c3c3c]">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Visual Table Editor (Table #{activeTableIndex + 1})
                    </span>
                    <button 
                        onClick={() => setEditMode('preview')}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:opacity-80"
                    >
                        Done
                    </button>
                </div>
                <VisualTableEditor 
                    data={currentTableData} 
                    onUpdate={handleTableUpdate}
                />
            </div>
        ) : (
            <DocPreview 
                content={content} 
                onEditTable={enterTableEdit}
                onEditText={enterTextEdit}
            />
        )
      }
    />
  );
}

export default App;
