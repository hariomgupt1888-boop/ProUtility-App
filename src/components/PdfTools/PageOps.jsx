import React, { useState, useRef } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { Icons } from '../Icons'; 
import { readFile } from '../../utils/pdfUtils'; 
import { Filesystem, Directory } from '@capacitor/filesystem'; 

const PageOps = ({ mode, onNotify, isPremium }) => {
  const [file, setFile] = useState(null);
  const [pageData, setPageData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [outputName, setOutputName] = useState('Modified_Document'); 
  const [draggedItem, setDraggedItem] = useState(null);
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadedFile = e.target.files[0];
    
    setIsProcessing(true); setStatus('Loading Pages...');
    try {
      const buffer = await readFile(uploadedFile);
      const pdfDoc = await PDFDocument.load(buffer);
      const count = pdfDoc.getPageCount();
      let thumbnails = [];
      
      if (window.pdfjsLib) {
        const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
        const maxPages = count > 30 ? 30 : count; // Limit to 30 for performance
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.3 });
          const canvas = document.createElement('canvas');
          canvas.height = viewport.height; canvas.width = viewport.width;
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
          thumbnails.push(canvas.toDataURL('image/jpeg', 0.5));
        }
      }
      
      setPageData(Array.from({ length: count }, (_, i) => ({ 
        originalIndex: i, 
        displayIndex: i + 1, 
        rotation: 0, 
        thumbnail: thumbnails[i] || null 
      })));
      
      setFile(uploadedFile);
      setOutputName(uploadedFile.name.replace('.pdf', '') + '_Edited');
      if (onNotify) onNotify(null, true);
    } catch { 
      alert('Failed to load PDF. Check if it is password protected.'); 
    }
    setIsProcessing(false); setStatus('');
    e.target.value = null;
  };

  const rotatePageUi = (index) => {
    setPageData(pageData.map((p, i) => i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
  };

  const deletePageUi = (index) => {
    setPageData(pageData.filter((_, i) => i !== index));
  };

  const movePageUi = (index, direction) => {
    const newData = [...pageData];
    if (direction === 'l' && index > 0) {
      [newData[index - 1], newData[index]] = [newData[index], newData[index - 1]];
    } else if (direction === 'r' && index < newData.length - 1) {
      [newData[index + 1], newData[index]] = [newData[index], newData[index + 1]];
    }
    setPageData(newData);
  };

  const handleDragStart = (index) => { setDraggedItem(index); };
  const handleDrop = (index) => {
    if (draggedItem === null) return;
    const newData = [...pageData];
    const item = newData.splice(draggedItem, 1)[0];
    newData.splice(index, 0, item);
    setPageData(newData);
    setDraggedItem(null);
  };

  const runPageOps = async () => {
    if (pageData.length === 0) return alert('No pages left to save!');
    if (!outputName.trim()) return alert("Please enter a valid file name!");

    setIsProcessing(true); setStatus('Applying Changes...');
    try {
      const src = await PDFDocument.load(await readFile(file));
      const newPdf = await PDFDocument.create();
      
      for (const p of pageData) {
        const [page] = await newPdf.copyPages(src, [p.originalIndex]);
        if (p.rotation !== 0) page.setRotation(degrees(page.getRotation().angle + p.rotation));
        newPdf.addPage(page);
      }
      
      // 1. Convert to Base64
      const pdfBytes = await newPdf.save();
      let binary = '';
      const bytes = new Uint8Array(pdfBytes);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = window.btoa(binary);

      // 💾 Asli Save Function
      const performSave = async () => {
          setStatus("Saving to Phone...");
          try { await Filesystem.requestPermissions(); } catch (e) { }
          const finalName = `${outputName}_${Date.now()}.pdf`; // 🔴 Timestamp

          await Filesystem.writeFile({
            path: finalName,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true
          });

          if (onNotify) onNotify(`✅ Saved ${finalName} to Documents!`, false);
      };

      // 👑 PREMIUM & AD GATE LOGIC
      if (isPremium) {
          await performSave();
      } else {
          if (navigator.onLine) {
              setStatus("Loading Ad...");
              await new Promise(resolve => setTimeout(resolve, 2000)); // 2 sec Ad wait
              await performSave();
          } else {
              alert("⚠️ Internet Required!\n\nFree users need internet to export. Enable internet, or Upgrade to Premium.");
          }
      }

    } catch (error) { 
        console.error(error);
        alert('⚠️ Failed to save. Please allow Storage permission.'); 
    } finally {
        // 🧹 CLEANUP (Jhaadu)
        setIsProcessing(false); 
        setStatus('');
        setFile(null);
        setPageData([]);
    }
  };

  return (
    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border-color)', position: 'relative' }}>
      
      {isProcessing && (
        <div style={{position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '24px'}}>
            <div style={{width: '45px', height: '45px', border: '4px solid #8b5cf6', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            <span style={{color: 'white', marginTop: '20px', fontWeight: 'bold', fontSize: '18px'}}>{status || 'Processing...'}</span>
        </div>
      )}

      <h3 style={{ textTransform: 'capitalize', fontSize: '18px', marginBottom: '15px', color: 'var(--text-main)' }}>{mode} Pages</h3>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="application/pdf" onChange={handleUpload} />

      {!file ? (
        <label style={{ border: '2px dashed var(--border-color)', padding: '30px', borderRadius: '15px', cursor: 'pointer', display: 'block', color: 'var(--text-muted)', background: 'var(--bg-input)' }} onClick={() => fileInputRef.current.click()}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}><Icons.Upload /></div>
          <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>Tap to Upload PDF</span>
        </label>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', maxHeight: '320px', overflowY: 'auto', padding: '5px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            {pageData.map((p, i) => (
              <div 
                key={i} 
                draggable={mode === 'organize'} 
                onDragStart={() => handleDragStart(i)} 
                onDragOver={(e) => e.preventDefault()} 
                onDrop={() => handleDrop(i)} 
                style={{ background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', cursor: mode === 'organize' ? 'grab' : 'default' }}
              >
                <div onClick={() => mode === 'delete' && deletePageUi(i)} style={{ height: '110px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: mode === 'delete' ? 'pointer' : 'default' }}>
                  {p.thumbnail ? (
                    <img src={p.thumbnail} alt={`Page ${i}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: `rotate(${p.rotation}deg)`, transition: '0.2s' }} />
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pg {p.originalIndex + 1}</span>
                  )}
                  <span style={{ position: 'absolute', top: 4, left: 4, fontSize: '10px', fontWeight: 'bold', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 6px', borderRadius: '10px' }}>{i + 1}</span>
                </div>
                
                <div style={{ background: 'var(--bg-input)', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--border-color)' }}>
                  {mode === 'delete' && (
                    <button onClick={() => deletePageUi(i)} style={{ width: '100%', padding: '6px', background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                  )}
                  {mode === 'rotate' && (
                    <button onClick={() => rotatePageUi(i)} style={{ width: '100%', padding: '6px', background: 'transparent', border: 'none', color: '#2563eb', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>Rotate ↻</button>
                  )}
                  {mode === 'organize' && (
                    <div style={{ display: 'flex', width: '100%' }}>
                      <button onClick={() => movePageUi(i, 'l')} style={{ flex: 1, padding: '6px 0', border: 'none', background: 'transparent', borderRight: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}>◀</button>
                      <button onClick={() => movePageUi(i, 'r')} style={{ flex: 1, padding: '6px 0', border: 'none', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer' }}>▶</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
             <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px', display: 'block' }}>Save As (Rename):</label>
             <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                <input type="text" value={outputName} onChange={(e) => setOutputName(e.target.value)} style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} placeholder="Enter file name..." />
                <span style={{ padding: '0 15px', color: 'var(--text-muted)', fontWeight: 'bold', background: 'var(--border-color)', height: '100%', display: 'flex', alignItems: 'center' }}>.pdf</span>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
             <button onClick={() => {setFile(null); setPageData([]);}} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
             <button onClick={runPageOps} disabled={isProcessing} style={{ flex: 2, background: '#8b5cf6', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)', cursor: 'pointer' }}>Save Changes</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageOps;