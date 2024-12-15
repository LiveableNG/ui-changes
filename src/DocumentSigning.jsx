import React, { useEffect, useRef, useState } from 'react';
import {
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Upload, Pen, Image, Calendar, Type, Check, X, Eye, EyeOff, Users, ZoomIn, ZoomOut, History, RotateCcw, Share2, FileText, Clock, PencilRuler,
    AlertCircle, CheckCircle2, FileCheck, Shield, BookOpen, Trash, Copy
} from 'lucide-react';

import { pdfjs } from 'react-pdf';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Add Google Font for signature
const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Allura&family=Great+Vibes&display=swap';
document.head.appendChild(style);

const DocumentSigning = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [step, setStep] = useState('preview');
    const [documentStatus, setDocumentStatus] = useState('pending');
    const [pdf, setPdf] = useState(null);
    // const [pdfUrl, setPdfUrl] = useState('https://good-tenants-bucket.s3.amazonaws.com/uploads/staging/5YwmiBGCTvg8XXacRJDzmPcE621lqABVtDx1jMwK.pdf');
    const [pdfUrl, setPdfUrl] = useState('https://good-tenants-bucket.s3.amazonaws.com/uploads/pdf/sfO8uT22IwSzeBC527wfjSMEckum0nbCvx6xDZ1O.pdf')
    const [isLoading, setIsLoading] = useState(false);
    const [documentInfo, setDocumentInfo] = useState({
        name: '',
        pages: 0,
        size: '',
        sharedBy: ''
    });
    const [totalPages, setTotalPages] = useState(null);
    const [documentTimeline, setDocumentTimeline] = useState([
        { action: 'Document Created', date: 'Dec 13, 2024', user: 'John Smith' },
        { action: 'Document Signed', date: 'Dec 14, 2024', user: 'Sarah Johnson' },
    ]);
    const [previewExpanded, setPreviewExpanded] = useState(false);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [isDrawing, setIsDrawing] = useState(false);

    const [zoomLevel, setZoomLevel] = useState(100);
    const [documentVersion, setDocumentVersion] = useState(1);
    const [isTermsAccepted, setIsTermsAccepted] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    const [savedSignatures, setSavedSignatures] = useState([]);
    const [signatureToDelete, setSignatureToDelete] = useState(null);
    const [selectedFont, setSelectedFont] = useState('dancing');


    const [placedSignatures, setPlacedSignatures] = useState([]);
    const [selectedSignature, setSelectedSignature] = useState(null);
    const [isPlacingSignature, setIsPlacingSignature] = useState(false);

    const [movingSignature, setMovingSignature] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const [selectedSignatureForResize, setSelectedSignatureForResize] = useState(null);
    const [resizeDirection, setResizeDirection] = useState(null);
    const [selectedSignatureId, setSelectedSignatureId] = useState(null);
    const [placedTexts, setPlacedTexts] = useState([]);
    const [isPlacingText, setIsPlacingText] = useState(false);
    const [currentText, setCurrentText] = useState('');
    const [selectedTextId, setSelectedTextId] = useState(null);
    const [isEditingText, setIsEditingText] = useState(false);
    const [selectedTextForResize, setSelectedTextForResize] = useState(null);

    // Objects
    const fontOptions = [
        { id: 'dancing', name: 'Cursive', fontFamily: "'Dancing Script', cursive", previewText: 'Signature' },
        { id: 'allura', name: 'Handwritten', fontFamily: "'Allura', cursive", previewText: 'Signature' },
        { id: 'great-vibes', name: 'Elegant', fontFamily: "'Great Vibes', cursive", previewText: 'Signature' }
    ];

    // Refs
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const activeTextInputRef = useRef(null);

    // useEffects
    useEffect(() => {
        const loadInitialPDF = async () => {
            if (pdfUrl) {
                setIsLoading(true);
                try {
                    const response = await fetch(pdfUrl);
                    const blob = await response.blob();

                    // Set document info
                    setDocumentInfo({
                        name: pdfUrl.split('/').pop() || 'Document.pdf',
                        pages: 0,  // This will be updated when PDF loads
                        size: `${(blob.size / (1024 * 1024)).toFixed(1)} MB`,
                        sharedBy: 'pm@goodtenants.com'
                    });

                    const reader = new FileReader();
                    reader.onload = (e) => setPdf(e.target.result);
                    reader.readAsDataURL(blob);
                } catch (error) {
                    console.error('Error loading PDF from URL:', error);
                    alert('Failed to load PDF from URL');
                } finally {
                    setIsLoading(false);
                }
            }
        };

        loadInitialPDF();
    }, [pdfUrl]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging || !movingSignature || !containerRef.current) return;

            e.preventDefault();
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left - dragOffset.x;
            const y = e.clientY - rect.top - dragOffset.y;

            if (movingSignature.text !== undefined) {
                // Moving text
                setPlacedTexts(prev => prev.map(item => {
                    if (item.id === movingSignature.id) {
                        const { x: constrainedX, y: constrainedY } = constrainPosition(x, y, item.width || 100, 50);
                        return { ...item, x: constrainedX, y: constrainedY };
                    }
                    return item;
                }));
            } else {
                // Moving signature
                setPlacedSignatures(prev => prev.map(sig => {
                    if (sig.id === movingSignature.id) {
                        const { x: constrainedX, y: constrainedY } = constrainPosition(x, y, sig.width || 100, sig.height || 50);
                        return { ...sig, x: constrainedX, y: constrainedY };
                    }
                    return sig;
                }));
            }
        };

        const handleMouseUp = (e) => {
            e.preventDefault();
            e.stopPropagation();

            setIsDragging(false);
            setMovingSignature(null);
            if (!isEditingText) {
                setSelectedTextId(null);
            }
        };

        // Resize logic
        const handleResize = (e) => {
            if ((!selectedSignatureForResize && !selectedTextForResize) || !containerRef.current) return;
            
            // Prevent text selection during resize
            e.preventDefault();
            document.body.style.userSelect = 'none';
            document.body.style.WebkitUserSelect = 'none';
            
            const rect = containerRef.current.getBoundingClientRect();
            const currentMouseX = e.clientX - rect.left;

            if (selectedSignatureForResize) {
                const mouseDelta = currentMouseX - selectedSignatureForResize.initialMouseX;

                // Add minimum and maximum constraints
                const minWidth = 50;
                const maxWidth = rect.width - selectedSignatureForResize.x - 20; // 20px padding

                // Smooth the resize using a damping factor
                const dampingFactor = 0.8;
                const smoothedDelta = mouseDelta * dampingFactor;

                // Calculate new dimensions with constraints
                const targetWidth = selectedSignatureForResize.initialWidth + smoothedDelta;
                const newWidth = Math.min(maxWidth, Math.max(minWidth, targetWidth));
                const newHeight = newWidth / selectedSignatureForResize.aspectRatio;

                // Use requestAnimationFrame for smoother updates
                requestAnimationFrame(() => {
                    setPlacedSignatures(prev => prev.map(sig =>
                        sig.id === selectedSignatureForResize.id
                            ? {
                                ...sig,
                                width: newWidth,
                                height: newHeight
                            }
                            : sig
                    ));
                });
            } else if (selectedTextForResize) {
                // Keep existing text resize logic
                const deltaX = currentMouseX - selectedTextForResize.x;
                const minWidth = 100;
                const maxWidth = rect.width - selectedTextForResize.x - 20;
                const newWidth = Math.min(maxWidth, Math.max(minWidth, deltaX));

                setPlacedTexts(prev => prev.map(text =>
                    text.id === selectedTextForResize.id
                        ? { ...text, width: newWidth }
                        : text
                ));
            }
        };

        const handleResizeEnd = () => {
            // Restore text selection
            document.body.style.userSelect = '';
            document.body.style.WebkitUserSelect = '';
            
            setSelectedSignatureForResize(null);
            setSelectedTextForResize(null);
            setResizeDirection(null);
        };

        // Add listeners to document to catch events even if mouse leaves original element
        const handleGlobalMouseMove = (e) => {
            if (isDragging) {
                handleMouseMove(e);
            }
            if (selectedSignatureForResize || selectedTextForResize) {
                e.preventDefault();
                handleResize(e);
            }
        };

        const handleGlobalMouseUp = (e) => {
            if (isDragging) {
                handleMouseUp(e);
            }
            if (selectedSignatureForResize) {
                handleResizeEnd();
            }
        };

        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging, movingSignature, selectedSignatureForResize, dragOffset]);

    useEffect(() => {
        const handleDocumentClick = (e) => {
            if (!e.target.closest('.signature-container') && !e.target.closest('.text-container')) {
                setSelectedSignatureId(null);
                setSelectedTextId(null);
                setIsEditingText(false);
            }
        };

        document.addEventListener('click', handleDocumentClick);
        return () => document.removeEventListener('click', handleDocumentClick);
    }, []);

    // Functions
    const onDocumentLoadSuccess = ({ numPages }) => {
        setTotalPages(numPages);
        setDocumentInfo(prev => ({
            ...prev,
            pages: numPages
        }));
    };

    // -- handlers
    const handleMouseDown = (e, signature) => {
        if (selectedSignatureForResize) return; // Don't start drag if resizing

        e.preventDefault();
        e.stopPropagation();

        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left - signature.x;
        const offsetY = e.clientY - rect.top - signature.y;

        setDragOffset({ x: offsetX, y: offsetY });
        setMovingSignature(signature);
        setIsDragging(true);
        setSelectedSignatureId(signature.id);
    };

    const deleteSignature = (id) => {
        setSavedSignatures(prev => prev.filter(sig => sig.id !== id));
        setPlacedSignatures(prev => prev.filter(sig => sig.signatureId !== id));
        setSignatureToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const saveSignature = (signatureData) => {
        const newSignature = {
            id: Date.now(),
            image: signatureData,
            name: `Signature ${savedSignatures.length + 1}`
        };
        setSavedSignatures(prev => [...prev, newSignature]);
        setIsSignatureModalOpen(false); // Close the modal after saving
    };

    const constrainPosition = (x, y, width, height) => {
        const containerWidth = containerRef.current?.clientWidth || 0;
        const containerHeight = containerRef.current?.clientHeight || 0;

        return {
            x: Math.min(Math.max(x, width / 2), containerWidth - width / 2),
            y: Math.min(Math.max(y, height / 2), containerHeight - height / 2)
        };
    };

    const SignatureModal = ({ isOpen, onClose, saveSignature }) => {
        const [activeTab, setActiveTab] = useState('draw');
        const [typedSignature, setTypedSignature] = useState('');
        const canvasRef = useRef(null);
        const [isDrawing, setIsDrawing] = useState(false);

        useEffect(() => {
            if (!isOpen) {
                setTypedSignature('');
                clearCanvas();
            }
        }, [isOpen]); // Keep this useEffect unchanged

        // Add a new separate useEffect for tab handling
        useEffect(() => {
            if (activeTab === 'type' && typedSignature === '') {
                setTypedSignature('Signature');  // Set default text when switching to type tab
            }
        }, [activeTab]);

        const clearCanvas = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.beginPath();
            }
        };

        const points = useRef([]);
        const lastVelocity = useRef(0);
        const lastWidth = useRef(2);

        const getPoint = (e, rect) => {
            const scaleX = canvasRef.current.width / rect.width;
            const scaleY = canvasRef.current.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            return { x, y, time: Date.now() };
        };

        const getVelocity = (p1, p2) => {
            const timeDiff = p2.time - p1.time;
            if (timeDiff <= 0) return 0;

            const distance = Math.sqrt(
                Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
            );
            return Math.min(distance / timeDiff, 2.5);
        };

        const getStrokeWidth = (velocity) => {
            const minWidth = 1;
            const maxWidth = 3;
            const velocityFilterWeight = 0.7;

            const newVelocity = velocityFilterWeight * velocity +
                (1 - velocityFilterWeight) * lastVelocity.current;
            lastVelocity.current = newVelocity;

            return Math.max(maxWidth / (newVelocity + 1), minWidth);
        };

        const drawCurve = (ctx, p1, p2, width) => {
            const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineWidth = width;
            ctx.stroke();
            ctx.closePath();
        };

        const startDrawing = (e) => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const rect = canvas.getBoundingClientRect();

            points.current = [];
            lastVelocity.current = 0;
            lastWidth.current = 2;

            const point = getPoint(e, rect);
            points.current.push(point);

            ctx.strokeStyle = '#000000';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            setIsDrawing(true);
        };

        const draw = (e) => {
            if (!isDrawing) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const rect = canvas.getBoundingClientRect();

            const newPoint = getPoint(e, rect);
            points.current.push(newPoint);

            if (points.current.length > 2) {
                const lastTwoPoints = points.current.slice(-2);
                const velocity = getVelocity(lastTwoPoints[0], lastTwoPoints[1]);
                const width = getStrokeWidth(velocity);

                drawCurve(ctx, lastTwoPoints[0], lastTwoPoints[1], width);
            }
        };

        const stopDrawing = () => {
            points.current = [];
            lastVelocity.current = 0;
            setIsDrawing(false);
        };

        const handleFileChange = (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = document.createElement('img');
                    img.onload = () => {
                        // Create canvas with the exact image dimensions
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');

                        // Make background transparent
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // Draw the image directly
                        ctx.drawImage(img, 0, 0);

                        // Make white pixels transparent
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;
                        for (let i = 0; i < data.length; i += 4) {
                            // If pixel is white or near white
                            if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
                                data[i + 3] = 0; // Make it transparent
                            }
                        }
                        ctx.putImageData(imageData, 0, 0);

                        // Save the signature with transparent background
                        saveSignature(canvas.toDataURL('image/png'));
                        onClose();
                    };
                    img.src = event.target?.result?.toString() || '';
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please upload an image file (PNG, JPG, etc.)');
            }
        };

        const handleSave = () => {
            if (activeTab === 'draw') {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');

                // Get the bounding box of the signature
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imageData.data;
                let minX = canvas.width;
                let minY = canvas.height;
                let maxX = 0;
                let maxY = 0;

                // Find the bounds of the signature
                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const alpha = pixels[(y * canvas.width + x) * 4 + 3];
                        if (alpha > 0) {
                            minX = Math.min(minX, x);
                            minY = Math.min(minY, y);
                            maxX = Math.max(maxX, x);
                            maxY = Math.max(maxY, y);
                        }
                    }
                }

                // Add padding around the signature
                const padding = 10;
                minX = Math.max(0, minX - padding);
                minY = Math.max(0, minY - padding);
                maxX = Math.min(canvas.width, maxX + padding);
                maxY = Math.min(canvas.height, maxY + padding);

                // Create a new canvas with just the signature
                const signatureCanvas = document.createElement('canvas');
                const signatureWidth = maxX - minX;
                const signatureHeight = maxY - minY;

                if (signatureWidth > 0 && signatureHeight > 0) {
                    signatureCanvas.width = signatureWidth;
                    signatureCanvas.height = signatureHeight;

                    const signatureCtx = signatureCanvas.getContext('2d');
                    // Make the background transparent
                    signatureCtx.clearRect(0, 0, signatureWidth, signatureHeight);

                    // Copy only the signature part
                    signatureCtx.drawImage(
                        canvas,
                        minX, minY, signatureWidth, signatureHeight,
                        0, 0, signatureWidth, signatureHeight
                    );

                    const signatureData = signatureCanvas.toDataURL('image/png');
                    saveSignature(signatureData);
                } else {
                    // If no signature was drawn
                    alert('Please draw a signature before saving');
                }
            } else if (activeTab === 'type' && typedSignature.trim()) {
                const canvas = document.createElement('canvas');
                canvas.width = 500;
                canvas.height = 200;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#000';
                const selectedFontFamily = fontOptions.find(f => f.id === selectedFont)?.fontFamily.replace(/[']/g, '');
                ctx.font = `48px ${selectedFontFamily}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);
                saveSignature(canvas.toDataURL());
            }
            onClose();
        };

        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="text-lg font-semibold">Add New Signature</h3>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4">
                        {/* Tabs */}
                        <div className="flex gap-2 mb-4">
                            {[
                                { id: 'draw', icon: Pen, label: 'Draw' },
                                // { id: 'type', icon: Type, label: 'Type' },
                                { id: 'upload', icon: Upload, label: 'Upload' }
                            ].map(({ id, icon: Icon, label }) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                                        ${activeTab === id ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'border hover:bg-gray-50'}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="mt-4">
                            {activeTab === 'draw' && (
                                <div className="space-y-4">
                                    <div className="relative border-2 border-dashed border-gray-200 rounded-lg w-full">
                                        <div className="absolute inset-0 bg-gray-50 pointer-events-none" />
                                        <canvas
                                            ref={canvasRef}
                                            width={500}
                                            height={200}
                                            className="w-full relative z-10 bg-transparent"
                                            onMouseDown={startDrawing}
                                            onMouseMove={draw}
                                            onMouseUp={stopDrawing}
                                            onMouseLeave={stopDrawing}
                                        />
                                    </div>
                                    <button
                                        onClick={clearCanvas}
                                        className="text-sm text-blue-600 hover:text-blue-700"
                                    >
                                        Clear Signature
                                    </button>
                                </div>
                            )}

                            {activeTab === 'type' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Type your signature
                                        </label>
                                        <input
                                            type="text"
                                            value={typedSignature}
                                            onChange={(e) => setTypedSignature(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Your name"
                                        />
                                    </div>

                                    {/* Font Selection */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {fontOptions.map((font) => (
                                            <div
                                                key={font.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedFont(font.id);
                                                    if (typedSignature === '') {
                                                        setTypedSignature('Signature');
                                                    }
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                className={`w-full p-3 border rounded-lg text-center transition-all cursor-pointer ${selectedFont === font.id
                                                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                                    : 'hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <span className="text-sm text-gray-600 block mb-2">{font.name}</span>
                                                <span
                                                    style={{
                                                        fontFamily: font.fontFamily,
                                                        fontSize: '20px'
                                                    }}
                                                    className="text-gray-800"
                                                >
                                                    {font.previewText}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                                        <div className="h-16 bg-white border rounded-lg flex items-center justify-center">
                                            <span
                                                className={typedSignature ? "text-gray-800" : "text-gray-400 text-sm"}
                                                style={typedSignature ? {
                                                    fontFamily: fontOptions.find(f => f.id === selectedFont)?.fontFamily,
                                                    fontSize: '28px'
                                                } : {}}
                                            >
                                                {typedSignature || 'Signature Preview'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'upload' && (
                                <div className="space-y-4">
                                    <label className="border-2 border-dashed border-gray-200 rounded-lg p-8 block cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                        <div className="flex flex-col items-center text-gray-400">
                                            <Upload className="w-8 h-8 mb-2" />
                                            <p className="text-sm text-center mb-2">
                                                Drag and drop your signature image here
                                            </p>
                                            <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100">
                                                Browse Files
                                            </span>
                                            <p className="text-xs text-gray-400 mt-2">
                                                Supported formats: PNG, JPG, JPEG
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 p-4 border-t">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                            disabled={activeTab === 'type' && !typedSignature.trim()}
                        >
                            Save Signature
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const DeleteSignatureModal = ({ isOpen, onClose }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="text-lg font-semibold">Delete Signature</h3>
                        <button
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setSignatureToDelete(null);
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        <p className="text-gray-600">
                            Are you sure you want to delete this signature? This action cannot be undone.
                        </p>
                    </div>

                    <div className="flex gap-2 p-4 border-t">
                        <button
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setSignatureToDelete(null);
                            }}
                            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => deleteSignature(signatureToDelete)}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const downloadOriginalPDF = async () => {
        try {
            const response = await fetch(pdfUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = documentInfo.name || 'document.pdf';
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Failed to download PDF');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation Bar */}
            {documentStatus === 'signed' ? (
                // Signed Document Header
                <div className="bg-white border-b shadow-sm fixed top-0 left-0 right-0 z-50">
                    <div className="max-w-full px-6 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-bold text-gray-900">Rental Agreement</h1>
                                    <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                                        Signed
                                    </span>
                                </div>
                                <div className="h-6 w-px bg-gray-200" />
                                <div className="text-sm text-gray-500">Document ID: AG-2024-12345</div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-600 font-medium">
                                        JS
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-green-600 font-medium">
                                        SJ
                                    </div>
                                </div>
                                <div className="h-6 w-px bg-gray-200" />
                                <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                                <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white border-b shadow-sm fixed top-0 left-0 right-0 z-50">
                    <div className="max-w-full px-6 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <h1 className="text-xl font-bold text-gray-900">Rental Agreement</h1>
                                <div className="h-6 w-px bg-gray-200" />
                                <div className="text-sm text-gray-500">Document ID: AG-2024-12345</div>
                            </div>

                            {/* Updated Signers Section */}
                            <div className="flex items-center gap-4">
                                {/* Property Manager */}
                                <div className="flex items-center gap-3 px-4 py-1.5 bg-blue-50 rounded-full">
                                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 font-semibold border border-blue-100">
                                        PM
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-medium text-gray-900">John Smith</p>
                                        <p className="text-blue-600">Property Manager</p>
                                    </div>
                                    <div className="px-2 py-0.5 bg-blue-100 rounded text-xs text-blue-700">Sender</div>
                                </div>

                                {/* Tenant */}
                                <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-50 rounded-full">
                                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 font-semibold border border-gray-200">
                                        T
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-medium text-gray-900">Awaiting Signature</p>
                                        <p className="text-gray-500">Tenant</p>
                                    </div>
                                    <div className="px-2 py-0.5 bg-yellow-100 rounded text-xs text-yellow-700">Pending</div>
                                </div>

                                <button
                                    onClick={() => setPreviewExpanded(!previewExpanded)}
                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 flex items-center gap-2"
                                >
                                    {previewExpanded ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    <span className="text-sm">{previewExpanded ? 'Collapse' : 'Expand'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="pt-16 flex h-[calc(100vh-4rem)]">
                {/* Left Panel - PDF Preview */}
                <div className={`${previewExpanded ? 'w-5/6' : 'w-2/3'} transition-all duration-300 border-r bg-white p-6 overflow-y-auto relative`}>
                    <div className="max-w-4xl mx-auto pb-16"> {/* Added padding bottom for navigation */}
                        {isLoading ? (
                            <div className="aspect-[3/4] bg-white rounded-xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300">
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-gray-400">Loading PDF...</div>
                                </div>
                            </div>
                        ) : pdf ? (
                            <div
                                ref={containerRef}
                                className="relative border rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                                onClick={(e) => {
                                    if (isDragging) return; // Prevent placing while dragging
                                    if (isPlacingText) {
                                        const rect = containerRef.current.getBoundingClientRect();
                                        const x = e.clientX - rect.left;
                                        const y = e.clientY - rect.top;

                                        setPlacedTexts(prev => [...prev, {
                                            id: Date.now(),
                                            text: currentText || 'Type here...',
                                            page: currentPage,
                                            x,
                                            y
                                        }]);
                                        setIsPlacingText(false);
                                        setCurrentText('');
                                    } else if (isPlacingSignature && selectedSignature) {
                                        const rect = containerRef.current.getBoundingClientRect();
                                        const x = e.clientX - rect.left;
                                        const y = e.clientY - rect.top;

                                        setPlacedSignatures(prev => [...prev, {
                                            id: Date.now(),
                                            signatureId: selectedSignature.id,
                                            page: currentPage,
                                            x,
                                            y,
                                            image: selectedSignature.image
                                        }]);

                                        setIsPlacingSignature(false);
                                        setSelectedSignature(null);
                                    }
                                }}
                                style={{ cursor: isPlacingSignature ? 'crosshair' : 'default' }}
                            >
                                <Document
                                    file={pdf}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    className="w-full"
                                >
                                    <Page
                                        pageNumber={currentPage}
                                        width={containerRef.current?.clientWidth || 600}
                                    />

                                    {/* Render placed texts */}
                                    {placedTexts
                                        .filter(text => text.page === currentPage)
                                        .map(text => (
                                            <div
                                                key={text.id}
                                                className="text-container"
                                                style={{
                                                    position: 'absolute',
                                                    left: text.x,
                                                    top: text.y,
                                                    transform: 'translate(-50%, -50%)',
                                                    zIndex: selectedTextId === text.id ? 1000 : 10,
                                                    cursor: isDragging ? 'grabbing' : 'grab',
                                                    width: text.width || 'auto',
                                                    minWidth: '100px'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isEditingText) {
                                                        setSelectedTextId(text.id);
                                                    }
                                                }}
                                                onDoubleClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsEditingText(true);
                                                    setSelectedTextId(text.id);
                                                }}
                                                onMouseDown={(e) => {
                                                    if (selectedTextForResize || isEditingText) return;
                                                    e.preventDefault();
                                                    e.stopPropagation();

                                                    if (!containerRef.current) return;

                                                    const rect = containerRef.current.getBoundingClientRect();
                                                    const offsetX = e.clientX - rect.left - text.x;
                                                    const offsetY = e.clientY - rect.top - text.y;

                                                    setDragOffset({ x: offsetX, y: offsetY });
                                                    setMovingSignature(text);
                                                    setIsDragging(true);
                                                    setSelectedTextId(text.id);
                                                }}
                                            >
                                                {selectedTextId === text.id && !isEditingText && (
                                                    <>
                                                        {/* Floating toolbar */}
                                                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border flex items-center gap-1 p-1">
                                                            <button
                                                                className="p-1.5 hover:bg-gray-100 rounded"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const newText = {
                                                                        ...text,
                                                                        id: Date.now(),
                                                                        x: text.x + 20,
                                                                        y: text.y + 20
                                                                    };
                                                                    setPlacedTexts(prev => [...prev, newText]);
                                                                }}
                                                            >
                                                                <Copy className="w-4 h-4 text-gray-600" />
                                                            </button>
                                                            <div className="w-px h-4 bg-gray-200" />
                                                            <button
                                                                className="p-1.5 hover:bg-gray-100 rounded"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPlacedTexts(prev =>
                                                                        prev.filter(t => t.id !== text.id)
                                                                    );
                                                                }}
                                                            >
                                                                <Trash className="w-4 h-4 text-gray-600" />
                                                            </button>
                                                        </div>

                                                        {/* Selection border */}
                                                        <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />

                                                        {/* Corner handles */}
                                                        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500" />
                                                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500" />
                                                        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500" />
                                                        <div
                                                            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 cursor-se-resize"
                                                            onMouseDown={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedTextForResize(text);
                                                                setResizeDirection('bottom-right');
                                                            }}
                                                        />
                                                    </>
                                                )}
                                                <input
                                                    data-text-id={text.id}
                                                    type="text"
                                                    value={text.text}
                                                    readOnly={selectedTextId !== text.id || !isEditingText}
                                                    onChange={(e) => {
                                                        setPlacedTexts(prev =>
                                                            prev.map(t =>
                                                                t.id === text.id ? { ...t, text: e.target.value } : t
                                                            )
                                                        );
                                                    }}
                                                    onFocus={(e) => {
                                                        if (selectedTextId === text.id && isEditingText) {
                                                            e.target.select();
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        setIsEditingText(false);
                                                        setSelectedTextId(null);
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (selectedTextId !== text.id) {
                                                            setSelectedTextId(text.id);
                                                        }
                                                    }}
                                                    onDoubleClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedTextId(text.id);
                                                        setIsEditingText(true);
                                                        e.target.select();
                                                    }}
                                                    className={`border-none bg-transparent focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 ${isEditingText && selectedTextId === text.id ? 'cursor-text' : 'cursor-grab'
                                                        }`}
                                                />
                                            </div>
                                        ))}

                                    {/* Render placed signatures */}
                                    {placedSignatures
                                        .filter(sig => sig.page === currentPage)
                                        .map(signature => (
                                            <div
                                                key={signature.id}
                                                className="signature-container"
                                                style={{
                                                    position: 'absolute',
                                                    left: signature.x,
                                                    top: signature.y,
                                                    transform: 'translate(-50%, -50%)',
                                                    zIndex: selectedSignatureId === signature.id ? 1000 : 10,
                                                    cursor: isDragging ? 'grabbing' : 'grab'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedSignatureId(signature.id);
                                                }}
                                                onMouseDown={(e) => handleMouseDown(e, signature)}
                                            >
                                                {/* Selection border and handles */}
                                                {selectedSignatureId === signature.id && (
                                                    <>
                                                        {/* Floating toolbar */}
                                                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border flex items-center gap-1 p-1">
                                                            <button
                                                                className="p-1.5 hover:bg-gray-100 rounded"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const newSignature = {
                                                                        ...signature,
                                                                        id: Date.now(),
                                                                        x: signature.x + 20,
                                                                        y: signature.y + 20
                                                                    };
                                                                    setPlacedSignatures(prev => [...prev, newSignature]);
                                                                }}
                                                            >
                                                                <Copy className="w-4 h-4 text-gray-600" />
                                                            </button>
                                                            <div className="w-px h-4 bg-gray-200" />
                                                            <button
                                                                className="p-1.5 hover:bg-gray-100 rounded"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPlacedSignatures(prev =>
                                                                        prev.filter(sig => sig.id !== signature.id)
                                                                    );
                                                                }}
                                                            >
                                                                <Trash className="w-4 h-4 text-gray-600" />
                                                            </button>
                                                        </div>

                                                        {/* Selection border */}
                                                        <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none" />

                                                        {/* Corner handles */}
                                                        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500" />
                                                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500" />
                                                        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-500" />
                                                        <div
                                                            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-500 cursor-se-resize"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                const signatureElement = e.currentTarget.parentElement.querySelector('img');
                                                                if (signatureElement) {
                                                                    const rect = containerRef.current.getBoundingClientRect();
                                                                    const startMouseX = e.clientX - rect.left;
                                                                    
                                                                    // Get actual rendered dimensions from the image element
                                                                    const actualWidth = signatureElement.getBoundingClientRect().width;
                                                                    const actualHeight = signatureElement.getBoundingClientRect().height;
                                                                    
                                                                    setSelectedSignatureForResize({
                                                                        ...signature,
                                                                        initialMouseX: startMouseX,
                                                                        initialWidth: actualWidth,
                                                                        initialHeight: actualHeight,
                                                                        aspectRatio: actualWidth / actualHeight,
                                                                        x: signature.x // Store position for boundary calculations
                                                                    });
                                                                }
                                                                setResizeDirection('bottom-right');
                                                            }}
                                                        />
                                                    </>
                                                )}

                                                <img
                                                    src={signature.image}
                                                    alt="Placed Signature"
                                                    style={{
                                                        width: signature.width || 'auto',
                                                        height: signature.height || 'auto',
                                                        maxWidth: '300px',
                                                        maxHeight: '150px'
                                                    }}
                                                />
                                            </div>
                                        ))}
                                </Document>
                            </div>
                        ) : (
                            <div className="aspect-[3/4] bg-white rounded-xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300">
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-gray-400">No PDF loaded</div>
                                </div>
                            </div>
                        )}

                        {/* Page Navigation */}
                        {pdf && (
                            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex justify-between items-center bg-white rounded-lg shadow-lg border p-3 w-auto min-w-[300px] z-50" style={{ maxWidth: 'calc(100% - 3rem)' }}>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className="p-1.5 hover:bg-gray-100 rounded-md disabled:opacity-40 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-600 transition-colors"
                                    >
                                        <ChevronsLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 hover:bg-gray-100 rounded-md disabled:opacity-40 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-600 transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-md shadow-sm hover:shadow transition-all duration-300">
                                    <select
                                        value={currentPage}
                                        onChange={(e) => setCurrentPage(Number(e.target.value))}
                                        className="px-2 py-1 bg-transparent border-none text-sm focus:outline-none focus:ring-0 hover:bg-gray-100 rounded cursor-pointer"
                                    >
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>Page {i + 1}</option>
                                        ))}
                                    </select>
                                    <div className="h-4 w-px bg-gray-300" />
                                    <span className="text-sm text-gray-600">of {totalPages}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 hover:bg-gray-100 rounded-md disabled:opacity-40 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-600 transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 hover:bg-gray-100 rounded-md disabled:opacity-40 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-600 transition-colors"
                                    >
                                        <ChevronsRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Actions */}
                <div className={`${previewExpanded ? 'w-1/6' : 'w-1/3'} transition-all duration-300 p-6 overflow-y-auto`}>
                    {documentStatus === 'signed' ? (
                        <div className="space-y-6">
                            {/* Document Status Card */}
                            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <Shield className="w-5 h-5 text-green-600" />
                                    <h3 className="text-sm font-medium text-green-900">Document Completed</h3>
                                </div>
                                <p className="text-sm text-green-800 mb-4">
                                    This document has been signed by all parties and is legally binding.
                                </p>
                                <div className="flex items-center justify-between text-sm text-green-800">
                                    <span>Completed Date:</span>
                                    <span className="font-medium">Dec 14, 2024</span>
                                </div>
                            </div>

                            {/* Document Timeline */}
                            <div className="bg-white border rounded-lg p-4">
                                <h3 className="text-sm font-medium mb-4">Document Timeline</h3>
                                <div className="space-y-4">
                                    {documentTimeline.map((event, index) => (
                                        <div key={index} className="relative pl-6 pb-4 last:pb-0">
                                            <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-600"></div>
                                            {index !== documentTimeline.length - 1 && (
                                                <div className="absolute left-1.5 top-4 bottom-0 w-0.5 bg-gray-200"></div>
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{event.action}</p>
                                                <p className="text-xs text-gray-500">{event.date} • {event.user}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button className="w-full px-4 py-2.5 bg-white border text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Download Document
                                </button>
                                <button className="w-full px-4 py-2.5 bg-white border text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                    <Share2 className="w-4 h-4" />
                                    Share Document
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Progress Steps */}
                            <div className="mb-8">
                                {[
                                    { label: 'Document Preview', value: 'preview' },
                                    { label: 'Signing Method', value: 'method' },
                                    { label: 'Sign Document', value: 'signing' },
                                    { label: 'Review & Submit', value: 'review' }
                                ].map(({ label, value }, index) => (
                                    <div
                                        key={label}
                                        className={`relative mb-1 last:mb-0 ${index < ['preview', 'method', 'signing', 'review'].indexOf(step) ? 'opacity-50' : ''
                                            }`}
                                    >
                                        <div className={`flex items-center gap-3 p-3 rounded-lg ${step === value ? 'bg-blue-50 border border-blue-100' : ''
                                            }`}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm
                ${step === value ? 'bg-blue-600 text-white' :
                                                    index < ['preview', 'method', 'signing', 'review'].indexOf(step) ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                                                {index < ['preview', 'method', 'signing', 'review'].indexOf(step) ? <Check className="w-4 h-4" /> : index + 1}
                                            </div>
                                            <span className="text-sm font-medium">{label}</span>
                                        </div>
                                        {index < 3 && (
                                            <div className="absolute left-3 top-10 bottom-0 w-px bg-gray-200" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {step === 'preview' && (
                                <div className="space-y-6">
                                    {/* Document Information */}
                                    {pdf && (
                                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-sm font-medium text-blue-900">Document Information</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <FileText className="w-4 h-4 flex-shrink-0" />
                                                        <p className="truncate" title={documentInfo.name}>
                                                            Name: {documentInfo.name}
                                                        </p>
                                                    </div>
                                                    <p className="truncate">Pages: {documentInfo.pages}</p>
                                                    <p className="truncate">Size: {documentInfo.size}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="truncate">Shared by: {documentInfo.sharedBy}</p>
                                                    <p className="truncate">Last Modified: 2 hours ago</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => setStep('method')}
                                            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            Continue to Sign
                                            <ChevronRight className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={downloadOriginalPDF}
                                            className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download Copy
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 'method' && (
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => setStep('signing')}
                                            className="w-full p-4 bg-white border shadow-sm rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left flex items-center gap-3 group"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100">
                                                <Pen className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <span className="font-medium block mb-0.5">Sign Online</span>
                                                <span className="text-sm text-gray-600">Draw or type your signature</span>
                                            </div>
                                        </button>
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <button
                                                    onClick={downloadOriginalPDF}
                                                    className="w-full p-4 bg-white border shadow-sm rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left flex items-center gap-3 group"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100">
                                                        <Download className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <span className="font-medium block mb-0.5">Download Document</span>
                                                        <span className="text-sm text-gray-600">Sign offline on your device</span>
                                                    </div>
                                                </button>

                                                <div className="relative">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <div className="w-full border-t border-gray-200"></div>
                                                    </div>
                                                    <div className="relative flex justify-center">
                                                        <span className="bg-gray-50 px-2 text-sm text-gray-500">Already signed?</span>
                                                    </div>
                                                </div>

                                                <div className="border rounded-lg p-4 bg-white space-y-4">
                                                    <label className="w-full p-4 bg-white border border-dashed rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left flex items-center gap-3 group cursor-pointer">
                                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100">
                                                            <Upload className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <span className="font-medium block mb-0.5">Upload Signed Document</span>
                                                            <span className="text-sm text-gray-600">Upload your signed PDF</span>
                                                        </div>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="application/pdf"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onload = (event) => {
                                                                        const img = document.createElement('img');
                                                                        img.onload = () => {
                                                                            // Create canvas to normalize the image size
                                                                            const canvas = document.createElement('canvas');
                                                                            canvas.width = 500;
                                                                            canvas.height = 200;
                                                                            const ctx = canvas.getContext('2d');

                                                                            // Calculate scaling to fit within canvas while maintaining aspect ratio
                                                                            const scale = Math.min(
                                                                                canvas.width / img.width,
                                                                                canvas.height / img.height
                                                                            ) * 0.8; // 80% of max size for margins

                                                                            // Calculate centered position
                                                                            const x = (canvas.width - img.width * scale) / 2;
                                                                            const y = (canvas.height - img.height * scale) / 2;

                                                                            // Draw image with calculated dimensions
                                                                            ctx.fillStyle = 'white';
                                                                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                                                                            ctx.drawImage(
                                                                                img,
                                                                                x,
                                                                                y,
                                                                                img.width * scale,
                                                                                img.height * scale
                                                                            );

                                                                            // Save the normalized signature
                                                                            saveSignature(canvas.toDataURL('image/png'));
                                                                            setIsSignatureModalOpen(false);
                                                                        };
                                                                        img.src = event.target?.result?.toString() || '';
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 'signing' && (
                                <div className="space-y-6">
                                    {/* Signature Tools */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => setIsSignatureModalOpen(true)}
                                            className={`p-3 rounded-lg transition-all flex flex-col items-center gap-2 border hover:border-blue-200 hover:bg-gray-50 hover:shadow-sm active:scale-95}`}
                                        >
                                            <Pen className={`w-5 h-5 text-gray-600`} />
                                            <span className="text-xs font-medium">Add Signature</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedSignature(null);
                                                setSelectedSignatureId(null);

                                                const container = containerRef.current;
                                                if (container) {
                                                    const rect = container.getBoundingClientRect();
                                                    const newTextId = Date.now();

                                                    // Set editing state before adding text
                                                    setIsEditingText(true);
                                                    setSelectedTextId(newTextId);

                                                    // Add new text with default text
                                                    setPlacedTexts(prev => [...prev, {
                                                        id: newTextId,
                                                        text: 'Type here...',
                                                        page: currentPage,
                                                        x: rect.width / 2,
                                                        y: rect.height / 2,
                                                        width: 150
                                                    }]);

                                                    // Focus and select after DOM update
                                                    setTimeout(() => {
                                                        const input = document.querySelector(`input[data-text-id="${newTextId}"]`);
                                                        if (input) {
                                                            input.focus();
                                                            input.select();
                                                        }
                                                    }, 0);
                                                }
                                            }}
                                            className={`p-3 rounded-lg transition-all flex flex-col items-center gap-2 border hover:border-blue-200 hover:bg-gray-50 hover:shadow-sm active:scale-95}`}
                                        >
                                            <Type className="w-5 h-5 text-gray-600" />
                                            <span className="text-xs font-medium">Add Text</span>
                                        </button>
                                        <button
                                            className={`p-3 rounded-lg transition-all flex flex-col items-center gap-2 border hover:border-blue-200 hover:bg-gray-50 hover:shadow-sm active:scale-95}`}
                                        >
                                            <Calendar className={`w-5 h-5 text-gray-600`} />
                                            <span className="text-xs font-medium">Add Date</span>
                                        </button>
                                    </div>

                                    {/* Saved Signatures Section */}
                                    <div className="bg-white border rounded-lg p-4 space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium">Saved Signatures</h3>
                                            {isPlacingSignature && (
                                                <span className="text-sm text-blue-600">
                                                    Click on the document to place signature
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            {savedSignatures.length === 0 ? (
                                                <div className="text-sm text-gray-500 text-center py-4">
                                                    No saved signatures
                                                </div>
                                            ) : (
                                                savedSignatures.map(signature => (
                                                    <div key={signature.id} className="border rounded-lg p-3 hover:border-blue-200">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-medium">{signature.name}</span>
                                                            <button
                                                                className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-red-500 transition-colors"
                                                                onClick={() => {
                                                                    setSignatureToDelete(signature.id);
                                                                    setIsDeleteModalOpen(true);
                                                                }}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <div
                                                            className="h-16 bg-gray-50 rounded border flex items-center justify-center cursor-pointer hover:border-gray-300 transition-colors"
                                                            onClick={() => {
                                                                setSelectedSignature(signature);
                                                                setIsPlacingSignature(true);
                                                            }}
                                                        >
                                                            {signature.image ? (
                                                                <img
                                                                    src={signature.image}
                                                                    alt="Signature"
                                                                    className="h-full object-contain p-2"
                                                                />
                                                            ) : (
                                                                <span className="text-sm text-gray-400">Preview</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Preview & Submit Button */}
                                    <div className="pt-4 border-t mt-8">
                                        <button
                                            onClick={() => setStep('review')}
                                            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            Preview & Submit
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                        <p className="text-xs text-gray-500 text-center mt-2">
                                            Review your document before submitting
                                        </p>
                                    </div>
                                </div>
                            )}

                            {step === 'review' && (
                                <div className="space-y-6">
                                    {/* Document Summary */}
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                        <h3 className="text-sm font-medium text-blue-900 mb-3">Document Summary</h3>
                                        <div className="space-y-2 text-sm text-blue-800">
                                            <div className="flex items-center justify-between">
                                                <span>Document Type:</span>
                                                <span className="font-medium">Rental Agreement</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Total Pages:</span>
                                                <span className="font-medium">{totalPages}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Verification Steps */}
                                    <div className="bg-white border rounded-lg divide-y">
                                        <div className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-0.5 ${isTermsAccepted ? 'text-green-500' : 'text-gray-400'}`}>
                                                    <BookOpen className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium mb-1">Terms & Conditions</h4>
                                                    <p className="text-sm text-gray-600 mb-3">
                                                        By signing this document, you agree to be bound by its terms
                                                    </p>
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={isTermsAccepted}
                                                            onChange={(e) => setIsTermsAccepted(e.target.checked)}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        I have read and agree to the terms and conditions
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Warning Notice */}
                                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-medium text-yellow-800 mb-1">Important Notice</h4>
                                            <p className="text-sm text-yellow-700">
                                                This is a legally binding document. Once submitted, you cannot modify your signature.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center justify-center gap-2"
                                            onClick={() => setStep('signing')}
                                        >
                                            <X className="w-4 h-4" />
                                            Back to Signing
                                        </button>
                                        <button
                                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2
                                    ${isVerified && isTermsAccepted
                                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                            disabled={!isVerified || !isTermsAccepted}
                                        >
                                            <FileCheck className="w-4 h-4" />
                                            Submit Document
                                        </button>
                                    </div>

                                    {/* Success Message */}
                                    {isVerified && isTermsAccepted && (
                                        <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-start gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm font-medium text-green-800 mb-1">Ready to Submit</h4>
                                                <p className="text-sm text-green-700">
                                                    All requirements have been met. You can now submit the document.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <SignatureModal
                isOpen={isSignatureModalOpen}
                onClose={() => setIsSignatureModalOpen(false)}
                saveSignature={(signatureData) => {
                    const newSignature = {
                        id: Date.now(),
                        image: signatureData,
                        name: `Signature ${savedSignatures.length + 1}`
                    };
                    setSavedSignatures(prev => [...prev, newSignature]);
                    setIsSignatureModalOpen(false);
                }}
            />

            <DeleteSignatureModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSignatureToDelete(null);
                }}
                onDelete={() => {
                    // Handle delete signature logic here
                    setIsDeleteModalOpen(false);
                    setSignatureToDelete(null);
                }}
            />
        </div>
    );
};

export default DocumentSigning;