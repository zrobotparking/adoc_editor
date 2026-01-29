import React from 'react';

export type Activity = 'explorer' | 'search' | 'git';

interface ActivityBarProps {
    activeActivity: Activity;
    onActivityChange: (activity: Activity) => void;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({ activeActivity, onActivityChange }) => {
    return (
        <div className="w-12 flex flex-col items-center py-2 bg-activity-bar border-r border-activity-bar-border z-20">
            <button
                className={`p-2 mb-2 rounded transition-colors ${activeActivity === 'explorer' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={() => onActivityChange('explorer')}
                title="Explorer"
            >
                {/* Folder Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z"></path>
                </svg>
            </button>
            <button
                className={`p-2 mb-2 rounded transition-colors ${activeActivity === 'search' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={() => onActivityChange('search')}
                title="Search"
            >
                {/* Search Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </button>
            <button
                className={`p-2 mb-2 rounded transition-colors ${activeActivity === 'git' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={() => onActivityChange('git')}
                title="Source Control"
            >
                {/* Git/Branch Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="6" y1="3" x2="6" y2="15"></line>
                    <circle cx="18" cy="6" r="3"></circle>
                    <circle cx="6" cy="18" r="3"></circle>
                    <path d="M18 9a9 9 0 0 1-9 9"></path>
                </svg>
            </button>
        </div>
    );
};
