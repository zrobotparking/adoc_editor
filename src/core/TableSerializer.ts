import { type Table, type TableSerializer } from './types';

export class BasicTableSerializer implements TableSerializer {
  serialize(table: Table): string {
    if (!table.rows || table.rows.length === 0) {
      return '';
    }

    let output = '|===\n';

    table.rows.forEach((row) => {
      row.cells.forEach((cell) => {
        // Basic serialization: | Content
        output += `| ${cell.content} `;
      });
      output += '\n'; // Newline after each row (or could be after each cell depending on style)
      // For now, let's keep it simple: 
      // | Cell 1 | Cell 2
      // becomes:
      // | Cell 1 | Cell 2
      // But we need to handle the newlines properly
    });

    // Re-doing logic for standard pipe syntax
    /*
      | Col 1 | Col 2
      | Val 1 | Val 2
    */
    
    // Reset output
    output = '|===\n';
    
    table.rows.forEach((row) => {
        const rowContent = row.cells.map(cell => {
             // Escape pipes if necessary, though basic usage usually assumes clean content
             return ` ${cell.content} `;
        }).join('|');
        
        output += `|${rowContent}\n`;
    });

    output += '|===';
    return output;
  }
}
