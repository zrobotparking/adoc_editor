const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Asciidoctor = require('asciidoctor');

const asciidoctor = Asciidoctor();

// --- 1. MOCK DATA & SERIALIZER (Use latest logic) ---

class BasicTableSerializer {
    serialize(table) {
        if (!table.rows || table.rows.length === 0) return '';

        let output = '|===\n';

        table.rows.forEach((row) => {
            const rowContent = row.cells.map(cell => {
                 // Generate Span Prefix
                 let prefix = '';
                 const c = cell.colSpan || 1;
                 const r = cell.rowSpan || 1;
                 
                 if (c > 1 || r > 1) {
                     if (c > 1 && r > 1) {
                         prefix = `${c}.${r}+|`;
                     } else if (c > 1) {
                         prefix = `${c}+|`;
                     } else { // r > 1
                         prefix = `.${r}+|`;
                     }
                 }

                 // [FIX APPLIED HERE] Ensure space before prefix
                 return ` ${prefix}${cell.content} `;
            }).join('|');
            
            output += `|${rowContent}\n`;
        });

        output += '|===';
        return output;
    }
}

// Simulated Table Data: "Start Hint" merged with cell below it
// Structure mimics what 'mergeCells' would produce
const mergedTable = {
    rows: [
        { // Header (Row 0)
            id: 'r0',
            cells: [
                { content: 'Hint Type', colSpan: 1, rowSpan: 1 },
                { content: 'Primary Instruction', colSpan: 1, rowSpan: 1 },
                { content: 'Pseudo-instruction Equivalent', colSpan: 1, rowSpan: 1 }
            ]
        },
        { // Row 1 (Start Hint - Merged)
            id: 'r1',
            cells: [
                // Merged Cell: RowSpan 2
                { content: 'Start Hint', colSpan: 1, rowSpan: 2 }, 
                { content: '`csrrs rd, mcycle, x0`', colSpan: 1, rowSpan: 1 },
                { content: '`csrr rd, mcycle`', colSpan: 1, rowSpan: 1 }
            ]
        },
        { // Row 2 (Partially covered by Start Hint)
            id: 'r2',
            cells: [
                // Cell at col 0 is conceptually "covered", so it's removed from the 'cells' array for serialization
                // standard sparse row representation
                { content: '`csrr rd, cycle`', colSpan: 1, rowSpan: 1 },
                // Wait, Row 2 should have 2 cells if the first one is covered by Row 1?
                // Let's check original:
                // Row 1: | Start Hint | csrrs... | csrr...
                // Row 2: | (covered)  | csrrs... | csrr...
                // So Row 2 in sparse model has 2 cells?
                // Original Row 2 was: | `csrrs rd, cycle, x0` | `csrr rd, cycle`
                // Wait, the input has THREE columns.
                // Row 1: Start Hint, csrrs(mcycle), csrr(mcycle)
                // Row 2: csrrs(cycle), csrr(cycle) <--- WAIT
                // Original text:
                // | .2+|Start Hint | `csrrs rd, mcycle, x0` | `csrr rd, mcycle` 
                // | `csrrs rd, cycle, x0` | `csrr rd, cycle` 
                // Ah, row 2 in AsciiDoc only lists the NON-covered cells.
                // So yes, row 2 should have 2 cells.
                { content: '`csrrs rd, cycle, x0`', colSpan: 1, rowSpan: 1 },
                { content: '`csrr rd, cycle`', colSpan: 1, rowSpan: 1 }
            ]
        },
        { // Row 3 (End Hint)
            id: 'r3',
            cells: [
                { content: 'End Hint', colSpan: 1, rowSpan: 1 },
                { content: '`csrrs rd, minstret, x0`', colSpan: 1, rowSpan: 1 },
                { content: '`csrr rd, minstret`', colSpan: 1, rowSpan: 1 }
            ]
        },
        { // Row 4
            id: 'r4',
            cells: [
                { content: '', colSpan: 1, rowSpan: 1 },
                { content: '`csrrs rd, instret, x0`', colSpan: 1, rowSpan: 1 },
                { content: '`csrr rd, instret`', colSpan: 1, rowSpan: 1 }
            ]
        }
    ]
};

// --- 2. EXECUTION ---

try {
    console.log("--- 1. Serializing Merged Table ---");
    const serializer = new BasicTableSerializer();
    const adocBody = serializer.serialize(mergedTable);
    
    // Add header for full document
    const fullAdoc = `.HPM Dump Trigger Instructions
[cols="1,3,3", options="header"]
${adocBody}`;

    console.log("Generated AsciiDoc:\n" + fullAdoc);

    // Verify Syntax
    if (!fullAdoc.includes('| .2+|Start Hint')) {
        throw new Error("Serialized AsciiDoc does not contain expected '| .2+|Start Hint' syntax (check spaces!)");
    }
    console.log("[PASS] AsciiDoc Syntax Check");

    console.log("\n--- 2. verifying HTML Rendering ---");
    const html = asciidoctor.convert(fullAdoc);
    // console.log(html);

    if (!html.includes('rowspan="2"')) {
        throw new Error("Rendered HTML does not contain rowspan='2'");
    }
    console.log("[PASS] HTML RowSpan Check");

    console.log("\n--- 3. Generating PDF ---");
    const outputPath = path.join(__dirname, 'output_merged.adoc');
    fs.writeFileSync(outputPath, fullAdoc);
    
    console.log(`Saved ADOC to ${outputPath}`);
    
    // Run Asciidoctor PDF
    // Assuming 'asciidoctor-pdf' is in path
    const pdfCmd = `asciidoctor-pdf "${outputPath}"`;
    console.log(`Executing: ${pdfCmd}`);
    
    execSync(pdfCmd, { stdio: 'inherit' });
    
    const pdfPath = path.join(__dirname, 'output_merged.pdf');
    if (fs.existsSync(pdfPath)) {
        console.log(`[PASS] PDF Generated successfully at ${pdfPath}`);
        console.log(`PDF Size: ${fs.statSync(pdfPath).size} bytes`);
    } else {
        throw new Error("PDF file was not created.");
    }

} catch (e) {
    console.error("\n[FAIL] Verification Failed!");
    console.error(e.message);
    process.exit(1);
}
