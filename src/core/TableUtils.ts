import type { Table, Cell } from './types';

// Grid Types
export interface GridCell {
  row: number;
  col: number; // Visual column index
  cell: Cell | null; // Null if it's a "covered" slot by a span
  isCovered: boolean;
  originCell?: Cell; // Reference to the spanning cell if covered
  originRow: number; // The visual row index where the cell starts
  originCol: number; // The visual column index where the cell starts
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
              cIndex++;
          }
          
          // Place the actual cell
          const cellNode: GridCell = {
             row: rIndex,
             col: cIndex,
             cell: cell,
             isCovered: false,
             originRow: rIndex,
             originCol: cIndex,
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
                   originRow: rIndex,
                   originCol: cIndex,
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
  static insertRow(table: Table, targetIndex: number): Table {
      const grid = this.buildGrid(table);
      const newRows = table.rows.map(r => ({ ...r, cells: r.cells.map(c => ({...c})) }));
      
      // Let's analyze the grid at `targetIndex` (the row BEFORE insertion)
      // Use MAX width from grid to handle ragged tables safely
      let gridWidth = 0;
      for(const r of grid) {
          if (r.length > gridWidth) gridWidth = r.length;
      }
      // Or use metadata cols if available? 
      // gridWidth from buildGrid should be sufficient as buildGrid accounts for spans.
      const generateId = () => Math.random().toString(36).substr(2, 9);
      const newRowCells: Cell[] = [];
      const newRowId = generateId();
      
      const processedCells = new Set<string>();

      // Iterate every COLUMN
      for (let c = 0; c < gridWidth; c++) {
          
          let coveredBySpan = false;
          
          // Check vertical span crossing
          if (targetIndex > 0) {
              const aboveRowIdx = targetIndex - 1;
              const gCell = grid[aboveRowIdx]?.[c];
              
              if (gCell && gCell.cell) {
                  const cell = gCell.cell;
                  const cellStartRow = gCell.originRow;
                  const cellEndRow = cellStartRow + cell.rowSpan;
                  
                  // If cell starts above the boundary and ends below it
                  if (cellStartRow < targetIndex && cellEndRow > targetIndex) {
                      // Crosses boundary! Increment RowSpan.
                      if (!processedCells.has(cell.id)) {
                          // Find cell in newRows (using origin row)
                          const originRow = newRows[gCell.originRow];
                          const targetCell = originRow?.cells.find(x => x.id === cell.id);
                          if (targetCell) {
                              targetCell.rowSpan += 1;
                          }
                          processedCells.add(cell.id);
                      }
                      coveredBySpan = true;
                  }
              }
          }
          
          if (!coveredBySpan) {
              // Not covered by a vertical span.
              // We need to add a cell to the new row for this column.
              
              // Handle Horizontal Spans in the NEW row?
              // Standard behavior: New row has simple 1x1 cells.
              // So for every column c that is NOT vertically covered, we add a cell.
              // BUT: If the column `c` is covered by a HORIZONTAL span in the row ABOVE?
              // e.g. Row Above: | A (colspan=2) |
              // New Row: | New | New |
              // This is correct.
              
              // However, `c` iterates visuals.
              // If `c=0`, we add Cell.
              // If `c=1`. Not vertically covered. Add Cell.
              // So we simply add 1x1 cells.
              
              newRowCells.push({
                  id: generateId(),
                  content: '',
                  rowSpan: 1,
                  colSpan: 1
              });
          }
      }
      
      // Insert the new row at the target index
      newRows.splice(targetIndex, 0, { id: newRowId, cells: newRowCells });
      
      return { ...table, rows: newRows };
  }

  static insertCol(table: Table, targetIndex: number): Table {
      const grid = this.buildGrid(table);
      const newRows = table.rows.map(r => ({ ...r, cells: r.cells.map(c => ({...c})) }));
      const generateId = () => Math.random().toString(36).substr(2, 9);
      
      const processedCells = new Set<string>();

      // Iterate every ROW
      for (let r = 0; r < newRows.length; r++) {
         const gridRow = grid[r] || [];
         
         // Look at the "insertion boundary" at `targetIndex`
         // We check if the cell strictly to the LEFT of the boundary spans ACROSS it.
         // Boundary is BETWEEN `targetIndex-1` and `targetIndex`.
         // So we look at the grid slot `targetIndex-1`.
         
         let coveredBySpan = false;
         
         if (targetIndex > 0) {
             const leftColIdx = targetIndex - 1;
             const gCell = gridRow[leftColIdx];
             
             if (gCell && gCell.cell) {
                 const cell = gCell.cell;
                 // Use Robust Origin Coords
                 const cellStartCol = gCell.originCol;
                 const cellEndCol = cellStartCol + cell.colSpan;
                 
                 // If the cell started before the boundary, and ends AFTER the boundary
                 if (cellStartCol < targetIndex && cellEndCol > targetIndex) {
                      // Crosses boundary! Increment ColSpan.
                      if (!processedCells.has(cell.id)) {
                           // Find existing cell object in `newRows` (using origin row)
                           const originRow = newRows[gCell.originRow];
                           const targetCell = originRow?.cells.find(x => x.id === cell.id);
                           if (targetCell) {
                               targetCell.colSpan += 1;
                           }
                           processedCells.add(cell.id);
                      }
                      coveredBySpan = true;
                  }
             }
         }
         
         if (!coveredBySpan) {
             // We need to insert a NEW cell into this row.
             // But we only insert if this specific ROW is not "vertically covered" at this spot?
             // If this slot `grid[r][targetIndex]` is covered by a VERTICAL span from a row above...
             // Then effectively this row has no cell here.
             // BUT, inserting a column WIDENS the table.
             // The vertical span (from above) should inherently widen too?
             // Or we split the vertical span?
             // Standard behavior: The vertical span stays 1-column wide, and we insert a neighbor?
             // NO. If we insert a column "Column 2", and there is a "RowSpan" covering Col 2:
             // Does that RowSpan widen to 2 cols? Or do we insert a cell "next" to it?
             // If the RowSpan has colSpan=1, and we insert AT its right edge -> We insert neighbor.
             // If we insert AT its left edge -> We insert neighbor.
             // If we insert IN THE MIDDLE of a `colSpan > 1`, we widen it (handled above).
             
             // So if `coveredBySpan` is false, we are NOT crossing a horizontal span.
             // We are essentially inserting a new column of cells.
             // For a specific row `r`, we must decide where to put the new `Cell` object in `row.cells`.
             // We must skip any cells that are "covered" by previous cells in this row?
             // `insertAtIndex` should be: Number of *started* cells (origins) before `targetIndex` in this row.
             
             // What if `grid[r][targetIndex]` is vertically covered (isCovered=true, originRow < r)?
             // Then `row[r]` has NO cell at `targetIndex`.
             // If we insert here, we effectively add a cell "after" the vertical span?
             // Wait. If I have:
             // R1: | A (rowspan=2) | B |
             // R2: | (covered)     | C |
             // Insert at index 0 (Left of A).
             // R1: Insert New at 0. A shifts to 1.
             // R2: Insert New at 0. Covered(A) shifts to 1. C shifts to 2.
             // Correct.
             
             // Insert at index 1 (Right of A, Left of B).
             // R1: insert at 1. `[A, New, B]`.
             // R2: insert at 1. `(Covered A)`, New, C.
             // Does R2 have a cell list? `[C]`.
             // We want `[New, C]`.
             // `insertAtIndex` calculation:
             // Iterate visual cols 0..targetIndex-1.
             // Col 0: Covered (no cell in list).
             // Count = 0.
             // Insert at 0? `row.cells` -> `[New, C]`.
             // Grid: 0->Covered(A), 1->New, 2->C.
             // Correct.
             
             // So `insertAtIndex` = Count of `gCell.originRow === r` for `c < targetIndex`.
             
             // One Edge Case: Vertical Span crossing the insertion line horizontally?
             // i.e. Cell at R0 spans Col 0-2.
             // We are at R1 (covered). Insert at 1.
             // `coveredBySpan` check looks at `grid[R1][0]`.
             // `gCell` is Covered(A). `cell` is A.
             // `cellStartCol`=0. `colSpan`=2.
             // `0 < 1` and `0+2 > 1`.
             // `coveredBySpan` becomes TRUE.
             // We increment A's colspan.
             // We DO NOT insert cell in R1.
             // Correct!
             
             const row = newRows[r];
             let insertAtIndex = 0;
             
             // Count how many cells in `row.cells` visually appear before `targetIndex`.
             // We can iterate `grid[r]` up to targetIndex.
             for (let c = 0; c < targetIndex; c++) {
                 const gc = gridRow[c];
                 // We only count a cell if it ORIGINATES in this row at this column.
                 if (gc && gc.originRow === r && gc.originCol === c) {
                     insertAtIndex++;
                 }
             }
             
             row.cells.splice(insertAtIndex, 0, {
                 id: generateId(),
                 content: '',
                 rowSpan: 1,
                 colSpan: 1
             });
         }
      }
      
      // Update cols metadata if present
      let newMetadata = table.metadata;
      let newAttributes = table.attributes ? [...table.attributes] : undefined;

      if (table.metadata && table.metadata.cols) {
          const colsStr = table.metadata.cols.replace(/^"|"$/g, '');
          const parts = colsStr.split(',').map(s => s.trim());
          
          if (parts.length > 0) {
              // Fix: Use '1' instead of empty string to prevent "1,,1" syntax which distorts tables
              parts.splice(targetIndex, 0, '1');
              const newColsVal = parts.join(',');
               
               newMetadata = {
                   ...table.metadata,
                   cols: newColsVal
               };
               
               // Also update the raw attributes string to preserve other options
               if (newAttributes) {
                   const colAttrIndex = newAttributes.findIndex(a => a.includes('cols='));
                   if (colAttrIndex !== -1) {
                       newAttributes[colAttrIndex] = newAttributes[colAttrIndex].replace(
                           /cols="?([^"]+)"?/,
                           `cols="${newColsVal}"`
                       );
                   }
               }
          }
      }

      return { ...table, rows: newRows, metadata: newMetadata, attributes: newAttributes };
  }

  static deleteRow(table: Table, rowIndex: number): Table {
      if (rowIndex < 0 || rowIndex >= table.rows.length) return table;

      const grid = this.buildGrid(table);
      const rows = table.rows;
      const survivors: { cell: Cell, colIndex: number }[] = [];
      const newRows: typeof rows = [];
      
      // 1. Identify Survivors in the deleted row (cells with rowSpan > 1)
      // They need to be moved to the NEXT row (which becomes the current index).
      // We rely on Grid to find their visual column (important for insertion).
      const deletedGridRow = grid[rowIndex];
      if (deletedGridRow) {
          deletedGridRow.forEach(gCell => {
              if (gCell && gCell.cell && gCell.originRow === rowIndex && gCell.col === gCell.originCol) { // Ensure we pick origin only once
                  if (gCell.cell.rowSpan > 1) {
                      // Survivor!
                      const survivorCell = { ...gCell.cell };
                      survivorCell.rowSpan -= 1; // Shrink
                      survivors.push({ cell: survivorCell, colIndex: gCell.col });
                  }
              }
          });
      }

      // 2. Process all rows
      for (let r = 0; r < rows.length; r++) {
          if (r === rowIndex) continue; // Skip deleted row

          const oldRow = rows[r];
          // Deep copy cells
          let newCells = oldRow.cells.map(c => ({...c}));
          
          // Adjust spans for cells starting BEFORE the deleted row
          if (r < rowIndex) {
              newCells.forEach(cell => {
                   const rs = cell.rowSpan || 1;
                   if (r + rs - 1 >= rowIndex) {
                       // Spans across deleted row
                       cell.rowSpan = rs - 1;
                   }
              });
          }
          
          // If this is the row immediately AFTER deletion (original index `rowIndex + 1`),
          // we must merge survivors into it.
          if (r === rowIndex + 1) {
              // We need to insert survivor cells at the correct visual positions.
              // `newCells` currently contains valid 1x1 or spanned cells for this row.
              // Survivors effectively "replace" the "covered" slots that verified existence here.
              // BUT `newCells` is sparse. It only has cells that START here.
              // The "covered" slots are implicit.
              // Now that the cover (from rowIndex) is gone/moved here, we just ADD the cells.
              
              // We must insert them in the correct Order (Visual Column).
              // 1. Map existing `newCells` to their Visual Cols (using Grid).
              const cellMap = new Map<number, Cell>();
              const gridRow = grid[r]; // Grid of this row
              
              // Existing cells
              gridRow.forEach(gc => {
                  if (gc && gc.cell && gc.originRow === r && gc.originCol === gc.col) {
                      const match = newCells.find(c => c.id === gc.cell!.id);
                      if (match) cellMap.set(gc.col, match);
                  }
              });
              
              // Add survivors
              survivors.forEach(s => {
                  cellMap.set(s.colIndex, s.cell);
              });
              
              // Rebuild `newCells` from map, sorted by column
              const sortedCols = Array.from(cellMap.keys()).sort((a,b) => a - b);
              newCells = sortedCols.map(c => cellMap.get(c)!);
          }
          
          newRows.push({ ...oldRow, cells: newCells });
      }
      
      return { ...table, rows: newRows };
  }

  static deleteCol(table: Table, colIndex: number): Table {
      const grid = this.buildGrid(table);
      // Determine max width to ensure bounds
      const gridWidth = grid[0]?.length || 0;
      if (colIndex < 0 || colIndex >= gridWidth) return table;

      const newRows = table.rows.map(r => ({ ...r, cells: r.cells.map(c => ({...c})) }));
      
      const processedCells = new Set<string>();

      newRows.forEach((row, rIndex) => {
          const gridRow = grid[rIndex];
          if (!gridRow) return;
          
          const gCell = gridRow[colIndex];
          if (gCell && gCell.cell) {
               if (processedCells.has(gCell.cell.id)) return;
               processedCells.add(gCell.cell.id);
               
               const cell = gCell.cell;
               // Find the cell instance in NEW structure (using originRow)
               const originRow = newRows[gCell.originRow];
               
               // Situation A: Cell Spans ACROSS deleted column
               // (Start < colIndex < End) OR (Start < colIndex <= End ?)
               // Range: [originCol, originCol + colSpan - 1]
               // If colIndex is strictly inside or at end.
               
               const start = gCell.originCol;
               const end = start + cell.colSpan - 1;
               
               if (start < colIndex && end >= colIndex) {
                   // Reduce ColSpan
                   const target = originRow.cells.find(c => c.id === cell.id);
                   if (target) target.colSpan -= 1;
               } 
               else if (start === colIndex) {
                   // Situation B: Cell STARTS at deleted column
                   const targetIndex = originRow.cells.findIndex(c => c.id === cell.id);
                   if (targetIndex !== -1) {
                       if (cell.colSpan > 1) {
                           // Shrink it. (Visual effect: Left side clipped, content shift?)
                           // Usually we keep content but shrink span.
                           originRow.cells[targetIndex].colSpan -= 1;
                       } else {
                           // Delete it.
                           originRow.cells.splice(targetIndex, 1);
                       }
                   }
               }
          }
      });
      
      // Update Metadata Cols
      let newMetadata = table.metadata;
      let newAttributes = table.attributes ? [...table.attributes] : undefined;
      
      if (table.metadata && table.metadata.cols) {
          const colsStr = table.metadata.cols.replace(/^"|"$/g, '');
          const parts = colsStr.split(',').map(s => s.trim()); // handle cleanup
          // AsciiDoc cols syntax might correspond to grid columns 1:1 or not (relative widths).
          // We assume 1:1 if parts count matches grid width.
          if (parts.length >= colIndex + 1) {
              parts.splice(colIndex, 1);
              const newColsVal = parts.join(',');
              
              newMetadata = { ...table.metadata, cols: newColsVal };
               if (newAttributes) {
                   const colAttrIndex = newAttributes.findIndex(a => a.includes('cols='));
                   if (colAttrIndex !== -1) {
                       newAttributes[colAttrIndex] = newAttributes[colAttrIndex].replace(
                           /cols="?([^"]+)"?/,
                           `cols="${newColsVal}"`
                       );
                   }
               }
          }
      }

      return { ...table, rows: newRows, metadata: newMetadata, attributes: newAttributes };
  }
}
