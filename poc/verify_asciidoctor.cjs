const Asciidoctor = require('asciidoctor');
const asciidoctor = Asciidoctor();

const input = `.HPM Dump Trigger Instructions
[cols="1,3,3", options="header"]
|===
|Hint Type|Primary Instruction|Pseudo-instruction Equivalent 
|.2+|Start Hint|\`csrrs rd, mcycle, x0\`|\`csrr rd, mcycle\` 
|\`csrrs rd, cycle, x0\`|\`csrr rd, cycle\` 
|End Hint|\`csrrs rd, minstret, x0\`|\`csrr rd, minstret\` 
||\`csrrs rd, instret, x0\`|\`csrr rd, instret\` 
|===`;

console.log("--- Input AsciiDoc (No Spaces) ---");
console.log(input);
console.log("\n--- Converted HTML ---");
const html = asciidoctor.convert(input);
console.log(html);

if (html.includes('rowspan="2"')) {
    console.log("\n[SUCCESS] 'rowspan=\"2\"' found in HTML.");
} else {
    console.log("\n[FAILURE] 'rowspan=\"2\"' NOT found in HTML.");
}
