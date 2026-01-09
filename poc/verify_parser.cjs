
// Mock Types
// (Copied strictly essential parts for the test)

class BasicPipeParser {
    parseTable(inputLines) {
        // Simplified Logic mimicking the real TableParser logic I WROTE
        // I need to use the EXACT logic I implemented to test it.
        // So I will copy-paste the logic from d:\others\adoc_editor\src\core\TableParser.ts
        // But adapting to JS.

        const rows = [];
        let blockIndex = 0;
        
        inputLines.forEach((line) => {
             // Handle Standard Row (Starts with |)
             const processingLine = line.trim().replace(/^\|/, '').replace(/\|$/, '');
             const parts = processingLine.split('|');
             
             if (parts.length > 0) {
                 const cells = [];
                 
                 for (let i = 0; i < parts.length; i++) {
                    let part = parts[i];
                    
                    // Detached Specifier Check (2+ | Content)
                    if (i < parts.length - 1) {
                         const specifierMatch = part.trim().match(/^(?:(\d+)?(?:\.(\d+))?)\+$/);
                         if (specifierMatch) {
                             const nextPart = parts[i+1];
                             let colSpan = 1;
                             let rowSpan = 1;
                             if (specifierMatch[1]) colSpan = parseInt(specifierMatch[1], 10);
                             if (specifierMatch[2]) rowSpan = parseInt(specifierMatch[2], 10);
                             
                             let cleanContent = nextPart.trim();
                             cells.push({ content: cleanContent, rowSpan, colSpan });
                             i++;
                             continue;
                         }
                    }
                    
                    // Normal or Inline Specifier
                    let cleanContent = part.trim();
                    let colSpan = 1;
                    let rowSpan = 1;
                    
                    // INLINE Check (.2+|Content)
                    const inlineMatch = cleanContent.match(/^(?:(\d+)?(?:\.(\d+))?)\+\|(.*)$/s);
                    if (inlineMatch) {
                         const colStr = inlineMatch[1];
                         const rowStr = inlineMatch[2];
                         const restContent = inlineMatch[3];
                         
                         if (colStr) colSpan = parseInt(colStr, 10);
                         if (rowStr) rowSpan = parseInt(rowStr, 10);
                         cleanContent = restContent.trim();
                    }
                    
                    cells.push({ content: cleanContent, rowSpan, colSpan });
                 }
                 if (cells.length > 0) rows.push({ cells });
             }
        });
        
        return { rows };
    }
}

class BasicTableSerializer {
    serialize(table) {
        let output = '|===\n';
        table.rows.forEach((row) => {
            const rowContent = row.cells.map(cell => {
                 let prefix = '';
                 const c = cell.colSpan || 1;
                 const r = cell.rowSpan || 1;
                 
                 if (c > 1 || r > 1) {
                     if (c > 1 && r > 1) prefix = `${c}.${r}+|`;
                     else if (c > 1) prefix = `${c}+|`;
                     else prefix = `.${r}+|`;
                 }
                 return ` ${prefix}${cell.content} `;
            }).join('|');
            output += `|${rowContent}\n`;
        });
        output += '|===';
        return output;
    }
}

// Test Data
const rawBody = `
| Hint Type | Primary Instruction | Pseudo-instruction Equivalent 
| .2+|Start Hint | \`csrrs rd, mcycle, x0\` | \`csrr rd, mcycle\` 
| \`csrrs rd, cycle, x0\` | \`csrr rd, cycle\` 
| End Hint | \`csrrs rd, minstret, x0\` | \`csrr rd, minstret\` 
| | \`csrrs rd, instret, x0\` | \`csrr rd, instret\` 
`.trim().split('\n');

console.log("--- Running Parser Logic ---");
const parser = new BasicPipeParser();
const table = parser.parseTable(rawBody);

console.log("Parsed Table Rows:");
table.rows.forEach((row, i) => {
    console.log(`Row ${i}:`);
    row.cells.forEach((cell, j) => {
        console.log(`  Cell ${j}: "${cell.content}" (r:${cell.rowSpan}, c:${cell.colSpan})`);
    });
});

console.log("\n--- Running Serializer Logic ---");
const serializer = new BasicTableSerializer();
const adoc = serializer.serialize(table);
console.log(adoc);

// Verify Asciidoctor on Serialized Output
const Asciidoctor = require('asciidoctor');
const asciidoctor = Asciidoctor();
const fullDoc = `[cols="1,3,3"]\n${adoc}`;
const html = asciidoctor.convert(fullDoc);

if (html.includes('rowspan="2"')) {
    console.log("\n[SUCCESS] Re-serialized HTML contains rowspan.");
} else {
    console.log("\n[FAILURE] Re-serialized HTML misses rowspan.");
}
