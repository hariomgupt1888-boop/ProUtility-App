import React, { useState, useRef } from 'react';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { Icons } from '../Icons'; 
import { readFile, checkInternetAndDownload } from '../../utils/pdfUtils';

const WatermarkPdf = ({ onNotify, isPremium }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  
  // 🔴 NAYA: Multi-page Preview States
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [previewImg, setPreviewImg] = useState(null);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [outputName, setOutputName] = useState('Watermarked_PDF'); 
  
  const [watermarks, setWatermarks] = useState([]); 
  const [activeId, setActiveId] = useState(null); 

  const previewContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const loadPreviewPage = async (pdf, pageNum) => {
      setIsProcessing(true); setStatus(`Loading Page ${pageNum}...`);
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        setPdfDimensions({ width: viewport.width, height: viewport.height });

        const canvas = document.createElement('canvas');
        canvas.height = viewport.height; canvas.width = viewport.width;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        setPreviewImg(canvas.toDataURL('image/jpeg', 0.8));
      } catch(e) { 
        console.error("Preview render failed", e); 
      }
      setIsProcessing(false); setStatus('');
  };

  const handleUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadedFile = e.target.files[0];
    
    setIsProcessing(true); setStatus('Reading Document...');
    try {
      const buffer = await readFile(uploadedFile);
      const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      
      await loadPreviewPage(pdf, 1);
      
      setFile(uploadedFile);
      setOutputName(uploadedFile.name.replace('.pdf', '') + '_WM'); 
      
      const newId = Date.now();
      setWatermarks([{ id: newId, text: 'YOUR WATERMARK', x: 50, y: 50, size: 45, opacity: 50 }]);
      setActiveId(newId);

      if (onNotify) onNotify(null, true);
    } catch (err) { 
      alert('Preview Failed! Ensure file is not encrypted.'); 
      setIsProcessing(false); setStatus('');
    }
    e.target.value = null;
  };

  const changePage = (offset) => {
      const newPage = currentPage + offset;
      if (newPage >= 1 && newPage <= totalPages) {
         setCurrentPage(newPage);
         loadPreviewPage(pdfDoc, newPage);
      }
  };

  const addNewWatermark = () => {
      const newId = Date.now();
      setWatermarks([...watermarks, { id: newId, text: 'NEW WATERMARK', x: 50, y: 50, size: 45, opacity: 50 }]);
      setActiveId(newId);
  };

  const updateActiveWatermarkProps = (updates) => {
      setWatermarks(prev => prev.map(wm => wm.id === activeId ? { ...wm, ...updates } : wm));
  };

  const deleteActiveWatermark = () => {
      const remaining = watermarks.filter(wm => wm.id !== activeId);
      setWatermarks(remaining);
      setActiveId(remaining.length > 0 ? remaining[0].id : null);
  };

  const handleTouchMoveWatermark = (e) => {
    if(!previewContainerRef.current || activeId === null) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    let x = ((touch.clientX - rect.left) / rect.width) * 100;
    let y = ((touch.clientY - rect.top) / rect.height) * 100;
    x = Math.max(0, Math.min(100, x)); y = Math.max(0, Math.min(100, y));
    
    updateActiveWatermarkProps({ x, y });
  };

  const runWatermark = async () => {
    const validWatermarks = watermarks.filter(wm => wm.text.trim() !== '');
    if (validWatermarks.length === 0) return alert('Please add at least one watermark!');
    if (!outputName.trim()) return alert("Please enter a valid file name!");

    setIsProcessing(true); setStatus("Applying Watermark to All Pages...");
    try {
      const pdfDocExport = await PDFDocument.load(await readFile(file));
      const pages = pdfDocExport.getPages();
      
      pages.forEach((page) => {
        const { width, height } = page.getSize();
        validWatermarks.forEach((wm) => {
           const pdfX = (wm.x / 100) * width;
           const pdfY = height - ((wm.y / 100) * height);
           page.drawText(wm.text, { 
               x: pdfX, 
               y: pdfY, 
               size: Number(wm.size), 
               color: rgb(0.5, 0.5, 0.5), 
               opacity: Number(wm.opacity) / 100, 
               rotate: degrees(45) 
           });
        });
      });
      
      const blob = new Blob([await pdfDocExport.save()], { type: 'application/pdf' });
      await checkInternetAndDownload(blob, `${outputName}.pdf`, 'Watermarked PDF', isPremium, setStatus, setIsProcessing, onNotify);
    } catch (e) { 
      alert('Failed to apply watermark.'); 
      setIsProcessing(false); setStatus(''); 
    }
  };

  const activeWm = watermarks.find(wm => wm.id === activeId);

  return (
    <div style={{ background: 'var(--bg-card)', padding: '20px', paddingBottom: '90px', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border-color)', position: 'relative' }}>
      
      {isProcessing && (
        <div style={{position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '24px'}}>
            <div style={{width: '45px', height: '45px', border: '4px solid #0ea5e9', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            <span style={{color: 'white', marginTop: '20px', fontWeight: 'bold', fontSize: '18px'}}>{status || 'Processing...'}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
         <h3 style={{ textTransform: 'capitalize', fontSize: '18px', margin: 0, color: 'var(--text-main)' }}>Add Watermark</h3>
         {file && (
             <button onClick={addNewWatermark} style={{ background: '#0ea5e9', color: 'white', padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>+ Add More</button>
         )}
      </div>

      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="application/pdf" onChange={handleUpload} />

      {!file ? (
        <label style={{ border: '2px dashed var(--border-color)', padding: '30px', borderRadius: '15px', cursor: 'pointer', display: 'block', color: 'var(--text-muted)', background: 'var(--bg-input)' }} onClick={() => fileInputRef.current.click()}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}><Icons.Upload /></div>
          <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>Tap to Upload PDF</span>
        </label>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
          
          {activeWm ? (
             <div style={{ background: 'var(--bg-input)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                   <input type="text" value={activeWm.text} onChange={(e) => updateActiveWatermarkProps({ text: e.target.value })} placeholder="Type Watermark..." style={{ flex: 1, padding: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
                   <button onClick={deleteActiveWatermark} style={{ background: '#ef4444', color: 'white', padding: '0 15px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>X</button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                   <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px' }}>
                         <span>Size</span><span>{activeWm.size}px</span>
                      </div>
                      <input type="range" min="15" max="150" value={activeWm.size} onChange={(e) => updateActiveWatermarkProps({ size: e.target.value })} style={{ width: '100%', cursor: 'pointer' }} />
                   </div>
                   <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px' }}>
                         <span>Opacity</span><span>{activeWm.opacity}%</span>
                      </div>
                      <input type="range" min="5" max="100" value={activeWm.opacity} onChange={(e) => updateActiveWatermarkProps({ opacity: e.target.value })} style={{ width: '100%', cursor: 'pointer' }} />
                   </div>
                </div>
             </div>
          ) : (
             <div style={{ padding: '15px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'var(--bg-input)', borderRadius: '12px' }}>
                Tap on "Add More" to create a new watermark.
             </div>
          )}

          <p style={{fontSize: '11px', color: '#0ea5e9', fontWeight:'bold', margin:0, textAlign: 'center'}}>Tap & Drag the text below to position it</p>
          
          <div 
             ref={previewContainerRef} 
             onTouchMove={handleTouchMoveWatermark} 
             onMouseMove={(e) => e.buttons === 1 && handleTouchMoveWatermark(e)}
             style={{position: 'relative', width: '100%', aspectRatio: `${pdfDimensions.width}/${pdfDimensions.height}`, backgroundImage: `url(${previewImg})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', touchAction: 'none' }}>
             
             {watermarks.map((wm) => (
                 <div 
                    key={wm.id}
                    onMouseDown={() => setActiveId(wm.id)}
                    onTouchStart={() => setActiveId(wm.id)}
                    style={{ 
                       position: 'absolute', left: `${wm.x}%`, top: `${wm.y}%`, transform: 'translate(-50%, -50%) rotate(-45deg)', 
                       color: `rgba(0, 0, 0, ${wm.opacity / 100})`, 
                       fontSize: `${wm.size * 0.6}px`, 
                       fontWeight: 'bold', cursor: 'move', whiteSpace: 'nowrap', userSelect: 'none', padding: '10px',
                       border: activeId === wm.id ? '2px dashed #0ea5e9' : '2px dashed transparent', 
                       borderRadius: '8px'
                    }}>
                    {wm.text || "..."}
                 </div>
             ))}
          </div>

          {/* 🔴 NAYA: Page Navigator Control */}
          {totalPages > 1 && (
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginTop: '5px' }}>
                <button onClick={() => changePage(-1)} disabled={currentPage === 1} style={{ background: currentPage === 1 ? 'var(--bg-input)' : '#0ea5e9', color: 'white', border: 'none', width: '35px', height: '35px', borderRadius: '50%', fontWeight: 'bold', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>◀</button>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>Page {currentPage} of {totalPages}</span>
                <button onClick={() => changePage(1)} disabled={currentPage === totalPages} style={{ background: currentPage === totalPages ? 'var(--bg-input)' : '#0ea5e9', color: 'white', border: 'none', width: '35px', height: '35px', borderRadius: '50%', fontWeight: 'bold', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>▶</button>
             </div>
          )}

          <div>
             <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px', display: 'block' }}>Save As (Rename):</label>
             <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                <input type="text" value={outputName} onChange={(e) => setOutputName(e.target.value)} style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} placeholder="Enter file name..." />
                <span style={{ padding: '0 15px', color: 'var(--text-muted)', fontWeight: 'bold', background: 'var(--border-color)', height: '100%', display: 'flex', alignItems: 'center' }}>.pdf</span>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
             <button onClick={() => {setFile(null); setPreviewImg(null); setWatermarks([]);}} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
             <button onClick={runWatermark} disabled={isProcessing} style={{ flex: 2, background: '#0ea5e9', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)', cursor: 'pointer' }}>Apply & Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatermarkPdf;