import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Move,
  RotateCcw,
} from 'lucide-react';
import Button from '../common/Button';

export default function DocumentViewer({
  documentUrl,
  documentType = 'Scanned Land Deed',
  totalPages = 1,
  currentPage: externalPage,
  onPageChange,
}) {
  const [internalPage, setInternalPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  const page = externalPage !== undefined ? externalPage : internalPage;
  const numPages = totalPages || 1;

  const handleZoomIn = () => setZoom((z) => Math.min(250, z + 25));
  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 25));
  const handleResetZoom = () => {
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
    setRotation(0);
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handlePrevPage = () => {
    const next = Math.max(1, page - 1);
    if (onPageChange) onPageChange(next);
    else setInternalPage(next);
  };

  const handleNextPage = () => {
    const next = Math.min(numPages, page + 1);
    if (onPageChange) onPageChange(next);
    else setInternalPage(next);
  };

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    if (zoom > 100) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-md">
      {/* Top Toolbar */}
      <div className="bg-slate-950 px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs text-slate-300 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <span className="font-medium text-white truncate max-w-[150px] sm:max-w-xs">
            {documentType}
          </span>
        </div>

        {/* Zoom & Rotate Controls */}
        <div className="flex items-center gap-1 bg-slate-900 rounded-lg p-0.5 border border-slate-800">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors text-slate-400"
            title="Zoom Out (-25%)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-mono text-[11px] text-slate-300 select-none">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors text-slate-400"
            title="Zoom In (+25%)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <button
            type="button"
            onClick={handleRotate}
            className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors text-slate-400"
            title="Rotate 90deg Clockwise"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 hover:text-white hover:bg-slate-800 rounded transition-colors text-slate-400"
            title="Reset Fit"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={handlePrevPage}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-40"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-300">
            Page {page} of {numPages}
          </span>
          <button
            type="button"
            disabled={page >= numPages}
            onClick={handleNextPage}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-40"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Document View Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 overflow-hidden relative flex items-center justify-center p-4 min-h-[480px] select-none ${
          zoom > 100 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
        style={{
          backgroundColor: '#0f172a',
        }}
      >
        <div
          className="transition-transform duration-75 origin-center shadow-2xl"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
          }}
        >
          {(() => {
            const trimmedUrl = typeof documentUrl === 'string' ? documentUrl.trim() : '';
            const hasValidUrl = Boolean(
              trimmedUrl &&
              trimmedUrl !== 'http://localhost:5000' &&
              trimmedUrl !== 'http://localhost:5000/' &&
              trimmedUrl !== '/'
            );
            const isPdf = hasValidUrl && (trimmedUrl.toLowerCase().includes('.pdf') || (documentType && String(documentType).toLowerCase().includes('pdf')));

            if (!hasValidUrl) {
              return (
                <div className="w-[500px] h-[680px] bg-white rounded-lg p-8 shadow-md border border-slate-300 text-slate-800 flex flex-col justify-between">
                  <div className="border-b border-slate-200 pb-3 text-center">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      BhumiPatra
                    </div>
                    <div className="text-base font-semibold text-slate-900 mt-1">
                      Land Record Document
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Page {page}
                    </div>
                  </div>

                  <div className="text-center py-20 text-slate-400 text-sm">
                    No scanned deed image or PDF available for this record.
                  </div>

                  <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 text-center">
                    Document identification record pending file upload
                  </div>
                </div>
              );
            }

            if (isPdf) {
              return (
                <iframe
                  src={`${trimmedUrl}#toolbar=0&navpanes=0`}
                  title="Land Document PDF"
                  className="w-[580px] h-[760px] bg-white rounded border border-slate-700 shadow-xl"
                />
              );
            }

            return (
              <img
                src={trimmedUrl}
                alt="Original Land Record Document"
                className="max-w-[620px] max-h-[780px] w-auto h-auto object-contain rounded bg-white border border-slate-700 shadow-xl pointer-events-none"
              />
            );
          })()}
        </div>

        {/* Pan Guide Tooltip */}
        {zoom > 100 && (
          <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm text-slate-400 text-[10px] px-2.5 py-1 rounded border border-slate-800 flex items-center gap-1.5">
            <Move className="w-3 h-3" />
            <span>Click and drag to pan scanned document</span>
          </div>
        )}
      </div>
    </div>
  );
}
