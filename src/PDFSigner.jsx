import React, { useRef, useState } from 'react';
import { Upload, Download } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFSignature = () => {
  const [pdf, setPdf] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signature, setSignature] = useState(null);
  const [signaturePosition, setSignaturePosition] = useState({ x: 50, y: 50 });
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => setPdf(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
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

  const handleSignatureDrag = (e) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSignaturePosition({ x, y });
  };

  const downloadSignedPDF = async () => {
    try {
      const pdfDoc = await PDFDocument.load(pdf);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      const signatureImage = await pdfDoc.embedPng(signature);
      
      // Convert coordinates to PDF space
      const pdfX = (signaturePosition.x / containerRef.current.clientWidth) * width;
      const pdfY = height - ((signaturePosition.y / containerRef.current.clientHeight) * height) - 100;

      firstPage.drawImage(signatureImage, {
        x: pdfX,
        y: pdfY,
        width: 200,
        height: 100,
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
        {/* PDF Upload */}
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <p className="text-sm text-gray-500">Upload PDF document</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept="application/pdf"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Signature Canvas */}
        <div className="border rounded-lg p-4">
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
            <button 
              onClick={clearSignature}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
        </div>

        {/* PDF Preview with Draggable Signature */}
        {pdf && (
          <div ref={containerRef} className="relative border rounded-lg" onClick={handleSignatureDrag}>
            <Document
              file={pdf}
              onLoadSuccess={onDocumentLoadSuccess}
              className="w-full"
            >
              <Page 
                pageNumber={pageNumber} 
                width={containerRef.current?.clientWidth || 600}
              />
            </Document>
            {signature && (
              <img
                src={signature}
                alt="Signature"
                className="absolute cursor-move"
                style={{
                  left: `${signaturePosition.x}px`,
                  top: `${signaturePosition.y}px`,
                  width: '200px',
                  height: '100px',
                  pointerEvents: 'none'
                }}
              />
            )}
          </div>
        )}

        {/* Download Button */}
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