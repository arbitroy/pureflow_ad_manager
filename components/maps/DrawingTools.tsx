'use client';

import React from 'react';

interface DrawingToolsProps {
    drawingMode: string | null;
    setDrawingMode: (mode: string | null) => void;
}

const DrawingTools: React.FC<DrawingToolsProps> = ({ drawingMode, setDrawingMode }) => {
    return (
        <div className="flex space-x-2">
            <button
                type="button"
                className={`px-3 py-1 rounded-md text-sm ${drawingMode === 'circle' ? 'bg-pure-primary text-white' : 'bg-pure-dark text-white'
                    }`}
                onClick={() => setDrawingMode(drawingMode === 'circle' ? null : 'circle')}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 inline mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12a3 3 0 100-6 3 3 0 000 6z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12v-1m0 0V9m0 0h1m-1 0H9m11 3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                Circle
            </button>
            <button
                type="button"
                className={`px-3 py-1 rounded-md text-sm ${drawingMode === 'polygon' ? 'bg-pure-primary text-white' : 'bg-pure-dark text-white'
                    }`}
                onClick={() => setDrawingMode(drawingMode === 'polygon' ? null : 'polygon')}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 inline mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16m-7 6h7"
                    />
                </svg>
                Polygon
            </button>
        </div>
    );
};

export default DrawingTools;