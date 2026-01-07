import { type Table, type Row, type Cell, type TableParser, type TableBlock, type Block } from './types';

// Basic ID generator to avoid crypto dependency issues in some environments
function uuid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export class BasicPipeParser implements TableParser {
    parse(input: string): Block[] {
        const lines = input.split('\n');
        const blocks: Block[] = [];
        let blockIndex = 0;
        
        let inTable = false;
        let tableStartLine = -1;
        let tableContentLines: string[] = [];
        
        // Track text content state
        let textStartLine = -1;
        let textContentLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]; // Keep whitespace for text accuracy
            const trimmedLine = line.trim();
            
            if (/^\|={3,}$/.test(trimmedLine)) {
                if (!inTable) {
                    // --- Start of a table ---
                    
                    // 1. Flush any pending text block before this table
                    if (textContentLines.length > 0) {
                        blocks.push({
                            id: `block-${blockIndex++}`,
                            type: 'text',
                            content: textContentLines.join('\n'),
                            startLine: textStartLine,
                            endLine: i - 1
                        });
                        textContentLines = [];
                        textStartLine = -1;
                    }

                    // 2. Start tracking table
                    inTable = true;
                    tableStartLine = i;
                    tableContentLines = [];
                } else {
                    // --- End of a table ---
                    inTable = false;
                    const tableEndLine = i;
                    
                    const table = this.parseTableContent(tableContentLines, blockIndex);
                    if (table) {
                        blocks.push({
                            id: `block-${blockIndex++}`,
                            type: 'table',
                            table,
                            startLine: tableStartLine,
                            endLine: tableEndLine
                        });
                    }
                    
                    // Reset text tracking for next block
                    // Next text block starts at i + 1
                    textStartLine = i + 1;
                    textContentLines = [];
                }
            } else if (inTable) {
                tableContentLines.push(line);
            } else {
                // We are in a text block area
                if (textStartLine === -1) {
                    textStartLine = i;
                }
                textContentLines.push(line);
            }
        }
        
        // Flush any remaining text at the end of file
        if (textContentLines.length > 0) {
             blocks.push({
                id: `block-${blockIndex++}`,
                type: 'text',
                content: textContentLines.join('\n'),
                startLine: textStartLine,
                endLine: lines.length - 1
            });
        }
        
        return blocks;
    }

    private parseTableContent(lines: string[], blockIndex: number): Table | null {
         // Filter Empty lines
         const contentLines = lines.filter(l => l.trim() !== '');
         
         if (contentLines.length === 0) return null;
 
         const rows: Row[] = [];
         
         contentLines.forEach((line, rowIndex) => {
             // Split line by '|'
             // Example: | Cell 1 | Cell 2
             // Note: This logic assumes simple pipe tables. 
             // AsciiDoc tables are complex, this is a simplified implementation.
             
             // Remove leading/trailing pipes if present for cleaner split
             const processingLine = line.replace(/^\|/, '').replace(/\|$/, '');
             
             const parts = processingLine.split('|');
             
             if (parts.length > 0) {
                 const cells: Cell[] = parts.map((part, colIndex) => ({
                     id: `cell-${blockIndex}-${rowIndex}-${colIndex}`,
                     content: part.trim(),
                     rowSpan: 1,
                     colSpan: 1
                 }));
                 
                 // Only add if we successfully parsed cells
                 if (cells.length > 0) {
                     rows.push({
                         id: `row-${blockIndex}-${rowIndex}`,
                         cells
                     });
                 }
             }
         });

         if (rows.length === 0) return null;
 
         return {
             id: `table-${blockIndex}`,
             rows
         };
    }
}
