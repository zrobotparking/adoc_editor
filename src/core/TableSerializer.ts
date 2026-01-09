import { type Table, type TableSerializer } from './types';

export class BasicTableSerializer implements TableSerializer {
  serialize(table: Table): string {
    if (!table.rows || table.rows.length === 0) {
      return '';
    }

    let output = '';
    
    // Add Attributes if available in table metadata (Currently Table interface has limited metadata)
    // But PreviewBlock handles the attributes separately before passing to convert?
    // PreviewBlock.tsx: lines 87-98 -> It creates serializer, gets adoc, preprends header.
    // So here we just return the |=== block content or the full block?
    // The previous code returned `|===\n...|===`.
    
    if (table.attributes && table.attributes.length > 0) {
        output += table.attributes.join('\n') + '\n';
    } else if (table.metadata && table.metadata.cols) {
        output += `[cols="${table.metadata.cols}"]\n`;
    }
    // Note: PreviewBlock might double-add attributes if we do it here. 
    // PreviewBlock adds `block.attributes`.
    // Let's stick to the content body.
    
    output += '|===\n';
    
    table.rows.forEach((row) => {
        row.cells.forEach(cell => {
             // Generate Span Prefix
             let prefix = '';
             let hasSpecifier = false;
             const c = cell.colSpan || 1;
             const r = cell.rowSpan || 1;
             
             if (c > 1 || r > 1) {
                 hasSpecifier = true;
                 if (c > 1 && r > 1) {
                     prefix = `${c}.${r}+|`;
                 } else if (c > 1) {
                     prefix = `${c}+|`;
                 } else { // r > 1
                     prefix = `.${r}+|`;
                 }
             } else {
                 prefix = '|'; 
             }
             
             // Escape content? 
             let content = cell.content || '';
             // If content has multiple lines, we need to ensure it doesn't break the cell structure.
             // Usually just raw text is fine after the pipe.
             
             output += `${prefix} ${content}\n`;
        });
        
        // No explicit row separator needed in "one cell per line" mode usually, 
        // BUT strict AsciiDoc often implies 1 line = 1 cell, and breaks row based on cols count.
        // Or requires an empty line to separate?
        // Actually, just `\n` between cells is fine.
        
        // HOWEVER, to be visually clean or debuggable:
        // output += '\n'; 
        // We removed logic that splits rows. The PARSER is column aware.
        // The GENERATOR should rely on the `rows` structure?
        // In "cell per line" mode, AsciiDoc consumes cells into the grid.
        // The `rows` array in `Table` is just our logical grouping.
        // We flat dump them.
    });

    output += '|===';
    return output;
  }
}
