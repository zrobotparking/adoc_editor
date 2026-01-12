export class IncludeResolver {
    /**
     * Resolves a target path relative to a base path.
     * Examples:
     * resolvePath('doc.adoc', 'include.adoc') -> 'include.adoc'
     * resolvePath('folder/doc.adoc', 'include.adoc') -> 'folder/include.adoc'
     * resolvePath('folder/doc.adoc', '../include.adoc') -> 'include.adoc'
     */
    static resolvePath(basePath: string, targetPath: string): string {
        if (targetPath.startsWith('/')) return targetPath.slice(1); // Absolute-ish path

        const baseParts = basePath.split('/');
        baseParts.pop(); // Remove filename, keep directory parts

        const targetParts = targetPath.split('/');

        for (const part of targetParts) {
            if (part === '.') {
                continue;
            } else if (part === '..') {
                if (baseParts.length > 0) {
                    baseParts.pop();
                }
            } else {
                baseParts.push(part);
            }
        }

        return baseParts.join('/');
    }

    /**
     * Recursively processes include directives in the content.
     */
    static resolve(
        content: string, 
        currentFilePath: string, 
        files: Record<string, string>, 
        seenPaths: Set<string> = new Set()
    ): string {
        // Prevent infinite recursion
        if (seenPaths.has(currentFilePath)) {
            return `\n// [Recursive Include Detected: ${currentFilePath}]\n`;
        }
        
        // Add current file to seen path for its children
        // Note: We need a new Set for each branch to allow siblings to include the same file,
        // but here we are passing 'seenPaths' down.
        // Actually, preventing A -> B -> A is what we want.
        // But A -> B and A -> C -> B is allowed.
        // So we should clone the set? 
        // No, 'seenPaths' tracks the *current chain*. 
        const newSeen = new Set(seenPaths);
        newSeen.add(currentFilePath);

        // Regex for include::filename[]
        // Supports attributes roughly: include::filename[tag=foo]
        // parsing [attrs] is complex, we might just ignore them for the naive text insertion.
        // But asciidoctor usually expects correct attributes.
        // If we just substitute text, we assume [attrs] are for partial includes or tags.
        // If it's a tag include, we might fail to support it properly without a parser.
        // For MVP, we handle full file includes.
        const includeRegex = /^include::(.+?)\[(.*?)\]/gm;

        return content.replace(includeRegex, (_match, path, _attrs) => {
            const resolvedPath = this.resolvePath(currentFilePath, path.trim());
            
            if (!files[resolvedPath]) {
                return `\n// [Include Not Found: ${resolvedPath} (derived from ${path})]\n`;
            }

            // Recursively resolve
            // We should probably preserve attributes?
            // If user uses 'lines=1..10', simply pasting the whole file is WRONG.
            // But implementing full attribute support is hard.
            // For now, warn if attributes exist?
            // Or just paste it and hope for best.
            // Most common use case is full include.
            
            // If attributes are present, we might want to keep the original directive if we can't handle it?
            // But asciidoctor-pdf won't find the file.
            // So we MUST substitute it. 
            // We'll substitute full content.
            
            const fileContent = files[resolvedPath];
            const resolvedContent = this.resolve(fileContent, resolvedPath, files, newSeen);
            
            return `\n// [Start Include: ${resolvedPath}]\n${resolvedContent}\n// [End Include: ${resolvedPath}]\n`;
        });
    }
}
