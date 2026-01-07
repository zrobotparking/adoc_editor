export interface LintError {
    line: number; // 0-indexed line number
    message: string;
    suggestion?: string;
    severity: 'warning' | 'error';
}

export class AsciiDocLinter {
    lint(content: string): LintError[] {
        const lines = content.split('\n');
        const errors: LintError[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Rule: Headers must be preceded by a blank line (unless it's the first line)
            // Regex matches lines starting with one or more '='
            if (/^=+\s+/.test(line)) {
                if (i > 0) {
                    const prevLine = lines[i - 1];
                    if (prevLine.trim() !== '') {
                        errors.push({
                            line: i,
                            message: 'Section Title must be preceded by a blank line.',
                            suggestion: 'Insert a blank line before this title.',
                            severity: 'warning'
                        });
                    }
                }
            }
        }

        return errors;
    }
}
