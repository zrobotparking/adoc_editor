import { TableUtils } from '../src/core/TableUtils';
import { Table, Cell } from '../src/core/types';

// Mock Data
// Row 0: | A (rowSpan=2) | B |
// Row 1: |               | C |
const table: Table = {
    id: 't1',
    rows: [
        {
            id: 'r0',
            cells: [
                { id: 'c0_0', content: 'A', rowSpan: 2, colSpan: 1 },
                { id: 'c0_1', content: 'B', rowSpan: 1, colSpan: 1 }
            ]
        },
        {
            id: 'r1',
            cells: [
                { id: 'c1_1', content: 'C', rowSpan: 1, colSpan: 1 }
            ]
        }
    ],
    metadata: { cols: '1,1' }
};

console.log("Original Table:");
console.log(JSON.stringify(table.rows, null, 2));

// Test 1: Insert Row at 1 (Middle of span)
console.log("\n--- Inserting Row at Index 1 ---");
const result1 = TableUtils.insertRow(table, 1);

console.log("Result Row 0 Cells:");
console.log(JSON.stringify(result1.rows[0].cells, null, 2));

console.log("Result Row 1 (New) Cells:");
console.log(JSON.stringify(result1.rows[1].cells, null, 2));

console.log("Result Row 2 (Old Row 1) Cells:");
console.log(JSON.stringify(result1.rows[2].cells, null, 2));

// Verify Span
const spanA = result1.rows[0].cells[0];
console.log(`Cell A RowSpan: ${spanA.rowSpan} (Expected 3)`);

// Verify New Row content
// Should have 1 cell (for Col 2). Col 1 is covered.
console.log(`New Row Cell Count: ${result1.rows[1].cells.length} (Expected 1)`);
