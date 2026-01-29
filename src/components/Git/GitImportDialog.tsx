import React, { useState } from 'react';

interface GitImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (repoUrl: string, token?: string) => Promise<void>;
}

export const GitImportDialog: React.FC<GitImportDialogProps> = ({ isOpen, onClose, onImport }) => {
    const [repoUrl, setRepoUrl] = useState('');
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await onImport(repoUrl, token);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to import repository');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-app-sidebar border border-explorer-border rounded-lg p-6 w-[400px] shadow-2xl">
                <h2 className="text-lg font-bold text-white mb-4">Import Git Repository</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-1">Repository URL</label>
                        <input
                            type="text"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/username/repo.git"
                            className="w-full bg-input-bg border border-input-border rounded p-2 text-text-primary focus:border-blue-500 outline-none"
                            autoFocus
                        />
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-1">Personal Access Token (Optional)</label>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="ghp_..."
                            className="w-full bg-input-bg border border-input-border rounded p-2 text-text-primary focus:border-blue-500 outline-none"
                        />
                    </div>

                    {error && (
                        <div className="mb-4 text-red-500 text-sm p-2 bg-red-500/10 rounded border border-red-500/20">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            disabled={isLoading || !repoUrl.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></span>
                                    Cloning...
                                </>
                            ) : (
                                'Import'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
