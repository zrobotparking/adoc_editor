const asciidoctor = require('asciidoctor')();

const tableWithSpace = `
[cols="1,1"]
|===
| .2+|Span | Cell 2
| Cell 3
|===
`;

const tableWithoutSpace = `
[cols="1,1"]
|===
|.2+|Span | Cell 2
| Cell 3
|===
`;

const tableInlineWithSpace = `
[cols="1,1"]
|===
| .2+|Span | Cell 2
| Cell 3
|===
`; // Same as above, checking if row context matters

console.log("--- TEST 1: With Formatting Space (| .2+|) ---");
const htmlSpace = asciidoctor.convert(tableWithSpace);
console.log(htmlSpace);
if (htmlSpace.includes('rowspan="2"')) {
    console.log("RESULT: Space is OK (Parsed as rowspan)");
} else {
    console.log("RESULT: Space BROKE parsing (Literal text or no span)");
}

console.log("\n--- TEST 2: Without Formatting Space (|.2+|) ---");
const htmlNoSpace = asciidoctor.convert(tableWithoutSpace);
console.log(htmlNoSpace);
if (htmlNoSpace.includes('rowspan="2"')) {
    console.log("RESULT: No Space is OK (Parsed as rowspan)");
} else {
    console.log("RESULT: No Space BROKE parsing");
}
