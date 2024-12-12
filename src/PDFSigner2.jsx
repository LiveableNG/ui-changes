import React, { useRef, useState, useEffect } from 'react';
import {
    Upload, Download, FileText, Pen, Share2,
    ChevronRight, Check, RefreshCw, Type, Calendar,
    Link
} from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// SigningOptions Component
const SigningOptions = ({ onSelect }) => {
    return (
        <div className="max-w-4xl mx-auto p-6">
            <h3 className="text-lg font-medium mb-6 text-center">Choose How You Want to Sign</h3>

            <div className="grid grid-cols-3 gap-6">
                {/* Option 1: Download & Upload Later */}
                <div
                    onClick={() => onSelect('download')}
                    className="bg-white p-6 rounded-lg border-2 hover:border-blue-500 cursor-pointer group"
                >
                    <div className="text-center">
                        <Download className="w-12 h-12 mx-auto mb-4 text-gray-400 group-hover:text-blue-500" />
                        <h4 className="font-medium mb-2">Download & Upload Later</h4>
                        <p className="text-sm text-gray-500">
                            Download the document to sign it offline and upload it later
                        </p>
                    </div>
                </div>

                {/* Option 2: Sign Online */}
                <div
                    onClick={() => onSelect('online')}
                    className="bg-white p-6 rounded-lg border-2 hover:border-blue-500 cursor-pointer group"
                >
                    <div className="text-center">
                        <Pen className="w-12 h-12 mx-auto mb-4 text-gray-400 group-hover:text-blue-500" />
                        <h4 className="font-medium mb-2">Sign Online</h4>
                        <p className="text-sm text-gray-500">
                            Draw or upload your signature to sign the document now
                        </p>
                    </div>
                </div>

                {/* Option 3: Upload Signed Document */}
                <div
                    onClick={() => onSelect('upload')}
                    className="bg-white p-6 rounded-lg border-2 hover:border-blue-500 cursor-pointer group"
                >
                    <div className="text-center">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400 group-hover:text-blue-500" />
                        <h4 className="font-medium mb-2">Upload Signed Document</h4>
                        <p className="text-sm text-gray-500">
                            Upload an already signed version of this document
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PDFSignature2 = () => {
    // Existing state variables
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
    const [fields, setFields] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    // const [pdfUrl, setPdfUrl] = useState('https://good-tenants-bucket.s3.amazonaws.com/uploads/pdf/sfO8uT22IwSzeBC527wfjSMEckum0nbCvx6xDZ1O.pdf')
    const [pdfUrl, setPdfUrl] = useState('https://good-tenants-bucket.s3.amazonaws.com/uploads/staging/5YwmiBGCTvg8XXacRJDzmPcE621lqABVtDx1jMwK.pdf');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [documentInfo, setDocumentInfo] = useState({
        name: '',
        pages: 0,
        size: '',
        sharedBy: ''
    });
    const [editingField, setEditingField] = useState(null);

    // New state variables for UI
    const [currentStep, setCurrentStep] = useState(1);

    // Refs
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const signatureRef = useRef(null);

    const [signingMethod, setSigningMethod] = useState(null);
    const [showSigningOptions, setShowSigningOptions] = useState(false);

    const [history, setHistory] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);

    const [historyState, setHistoryState] = useState({
        signaturePosition: signaturePosition,
        signatureSize: signatureSize,
        fields: fields
    });

    // Define steps
    const steps = [
        { id: 1, title: 'Review Document', icon: FileText },
        { id: 2, title: 'Add Signature', icon: Pen },
        { id: 3, title: 'Place & Submit', icon: Share2 }
    ];

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
                        sharedBy: 'john@example.com'  // This could come from your app's context
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
    }, [pdfUrl]); // Changed dependency to pdfUrl

    useEffect(() => {
        if (signature && containerRef.current && currentIndex === -1) {
            const container = containerRef.current;
            const initialPosition = {
                x: (container.clientWidth - signatureSize.width) / 2,
                y: (container.clientHeight - signatureSize.height) / 2
            };

            const initialState = {
                signaturePosition: initialPosition,
                signatureSize,
                fields: []
            };

            setHistory([initialState]);
            setCurrentIndex(0);
            setSignaturePosition(initialPosition);
        }
    }, [signature]);

    useEffect(() => {
        const handleKeyPress = (e) => {
            // Check if the target is an input field
            if (e.target.tagName === 'INPUT') {
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault(); // Prevent browser's default undo
                if (e.shiftKey) {
                    handleRedo();
                } else {
                    handleUndo();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault(); // Prevent browser's default redo
                handleRedo();
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [currentIndex, history]);

    useEffect(() => {
        const handleGlobalClick = (e) => {
            // Check if clicking outside the field and container
            if (!containerRef.current?.contains(e.target)) {
                if (editingField) {
                    setEditingField(null);
                } else if (selectedItem) {
                    setSelectedItem(null);
                }
            }
        };

        document.addEventListener('mousedown', handleGlobalClick);
        return () => document.removeEventListener('mousedown', handleGlobalClick);
    }, [editingField, selectedItem]);

    const addToHistory = (newState) => {
        // Remove any future states if we're in the middle of the history
        const newHistory = history.slice(0, currentIndex + 1);

        // Add the new state
        newHistory.push({
            signaturePosition: { ...newState.signaturePosition },
            signatureSize: { ...newState.signatureSize },
            fields: newState.fields.map(field => ({ ...field }))
        });

        // Update history and currentIndex
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (currentIndex > 0) {
            const previousState = history[currentIndex - 1];
            setSignaturePosition({ ...previousState.signaturePosition });
            setSignatureSize({ ...previousState.signatureSize });
            setFields(previousState.fields.map(field => ({ ...field })));
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleRedo = () => {
        if (currentIndex < history.length - 1) {
            const nextState = history[currentIndex + 1];
            setSignaturePosition({ ...nextState.signaturePosition });
            setSignatureSize({ ...nextState.signatureSize });
            setFields(nextState.fields.map(field => ({ ...field })));
            setCurrentIndex(currentIndex + 1);
        }
    };

    // Update pages when PDF loads
    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setDocumentInfo(prev => ({
            ...prev,
            pages: numPages
        }));
    };

    const updateFieldContent = (id, content) => {
        const newFields = fields.map(field =>
            field.id === id ? { ...field, content } : field
        );
        setFields(newFields);

        const newState = {
            signaturePosition,
            signatureSize,
            fields: newFields
        };
        addToHistory(newState);
    };

    const addField = (type) => {
        const newField = {
            id: Date.now(),
            type,
            content: type === 'date' ? new Date().toISOString().split('T')[0] : '',
            position: { x: 100, y: 100 },
            size: { width: type === 'date' ? 150 : 200, height: 40 }
        };

        const newFields = [...fields, newField];
        setFields(newFields);

        const newState = {
            signaturePosition,
            signatureSize,
            fields: newFields
        };
        addToHistory(newState);
    };

    const handleFieldMouseDown = (e, field) => {
        e.preventDefault();
        e.stopPropagation();

        // If clicking on input while editing, don't change state
        if (e.target.tagName === 'INPUT' && editingField === field.id) {
            return;
        }

        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();

        // Set drag start position relative to the field's current position
        setDragStartPos({
            x: e.clientX - field.position.x,
            y: e.clientY - field.position.y
        });

        // Always select the field when clicking
        setSelectedItem(field.id);

        // If not editing, initiate drag
        if (!editingField) {
            setIsDragging(true);
        }
    };

    // Add new function to handle field double click
    const handleFieldDoubleClick = (field) => {
        setEditingField(field.id);
        setSelectedItem(field.id);
    };


    const handlePdfUrl = async (e) => {
        e.preventDefault();
        if (!pdfUrl) return;

        setIsLoading(true);
        try {
            const response = await fetch(pdfUrl);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onload = (e) => setPdf(e.target.result);
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Error loading PDF from URL:', error);
            alert('Failed to load PDF from URL');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        if (type === 'pdf' && file.type === 'application/pdf') {
            reader.onload = (e) => setPdf(e.target.result);
            reader.readAsDataURL(file);
        } else if (type === 'signature' && file.type.startsWith('image/')) {
            reader.onload = (e) => {
                setSignature(e.target.result);
                setSelectedItem('signature');

                // Set initial position to center of container
                if (containerRef.current) {
                    const container = containerRef.current;
                    const newPosition = {
                        x: (container.clientWidth - signatureSize.width) / 2,
                        y: (container.clientHeight - signatureSize.height) / 2
                    };
                    setSignaturePosition(newPosition);

                    // Initialize history with first state
                    const initialState = {
                        signaturePosition: newPosition,
                        signatureSize,
                        fields
                    };
                    setHistory([initialState]);
                    setCurrentIndex(0);
                }
            };
            reader.readAsDataURL(file);
        } else if (type === 'signedPdf' && file.type === 'application/pdf') {
            reader.onload = (e) => {
                setPdf(e.target.result);
                setDocumentInfo({
                    name: file.name,
                    pages: 0,  // This will be updated when PDF loads
                    size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                    sharedBy: 'Uploaded by user'
                });
                setShowSigningOptions(false);
                setCurrentStep(3);
            };
            reader.readAsDataURL(file);
        }
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        // Account for canvas scaling
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        // Account for canvas scaling
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            const canvas = canvasRef.current;
            setSignature(canvas.toDataURL());
            setSelectedItem('signature'); // Set as selected when drawn
            // Set initial position to center of container
            if (containerRef.current) {
                const container = containerRef.current;
                setSignaturePosition({
                    x: (container.clientWidth - signatureSize.width) / 2,
                    y: (container.clientHeight - signatureSize.height) / 2
                });
            }
            setIsDrawing(false);

            // Start a new path after stopping
            const ctx = canvas.getContext('2d');
            ctx.beginPath();
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

        if (action === 'drag') {
            setDragStartPos({
                x: e.clientX - containerRect.left - signaturePosition.x,
                y: e.clientY - containerRect.top - signaturePosition.y
            });
            setIsDragging(true);
        }

        if (action === 'resize') {
            setIsResizing(true);
            setResizeDirection(direction);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging && !isResizing) return;
        if (!containerRef.current) return;
        e.preventDefault();

        const container = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - container.left;
        const mouseY = e.clientY - container.top;

        if (isDragging) {
            if (selectedItem === 'signature') {
                const newX = e.clientX - dragStartPos.x - container.left;
                const newY = e.clientY - dragStartPos.y - container.top;

                setSignaturePosition({
                    x: Math.max(0, Math.min(newX, container.width - signatureSize.width)),
                    y: Math.max(0, Math.min(newY, container.height - signatureSize.height))
                });
            } else {
                // Update field position with direct mouse position calculation
                setFields(fields.map(field => {
                    if (field.id === selectedItem) {
                        const newX = e.clientX - dragStartPos.x;
                        const newY = e.clientY - dragStartPos.y;

                        return {
                            ...field,
                            position: {
                                x: Math.max(0, Math.min(newX, container.width - field.size.width)),
                                y: Math.max(0, Math.min(newY, container.height - field.size.height))
                            }
                        };
                    }
                    return field;
                }));
            }
        } else if (isResizing) {
            if (selectedItem === 'signature') {
                // Get current position and size
                const startX = signaturePosition.x;
                const startY = signaturePosition.y;
                const startWidth = signatureSize.width;
                const startHeight = signatureSize.height;

                // Calculate new dimensions based on resize direction
                let newX = startX;
                let newY = startY;
                let newWidth = startWidth;
                let newHeight = startHeight;

                const minSize = 50; // Minimum size for signature
                const maxWidth = container.width - startX;
                const maxHeight = container.height - startY;

                switch (resizeDirection) {
                    case 'se': // Southeast
                        newWidth = Math.max(minSize, Math.min(mouseX - startX, maxWidth));
                        newHeight = Math.max(minSize, Math.min(mouseY - startY, maxHeight));
                        break;

                    case 'sw': // Southwest
                        const swWidth = Math.max(minSize, startX + startWidth - mouseX);
                        newX = Math.min(startX + startWidth - minSize, mouseX);
                        newWidth = startWidth + (startX - newX);
                        newHeight = Math.max(minSize, Math.min(mouseY - startY, maxHeight));
                        break;

                    case 'ne': // Northeast
                        newWidth = Math.max(minSize, Math.min(mouseX - startX, maxWidth));
                        const neHeight = Math.max(minSize, startY + startHeight - mouseY);
                        newY = Math.min(startY + startHeight - minSize, mouseY);
                        newHeight = startHeight + (startY - newY);
                        break;

                    case 'nw': // Northwest
                        const nwWidth = Math.max(minSize, startX + startWidth - mouseX);
                        const nwHeight = Math.max(minSize, startY + startHeight - mouseY);
                        newX = Math.min(startX + startWidth - minSize, mouseX);
                        newY = Math.min(startY + startHeight - minSize, mouseY);
                        newWidth = startWidth + (startX - newX);
                        newHeight = startHeight + (startY - newY);
                        break;
                }

                // Update position and size with constraints
                setSignaturePosition({
                    x: Math.max(0, Math.min(newX, container.width - minSize)),
                    y: Math.max(0, Math.min(newY, container.height - minSize))
                });

                setSignatureSize({
                    width: Math.max(minSize, Math.min(newWidth, container.width - newX)),
                    height: Math.max(minSize, Math.min(newHeight, container.height - newY))
                });
            } else {
                // Handle field resizing
                setFields(fields.map(field => {
                    if (field.id === selectedItem) {
                        const startX = field.position.x;
                        const startY = field.position.y;
                        const startWidth = field.size.width;
                        const startHeight = field.size.height;

                        let newX = startX;
                        let newY = startY;
                        let newWidth = startWidth;
                        let newHeight = startHeight;

                        const minSize = 50;
                        const maxWidth = container.width - startX;
                        const maxHeight = container.height - startY;

                        switch (resizeDirection) {
                            case 'se':
                                newWidth = Math.max(minSize, Math.min(mouseX - startX, maxWidth));
                                newHeight = Math.max(minSize, Math.min(mouseY - startY, maxHeight));
                                break;
                            case 'sw':
                                const swWidth = Math.max(minSize, startX + startWidth - mouseX);
                                newX = Math.min(startX + startWidth - minSize, mouseX);
                                newWidth = startWidth + (startX - newX);
                                newHeight = Math.max(minSize, Math.min(mouseY - startY, maxHeight));
                                break;
                            case 'ne':
                                newWidth = Math.max(minSize, Math.min(mouseX - startX, maxWidth));
                                const neHeight = Math.max(minSize, startY + startHeight - mouseY);
                                newY = Math.min(startY + startHeight - minSize, mouseY);
                                newHeight = startHeight + (startY - newY);
                                break;
                            case 'nw':
                                const nwWidth = Math.max(minSize, startX + startWidth - mouseX);
                                const nwHeight = Math.max(minSize, startY + startHeight - mouseY);
                                newX = Math.min(startX + startWidth - minSize, mouseX);
                                newY = Math.min(startY + startHeight - minSize, mouseY);
                                newWidth = startWidth + (startX - newX);
                                newHeight = startHeight + (startY - newY);
                                break;
                        }

                        return {
                            ...field,
                            position: {
                                x: Math.max(0, Math.min(newX, container.width - minSize)),
                                y: Math.max(0, Math.min(newY, container.height - minSize))
                            },
                            size: {
                                width: Math.max(minSize, Math.min(newWidth, container.width - newX)),
                                height: Math.max(minSize, Math.min(newHeight, container.height - newY))
                            }
                        };
                    }
                    return field;
                }));
            }

        }
    };

    const handleMouseUp = () => {
        if (isDragging || isResizing) {
            setIsDragging(false);
            setIsResizing(false);
            setResizeDirection(null);

            // Add the current state to history only if we were dragging or resizing
            const newState = {
                signaturePosition,
                signatureSize,
                fields
            };
            addToHistory(newState);
        }
    };

    useEffect(() => {
        if (isDragging || isResizing) {
            // Add listeners to window to ensure smooth dragging even when mouse moves fast
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);

            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, selectedItem, fields, signaturePosition, signatureSize]);

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

            // Add text and date fields
            fields.forEach(field => {
                let accumulatedHeight = 0;
                let currentPage = 0;

                for (let i = 0; i < pageHeights.length; i++) {
                    if (field.position.y > accumulatedHeight && field.position.y <= accumulatedHeight + pageHeights[i]) {
                        currentPage = i;
                        break;
                    }
                    accumulatedHeight += pageHeights[i];
                }

                const page = pages[currentPage];
                const { width, height } = page.getSize();
                const container = containerRef.current;
                const localY = field.position.y - accumulatedHeight;

                const pdfX = (field.position.x / container.clientWidth) * width;
                const pdfY = height - ((localY / pageHeights[currentPage]) * height) -
                    ((field.size.height / pageHeights[currentPage]) * height);

                page.drawText(field.content, {
                    x: pdfX,
                    y: pdfY + (field.size.height / 2),
                    size: 12,
                    color: rgb(0, 0, 0),
                });
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

    // New function to reset all changes
    const resetChanges = () => {
        setSignature(null);
        setFields([]);
        setSelectedItem(null);
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    // Modified handleStepChange function
    const handleStepChange = (newStep) => {
        if (currentStep === 1 && newStep === 2) {
            setShowSigningOptions(true);
            return;
        }

        if (newStep === 3 && !signature && signingMethod === 'online') {
            alert('Please add a signature before proceeding.');
            return;
        }

        setCurrentStep(newStep);
    };

    const handleContainerClick = (e) => {
        if (
            e.target === e.currentTarget ||
            e.target.classList.contains('react-pdf__Page') ||
            e.target.classList.contains('react-pdf__Page__canvas') ||
            e.target.classList.contains('react-pdf__Page__textContent')
        ) {
            if (editingField) {
                // If in edit mode, exit to selected mode
                setEditingField(null);
                // Don't deselect here, keep the item selected
            } else {
                // If not in edit mode but something is selected, deselect it
                setSelectedItem(null);
            }
        }
    };

    // Handle signing method selection
    const handleSigningMethodSelect = (method) => {
        setSigningMethod(method);
        setShowSigningOptions(false);

        if (method === 'download') {
            downloadOriginalPDF();
            setShowSigningOptions(true);
        } else if (method === 'online') {
            setCurrentStep(2);
        } else if (method === 'upload') {
            setCurrentStep(3);
        }
    };

    // Function to download original PDF
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

    // Modified return statement with new UI structure
    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header with steps */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex justify-between items-center">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div className={`flex items-center ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'}`}>
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
                                    ${currentStep > step.id ? 'bg-blue-600 border-blue-600' :
                                        currentStep === step.id ? 'border-blue-600' : 'border-gray-300'}`}>
                                    {currentStep > step.id ? (
                                        <Check className="w-6 h-6 text-white" />
                                    ) : (
                                        <step.icon className={`w-6 h-6 ${currentStep === step.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                    )}
                                </div>
                                <span className="ml-3 font-medium">{step.title}</span>
                            </div>
                            {index < steps.length - 1 && (
                                <ChevronRight className="w-6 h-6 mx-4 text-gray-300" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main content area */}
            <div className="grid grid-cols-3 gap-6">
                {/* Left sidebar */}
                <div className="col-span-1 space-y-4">
                    {/* Document Info - Always show when PDF is loaded */}
                    {pdf && (
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <h3 className="font-medium mb-4">Document Info</h3>
                            <div className="space-y-2 text-sm">
                                <p><span className="text-gray-500">Name:</span> {documentInfo.name}</p>
                                <p><span className="text-gray-500">Pages:</span> {documentInfo.pages}</p>
                                <p><span className="text-gray-500">Size:</span> {documentInfo.size}</p>
                                <p><span className="text-gray-500">Shared by:</span> {documentInfo.sharedBy}</p>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Signature Options */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            {/* Signature Options */}
                            <div className="bg-white rounded-lg shadow-sm p-4">
                                <h3 className="font-medium mb-4">Signature Options</h3>
                                <div className="space-y-4">
                                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-2 text-gray-500" />
                                            <p className="text-sm text-gray-500">Upload Signature Image</p>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'signature')} />
                                    </label>

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
                                            style={{ touchAction: 'none' }}
                                        />
                                        <div className="flex justify-end mt-2">
                                            <button
                                                onClick={clearSignature}
                                                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Fields */}
                            <div className="bg-white rounded-lg shadow-sm p-4">
                                <h3 className="font-medium mb-4">Additional Fields</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => addField('text')}
                                        className="flex items-center w-full px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                    >
                                        <Type className="w-4 h-4 mr-2" />
                                        Add Text Field
                                    </button>
                                    <button
                                        onClick={() => addField('date')}
                                        className="flex items-center w-full px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                    >
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Add Date Field
                                    </button>
                                </div>
                            </div>


                            <div className="flex justify-end space-x-2 mb-4">
                                <button
                                    onClick={handleUndo}
                                    disabled={currentIndex <= 0}
                                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                                    title="Undo (Ctrl+Z)"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M3 10h10a5 5 0 0 1 5 5v3a5 5 0 0 1-5 5H8" strokeWidth="2" />
                                        <path d="M7 6L3 10l4 4" strokeWidth="2" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleRedo}
                                    disabled={currentIndex >= history.length - 1}
                                    className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                                    title="Redo (Ctrl+Y)"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M21 10H11a5 5 0 0 0-5 5v3a5 5 0 0 0 5 5h5" strokeWidth="2" />
                                        <path d="M17 6l4 4-4 4" strokeWidth="2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Actions */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-lg shadow-sm p-4">
                                <h3 className="font-medium mb-4">Actions</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={resetChanges}
                                        className="flex items-center w-full px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Reset Changes
                                    </button>
                                    <button
                                        onClick={downloadSignedPDF}
                                        disabled={!pdf || !signature}
                                        className="flex items-center w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download Signed PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main content */}
                <div className="col-span-2">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        {showSigningOptions ? (
                            <SigningOptions onSelect={handleSigningMethodSelect} />
                        ) : currentStep === 3 && signingMethod === 'upload' ? (
                            // Upload form for signed document
                            <div className="flex flex-col items-center justify-center min-h-[600px]">
                                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-16 h-16 mb-4 text-gray-400" />
                                        <h3 className="mb-2 text-lg font-medium">Upload Signed Document</h3>
                                        <p className="text-sm text-gray-500">
                                            Upload the already signed version of this document
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="application/pdf"
                                        onChange={(e) => handleFileChange(e, 'signedPdf')}
                                    />
                                </label>
                            </div>
                        ) : pdf ? (
                            // Show PDF preview with signature and fields
                            <div
                                ref={containerRef}
                                className="relative border rounded-lg overflow-hidden"
                                onMouseDown={handleContainerClick}
                            >
                                <Document
                                    file={pdf}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    className="w-full"
                                    onClick={() => setSelectedItem(null)} // Add click handler here too
                                >
                                    {Array.from(new Array(numPages), (_, index) => (
                                        <Page
                                            key={`page_${index + 1}`}
                                            pageNumber={index + 1}
                                            width={containerRef.current?.clientWidth || 600}
                                            onClick={() => setSelectedItem(null)} // Add click handler to Page component
                                        />
                                    ))}
                                </Document>

                                {/* Signature element */}
                                {signature && (currentStep === 2 || currentStep === 3) && (
                                    <div
                                        ref={signatureRef}
                                        className={`absolute ${selectedItem === 'signature' ? 'border-1 border-blue-500' : ''} ${isDragging ? 'cursor-move' : 'cursor-pointer'}`}
                                        style={{
                                            left: `${signaturePosition.x}px`,
                                            top: `${signaturePosition.y}px`,
                                            width: `${signatureSize.width}px`,
                                            height: `${signatureSize.height}px`,
                                            zIndex: selectedItem === 'signature' ? 50 : 10
                                        }}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!selectedItem) {
                                                setSelectedItem('signature');
                                            }
                                            handleMouseDown(e, 'drag');
                                        }}
                                    >
                                        <img
                                            src={signature}
                                            alt="Signature"
                                            className="w-full h-full object-contain pointer-events-none"
                                            draggable="false"
                                        />
                                        {selectedItem === 'signature' && (
                                            <>
                                                {/* Corner resize handles */}
                                                {['nw', 'ne', 'sw', 'se'].map((direction) => (
                                                    <div
                                                        key={direction}
                                                        className={`absolute w-3 h-3 border border-blue-500 bg-white cursor-${direction}-resize z-50
                    ${direction.includes('n') ? '-top-1' : '-bottom-1'}
                    ${direction.includes('w') ? '-left-1' : '-right-1'}`}
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            handleMouseDown(e, 'resize', direction);
                                                        }}
                                                        style={{
                                                            transform: 'none', // Remove previous transform
                                                            margin: 0 // Remove previous margin
                                                        }}
                                                    />
                                                ))}

                                                {/* Border outline when selected */}
                                                <div className="absolute inset-0 border border-blue-500 pointer-events-none" />
                                            </>
                                        )}
                                    </div>
                                )}
                                {/* Fields */}
                                {(currentStep === 2 || currentStep === 3) && fields.map((field) => (
                                    <div
                                        key={field.id}
                                        className={`absolute ${selectedItem === field.id && !editingField ? 'cursor-move' : 'cursor-pointer'
                                            } select-none z-10`}
                                        style={{
                                            left: `${field.position.x}px`,
                                            top: `${field.position.y}px`,
                                            width: `${field.size.width}px`,
                                            height: `${field.size.height}px`,
                                        }}
                                        onMouseDown={(e) => {
                                            if (!editingField) {
                                                handleFieldMouseDown(e, field);
                                            }
                                        }}
                                        onDoubleClick={() => handleFieldDoubleClick(field)}
                                    >
                                        <input
                                            type={field.type}
                                            value={field.content}
                                            onChange={(e) => updateFieldContent(field.id, e.target.value)}
                                            className={`w-full h-full px-2 bg-white/80 pointer-events-auto
                    ${editingField === field.id ? 'border border-blue-500' : ''}
                    ${selectedItem === field.id && !editingField ? 'border border-blue-500' : ''}
                    focus:outline-none
                `}
                                            placeholder={field.type === 'text' ? "Enter text..." : "Select date..."}
                                            readOnly={editingField !== field.id}
                                        />

                                        {/* Resize handles - only show when selected and not editing */}
                                        {selectedItem === field.id && !editingField && (
                                            <>
                                                {['nw', 'ne', 'sw', 'se'].map((direction) => (
                                                    <div
                                                        key={direction}
                                                        className={`absolute w-3 h-3 border border-blue-500 bg-white cursor-${direction}-resize z-50
                                ${direction.includes('n') ? '-top-1' : '-bottom-1'}
                                ${direction.includes('w') ? '-left-1' : '-right-1'}`}
                                                        onMouseDown={(e) => {
                                                            e.stopPropagation();
                                                            handleMouseDown(e, 'resize', direction);
                                                        }}
                                                        style={{
                                                            transform: 'none',
                                                            margin: 0
                                                        }}
                                                    />
                                                ))}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 min-h-[600px] flex flex-col items-center justify-center">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <h3 className="text-lg font-medium mb-2">Upload or Load a Document</h3>
                                <p className="text-gray-500 mb-4">Select a PDF file to get started</p>

                                {/* Add this label and input */}
                                <label className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload PDF
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(e) => handleFileChange(e, 'pdf')}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer actions */}
            <div className="flex justify-between items-center bg-white rounded-lg shadow-sm p-4">
                <button
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    onClick={() => handleStepChange(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                >
                    Back
                </button>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    onClick={() => handleStepChange(Math.min(3, currentStep + 1))}
                    disabled={currentStep === 3 || !pdf}
                >
                    {currentStep === 1 ? 'Continue' :
                        currentStep === 2 ? 'Place Signature' :
                            'Finish'}
                </button>
            </div>
        </div>
    );
};

export default PDFSignature2;