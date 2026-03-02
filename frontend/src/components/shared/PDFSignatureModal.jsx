import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { X, Download, Save, Pen, Eraser, Undo, ZoomIn, ZoomOut, Maximize2, CheckCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const PDFSignatureModal = ({ 
  isOpen, 
  onClose, 
  pdfUrl, 
  formType,
  admissionId,
  onSave 
}) => {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen' or 'eraser'
  const [drawings, setDrawings] = useState([]); // Store all drawings
  const [currentPath, setCurrentPath] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(false);
  
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const pdfBytesRef = useRef(null); // Keep a ref as backup
  const loadingRef = useRef(false); // Prevent double-loading
  const { toast } = useToast();

  // Load PDF when modal opens
  useEffect(() => {
    if (isOpen && pdfUrl) {
      loadPDF();
    } else if (!isOpen) {
      // Don't clear state when modal closes - keep it in case modal reopens
    }
  }, [isOpen, pdfUrl]);

  const loadPDF = async () => {
    // Prevent double-loading
    if (loadingRef.current) {
      return;
    }
    
    try {
      loadingRef.current = true;
      setIsLoading(true);
      
      // Fetch the PDF
      const response = await fetch(pdfUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Create a copy of the array buffer to ensure it persists
      const arrayBufferCopy = arrayBuffer.slice(0);
      const bytes = new Uint8Array(arrayBufferCopy);
      
      if (bytes.length === 0) {
        throw new Error('PDF file is empty (0 bytes)');
      }
      
      
      // Store in both state and ref with a deep copy
      const bytesCopy = new Uint8Array(bytes);
      setPdfBytes(bytesCopy);
      pdfBytesRef.current = bytes; // Store original in ref
      
      
      // Load pdf.js for rendering
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      if (!pdfjsLib) {
        throw new Error('PDF.js library not loaded');
      }
      
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      
      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const pdf = await loadingTask.promise;
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      
      
      // Wait for canvas refs to be available
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Render first page
      await renderPage(pdf, 1);
      
      // Only stop loading after render completes
      setIsLoading(false);
      loadingRef.current = false;
      
    } catch (error) {
      setIsLoading(false);
      loadingRef.current = false;
      toast({
        title: "Error",
        description: "Failed to load PDF: " + error.message,
        variant: "destructive"
      });
    }
  };

  const renderPage = async (pdf, pageNumber) => {
    try {
      
      // Check if canvas refs are available
      if (!canvasRef.current || !overlayCanvasRef.current) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Check again
        if (!canvasRef.current || !overlayCanvasRef.current) {
          throw new Error('Canvas elements not available');
        }
      }
      
      
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render PDF page
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Setup overlay canvas for drawing
      const overlayCanvas = overlayCanvasRef.current;
      overlayCanvas.width = viewport.width;
      overlayCanvas.height = viewport.height;
      
      // Redraw existing drawings
      redrawCanvas();
      
    } catch (error) {
    }
  };

  const redrawCanvas = () => {
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all paths for the given page
    const pageDrawings = drawings.filter(d => d.page === currentPage);
    pageDrawings.forEach(drawing => {
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = drawing.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      drawing.path.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    });
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPath([{ x, y }]);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newPath = [...currentPath, { x, y }];
    setCurrentPath(newPath);
    
    // Draw on canvas
    ctx.strokeStyle = tool === 'pen' ? '#000000' : '#FFFFFF';
    ctx.lineWidth = tool === 'pen' ? 2 : 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    if (currentPath.length > 0) {
      const lastPoint = currentPath[currentPath.length - 1];
      ctx.moveTo(lastPoint.x, lastPoint.y);
    }
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && currentPath.length > 0) {
      // Save the path
      setDrawings([...drawings, {
        page: currentPage,
        path: currentPath,
        color: tool === 'pen' ? '#000000' : '#FFFFFF',
        width: tool === 'pen' ? 2 : 10
      }]);
      setCurrentPath([]);
    }
    setIsDrawing(false);
  };

  const undoLastDrawing = () => {
    const pageDrawings = drawings.filter(d => d.page === currentPage);
    if (pageDrawings.length > 0) {
      // Remove last drawing from current page
      const lastDrawingIndex = drawings.lastIndexOf(pageDrawings[pageDrawings.length - 1]);
      const newDrawings = [...drawings];
      newDrawings.splice(lastDrawingIndex, 1);
      setDrawings(newDrawings);
      redrawCanvas();
    }
  };

  const clearPage = () => {
    // Remove all drawings from current page
    setDrawings(drawings.filter(d => d.page !== currentPage));
    redrawCanvas();
  };

  const savePDF = async () => {
    setIsSaving(true);
    try {
      
      // Try to use ref if state is null
      const bytesToUse = pdfBytes || pdfBytesRef.current;
      
      if (!bytesToUse || bytesToUse.length === 0) {
        throw new Error('PDF data not loaded. Please wait for the PDF to load completely and try again.');
      }
      
      
      // Load pdf-lib for modifying PDF
      const { PDFDocument, rgb } = await import('pdf-lib');
      
      // Load the original PDF
      const pdfLibDoc = await PDFDocument.load(bytesToUse);
      const pages = pdfLibDoc.getPages();
      
      
      // Add drawings to each page
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const pageDrawings = drawings.filter(d => d.page === pageNum);
        if (pageDrawings.length === 0) continue;
        
        
        const page = pages[pageNum - 1];
        const { width, height } = page.getSize();
        
        // Get the rendered page dimensions
        const renderedPage = await pdfDoc.getPage(pageNum);
        const viewport = renderedPage.getViewport({ scale });
        
        // Create a canvas to render drawings
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Fill with transparent background
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw all paths for this page
        pageDrawings.forEach(drawing => {
          tempCtx.strokeStyle = drawing.color;
          tempCtx.lineWidth = drawing.width;
          tempCtx.lineCap = 'round';
          tempCtx.lineJoin = 'round';
          
          tempCtx.beginPath();
          drawing.path.forEach((point, index) => {
            if (index === 0) {
              tempCtx.moveTo(point.x, point.y);
            } else {
              tempCtx.lineTo(point.x, point.y);
            }
          });
          tempCtx.stroke();
        });
        
        // Convert canvas to PNG
        const pngDataUrl = tempCanvas.toDataURL('image/png');
        const pngBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer());
        
        const pngImage = await pdfLibDoc.embedPng(new Uint8Array(pngBytes));
        
        // Calculate scaling
        const scaleX = width / viewport.width;
        const scaleY = height / viewport.height;
        
        // Draw image on PDF page
        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: width,
          height: height,
          opacity: 1
        });
      }
      
      // Save modified PDF
      const modifiedPdfBytes = await pdfLibDoc.save();
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      
      
      // Call onSave callback to upload to backend
      if (onSave) {
        await onSave(blob, formType);
      }
      
      toast({
        title: "Success",
        description: `Signed ${formType === 'ophsureng' ? 'Ophthalmic Surgery' : 'Anesthesia'} consent form saved to patient's admission record.`,
        duration: 5000,
      });
      
      onClose();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save signed PDF: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Download the signed PDF (with drawings) at any time
  const downloadPDF = async () => {
    try {
      // Generate the signed PDF with drawings (same as savePDF, but just download)
      const { PDFDocument } = await import('pdf-lib');
      const bytesToUse = pdfBytes || pdfBytesRef.current;
      if (!bytesToUse || bytesToUse.length === 0) {
        toast({ title: 'Error', description: 'PDF not loaded yet', variant: 'destructive' });
        return;
      }
      const pdfLibDoc = await PDFDocument.load(bytesToUse);
      const pages = pdfLibDoc.getPages();
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const pageDrawings = drawings.filter(d => d.page === pageNum);
        if (pageDrawings.length === 0) continue;
        const page = pages[pageNum - 1];
        const { width, height } = page.getSize();
        const renderedPage = await pdfDoc.getPage(pageNum);
        const viewport = renderedPage.getViewport({ scale });
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        pageDrawings.forEach(drawing => {
          tempCtx.strokeStyle = drawing.color;
          tempCtx.lineWidth = drawing.width;
          tempCtx.lineCap = 'round';
          tempCtx.lineJoin = 'round';
          tempCtx.beginPath();
          drawing.path.forEach((point, index) => {
            if (index === 0) tempCtx.moveTo(point.x, point.y);
            else tempCtx.lineTo(point.x, point.y);
          });
          tempCtx.stroke();
        });
        const pngDataUrl = tempCanvas.toDataURL('image/png');
        const pngBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer());
        const pngImage = await pdfLibDoc.embedPng(new Uint8Array(pngBytes));
        page.drawImage(pngImage, {
          x: 0, y: 0, width, height, opacity: 1
        });
      }
      const modifiedPdfBytes = await pdfLibDoc.save();
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${formType}_signed.pdf`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
        link.remove();
      }, 1000);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to generate signed PDF for download', variant: 'destructive' });
    }
  };

  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.25, 3);
    setScale(newScale);
    if (pdfDoc && currentPage) {
      renderPage(pdfDoc, currentPage);
    }
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.25, 0.5);
    setScale(newScale);
    if (pdfDoc && currentPage) {
      renderPage(pdfDoc, currentPage);
    }
  };

  const handleResetZoom = () => {
    setScale(1.5);
    if (pdfDoc && currentPage) {
      renderPage(pdfDoc, currentPage);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col overflow-hidden" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
        <DialogHeader className="border-b pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Sign Consent Form</DialogTitle>
            {(pdfBytes || pdfBytesRef.current) && !isLoading && (
              <Badge variant="success" className="bg-green-100 text-green-800 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                PDF Loaded ({pdfBytes ? pdfBytes.length : pdfBytesRef.current.length} bytes)
              </Badge>
            )}
            {isLoading && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                Loading...
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={tool === 'pen' ? 'default' : 'outline'}
              onClick={() => setTool('pen')}
            >
              <Pen className="h-4 w-4 mr-2" />
              Pen
            </Button>
            <Button
              size="sm"
              variant={tool === 'eraser' ? 'default' : 'outline'}
              onClick={() => setTool('eraser')}
            >
              <Eraser className="h-4 w-4 mr-2" />
              Eraser
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={undoLastDrawing}
            >
              <Undo className="h-4 w-4 mr-2" />
              Undo
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearPage}
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
            
            <div className="h-6 w-px bg-gray-300 mx-2" />
            
            {/* Zoom Controls */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              disabled={scale >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetZoom}
              title="Reset Zoom"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={downloadPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              size="sm"
              onClick={savePDF}
              disabled={isSaving || drawings.length === 0 || (!pdfBytes && !pdfBytesRef.current) || isLoading}
              className="bg-green-600 hover:bg-green-700"
              title={(!pdfBytes && !pdfBytesRef.current) ? 'Waiting for PDF to load...' : drawings.length === 0 ? 'Add signatures before saving' : 'Save signed PDF'}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Signed PDF'}
            </Button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div ref={containerRef} className="relative flex-1 overflow-auto bg-gray-100 p-4" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-sm font-medium text-gray-700">Loading PDF...</p>
                <p className="text-xs text-gray-500 mt-2">Please wait while we prepare your document</p>
              </div>
            </div>
          )}
          <div className="flex items-start justify-center">
            <div className="relative inline-block shadow-2xl">
              <canvas
                ref={canvasRef}
                className="border border-gray-300 bg-white"
                style={{ display: isLoading ? 'none' : 'block' }}
              />
              <canvas
                ref={overlayCanvasRef}
                className="absolute top-0 left-0 cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{ display: isLoading ? 'none' : 'block' }}
              />
            </div>
          </div>
        </div>

        {/* Page Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 p-4 border-t flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (currentPage > 1) {
                  setCurrentPage(currentPage - 1);
                  renderPage(pdfDoc, currentPage - 1);
                }
              }}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (currentPage < totalPages) {
                  setCurrentPage(currentPage + 1);
                  renderPage(pdfDoc, currentPage + 1);
                }
              }}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PDFSignatureModal;
