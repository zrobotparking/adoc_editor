import React, { useState, useEffect } from 'react';
import Asciidoctor from 'asciidoctor';
import { BasicPipeParser } from '../../core/TableParser';
import { BasicTableSerializer } from '../../core/TableSerializer';
import { VisualTableEditor } from '../Editor/VisualTableEditor';
import { type Table } from '../../core/types';

const asciidoctor = Asciidoctor();

const DEFAULT_INPUT = `.HPM Dump Trigger Instructions
[cols="1,3,3", options="header"]
|===
| Hint Type | Primary Instruction | Pseudo-instruction Equivalent 
| .2+|Start Hint | \`csrrs rd, mcycle, x0\` | \`csrr rd, mcycle\` 
| \`csrrs rd, cycle, x0\` | \`csrr rd, cycle\` 
| End Hint | \`csrrs rd, minstret, x0\` | \`csrr rd, minstret\` 
| | \`csrrs rd, instret, x0\` | \`csrr rd, instret\` 
|===`;

export const TableTestPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [input, setInput] = useState(DEFAULT_INPUT);
    const [parsedJson, setParsedJson] = useState('');
    const [serializedAdoc, setSerializedAdoc] = useState('');
    const [renderedHtml, setRenderedHtml] = useState('');
    const [tableData, setTableData] = useState<Table | null>(null);

    const serializeAndRender = (table: Table) => {
        try {
            const serializer = new BasicTableSerializer();
            // Basic serialization
            const adoc = serializer.serialize(table);
            
            // For now, we don't persist table attributes in the visual editor state,
            // so we just render the raw table content.
            // In a real scenario, we'd merge attributes from the original block.
            setSerializedAdoc(adoc);

            const html = asciidoctor.convert(adoc) as string;
            setRenderedHtml(html);
        } catch (e: any) {
            console.error('Serialization/Render Error:', e);
            setRenderedHtml(`<div class="text-red-500">Error rendering table: ${e.message}</div>`);
        }
    };

    const handleTableUpdate = (newTable: Table) => {
        setTableData(newTable);
        serializeAndRender(newTable);
    };

    const runTest = () => {
        try {
            // 1. Parse
            const parser = new BasicPipeParser();
            const blocks = parser.parse(input);
            const tableBlock = blocks.find(b => b.type === 'table');

            if (!tableBlock || !tableBlock.table) {
                setParsedJson('No table block found.');
                setSerializedAdoc('');
                setRenderedHtml('');
                setTableData(null);
                return;
            }

            setTableData(tableBlock.table);
            setParsedJson(JSON.stringify(tableBlock.table, null, 2));

            // 2. Serialize & Render
            // We use the same helper to ensure consistency
            serializeAndRender(tableBlock.table);

        } catch (e: any) {
            setParsedJson(`Error parsing: ${e.message}`);
        }
    };

    // Auto-run on mount
    useEffect(() => {
        runTest();
    }, []);

    return (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col overflow-hidden">
            <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Table Logic Playground</h2>
                <button 
                    onClick={onClose}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Close
                </button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
                {/* Input Column */}
                <div className="w-1/3 flex flex-col p-4 border-r">
                    <h3 className="font-bold mb-2">Input AsciiDoc</h3>
                    <textarea 
                        className="flex-1 border p-2 font-mono text-sm resize-none"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button 
                        onClick={runTest}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Run Verification
                    </button>
                </div>

                {/* Editor Column */}
                <div className="w-1/3 flex flex-col p-4 border-r overflow-y-auto bg-gray-50">
                    <h3 className="font-bold mb-2">2. Visual Editor (Live)</h3>
                    <div className="flex-1 border border-gray-300 rounded overflow-hidden bg-white shadow-sm">
                        <VisualTableEditor 
                            data={tableData} 
                            onUpdate={handleTableUpdate}
                        />
                    </div>
                   
                    <div className="mt-4">
                        <h3 className="font-bold mb-2 text-xs text-gray-500 uppercase">Live Serialized Output</h3>
                        <pre className="bg-gray-100 p-2 border rounded text-xs overflow-auto max-h-[200px] text-gray-800 font-mono">
                            {serializedAdoc}
                        </pre>
                    </div>
                </div>

                {/* Preview Column */}
                <div className="w-1/3 flex flex-col p-4 bg-white overflow-y-auto">
                    <h3 className="font-bold mb-2">3. Rendered HTML Preview</h3>
                    <div 
                        className="prose max-w-none border p-4 rounded shadow-sm"
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    />
                </div>
            </div>
        </div>
    );
};
