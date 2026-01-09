import type { Table, Cell } from './types';

// Grid Types
export interface GridCell {
  row: number;
  col: number; // Visual column index
  cell: Cell | null; // Null if it's a "covered" slot by a span
  isCovered: boolean;
  originCell?: Cell; // Reference to the spanning cell if covered
  rowSpan: number;
  colSpan: number;
}

export type Grid = GridCell[][];

export class TableUtils {
  // --- Grid Construction ---
  
  static buildGrid(table: Table): Grid {
    const grid: Grid = [];
    const rows = table.rows;
    if (rows.length === 0) return [];

    // Initialize grid with estimated size (will grow dynamically)
    // We assume mostly consistent column count, but will expand if needed.
    
    // 1. Create a tracking map for occupied slots (by rowspans)
    // occupied[row][col] = true
    const occupied: boolean[][] = [];

    rows.forEach((row, rIndex) => {
       if (!grid[rIndex]) grid[rIndex] = [];
       if (!occupied[rIndex]) occupied[rIndex] = [];

       let cIndex = 0;
       
       row.cells.forEach(cell => {
          // Find next free slot in this row
          while (occupied[rIndex][cIndex]) {
              // Create a placeholder grid cell for the covered slot
              // We need to look back to find WHO covers it to link originCell
              // But 'occupied' pure boolean doesn't strictly store that.
              // Better to store reference in occupied map?
              cIndex++;
          }
          
          // Place the actual cell
          const cellNode: GridCell = {
             row: rIndex,
             col: cIndex,
             cell: cell,
             isCovered: false,
             rowSpan: cell.rowSpan || 1,
             colSpan: cell.colSpan || 1
          };
          
          // Ensure grid row exists (might be far down if huge rowspan)
          if (!grid[rIndex]) grid[rIndex] = []; 
          grid[rIndex][cIndex] = cellNode;

          // Mark spans
          const rs = cell.rowSpan || 1;
          const cs = cell.colSpan || 1;

          for (let i = 0; i < rs; i++) {
             for (let j = 0; j < cs; j++) {
                if (i === 0 && j === 0) continue; // Skip origin
                
                const targetRow = rIndex + i;
                const targetCol = cIndex + j;
                
                // Ensure array existence
                if (!occupied[targetRow]) occupied[targetRow] = [];
                if (!grid[targetRow]) grid[targetRow] = [];

                occupied[targetRow][targetCol] = true;
                
                grid[targetRow][targetCol] = {
                   row: targetRow,
                   col: targetCol,
                   cell: null,
                   isCovered: true,
                   originCell: cell,
                   rowSpan: 1,
                   colSpan: 1
                };
             }
          }
          
          // Move pointer
          cIndex += cs;
       });
       
       // Fill gaps if any (implicit empty cells at end of row? AsciiDoc tables technically usually full)
    });

    return grid;
  }

  // --- Operations ---

  static mergeCells(table: Table, startRow: number, startCol: number, endRow: number, endCol: number): Table {
      const grid = this.buildGrid(table);
      
      // Normalize bounds
      let minRow = Math.min(startRow, endRow);
      let maxRow = Math.max(startRow, endRow);
      let minCol = Math.min(startCol, endCol);
      let maxCol = Math.max(startCol, endCol);
      
      // Expand bounds to fully encompass any cell that is partially selected
      // We loop until stable because expanding to include one cell might touch another.
      let changed = true;
      while (changed) {
          changed = false;
          for (let r = minRow; r <= maxRow; r++) {
              for (let c = minCol; c <= maxCol; c++) {
                  const gCell = grid[r]?.[c];
                  if (!gCell) continue;
                  
                  // If it's a covered cell, we must include its origin
                  if (gCell.isCovered && gCell.originCell) {
                      // Find origin coordinates (We can't easily know them from gCell unless we store them or search)
                      // But wait, GridCell should ideally store 'originRow', 'originCol'?
                      // Currently it stores `originCell` (ref).
                      // Search grid for origin? Or update grid to store coords?
                      // We can search the grid for the originCellRef.
                      // Optimization: Let's search 'up and left' from current pos since origin is always top-left.
                      // Or just scan the `rows`?
                      
                      // Better: Let's find the origin from the grid.
                      // Since we are inside the box, let's look at the origin.
                      // Actually, if we hit a covered cell, its origin might be OUTSIDE the box.
                      // We need to find that origin and expand minRow/minCol.
                      
                      // Brute force search for origin in grid (reliable)
                      // Or add originRow/originCol to GridCell in buildGrid? (Cleaner but changes interface)
                      // Let's search for now.
                      let originFound = false;
                      let or = r;
                      let oc = c;
                      
                      // Scan backwards to find the Origin (which has cell === gCell.originCell)
                      // Heuristic: Origin is <= r and <= c.
                      // But we don't know exactly where. 
                      // Let's cheat: We know the cell instance.
                      if (gCell.originCell) {
                           // Iterate grid to find coordinates of gCell.originCell
                           // This is O(GridSize) but grid is small.
                           for (let gr = 0; gr <= r; gr++) {
                               for (let gc = 0; gc < grid[gr].length; gc++) {
                                    if (grid[gr][gc].cell === gCell.originCell && !grid[gr][gc].isCovered) {
                                        or = gr;
                                        oc = gc;
                                        originFound = true;
                                        break;
                                    }
                               }
                               if (originFound) break;
                           }
                      }
                      
                      if (or < minRow) { minRow = or; changed = true; }
                      if (oc < minCol) { minCol = oc; changed = true; }
                  }
                  
                  // Now check the span of the cell (Origin or the one we just found/verified)
                  // The cell at (r,c) (which might be covered, but we care about the "Active Unit" at this slot)
                  // If it's covered, we looked up Origin.
                  // If it's origin, we check its span.
                  
                  // Simplification:
                  // For every visual slot (r,c) in range:
                  // 1. Identify the effective cell at this slot (Origin).
                  // 2. Ensure the selection box covers this effective cell's entire span (rowSpan, colSpan).
                  
                  // Let's resolve the effective cell again
                  let effectiveOrigin = gCell;
                  if (gCell.isCovered && gCell.originCell) {
                       // We found coordinates 'or', 'oc' above? 
                       // Reuse that search logic?
                       // Let's encapsulate finding origin.
                       // Or just continue relying on the "Expand Min" logic above, 
                       // and the "Expand Max" logic below.
                  }
                  
                  // If we encountered a COVERED cell, we expanded MIN bounds to include origin.
                  // Now we must ensure MAX bounds include the span of that origin.
                  
                  const cell = gCell.isCovered ? gCell.originCell : gCell.cell;
                  if (cell) {
                      // We need the coordinates of this cell's origin to calculate extent.
                      // If gCell is origin, coords are (r,c).
                      // If gCell is covered, coords are outside (or inside) - we expanded min to include them.
                      // So if we iterate from refreshed minRow/minCol?
                      // The outer loop `while(changed)` handles re-checking.
                      
                      // We just need to ensure valid logic:
                      // If we are at an origin (r,c), check if r+rowSpan > maxRow or c+colSpan > maxCol.
                      if (!gCell.isCovered) {
                          const rs = cell.rowSpan || 1;
                          const cs = cell.colSpan || 1;
                          if (r + rs - 1 > maxRow) { maxRow = r + rs - 1; changed = true; }
                          if (c + cs - 1 > maxCol) { maxCol = c + cs - 1; changed = true; }
                      }
                  }
              }
          }
      }
      
      // Get Origin Cell at top-left
      const originGridCell = grid[minRow] && grid[minRow][minCol];
      if (!originGridCell || !originGridCell.cell) {
          console.warn("Merge operation started on invalid or covered cell");
          return table;
      }
      
      // Collect all cells in the range to remove them (except origin)
      const cellsToRemove = new Set<string>();
      let combinedContent = originGridCell.cell.content;

      // Validate Rectangular integrity & collect content
      // If the selection partially cuts another span, we should technically expand or fail.
      // For now, we assume standard behavior: strict crop or simple merge.
      
      for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
              if (r === minRow && c === minCol) continue;
              
              const gCell = grid[r]?.[c];
              if (gCell && gCell.cell) {
                  cellsToRemove.add(gCell.cell.id);
                  if (gCell.cell.content.trim()) {
                      combinedContent += ' ' + gCell.cell.content;
                  }
              }
          }
      }

      // 1. Clone Rows (Deep copy structure to modify)
      const newRows = table.rows.map(row => ({
          ...row,
          cells: row.cells.map(c => ({...c})).filter(c => !cellsToRemove.has(c.id))
      }));
      
      // 2. Update Origin Cell Span & Content
      const originCellId = originGridCell.cell.id;
      // We need to find this cell in the NEW rows structure
      // Note: Row index in `newRows` corresponds to `table.rows` index.
      // `originGridCell.row` is the visual row index, which matches `table.rows` index (mostly).
      // Yes, `table.rows` array index IS the visual row index for the *start* of the row.
      
      const targetRow = newRows[minRow];
      if (targetRow) {
          const targetCell = targetRow.cells.find(c => c.id === originCellId);
          if (targetCell) {
              targetCell.rowSpan = (maxRow - minRow) + 1;
              targetCell.colSpan = (maxCol - minCol) + 1;
              // targetCell.content = combinedContent; // Optional: merge content?
              // User request didn't specify content behavior. Merging usually preserves data.
              // Let's preserve data.
              targetCell.content = combinedContent;
          }
      }

      return {
          ...table,
          rows: newRows
      };
  }

  static splitCell(table: Table, cellId: string): Table {
      const grid = this.buildGrid(table);
      
      // 1. Find the cell in Grid
      let targetGridCell: GridCell | null = null;
      
      // Search the grid
      for (const row of grid) {
          for (const gCell of row) {
              if (gCell.cell && gCell.cell.id === cellId) {
                  targetGridCell = gCell;
                  break;
              }
          }
          if (targetGridCell) break;
      }
      
      if (!targetGridCell || !targetGridCell.cell) return table;
      
      const { row: startRow, col: startCol, cell } = targetGridCell;
      const rowSpan = cell.rowSpan || 1;
      const colSpan = cell.colSpan || 1;
      
      if (rowSpan === 1 && colSpan === 1) return table; // Nothing to split

      // 2. Clone Rows
      const newRows = table.rows.map(row => ({
          ...row,
          cells: row.cells.map(c => ({...c}))
      }));
      
      // 3. Reset Origin Cell
      const originRow = newRows[startRow];
      const originCell = originRow.cells.find(c => c.id === cellId);
      if (originCell) {
          originCell.rowSpan = 1;
          originCell.colSpan = 1;
      }
      
      // 4. Insert Empty Cells
      // Iterate over the span area [startRow ... startRow + rowSpan - 1]
      //                             [startCol ... startCol + colSpan - 1]
      
      // Helpers
      const generateId = () => Math.random().toString(36).substr(2, 9);
      
      for (let r = 0; r < rowSpan; r++) {
         const currentRowIdx = startRow + r;
         const currentRow = newRows[currentRowIdx];
         
         // If r=0 (Origin Row), we insert (colSpan-1) cells AFTER origin.
         // If r>0 (Subseq Row), we insert (colSpan) cells at the correct visual column position.
         
         const isOriginRow = (r === 0);
         const insertCount = isOriginRow ? colSpan - 1 : colSpan;
         
         if (insertCount <= 0) continue;
         
         const newCellsToInsert: Cell[] = Array(insertCount).fill(null).map(() => ({
             id: generateId(),
             content: '',
             rowSpan: 1,
             colSpan: 1
         }));
         
         // Calculate Insertion Index in the `cells` array
         // The `cells` array is SPARSE. We need to find where `startCol` falls in this array.
         // We can fallback to the Grid to find the "Cell Index" (index in the cells array).
         
         // Simple heuristic:
         // Iterate the grid for this row. Count how many REAL cells (gCell.cell != null) appear before `startCol` (or at `startCol`).
         // For r > 0, we want to insert AT `startCol`.
         // For r = 0, we want to insert AFTER `startCol` (where origin is).
         
         let insertAtIndex = 0;
         const gridRow = grid[currentRowIdx] || [];
         
         // Count existing real cells before the target column
         let realCellCount = 0;
         for (let c = 0; c < (isOriginRow ? startCol + 1 : startCol); c++) {
              if (gridRow[c] && gridRow[c].cell !== null && !gridRow[c].isCovered) {
                  realCellCount++;
              }
         }
         insertAtIndex = realCellCount;
         
         currentRow.cells.splice(insertAtIndex, 0, ...newCellsToInsert);
      }
      
      return {
          ...table,
          rows: newRows
      };
  }
}
