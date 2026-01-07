import { type Table, type Row, type Cell, type TableParser, type TableBlock } from './types';

// Basic ID generator to avoid crypto dependency issues in some environments
function uuid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export class BasicPipeParser implements TableParser {
    parse(input: string): TableBlock[] {
        const lines = input.split('\n'); // Keep empty lines to track indices
        const blocks: TableBlock[] = [];
        
        let inTable = false;
        let tableStartLine = -1;
        let tableContentLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (/^\|={3,}$/.test(line)) {
                if (!inTable) {
                    // Start of a table
                    inTable = true;
                    tableStartLine = i;
                    tableContentLines = [];
                } else {
                    // End of a table
                    inTable = false;
                    const tableEndLine = i;
                    
                    const table = this.parseTableContent(tableContentLines);
                    if (table) {
                        blocks.push({
                            table,
                            startLine: tableStartLine,
                            endLine: tableEndLine
                        });
                    }
                }
            } else if (inTable) {
                tableContentLines.push(line);
            }
        }
        
        return blocks;
    }

    private parseTableContent(lines: string[]): Table | null {
         // Filter Empty lines
         const contentLines = lines.filter(l => l.trim() !== '');
         
         if (contentLines.length === 0) return null;
 
         const rows: Row[] = [];
         
         contentLines.forEach(line => {
             // Split line by '|'
             // Example: | Cell 1 | Cell 2
             // Note: This logic assumes simple pipe tables. 
             // AsciiDoc tables are complex, this is a simplified implementation.
             
             // Remove leading/trailing pipes if present for cleaner split
             const processingLine = line.replace(/^\|/, '').replace(/\|$/, '');
             
             const parts = processingLine.split('|');
             
             if (parts.length > 0) {
                 const cells: Cell[] = parts.map(part => ({
                     id: uuid(),
                     content: part.trim(),
                     rowSpan: 1,
                     colSpan: 1
                 }));
                 
                 // Only add if we successfully parsed cells
                 if (cells.length > 0) {
                     rows.push({
                         id: uuid(),
                         cells
                     });
                 }
             }
         });

         if (rows.length === 0) return null;
 
         return {
             id: uuid(),
             rows
         };
    }
}
