
function testParserLogic() {
    const lines = [
        "| Cell 1",
        ".4+| Span Cell", // Should be new cell, NOT continuation
        "| Cell 2"
    ];

    let rows = [{ cells: [{ content: "Cell 1" }] }];
    
    console.log("--- Test Case ---");
    lines.forEach((line, index) => {
        if (index === 0) return; // Skip setup line

        const isCellSpecifier = /^(?:(\d+)?(?:\.(\d+))?)\+\|/.test(line.trim());
        const startsWithPipe = line.trim().startsWith('|');

        console.log(`Line: "${line}"`);
        console.log(`  Starts with | : ${startsWithPipe}`);
        console.log(`  Is Specifier  : ${isCellSpecifier}`);
        
        if (!startsWithPipe && !isCellSpecifier && rows.length > 0) {
            console.log("  => Decision: CONTINUATION (Bad if specifier)");
        } else {
            console.log("  => Decision: NEW CELL / ROW (Good)");
        }
    });
}

testParserLogic();
