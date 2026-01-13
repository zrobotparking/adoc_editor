import { type Table, type Row, type Cell, type TableParser, type Block } from './types';

// Basic ID generator to avoid crypto dependency issues in some environments
// function uuid(): string { return ... } // Unused

export class BasicPipeParser implements TableParser {
    parse(input: string): Block[] {
        const lines = input.split('\n');
        const blocks: Block[] = [];
        let blockIndex = 0;
        
        let inTable = false;
        let tableStartLine = -1;
        let tableContentLines: string[] = [];
        let currentTableAttributes: string[] = [];
        
        // Track Code Block state
        let inCodeBlock = false;
        let codeBlockStartLine = -1;
        let codeBlockContentLines: string[] = [];
        let currentCodeAttributes: string[] = [];
        
        // Track text content state
        let textStartLine = -1;
        let textContentLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]; // Keep whitespace for text accuracy
            const trimmedLine = line.trim();
            
            if (/^\|={3,}$/.test(trimmedLine) && !inCodeBlock) {
                if (!inTable) {
                    // --- Start of a table ---
                    
                    // 0. Check for Metadata (Attributes/Title) in pending text
                    currentTableAttributes = [];
                    let attributesStartLine = -1;

                    if (textContentLines.length > 0) {
                        // Scan backwards for metadata
                        let cutoffIndex = textContentLines.length;
                        while (cutoffIndex > 0) {
                             const l = textContentLines[cutoffIndex - 1].trim();
                             // Match [attributes] or .Title (but not ..DoubleDot)
                             if ((/^\[.*\]$/.test(l)) || (/^\.[^.]+.*$/.test(l))) {
                                 cutoffIndex--;
                             } else {
                                 break;
                             }
                        }
                        
                        if (cutoffIndex < textContentLines.length) {
                             currentTableAttributes = textContentLines.slice(cutoffIndex);
                             // Calculate the line number where attributes start
                             // textStartLine is the start of the whole text block
                             // The attributes start at cutoffIndex relative to textStartLine
                             attributesStartLine = textStartLine + cutoffIndex;
                             
                             textContentLines = textContentLines.slice(0, cutoffIndex);
                        }
                    }
                    
                    // 1. Flush any pending text block (minus attributes)
                    if (textContentLines.length > 0) {
                        blocks.push({
                            id: `block-${blockIndex++}`,
                            type: 'text',
                            content: textContentLines.join('\n'),
                            startLine: textStartLine, 
                            endLine: (textStartLine + textContentLines.length) - 1
                        });
                        textContentLines = [];
                        textStartLine = -1;
                    }

                    // 2. Start tracking table
                    inTable = true;
                    // If we found attributes, the table block conceptually starts there
                    tableStartLine = attributesStartLine !== -1 ? attributesStartLine : i;
                    tableContentLines = [];
                } else {
                    // --- End of a table ---
                    inTable = false;
                    const tableEndLine = i;
                    
                    const table = this.parseTableContent(tableContentLines, blockIndex, currentTableAttributes);
                    if (table) {
                        blocks.push({
                            id: `block-${blockIndex++}`,
                            type: 'table',
                            table,
                            startLine: tableStartLine,
                            endLine: tableEndLine,
                            attributes: currentTableAttributes.filter(a => a.startsWith('[')),
                            title: currentTableAttributes.find(a => a.startsWith('.'))?.substring(1).trim()
                        });
                    }
                    currentTableAttributes = [];
                    
                    // Reset text tracking for next block
                    // Next text block starts at i + 1
                    textStartLine = i + 1;
                    textContentLines = [];
                }
            } else if (/^-{4,}$/.test(trimmedLine) && !inTable) {
                // --- Code Block Delimiter ---
                if (!inCodeBlock) {
                    // Start of Code Block
                    
                    // 0. Check for Metadata
                    let attributes: string[] = [];
                    let attributesStartLine = -1;

                     if (textContentLines.length > 0) {
                        let cutoffIndex = textContentLines.length;
                        while (cutoffIndex > 0) {
                             const l = textContentLines[cutoffIndex - 1].trim();
                             if ((/^\[.*\]$/.test(l)) || (/^\.[^.]+.*$/.test(l))) {
                                 cutoffIndex--;
                             } else {
                                 break;
                             }
                        }
                        
                        if (cutoffIndex < textContentLines.length) {
                             attributes = textContentLines.slice(cutoffIndex);
                             attributesStartLine = textStartLine + cutoffIndex;
                             textContentLines = textContentLines.slice(0, cutoffIndex);
                        }
                    }

                    // 1. Flush Pending Text
                    if (textContentLines.length > 0) {
                        blocks.push({
                            id: `block-${blockIndex++}`,
                            type: 'text',
                            content: textContentLines.join('\n'),
                            startLine: textStartLine, 
                            endLine: (textStartLine + textContentLines.length) - 1
                        });
                        textContentLines = [];
                        textStartLine = -1;
                    }

                    // 2. Start Code Block
                    inCodeBlock = true;
                    codeBlockStartLine = attributesStartLine !== -1 ? attributesStartLine : i;
                    codeBlockContentLines = [];
                    currentCodeAttributes = attributes;

                } else {
                     // End of Code Block
                     inCodeBlock = false;
                     const codeEndLine = i;
                     
                     blocks.push({
                         id: `block-${blockIndex++}`,
                         type: 'code',
                         content: codeBlockContentLines.join('\n'),
                         startLine: codeBlockStartLine,
                         endLine: codeEndLine,
                         attributes: currentCodeAttributes.filter(a => a.startsWith('[')),
                         title: currentCodeAttributes.find(a => a.startsWith('.'))?.substring(1).trim()
                     });

                     currentCodeAttributes = [];
                     textStartLine = i + 1;
                     textContentLines = [];
                }

            } else if (inTable) {
                tableContentLines.push(line);
            } else if (inCodeBlock) {
                codeBlockContentLines.push(line);
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
                } else if (trimmedLine === '') {
                    // EMPTY LINE SPLIT
                    // 1. Flush Pending Text
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

                    // 2. Push Empty Block (Spacer)
                    blocks.push({
                         id: `block-${blockIndex++}`,
                         type: 'text',
                         content: line,
                         startLine: i,
                         endLine: i
                    });
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

    private parseTableContent(lines: string[], blockIndex: number, attributes: string[]): Table | null {
         // 1. Determine Column Count from attributes
         let colCount = 0;
         const colsAttr = attributes.find(a => a.includes('cols='));
         if (colsAttr) {
             const match = colsAttr.match(/cols="?([^"]+)"?/);
             if (match) {
                 // Format: "1,2,3" or "2*^" etc.
                 // Simple comma count for now
                 const parts = match[1].split(',');
                 colCount = parts.length;
             }
         }

         // Filter Empty lines (unless we want to use them as row separators? 
         // Standard AsciiDoc: cells just flow into the grid. Empty lines are separators if strict, but let's rely on cols if available.)
         const contentLines = lines.filter(l => l.trim() !== '');
         
         if (contentLines.length === 0) return null;
 
         // 2. Extract ALL Cells first (Flattening)
         const allCells: Cell[] = [];
         
         contentLines.forEach((line) => {
             // ... [Reuse existing Cell Extraction Logic] ...
             const isCellSpecifier = /^(?:(\d+)?(?:\.(\d+))?)\+\|/.test(line.trim());
             
             if (!line.trim().startsWith('|') && !isCellSpecifier && allCells.length > 0) {
                 // Continuation
                 const lastCell = allCells[allCells.length - 1];
                 lastCell.content += '\n' + line.trim();
                 return;
             }

             const processingLine = line.replace(/^\|/, '').replace(/\|$/, '');
             const parts = processingLine.split('|');
             
             if (parts.length > 0) {
                 for (let i = 0; i < parts.length; i++) {
                    let part = parts[i];
                    
                    if (i < parts.length - 1) {
                         const specifierMatch = part.trim().match(/^(?:(\d+)?(?:\.(\d+))?)\+$/);
                         if (specifierMatch) {
                             const nextPart = parts[i+1];
                             let colSpan = 1;
                             let rowSpan = 1;
                             if (specifierMatch[1]) colSpan = parseInt(specifierMatch[1], 10);
                             if (specifierMatch[2]) rowSpan = parseInt(specifierMatch[2], 10);
                             
                             let cleanContent = nextPart.trim();
                             cleanContent = cleanContent.replace(/\s\+\s/g, '\n').replace(/\s\+$/, '\n');
                             
                             allCells.push({
                                id: `cell-${blockIndex}-${allCells.length}`,
                                content: cleanContent,
                                rowSpan,
                                colSpan
                             });
                             i++;
                             continue;
                         }
                    }
                    
                    let cleanContent = part.trim();
                    let colSpan = 1;
                    let rowSpan = 1;
                    
                    const inlineMatch = cleanContent.match(/^(?:(\d+)?(?:\.(\d+))?)\+\|(.*)$/s);
                    if (inlineMatch) {
                         const colStr = inlineMatch[1];
                         const rowStr = inlineMatch[2];
                         const restContent = inlineMatch[3];
                         if (colStr) colSpan = parseInt(colStr, 10);
                         if (rowStr) rowSpan = parseInt(rowStr, 10);
                         cleanContent = restContent.trim();
                    }
                    
                    cleanContent = cleanContent.replace(/\s\+\s/g, '\n').replace(/\s\+$/, '\n');
                    
                    allCells.push({
                        id: `cell-${blockIndex}-${allCells.length}`,
                        content: cleanContent,
                        rowSpan,
                        colSpan
                    });
                 }
             }
         });

         // 3. Reconstruct Rows based on Col Count
         // If colCount is 0, heuristic: Try to detect from first "row" of cells?
         // Fallback: If no cols attribute, we assume strict one-line-one-row? 
         // Or just treat allCells as one row? 
         // Let's assume user provides cols or we scan first row of pipes.
         if (colCount === 0 && lines.length > 0) {
             const firstLine = lines.find(l => l.trim().startsWith('|'));
             if (firstLine) {
                 // Count pipes? `| a | b |` -> 3 pipes -> 2 cells.
                 // A bit loose. Default to 1 if failed.
                 const pipes = firstLine.trim().split('|').length - 1;
                 colCount = pipes > 0 ? pipes - 1 : 1; 
                 // Adjust for leading/trailing pipe usually?
                 // `| a | b` -> 3 parts -> 2 cells.
             } else {
                 colCount = 1;
             }
         }
         
         const rows: Row[] = [];
         
         // Grid Tracker to account for RowSpans
         // occupied[row][col] = true
         // Since we don't know total rows, we grow it.
         // We iterate cell by cell and place them into the "next available slot".
         // Use a virtual pointer.
         
         const occupied: boolean[][] = [];
         let currentRowIndex = 0;
         let currentColIndex = 0;
         
         // Init First Row
         rows.push({ id: `row-${blockIndex}-0`, cells: [] });
         
         allCells.forEach(cell => {
             // Find next free slot
             while (occupied[currentRowIndex] && occupied[currentRowIndex][currentColIndex]) {
                 currentColIndex++;
                 if (currentColIndex >= colCount) {
                     currentColIndex = 0;
                     currentRowIndex++;
                     if (!rows[currentRowIndex]) rows[currentRowIndex] = { id: `row-${blockIndex}-${currentRowIndex}`, cells: [] };
                 }
             }
             
             // Place cell at current slot
             if (!rows[currentRowIndex]) rows[currentRowIndex] = { id: `row-${blockIndex}-${currentRowIndex}`, cells: [] };
             rows[currentRowIndex].cells.push(cell);
             
             // Mark coverage
             const rs = cell.rowSpan || 1;
             const cs = cell.colSpan || 1;
             
             // Mark this cell's immediate span
             for (let r = 0; r < rs; r++) {
                 for (let c = 0; c < cs; c++) {
                     const targetR = currentRowIndex + r;
                     const targetC = currentColIndex + c;
                     if (!occupied[targetR]) occupied[targetR] = [];
                     occupied[targetR][targetC] = true;
                 }
             }
             
             // Move Pointer
             // In AsciiDoc flow, we move by *1 logical slot*? 
             // No, if I place a colspan=2 cell, I consumed 2 cols.
             currentColIndex += cs;
             
             // Wrap
             if (currentColIndex >= colCount) {
                 currentColIndex = 0;
                 currentRowIndex++;
                 // Ensure next row exists if we are jumping there
                 if (!rows[currentRowIndex]) rows[currentRowIndex] = { id: `row-${blockIndex}-${currentRowIndex}`, cells: [] };
             }
         });
         
         // Filter Empty Rows (caused by trailing jumps)?
         // Usually harmless.
         
         return {
             id: `table-${blockIndex}`,
             rows: rows.filter(r => r.cells.length > 0), // cleanup empty tail rows
             metadata: {
                 cols: colsAttr ? colsAttr.match(/cols="?([^"]+)"?/)?.[1] : undefined
             },
             attributes: attributes
         };
    }
}
