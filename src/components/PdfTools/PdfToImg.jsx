import React, { useState, useRef } from 'react';
import { Icons } from '../Icons'; 
import { readFile } from '../../utils/pdfUtils'; 
import { Filesystem, Directory } from '@capacitor/filesystem'; 

const PdfToImg = ({ onNotify, isPremium }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [outputPrefix, setOutputPrefix] = useState('Extracted_Img'); 
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    setOutputPrefix(uploadedFile.name.replace('.pdf', '')); 
    if (onNotify) onNotify(null, true);
    e.target.value = null;
  };

  const runPdfToImg = async () => {
    if (!file) return;
    if (!outputPrefix.trim()) return alert("Please enter a valid base name!");
    
    // Ad Gate Internet Check
    if (!isPremium && !navigator.onLine) {
        return alert('⚠️ Internet Required!\nFree users need internet to process. Enable internet, or Upgrade to Premium.');
    }

    setIsProcessing(true); 
    
    try {
      // 👑 AD GATE LOGIC (Pehle Ad dikhao, fir process shuru karo)
      if (!isPremium) {
          setStatus("Loading Ad...");
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 sec Ad wait
      }

      setStatus('Extracting Images...');
      const buffer = await readFile(file);
      const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      
      // Request Permission just once before the loop
      try { await Filesystem.requestPermissions(); } catch (e) { }

      const totalPages = pdf.numPages;

      for (let i = 1; i <= totalPages; i++) {
        setStatus(`Saving Image ${i} of ${totalPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.height = viewport.height; canvas.width = viewport.width;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        
        // 1. Direct Base64 for Image
        const base64Data = canvas.toDataURL('image/png').split(',')[1];
        
        // 2. 🔴 NAYA FIX: Timestamp joda gaya taaki naam overwrite na ho (Loop ke hisaab se)
        const finalName = `${outputPrefix}_Pg${i}_${Date.now()}.png`;

        // 3. SEEDHA PHONE KE DOCUMENTS FOLDER MEIN SAVE
        await Filesystem.writeFile({
          path: finalName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });

        // Halka sa pause taaki phone hang na ho (Performance ke liye zaroori)
        await new Promise((r) => setTimeout(r, 200));
      }
      
      if (onNotify) onNotify(`✅ Successfully saved ${totalPages} image(s) to Documents!`, false);

    } catch (error) { 
        console.error("PDF to Img Error:", error);
        alert('⚠️ Failed to extract images. Please check permissions or file format.'); 
    } finally {
        // 🧹 CLEANUP (Jhaadu)
        setIsProcessing(false); 
        setStatus('');
        setFile(null);
    }
  };

  return (
    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border-color)', position: 'relative' }}>
      
      {isProcessing && (
        <div style={{position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '24px'}}>
            <div style={{width: '45px', height: '45px', border: '4px solid #f59e0b', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            <span style={{color: 'white', marginTop: '20px', fontWeight: 'bold', fontSize: '18px'}}>{status || 'Processing...'}</span>
        </div>
      )}

      <h3 style={{ textTransform: 'capitalize', fontSize: '18px', marginBottom: '15px', color: 'var(--text-main)' }}>PDF to Images</h3>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="application/pdf" onChange={handleUpload} />

      {!file ? (
        <label style={{ border: '2px dashed var(--border-color)', padding: '30px', borderRadius: '15px', cursor: 'pointer', display: 'block', color: 'var(--text-muted)', background: 'var(--bg-input)' }} onClick={() => fileInputRef.current.click()}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}><Icons.Upload /></div>
          <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>Tap to Upload PDF</span>
        </label>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
          <div style={{ padding: '15px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', display: 'block' }}>Selected File: {file.name}</span>
            <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 'bold' }}>Every PDF page will become an image.</span>
          </div>

          {/* 🔴 RENAME FEATURE UI */}
          <div>
             <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px', display: 'block' }}>Base Name (E.g. Img_1.png, Img_2.png):</label>
             <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                <input type="text" value={outputPrefix} onChange={(e) => setOutputPrefix(e.target.value)} style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} placeholder="Base image name..." />
                <span style={{ padding: '0 15px', color: 'var(--text-muted)', fontWeight: 'bold', background: 'var(--border-color)', height: '100%', display: 'flex', alignItems: 'center' }}>_1.png</span>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
             <button onClick={() => setFile(null)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
             <button onClick={runPdfToImg} disabled={isProcessing} style={{ flex: 2, background: '#f59e0b', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)', cursor: 'pointer' }}>Extract All</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfToImg;