import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import { PDFDocument, degrees, rgb } from 'pdf-lib'; 
import { Capacitor } from '@capacitor/core'; 
import { Filesystem, Directory } from '@capacitor/filesystem'; 

// --- ICONS ---
const Icons = {
  Back: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>),
  Merge: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M8 13h8m-8-4h8m-4 8v-8" /></svg>),
  Split: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M15 4l-6 16M6 9h12M6 15h12" /></svg>),
  ImgToPdf: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>),
  PdfToImg: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>),
  Compress: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M4 14h6v6" /><path d="M20 10h-6V4" /><line x1="14" y1="10" x2="21" y2="3" /></svg>),
  Text: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M12 18v-6l-3 3m6 0l-3-3" /></svg>),
  Rotate: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /></svg>),
  Organize: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>),
  View: () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>),
  Lock: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>),
  Unlock: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 9.9-1" /></svg>),
  Rename: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>),
  Upload: () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>),
  TrashSmall: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>),
  MoveUp: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></svg>),
  MoveDown: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14" /><path d="M19 12l-7 7-7-7" /></svg>),
  RotateCW: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>),
  Crown: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="2 15 2 2 8 8 12 2 16 8 22 2 22 15" /><path d="M2 15h20v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4z" /></svg>),
  Edit: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>),
  Watermark: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>),
  OCR: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="M3 9h18M9 21V9" /></svg>),
};

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(2) + ' MB';
};

const readFile = (file) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsArrayBuffer(file); });
const readImage = (file) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });

const PdfTools = ({ onBack, onNotify, onOpenSecurity }) => {
  const [activeTool, setActiveTool] = useState('menu');
  const [files, setFiles] = useState([]);
  const [pageData, setPageData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  
  const [renameText, setRenameText] = useState('');
  const [textInput, setTextInput] = useState('');
  const [extractedText, setExtractedText] = useState(''); 

  // 🔴 NAYA: INTERACTIVE PDF STATES (For Editor & Watermark)
  const [previewImg, setPreviewImg] = useState(null);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [watermarkPos, setWatermarkPos] = useState({ x: 50, y: 50 }); // Center default
  const [editorTexts, setEditorTexts] = useState([]); // Format: { id, text, x, y }
  const previewContainerRef = useRef(null);

  const [compressLevel, setCompressLevel] = useState(50);
  const [reduceQuality, setReduceQuality] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

  const [viewerDoc, setViewerDoc] = useState(null);
  const [viewPagesCount, setViewPagesCount] = useState(0);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; };
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (activeTool === 'view' && viewerDoc && viewPagesCount > 0) {
      const renderAllPages = async () => {
        for (let i = 1; i <= viewPagesCount; i++) {
          const canvas = document.getElementById(`pdf-page-${i}`);
          if (!canvas || canvas.getAttribute('data-rendered') === 'true') continue;
          try {
            const page = await viewerDoc.getPage(i);
            const viewport = page.getViewport({ scale: window.innerWidth < 600 ? 1.0 : 1.5 });
            canvas.height = viewport.height; canvas.width = viewport.width;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
            canvas.setAttribute('data-rendered', 'true');
          } catch (e) { console.log('Render error page', i); }
        }
      };
      setTimeout(renderAllPages, 100);
    }
  }, [viewerDoc, viewPagesCount, activeTool]);

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });

  const handleNativeSave = async (blob, fileName, fileType) => {
      try {
          if (Capacitor.isNativePlatform()) {
              setStatus("Saving to Phone...");
              const base64Data = await blobToBase64(blob);
              await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Documents });
          } else {
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a'); link.href = url; link.download = fileName;
              document.body.appendChild(link); link.click(); document.body.removeChild(link);
          }
          if (onNotify) onNotify(`${fileName} Saved! ✅`, false, fileName, fileType, blob);
      } catch (error) {
          console.error("Save Error: ", error);
          alert("⚠️ Storage Permission Required!\nPlease allow storage access.");
      }
  };

  const checkInternetAndDownload = async (blob, fileName, fileType = 'PDF Document') => {
    if (isPremium) {
      await handleNativeSave(blob, fileName, fileType);
      setIsProcessing(false); setStatus(''); return;
    }
    if (navigator.onLine) {
      setStatus('Loading Ad...');
      setTimeout(async () => {
        await handleNativeSave(blob, fileName, fileType);
        setIsProcessing(false); setStatus('');
      }, 1500); 
    } else {
      alert('⚠️ Internet Required!\nFree users need internet to save files.');
      setIsProcessing(false); setStatus('');
    }
  };

  const tools = [
    { id: 'merge', label: 'Merge PDF', icon: <Icons.Merge />, color: '#e11d48', bg: '#ffe4e6' },
    { id: 'split', label: 'Split PDF', icon: <Icons.Split />, color: '#f97316', bg: '#ffedd5' },
    { id: 'compress', label: 'Compress', icon: <Icons.Compress />, color: '#16a34a', bg: '#dcfce7' },
    { id: 'img-to-pdf', label: 'Img to PDF', icon: <Icons.ImgToPdf />, color: '#f59e0b', bg: '#fef3c7' },
    { id: 'pdf-ocr', label: 'Extract Text', icon: <Icons.OCR />, color: '#14b8a6', bg: '#ccfbf1' }, 
    { id: 'watermark', label: 'Watermark', icon: <Icons.Watermark />, color: '#0ea5e9', bg: '#e0f2fe' }, 
    { id: 'pdf-editor', label: 'Add Text', icon: <Icons.Edit />, color: '#8b5cf6', bg: '#ede9fe' }, 
    { id: 'text-to-pdf', label: 'Text to PDF', icon: <Icons.Text />, color: '#3b82f6', bg: '#ede9fe' },
    { id: 'rotate', label: 'Rotate Pages', icon: <Icons.Rotate />, color: '#8b5cf6', bg: '#e0e7ff' },
    { id: 'delete', label: 'Delete Pages', icon: <Icons.TrashSmall />, color: '#ef4444', bg: '#fee2e2' },
    { id: 'organize', label: 'Organize', icon: <Icons.Organize />, color: '#06b6d4', bg: '#cffafe' },
    { id: 'rename', label: 'Rename PDF', icon: <Icons.Rename />, color: '#64748b', bg: '#dbeafe' },
    { id: 'pdf-to-img', label: 'PDF to Img', icon: <Icons.PdfToImg />, color: '#f59e0b', bg: '#fef3c7' },
    { id: 'lock', label: 'Lock PDF', icon: <Icons.Lock />, color: '#1e293b', bg: '#f1f5f9' }, 
    { id: 'unlock', label: 'Unlock PDF', icon: <Icons.Unlock />, color: '#10b981', bg: '#e0e7ff' }, 
    { id: 'view', label: 'View PDF', icon: <Icons.View />, color: '#ec4899', bg: '#fce7f3' },
  ];

  const reset = () => {
    setFiles([]); setPageData([]); setRenameText(''); setTextInput('');
    setExtractedText(''); setStatus(''); setIsProcessing(false);
    setViewerDoc(null); setViewPagesCount(0); setPreviewImg(null); 
    setEditorTexts([]); setWatermarkPos({x: 50, y: 50});
  };

  const handleToolClick = (toolId) => {
    if (onNotify) onNotify(null, true); 
    if (toolId === 'lock' || toolId === 'unlock') { if (onOpenSecurity) onOpenSecurity(toolId); return; }
    setActiveTool(toolId); reset();
    if (toolId !== 'text-to-pdf') { if (fileInputRef.current) fileInputRef.current.click(); }
  };

  const handleUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files).map((f) => ({ id: Math.random().toString(), file: f, name: f.name, size: f.size }));
    if (onNotify) onNotify(null, true); 
    const currentTool = activeTool;

    if (currentTool === 'view') {
      setIsProcessing(true); setStatus('Loading Viewer...'); setFiles([newFiles[0]]);
      try {
        const buffer = await readFile(newFiles[0].file);
        const pdfDoc = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
        setViewerDoc(pdfDoc); setViewPagesCount(pdfDoc.numPages);
      } catch (err) { alert('Cannot read PDF. It might be locked.'); reset(); }
      setIsProcessing(false); setStatus(''); e.target.value = null; return;
    }

    // 🔴 NAYA: Generate Interactive Preview for Editor & Watermark
    if (['watermark', 'pdf-editor'].includes(currentTool)) {
      setIsProcessing(true); setStatus('Generating Preview...'); setFiles([newFiles[0]]);
      try {
          const buffer = await readFile(newFiles[0].file);
          const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.5 });
          setPdfDimensions({ width: viewport.width, height: viewport.height });

          const canvas = document.createElement('canvas');
          canvas.height = viewport.height; canvas.width = viewport.width;
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
          setPreviewImg(canvas.toDataURL('image/jpeg', 0.8));
      } catch (err) { alert('Preview Failed! Proceeding blind.'); }
      setIsProcessing(false); setStatus(''); e.target.value = null; return;
    }

    if (['delete', 'rotate', 'organize', 'split', 'pdf-to-img', 'pdf-ocr'].includes(currentTool)) {
      setIsProcessing(true); setStatus('Loading...');
      try {
        const buffer = await readFile(newFiles[0].file);
        try { await PDFDocument.load(buffer); } catch { alert('File Encrypted!'); reset(); return; }
        const pdfDoc = await PDFDocument.load(buffer);
        const count = pdfDoc.getPageCount();
        let thumbnails = [];
        try {
          if (window.pdfjsLib && currentTool !== 'pdf-ocr') {
            const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
            const maxPages = count > 30 ? 30 : count;
            for (let i = 1; i <= maxPages; i++) {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 0.3 });
              const canvas = document.createElement('canvas');
              canvas.height = viewport.height; canvas.width = viewport.width;
              await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
              thumbnails.push(canvas.toDataURL('image/jpeg', 0.5));
            }
          }
        } catch (err) { console.log('Preview skip'); }
        setPageData(Array.from({ length: count }, (_, i) => ({ originalIndex: i, displayIndex: i + 1, rotation: 0, thumbnail: thumbnails[i] || null })));
        setFiles([newFiles[0]]);
      } catch { alert('Failed to load PDF.'); reset(); }
      setIsProcessing(false); setStatus('');
    } else if (currentTool === 'rename') {
      setFiles([newFiles[0]]); setRenameText(newFiles[0].name.replace('.pdf', ''));
    } else {
      setFiles((prev) => [...prev, ...newFiles]);
    }
    e.target.value = null;
  };

  // --- FEATURES LOGIC ---
  const runMerge = async () => { /* Kept original */
    if (files.length < 2) return alert('Select 2+ files');
    setIsProcessing(true);
    try {
      const merged = await PDFDocument.create();
      for (const f of files) {
        const pdf = await PDFDocument.load(await readFile(f.file));
        const pages = await merged.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      await checkInternetAndDownload(new Blob([await merged.save()], { type: 'application/pdf' }), 'ProUtility_Merged.pdf', 'Merged PDF');
    } catch { alert('Failed to Merge'); setIsProcessing(false); }
  };

  const runSplit = async () => { /* Kept original */
    if (!isPremium && !navigator.onLine) return alert('⚠️ Internet Required!');
    setIsProcessing(true); setStatus('Splitting Pages...');
    try {
      const pdf = await PDFDocument.load(await readFile(files[0].file));
      for (let i = 0; i < pdf.getPageCount(); i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(page);
        await handleNativeSave(new Blob([await newPdf.save()], { type: 'application/pdf' }), `Page_${i + 1}.pdf`, 'Split PDF');
        await new Promise((r) => setTimeout(r, 400));
      }
      if (onNotify) onNotify('All pages separated! ✅', false);
    } catch { alert('Failed to Split'); }
    setIsProcessing(false); setStatus('');
  };

  const runCompress = async () => { /* Kept original */
    setIsProcessing(true);
    try {
      const pdf = await PDFDocument.load(await readFile(files[0].file));
      await checkInternetAndDownload(new Blob([await pdf.save({ useObjectStreams: false })], { type: 'application/pdf' }), 'Compressed_' + files[0].name, 'Compressed PDF');
    } catch { alert('Failed'); setIsProcessing(false); }
  };

  const runImgToPdf = async () => { /* Kept original */
    setIsProcessing(true);
    try {
      const doc = new jsPDF();
      for (let i = 0; i < files.length; i++) {
        const imgData = await readImage(files[i].file);
        const props = doc.getImageProperties(imgData);
        if (i > 0) doc.addPage();
        doc.addImage(imgData, 'JPEG', 0, 0, doc.internal.pageSize.getWidth(), (props.height * doc.internal.pageSize.getWidth()) / props.width, undefined, reduceQuality ? 'FAST' : 'SLOW');
      }
      await checkInternetAndDownload(doc.output('blob'), 'Images_Converted.pdf', 'Img to PDF');
    } catch { alert('Failed'); setIsProcessing(false); }
  };

  const runPdfToImg = async () => { /* Kept original */
    if (!isPremium && !navigator.onLine) return alert('Internet Required!');
    setIsProcessing(true); setStatus('Extracting Images...');
    try {
      const buffer = await readFile(files[0].file);
      const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.height = viewport.height; canvas.width = viewport.width;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        const imgBlob = await (await fetch(canvas.toDataURL('image/png'))).blob();
        await handleNativeSave(imgBlob, `Page_${i}.png`, 'Image Extraction');
        await new Promise((r) => setTimeout(r, 300));
      }
      if (onNotify) onNotify('Images Extracted! 🖼️', false);
    } catch { alert('Failed.'); }
    setIsProcessing(false); setStatus('');
  };

  const runTextToPdf = async () => { /* Kept original */
    if (!textInput) return alert('Write something!');
    const doc = new jsPDF(); doc.text(doc.splitTextToSize(textInput, 180), 10, 10);
    await checkInternetAndDownload(doc.output('blob'), 'Text_Document.pdf', 'Text to PDF');
  };

  const runRename = async () => { /* Kept original */
    if (!renameText) return;
    await checkInternetAndDownload(files[0].file.slice(0, files[0].file.size, files[0].file.type), `${renameText}.pdf`, 'Renamed PDF');
  };

  const runPageOps = async () => { /* Kept original */
    setIsProcessing(true);
    try {
      const src = await PDFDocument.load(await readFile(files[0].file));
      const newPdf = await PDFDocument.create();
      for (const p of pageData) {
        const [page] = await newPdf.copyPages(src, [p.originalIndex]);
        if (p.rotation !== 0) page.setRotation(degrees(page.getRotation().angle + p.rotation));
        newPdf.addPage(page);
      }
      await checkInternetAndDownload(new Blob([await newPdf.save()], { type: 'application/pdf' }), 'Modified_' + files[0].name, 'Organized PDF');
    } catch { alert('Failed'); setIsProcessing(false); }
  };

  // 🔴 NAYA: Interactive Watermark Engine (Coordinate Mapping)
  const runWatermark = async () => {
    if (!textInput) return alert('Enter watermark text!');
    setIsProcessing(true); setStatus("Applying Watermark...");
    try {
      const pdfDoc = await PDFDocument.load(await readFile(files[0].file));
      const pages = pdfDoc.getPages();
      pages.forEach((page) => {
        const { width, height } = page.getSize();
        // Convert screen % coordinates to PDF point coordinates (PDF origin is bottom-left)
        const pdfX = (watermarkPos.x / 100) * width;
        const pdfY = height - ((watermarkPos.y / 100) * height);
        page.drawText(textInput, { x: pdfX, y: pdfY, size: 45, color: rgb(0.7, 0.7, 0.7), opacity: 0.5, rotate: degrees(45) });
      });
      await checkInternetAndDownload(new Blob([await pdfDoc.save()], { type: 'application/pdf' }), 'Watermarked_' + files[0].name, 'Watermarked PDF');
    } catch (e) { alert('Failed'); setIsProcessing(false); setStatus(''); }
  };

  // 🔴 NAYA: Interactive Editor Engine (Multiple Texts anywhere)
  const runPdfEditor = async () => {
    if (editorTexts.length === 0) return alert('Tap anywhere on the document to add text!');
    setIsProcessing(true); setStatus("Saving Document...");
    try {
      const pdfDoc = await PDFDocument.load(await readFile(files[0].file));
      const pages = pdfDoc.getPages();
      
      // Applying text to the first page (as per standard overlay tools)
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      editorTexts.forEach(item => {
          if(!item.text) return;
          const pdfX = (item.x / 100) * width;
          const pdfY = height - ((item.y / 100) * height) - 10; // Adjust for baseline
          firstPage.drawText(item.text, { x: pdfX, y: pdfY, size: 14, color: rgb(0.1, 0.1, 0.1) });
      });

      await checkInternetAndDownload(new Blob([await pdfDoc.save()], { type: 'application/pdf' }), 'Edited_' + files[0].name, 'Edited PDF');
    } catch (e) { alert('Failed to edit'); setIsProcessing(false); setStatus(''); }
  };

  const runPdfOcr = async () => {
    setIsProcessing(true); setStatus("Scanning...");
    try {
      const buffer = await readFile(files[0].file);
      const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += `--- Page ${i} ---\n${textContent.items.map(item => item.str).join(" ")}\n\n`;
      }
      if(!fullText.trim()) throw new Error("No text");
      setExtractedText(fullText);
      if (onNotify) onNotify("Text Extracted! 📝", false);
    } catch (e) { alert("No readable text found."); }
    setIsProcessing(false); setStatus("");
  };

  // --- INTERACTIVE UI HELPERS ---
  const handleTouchMoveWatermark = (e) => {
      if(!previewContainerRef.current) return;
      const rect = previewContainerRef.current.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      let x = ((touch.clientX - rect.left) / rect.width) * 100;
      let y = ((touch.clientY - rect.top) / rect.height) * 100;
      // Clamp values between 0 and 100
      x = Math.max(0, Math.min(100, x)); y = Math.max(0, Math.min(100, y));
      setWatermarkPos({ x, y });
  };

  const handleEditorTap = (e) => {
      if(!previewContainerRef.current) return;
      const rect = previewContainerRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      
      setEditorTexts([...editorTexts, { id: Date.now(), text: '', x, y }]);
  };

  const updateEditorText = (id, newText) => {
      setEditorTexts(editorTexts.map(t => t.id === id ? { ...t, text: newText } : t));
  };


  return (
    <div style={{ padding: '20px', height: '100%', overflowY: 'auto', paddingBottom: '100px', background: 'var(--bg-main)', color: 'var(--text-main)', transition: 'background-color 0.3s', position: 'relative' }}>
      
      {isProcessing && (
        <div style={{position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10000}}>
            <div style={{width: '45px', height: '45px', border: '4px solid #3b82f6', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            <span style={{color: 'white', marginTop: '20px', fontWeight: 'bold', fontSize: '18px'}}>{status || 'Processing...'}</span>
        </div>
      )}

      <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple={['merge', 'img-to-pdf'].includes(activeTool)} accept={activeTool === 'img-to-pdf' ? 'image/*' : 'application/pdf'} onChange={handleUpload} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => activeTool === 'menu' ? onBack() : setActiveTool('menu') } style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer', touchAction: 'manipulation' }}><Icons.Back /></button>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>PDF Master</h2>
        </div>
        <button onClick={() => setIsPremium(!isPremium)} style={{ padding: '6px 15px', borderRadius: '20px', border: 'none', background: isPremium ? '#f59e0b' : 'var(--bg-input)', color: isPremium ? '#000' : 'var(--text-main)', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', touchAction: 'manipulation' }}><Icons.Crown /> {isPremium ? 'Premium' : 'Free'}</button>
      </div>

      {activeTool === 'menu' ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            {tools.slice(0, 15).map((t) => (
              <button key={t.id} onClick={() => handleToolClick(t.id)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', aspectRatio: '1/1', padding: '10px', touchAction: 'manipulation' }}>
                <div style={{ background: t.color, color: 'white', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '5px', boxShadow: `0 4px 10px ${t.color}40` }}>{t.icon}</div>
                <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-main)' }}>{t.label}</span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: '15px' }}>
            <button onClick={() => handleToolClick('view')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', display: 'flex', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', width: '100%', padding: '15px', gap: '15px', touchAction: 'manipulation' }}>
              <div style={{ background: tools[15].bg, color: tools[15].color, width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{tools[15].icon}</div>
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)', fontWeight: '700' }}>{tools[15].label}</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>Read PDFs Smoothly</p>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
          <h3 style={{ textTransform: 'capitalize', fontSize: '18px', marginBottom: '15px', color: 'var(--text-main)' }}>{activeTool.replace(/-/g, ' ')}</h3>

          {activeTool === 'text-to-pdf' ? (
            <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type here..." style={{ width: '100%', height: '150px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
          ) : (
            <div style={{ minHeight: '200px' }}>
              {files.length === 0 ? (
                <label style={{ border: '2px dashed var(--border-color)', padding: '30px', borderRadius: '15px', cursor: 'pointer', display: 'block', color: 'var(--text-muted)', background: 'var(--bg-input)', touchAction: 'manipulation' }} onClick={() => fileInputRef.current.click()}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}><Icons.Upload /></div>
                  <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>Tap to Upload</span>
                </label>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {activeTool === 'view' && (
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', marginBottom: '10px' }}>
                      <div style={{ background: '#1e293b', padding: '10px', color: 'white', fontWeight: 'bold', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}><span>{files[0]?.name || 'Document'}</span><span>{viewPagesCount} Pages</span></div>
                      <div style={{ height: '450px', background: 'var(--bg-input)', overflowY: 'auto', padding: '15px 10px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                        {Array.from({ length: viewPagesCount }).map((_, index) => ( <canvas key={index} id={`pdf-page-${index + 1}`} style={{ maxWidth: '100%', background: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.15)' }}></canvas> ))}
                      </div>
                    </div>
                  )}

                  {activeTool === 'pdf-ocr' && (
                     extractedText ? ( <textarea value={extractedText} readOnly style={{ width: '100%', height: '250px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '13px', lineHeight: '1.5' }} />
                     ) : ( <div style={{background: 'var(--bg-input)', padding: '15px', borderRadius: '12px', textAlign: 'center'}}> <p style={{color: 'var(--text-main)', fontSize: '14px', fontWeight: 'bold'}}>File Selected: {files[0].name}</p> <p style={{color: 'var(--text-muted)', fontSize: '12px'}}>Click below to extract readable text.</p> </div> )
                  )}

                  {/* 🔴 NAYA: INTERACTIVE WATERMARK PREVIEW */}
                  {activeTool === 'watermark' && previewImg && (
                      <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                         <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Type Watermark Text here..." style={{ width: '100%', padding: '12px', border: '2px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', borderRadius: '10px', fontSize: '14px' }} />
                         <p style={{fontSize: '11px', color: '#3b82f6', fontWeight:'bold', margin:0}}>Drag the text below to position it</p>
                         
                         <div ref={previewContainerRef} style={{position: 'relative', width: '100%', aspectRatio: `${pdfDimensions.width}/${pdfDimensions.height}`, backgroundImage: `url(${previewImg})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', touchAction: 'none' }}>
                             
                             <div 
                                onTouchMove={handleTouchMoveWatermark} 
                                onMouseMove={(e) => e.buttons === 1 && handleTouchMoveWatermark(e)}
                                style={{ position: 'absolute', left: `${watermarkPos.x}%`, top: `${watermarkPos.y}%`, transform: 'translate(-50%, -50%) rotate(-45deg)', color: 'rgba(0,0,0,0.4)', fontSize: '30px', fontWeight: 'bold', cursor: 'move', whiteSpace: 'nowrap', userSelect: 'none', padding: '20px' }}>
                                {textInput || "YOUR WATERMARK"}
                             </div>
                         </div>
                      </div>
                  )}

                  {/* 🔴 NAYA: INTERACTIVE EDITOR PREVIEW */}
                  {activeTool === 'pdf-editor' && previewImg && (
                      <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                         <p style={{fontSize: '11px', color: '#3b82f6', fontWeight:'bold', margin:0}}>Tap anywhere on the document to add text</p>
                         
                         <div 
                            ref={previewContainerRef} 
                            onClick={handleEditorTap}
                            style={{position: 'relative', width: '100%', aspectRatio: `${pdfDimensions.width}/${pdfDimensions.height}`, backgroundImage: `url(${previewImg})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', cursor: 'text' }}>
                             
                             {editorTexts.map((item) => (
                                 <input 
                                     key={item.id}
                                     autoFocus
                                     onClick={(e) => e.stopPropagation()}
                                     value={item.text}
                                     onChange={(e) => updateEditorText(item.id, e.target.value)}
                                     placeholder="Type..."
                                     style={{ position: 'absolute', left: `${item.x}%`, top: `${item.y}%`, transform: 'translateY(-50%)', background: 'transparent', border: '1px dashed #3b82f6', color: 'black', fontSize: '14px', padding: '2px', outline: 'none', minWidth: '100px' }}
                                 />
                             ))}
                         </div>
                      </div>
                  )}

                  {activeTool === 'compress' && ( <div style={{ background: 'var(--bg-input)', padding: '15px', borderRadius: '12px', textAlign: 'left' }}> <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Select Compression Level</p> <input type="range" min="10" max="90" value={compressLevel} onChange={(e) => setCompressLevel(e.target.value)} style={{ width: '100%', cursor: 'pointer', touchAction: 'manipulation' }} /> <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}> <span>Better Quality</span><span>Smaller Size</span> </div> <p style={{ fontSize: '13px', color: '#2563eb', fontWeight: 'bold', marginTop: '10px' }}>Estimated Size: ~{formatSize(files[0].size * (1 - compressLevel / 100))}</p> </div> )}
                  {activeTool === 'img-to-pdf' && ( <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-input)', padding: '15px', borderRadius: '12px', cursor: 'pointer', touchAction: 'manipulation' }}> <input type="checkbox" checked={reduceQuality} onChange={(e) => setReduceQuality(e.target.checked)} style={{ width: '18px', height: '18px' }} /> <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>Reduce Image Quality (Smaller PDF)</span> </label> )}

                  {!['delete', 'rotate', 'organize', 'view', 'pdf-ocr', 'watermark', 'pdf-editor'].includes(activeTool) && files.map((f, i) => ( <div key={f.id} style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}> <span style={{ fontSize: '12px', fontWeight: '600', maxWidth: '70%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>{f.name}</span> {activeTool === 'merge' && ( <div style={{ display: 'flex', gap: '5px' }}> <button onClick={() => moveFile(i, 'up')} style={{ border: 'none', background: 'var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', cursor: 'pointer', touchAction: 'manipulation' }}><Icons.MoveUp /></button> <button onClick={() => moveFile(i, 'down')} style={{ border: 'none', background: 'var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', cursor: 'pointer', touchAction: 'manipulation' }}><Icons.MoveDown /></button> </div> )} </div> ))}

                  {['delete', 'rotate', 'organize'].includes(activeTool) && ( <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', maxHeight: '350px', overflowY: 'auto', padding: '5px' }}> {pageData.map((p, i) => ( <div key={i} draggable={activeTool === 'organize'} onDragStart={() => handleDragStart(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(i)} style={{ background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: activeTool === 'organize' ? 'grab' : 'default', touchAction: activeTool === 'organize' ? 'none' : 'manipulation' }}> <div onClick={() => activeTool === 'delete' && deletePageUi(i)} style={{ height: '120px', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: activeTool === 'delete' ? 'pointer' : '' }}> {p.thumbnail ? ( <img src={p.thumbnail} alt={`Page ${i}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: `rotate(${p.rotation}deg)`, transition: '0.3s' }} /> ) : ( <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pg {p.originalIndex + 1}</span> )} <span style={{ position: 'absolute', top: 4, left: 4, fontSize: '10px', fontWeight: 'bold', background: 'rgba(255,255,255,0.9)', color: 'black', padding: '2px 6px', borderRadius: '10px' }}>{i + 1}</span> {activeTool === 'delete' && ( <div style={{ position: 'absolute', inset: 0, background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, ':hover': { opacity: 1 } }}> <div style={{ background: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px' }}>Delete</div> </div> )} </div> <div style={{ background: 'var(--bg-card)', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--border-color)' }}> {activeTool === 'delete' && ( <button onClick={() => deletePageUi(i)} style={{ width: '100%', padding: '8px', background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', touchAction: 'manipulation' }}>Delete</button> )} {activeTool === 'rotate' && ( <button onClick={(e) => { e.stopPropagation(); rotatePageUi(i); }} style={{ width: '100%', padding: '8px', background: 'transparent', border: 'none', color: '#2563eb', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', touchAction: 'manipulation' }}>Rotate ↻</button> )} {activeTool === 'organize' && ( <div style={{ display: 'flex', width: '100%' }}> <button onClick={(e) => { e.stopPropagation(); movePageUi(i, 'l'); }} style={{ flex: 1, padding: '8px 0', border: 'none', background: 'transparent', borderRight: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer', touchAction: 'manipulation' }}>◀</button> <button onClick={(e) => { e.stopPropagation(); movePageUi(i, 'r'); }} style={{ flex: 1, padding: '8px 0', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', touchAction: 'manipulation' }}>▶</button> </div> )} </div> </div> ))} </div> )}

                  {activeTool === 'rename' && ( <input type="text" value={renameText} onChange={(e) => setRenameText(e.target.value)} placeholder="New Name" style={{ width: '100%', padding: '15px', marginTop: '10px', border: '2px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', borderRadius: '10px', fontSize: '16px' }} /> )}
                  {!(activeTool === 'pdf-ocr' && extractedText) && ( <button onClick={() => { setFiles([]); if (fileInputRef.current) fileInputRef.current.click(); }} style={{ color: '#ef4444', background: 'none', border: 'none', marginTop: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', touchAction: 'manipulation' }}>Select Another File</button> )}
                </div>
              )}
            </div>
          )}

          {(files.length > 0 || (activeTool === 'text-to-pdf' && textInput.length > 0)) && !['view'].includes(activeTool) && (
              <button
                onClick={async () => {
                  if (isProcessing) return;
                  if (activeTool === 'text-to-pdf') runTextToPdf();
                  else if (activeTool === 'merge') runMerge();
                  else if (activeTool === 'split') runSplit();
                  else if (activeTool === 'img-to-pdf') runImgToPdf();
                  else if (activeTool === 'pdf-to-img') runPdfToImg();
                  else if (activeTool === 'compress') runCompress();
                  else if (activeTool === 'rename') runRename();
                  else if (activeTool === 'watermark') runWatermark(); 
                  else if (activeTool === 'pdf-editor') runPdfEditor(); 
                  else if (activeTool === 'pdf-ocr') { if (!extractedText) runPdfOcr(); else { const txtBlob = new Blob([extractedText], { type: 'text/plain' }); await checkInternetAndDownload(txtBlob, `Extracted_${files[0].name}.txt`, 'Extracted Text'); } }
                  else if (['delete', 'rotate', 'organize'].includes(activeTool)) runPageOps();
                }}
                disabled={isProcessing}
                style={{ background: '#2563eb', color: 'white', padding: '16px', borderRadius: '16px', border: 'none', marginTop: '20px', width: '100%', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', cursor: isProcessing ? 'not-allowed' : 'pointer', touchAction: 'manipulation' }}
              >
                {isProcessing ? status || 'Processing...' : (activeTool === 'pdf-ocr' && !extractedText ? 'Extract Text' : (activeTool === 'pdf-ocr' && extractedText ? 'Download TXT File' : 'Download & Save'))}
              </button>
            )}
        </div>
      )}
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PdfTools;