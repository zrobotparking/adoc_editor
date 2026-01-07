export interface Cell {
  id: string; // Unique identifier for React keys
  content: string;
  rowSpan: number;
  colSpan: number;
}

export interface Row {
  id: string;
  cells: Cell[];
}

export interface Table {
  id: string;
  rows: Row[];
  metadata?: {
    cols?: string; // e.g., "1,1,2"
    options?: string; // e.g., "header,footer"
  };
}

export interface TableBlock {
    table: Table;
    startLine: number; // 0-indexed line number where |=== starts
    endLine: number;   // 0-indexed line number where |=== ends
}

export interface TableParser {
  parse(input: string): TableBlock[];
}

export interface TableSerializer {
  serialize(table: Table): string;
}
