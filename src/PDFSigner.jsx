import React, { useRef, useState, useEffect } from 'react';
import { Upload, Download } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFSignature = () => {
    const [pdf, setPdf] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [signature, setSignature] = useState(null);
    const [signaturePosition, setSignaturePosition] = useState({ x: 50, y: 50 });
    const [signatureSize, setSignatureSize] = useState({ width: 200, height: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState(null);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const signatureRef = useRef(null);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        if (type === 'pdf' && file.type === 'application/pdf') {
            reader.onload = (e) => setPdf(e.target.result);
            reader.readAsDataURL(file);
        } else if (type === 'signature' && file.type.startsWith('image/')) {
            reader.onload = (e) => setSignature(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            const canvas = canvasRef.current;
            setSignature(canvas.toDataURL());
            setIsDrawing(false);
        }
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignature(null);
    };

    const handleMouseDown = (e, action, direction = null) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        
        setDragStartPos({
            x: e.clientX - containerRect.left - signaturePosition.x,
            y: e.clientY - containerRect.top - signaturePosition.y
        });
        
        if (action === 'drag') setIsDragging(true);
        if (action === 'resize') {
            setIsResizing(true);
            setResizeDirection(direction);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging && !isResizing) return;
        e.preventDefault();

        const container = containerRef.current.getBoundingClientRect();

        if (isDragging) {
            const newX = e.clientX - container.left - dragStartPos.x;
            const newY = e.clientY - container.top - dragStartPos.y;

            setSignaturePosition({
                x: Math.max(0, Math.min(newX, container.width - signatureSize.width)),
                y: Math.max(0, Math.min(newY, container.height - signatureSize.height))
            });
        } else if (isResizing) {
            const minSize = 50;
            let newWidth = signatureSize.width;
            let newHeight = signatureSize.height;
            let newX = signaturePosition.x;
            let newY = signaturePosition.y;

            const deltaX = e.clientX - (container.left + signaturePosition.x + dragStartPos.x);
            const deltaY = e.clientY - (container.top + signaturePosition.y + dragStartPos.y);

            switch (resizeDirection) {
                case 'se':
                    newWidth = Math.max(minSize, signatureSize.width + deltaX);
                    newHeight = Math.max(minSize, signatureSize.height + deltaY);
                    break;
                case 'sw':
                    newWidth = Math.max(minSize, signatureSize.width - deltaX);
                    newHeight = Math.max(minSize, signatureSize.height + deltaY);
                    newX = signaturePosition.x + deltaX;
                    break;
                case 'ne':
                    newWidth = Math.max(minSize, signatureSize.width + deltaX);
                    newHeight = Math.max(minSize, signatureSize.height - deltaY);
                    newY = signaturePosition.y + deltaY;
                    break;
                case 'nw':
                    newWidth = Math.max(minSize, signatureSize.width - deltaX);
                    newHeight = Math.max(minSize, signatureSize.height - deltaY);
                    newX = signaturePosition.x + deltaX;
                    newY = signaturePosition.y + deltaY;
                    break;
            }

            setSignatureSize({ width: newWidth, height: newHeight });
            setSignaturePosition({ x: newX, y: newY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        setResizeDirection(null);
    };

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, signaturePosition, signatureSize]);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const downloadSignedPDF = async () => {
        try {
            const pdfDoc = await PDFDocument.load(pdf);
            const pages = pdfDoc.getPages();
            const pageHeights = Array.from(containerRef.current.querySelectorAll('.react-pdf__Page')).map(page => page.clientHeight);
            
            let accumulatedHeight = 0;
            let currentPage = 0;
            
            for (let i = 0; i < pageHeights.length; i++) {
                if (signaturePosition.y > accumulatedHeight && signaturePosition.y <= accumulatedHeight + pageHeights[i]) {
                    currentPage = i;
                    break;
                }
                accumulatedHeight += pageHeights[i];
            }
    
            const page = pages[currentPage];
            const { width, height } = page.getSize();
            const container = containerRef.current;
            const localY = signaturePosition.y - accumulatedHeight;
    
            const signatureImage = await pdfDoc.embedPng(signature);
            const pdfX = (signaturePosition.x / container.clientWidth) * width;
            const pdfY = height - ((localY / pageHeights[currentPage]) * height) - 
                ((signatureSize.height / pageHeights[currentPage]) * height);
    
            page.drawImage(signatureImage, {
                x: pdfX,
                y: pdfY,
                width: (signatureSize.width / container.clientWidth) * width,
                height: (signatureSize.height / pageHeights[currentPage]) * height,
            });
    
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'signed-document.pdf';
            link.click();
        } catch (error) {
            console.error('Error signing PDF:', error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-500" />
                            <p className="text-sm text-gray-500">Upload PDF</p>
                        </div>
                        <input type="file" className="hidden" accept="application/pdf" onChange={(e) => handleFileChange(e, 'pdf')} />
                    </label>

                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-500" />
                            <p className="text-sm text-gray-500">Upload Signature Image</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'signature')} />
                    </label>
                </div>

                <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-2">Or draw your signature:</p>
                    <canvas
                        ref={canvasRef}
                        width={500}
                        height={200}
                        className="border border-gray-300 rounded w-full"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                    />
                    <div className="flex justify-end mt-2">
                        <button onClick={clearSignature} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200">
                            Clear
                        </button>
                    </div>
                </div>

                {pdf && (
                    <div
                        ref={containerRef}
                        className="relative border rounded-lg"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setSignaturePosition({
                                    x: e.clientX - rect.left,
                                    y: e.clientY - rect.top
                                });
                            }
                        }}
                    >
                        <Document file={pdf} onLoadSuccess={onDocumentLoadSuccess} className="w-full">
                            {Array.from(new Array(numPages), (_, index) => (
                                <Page key={`page_${index + 1}`} pageNumber={index + 1} width={containerRef.current?.clientWidth || 600} />
                            ))}
                        </Document>

                        {signature && (
                            <div
                                ref={signatureRef}
                                className="absolute border-2 border-blue-500 cursor-move select-none z-10"
                                style={{
                                    left: `${signaturePosition.x}px`,
                                    top: `${signaturePosition.y}px`,
                                    width: `${signatureSize.width}px`,
                                    height: `${signatureSize.height}px`,
                                }}
                                onMouseDown={(e) => handleMouseDown(e, 'drag')}
                            >
                                <img
                                    src={signature}
                                    alt="Signature"
                                    className="w-full h-full object-contain"
                                    draggable="false"
                                />
                                <div
                                    className="absolute top-0 left-0 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize"
                                    onMouseDown={(e) => handleMouseDown(e, 'resize', 'nw')}
                                />
                                <div
                                    className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize"
                                    onMouseDown={(e) => handleMouseDown(e, 'resize', 'ne')}
                                />
                                <div
                                    className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize"
                                    onMouseDown={(e) => handleMouseDown(e, 'resize', 'sw')}
                                />
                                <div
                                    className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize"
                                    onMouseDown={(e) => handleMouseDown(e, 'resize', 'se')}
                                />
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={downloadSignedPDF}
                    disabled={!pdf || !signature}
                    className="w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download Signed PDF
                </button>
            </div>
        </div>
    );
};

export default PDFSignature;