export type TokenType = 
    | 'header' 
    | 'bold' 
    | 'italic' 
    | 'monospace' 
    | 'list' 
    | 'link' 
    | 'attribute' 
    | 'comment' 
    | 'block-delimiter'
    | 'macro'
    | 'plain';

export interface Token {
    type: TokenType;
    text: string;
    start: number;
    end: number;
}

export class AsciiDocTokenizer {
    private lineCache = new Map<string, Token[]>();

    tokenize(text: string): Token[][] {
        const linesOfTokens: Token[][] = [];
        const lines = text.split('\n');
        
        // Cache management: clear if too big
        if (this.lineCache.size > 10000) {
            this.lineCache.clear();
        }

        lines.forEach((line) => {
            let tokens = this.lineCache.get(line);
            if (!tokens) {
                tokens = [];
                this.tokenizeLine(line, tokens);
                this.lineCache.set(line, tokens);
            }
            linesOfTokens.push(tokens);
        });

        return linesOfTokens;
    }

    // Regex patterns defined as static to avoid recreation
    private static PATTERNS = [
        { type: 'bold', regex: /^\*([^*\n]+)\*/ },
        { type: 'italic', regex: /^([_])([^_]+)\1/ }, // simple _italic_
        { type: 'monospace', regex: /^`([^`]+)`/ },
        { type: 'attribute', regex: /^(:[a-zA-Z0-9_-]+:|{[a-zA-Z0-9_-]+})/ },
        { type: 'link', regex: /^(https?:\/\/[^\s\[]+|link:[^\s\[]+|image:[^\s\[]+)(\[[^\]]*\])?/ },
        { type: 'macro', regex: /^(btn|kbd|menu|icon):\[[^\]]*\]/ }
    ];

    private tokenizeLine(line: string, tokens: Token[]) {
        if (!line) return;
        const offset = 0; // Relative to line start

        // 1. Headers (= Title, == Title) - Full line
        // Must start with = and space, or be a 1-6 level header
        if (/^={1,6}\s+.+$/.test(line)) {
            tokens.push({ type: 'header', text: line, start: offset, end: offset + line.length });
            return;
        }

        // 2. Block Delimiters (----, |===, ....)
        if (/^(--|__|\*\*|``|\+\+|==|\|={3,}|-{4,}|\.{4,}|_{4,})/.test(line)) {
            tokens.push({ type: 'block-delimiter', text: line, start: offset, end: offset + line.length });
            return;
        }

        // 3. Comments (//)
        if (/^\/\/.*/.test(line)) {
            tokens.push({ type: 'comment', text: line, start: offset, end: offset + line.length });
            return;
        }

        // 4. Lists (* item, - item, . item)
        // Check start of line
        const listMatch = line.match(/^(\s*)([\*\-\.]+)(\s+)/);
        let contentStart = 0;
        
        if (listMatch) {
            const fullMatch = listMatch[0];
            tokens.push({ 
                type: 'list', 
                text: fullMatch, 
                start: offset, 
                end: offset + fullMatch.length 
            });
            contentStart = fullMatch.length;
        }

        // 5. Inline Formatting (Scan remainder)
        // We scan the content part of the line
        let remaining = line.substring(contentStart);
        let currentLocalIndex = contentStart;

        while (remaining.length > 0) {
            // Find earliest match of any inline token
            let matched = false;
            for (const p of AsciiDocTokenizer.PATTERNS) {
                // @ts-ignore
                const match = remaining.match(p.regex);
                if (match) {
                     const matchText = match[0];
                     tokens.push({
                         type: p.type as TokenType,
                         text: matchText,
                         start: offset + currentLocalIndex,
                         end: offset + currentLocalIndex + matchText.length
                     });
                     
                     remaining = remaining.substring(matchText.length);
                     currentLocalIndex += matchText.length;
                     matched = true;
                     break;
                }
            }

            if (!matched) {
                // Skip one char (plain)
                // Efficiency: merge plain text
                const nextSpecial = remaining.search(/[\*_`:{\[hli]/); // approximate scan for special chars
                if (nextSpecial === -1) {
                    // All plain
                     tokens.push({ type: 'plain', text: remaining, start: offset + currentLocalIndex, end: offset + currentLocalIndex + remaining.length });
                     break;
                } else if (nextSpecial > 0) {
                     // Plain text chunk before special char
                     const plainChunk = remaining.substring(0, nextSpecial);
                     tokens.push({ type: 'plain', text: plainChunk, start: offset + currentLocalIndex, end: offset + currentLocalIndex + plainChunk.length });
                     remaining = remaining.substring(nextSpecial);
                     currentLocalIndex += nextSpecial;
                } else {
                    // Starts with a special char but didn't match pattern -> consume 1 char as plain
                     tokens.push({ type: 'plain', text: remaining[0], start: offset + currentLocalIndex, end: offset + currentLocalIndex + 1 });
                     remaining = remaining.substring(1);
                     currentLocalIndex += 1;
                }
            }
        }
    }
}
