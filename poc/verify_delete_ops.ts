import { TableUtils } from '../src/core/TableUtils';
import { Table, Cell } from '../src/core/types';

const generateTable = (): Table => ({
    id: 't1',
    rows: [
        {
            id: 'r0',
            cells: [
                { id: 'A', content: 'A', rowSpan: 2, colSpan: 1 },
                { id: 'B', content: 'B', rowSpan: 1, colSpan: 1 }
            ]
        },
        {
            id: 'r1',
            cells: [
                { id: 'C', content: 'C', rowSpan: 1, colSpan: 1 }
            ]
        }
    ],
    metadata: { cols: '1,1' }
});

console.log("--- Test 1: Delete Row 1 (Bottom Row, covered by A) ---");
const t1 = generateTable();
const r1 = TableUtils.deleteRow(t1, 1);
console.log("Row 0 Cells:", r1.rows[0].cells.map(c => `${c.content}(rs=${c.rowSpan})`));
// A should shrink to 1. B remains.
// Expected: A(rs=1), B(rs=1)

console.log("\n--- Test 2: Delete Row 0 (Top Row, origin of A) ---");
const t2 = generateTable();
const r2 = TableUtils.deleteRow(t2, 0);
// Row 0 deleted. Row 1 becomes new Row 0.
// A was survivor (rs=2 -> rs=1). Should shift to new Row 0.
// B deleted. C remains.
// Expected: A(rs=1), C(rs=1)
console.log("New Row 0 Cells:", r2.rows[0].cells.map(c => `${c.content}(rs=${c.rowSpan})`));


console.log("\n--- Test 3: Delete Col 0 (Left Col, origin of A) ---");
const t3 = generateTable();
const r3 = TableUtils.deleteCol(t3, 0);
// A (colSpan=1) starts at 0. Deleted.
// C (colSpan=1) starts at 1? No, 0 (Grid).
// Visual:
// R0: A | B
// R1: (A)| C
// Col 0 is A. Col 1 is B/C.
// Delete Col 0.
// R0: B.
// R1: C.
console.log("Row 0:", r3.rows[0].cells.map(c => c.content));
console.log("Row 1:", r3.rows[1].cells.map(c => c.content));

console.log("\n--- Test 4: Delete Col with Span (A colSpan=2) ---");
const t4: Table = {
    id: 't4',
    rows: [{ 
        id: 'rx', 
        cells: [{ id: 'S', content: 'Span', rowSpan: 1, colSpan: 2 }, { id: 'E', content: 'End', rowSpan: 1, colSpan: 1 }] 
    }],
    metadata: { cols: '1,1,1' }
}; 
// | Span Span | End |
// Delete Col 0.
// Span starts at 0. colSpan=2.
// Should reduce to colSpan=1.
const r4 = TableUtils.deleteCol(t4, 0);
console.log("Row Cells:", r4.rows[0].cells.map(c => `${c.content}(cs=${c.colSpan})`));
