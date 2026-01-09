
const inputs = [
    "2+|Content",
    ".2+|Content",
    "2.3+|Content",
    "2+| Content",
    " .2+|Content",
    "10+|Long"
];

const regex = /^(?:(\d+)?(?:\.(\d+))?)\+\|(.*)$/s;

inputs.forEach(input => {
    const clean = input.trim();
    const match = clean.match(regex);
    console.log(`Input: "${input}"`);
    if (match) {
        console.log(`  Matched! Col: ${match[1]}, Row: ${match[2]}, Content: "${match[3]}"`);
    } else {
        console.log("  No match.");
    }
});
