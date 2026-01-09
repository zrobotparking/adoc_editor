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
    id: string;
    type: 'table';
    table: Table;
    startLine: number; // 0-indexed line number where |=== starts
    endLine: number;   // 0-indexed line number where |=== ends
    attributes?: string[];
    title?: string;
}

export interface TextBlock {
    id: string;
    type: 'text';
    content: string; // The raw text content
    startLine: number;
    endLine: number;
    attributes?: string[];
    title?: string;
}

export type Block = TableBlock | TextBlock;

export interface TableParser {
  parse(input: string): Block[];
}

export interface TableSerializer {
  serialize(table: Table): string;
}
