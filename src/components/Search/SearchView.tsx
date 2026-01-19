import React, { useState, useEffect } from 'react';

export interface SearchResult {
    file: string;
    matches: {
        line: number;
        text: string;
        startCol: number;
        endCol: number;
    }[];
}

interface SearchViewProps {
    onSearch: (query: string) => SearchResult[];
    onNavigate: (file: string, line: number) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ onSearch, onNavigate }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                setIsSearching(true);
                // Wrap in microtask to allow UI update
                Promise.resolve().then(() => {
                     const res = onSearch(query);
                     setResults(res);
                     setIsSearching(false);
                });
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, onSearch]);

    return (
        <div className="flex flex-col h-full bg-app-sidebar text-text-primary">
             <div className="p-3 border-b border-explorer-border">
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search"
                        className="w-full bg-input-bg border border-input-border rounded p-1 pl-2 text-sm text-text-primary focus:border-blue-500 outline-none"
                    />
                </div>
            </div>
            
            <div className="flex-1 overflow-auto">
                {isSearching && <div className="p-4 text-sm text-gray-400">Searching...</div>}
                
                {!isSearching && query && results.length === 0 && (
                    <div className="p-4 text-sm text-gray-400">No results found.</div>
                )}

                {!isSearching && results.map((result) => (
                    <div key={result.file} className="flex flex-col">
                        <div className="px-3 py-1 bg-white/5 text-xs font-bold text-gray-300 truncate sticky top-0">
                            {result.file} <span className="text-gray-500 font-normal ml-1">({result.matches.length})</span>
                        </div>
                        {result.matches.map((match, idx) => (
                            <div 
                                key={idx} 
                                className="px-4 py-1 hover:bg-white/10 cursor-pointer text-sm font-mono group"
                                onClick={() => onNavigate(result.file, match.line)}
                            >
                                <div className="flex items-baseline overflow-hidden text-ellipsis whitespace-nowrap">
                                    <span className="text-gray-500 text-xs mr-2 w-6 text-right flex-shrink-0">{match.line + 1}:</span>
                                    <span className="text-gray-300">
                                        {/* Simple highlight rendering */}
                                        {match.text.substring(0, match.startCol)}
                                        <span className="bg-yellow-500/30 text-yellow-200">
                                            {match.text.substring(match.startCol, match.endCol)}
                                        </span>
                                        {match.text.substring(match.endCol)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
