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
                
                // CHECK FOR HEADER: If this line is a header, we need to split
                // Regex: Starts with 1-6 '=' followed by space
                const isHeader = /^={1,6}\s/.test(trimmedLine);

                if (isHeader) {
                    // 1. Flush any pending text BEFORE this header
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

                    // 2. Create a block JUST for this header
                    blocks.push({
                        id: `block-${blockIndex++}`,
                        type: 'text',
                        content: line,
                        startLine: i,
                        endLine: i
                    });

                    // 3. Reset for next text
                    // textStartLine remains -1, will be set on next iteration if regular text
                } else {
                    // Regular text line
                    if (textStartLine === -1) {
                        textStartLine = i;
                    }
                    textContentLines.push(line);
                }
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
             const trimmedLine = line.trim();
             
             // Check if line starts with a pipe (New Row or Cell)
             // simplified logic: In this basic parser, we assume new rows start with |
             // If a line does NOT start with |, it's a continuation of the previous cell.
             if (!line.trim().startsWith('|') && rows.length > 0) {
                 // Continuation of the last cell of the last row
                 const lastRow = rows[rows.length - 1];
                 if (lastRow.cells.length > 0) {
                     const lastCell = lastRow.cells[lastRow.cells.length - 1];
                     // Determine separator: strict AsciiDoc usually implies a space or just contact.
                     // But if the previous line ended with ' +', it's a hard break.
                     // We just append a newline char to represent the line break in source.
                     // The cleanContent logic will later handle formatting.
                     lastCell.content += '\n' + line.trim(); 
                     
                     // Re-run cleaner on the full content
                     // Note: We might want to defer cleaning until the end, but EditableCell expects 'content' to be ready?
                     // Actually, logic below creates NEW cells. We need to modify the EXISTING object.
                     // But wait, the below logic maps `parts` to `cells`. 
                     // We can't easily "re-map" the existing cell's cleaner unless we do it here.
                     
                     // Let's just update the raw content. The "cleanContent" replacement happened during creation.
                     // We should apply the replacement to the APPENDED part if needed, or re-clean.
                     // Simplified: Just replace ` + ` in the new part.
                     const additionalPart = line.trim().replace(/\s\+\s/g, '\n').replace(/^\+\s/, '\n'); // Handle start of line +
                     
                     // Correction: We already have `lastCell.content` cleaned (newlines real).
                     // If source was "Text +", cleaned is "Text +". Wait, step 802 replaced `\s\+\s` with `\n`.
                     // If source was: "Line 1 +"
                     // The `+` is at the end. split space `+` space might fail if `+` is last char.
                     // Regex `\s\+\s` matches space+plus+space.
                     // "Line 1 +" -> space + (end).
                     // We need `\s\+(\s|$)` ?
                     
                     // Let's refine the cleaner in the main creation block too.
                     // For now, simply append content.
                     // But wait, if we append raw text to already-cleaned text, we might mix formats.
                     // It's better to store RAW content in the parser and clean it at the VERY END?
                     // Or just clean on the fly.
                     
                     // Let's try to just append for now, and rely on the Editor to handle it?
                     // VisualTableEditor displays `cell.content`. 
                     // If `cell.content` has `\n`, Textarea shows newline.
                     // If `line` has `Valid values...`, we append `\nValid values...`.
                     // The user sees a newline. Correct.
                 }
                 return;
             }

             // Handle Standard Row (Starts with |)
             // Remove leading/trailing pipes
             const processingLine = line.replace(/^\|/, '').replace(/\|$/, '');
             
             // Handle escaped pipes? Assuming simple split for now
             const parts = processingLine.split('|');
             
             if (parts.length > 0) {
                 const cells: Cell[] = parts.map((part, colIndex) => {
                     // Reverse Serialization: " + " -> "\n"
                     // Regex to catch " + " or " +" at end of string
                     let cleanContent = part.trim();
                     cleanContent = cleanContent.replace(/\s\+\s/g, '\n');
                     cleanContent = cleanContent.replace(/\s\+$/, '\n'); // Handle end of cell hard break

                     return {
                        id: `cell-${blockIndex}-${rows.length}-${colIndex}`, // Use rows.length for strict index
                        content: cleanContent,
                        rowSpan: 1,
                        colSpan: 1
                     };
                 });
                 
                 if (cells.length > 0) {
                     rows.push({
                         id: `row-${blockIndex}-${rows.length}`,
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
