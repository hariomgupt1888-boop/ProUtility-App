import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Icons } from '../Icons'; 
import { readFile, checkInternetAndDownload, handleNativeSave } from '../../utils/pdfUtils';

const SplitPdf = ({ onNotify, isPremium }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [outputPrefix, setOutputPrefix] = useState('Split_Page'); // 🔴 RENAME FEATURE
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    setOutputPrefix(uploadedFile.name.replace('.pdf', '')); // Set base name automatically
    if (onNotify) onNotify(null, true);
    e.target.value = null;
  };

  const runSplit = async () => {
    if (!file) return;
    if (!outputPrefix.trim()) return alert("Please enter a valid base name!");
    if (!isPremium && !navigator.onLine) return alert('⚠️ Internet Required for Free Users!');

    setIsProcessing(true); setStatus('Splitting Pages...');
    try {
      const pdf = await PDFDocument.load(await readFile(file));
      const totalPages = pdf.getPageCount();
      
      for (let i = 0; i < totalPages; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdf, [i]);
        newPdf.addPage(page);
        const blob = new Blob([await newPdf.save()], { type: 'application/pdf' });
        
        // Save individually. Only show Ad on the first page if free user to avoid spamming ads.
        if (i === 0) {
            await checkInternetAndDownload(blob, `${outputPrefix}_${i + 1}.pdf`, 'Split PDF', isPremium, setStatus, null, null);
        } else {
            await handleNativeSave(blob, `${outputPrefix}_${i + 1}.pdf`, 'Split PDF');
        }
        await new Promise((r) => setTimeout(r, 400)); // Delay to prevent OS block
      }
      if (onNotify) onNotify('All pages separated successfully! ✅', false);
    } catch { alert('Failed to Split. File might be encrypted.'); }
    
    setIsProcessing(false); setStatus('');
  };

  return (
    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border-color)', position: 'relative' }}>
      
      {isProcessing && (
        <div style={{position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '24px'}}>
            <div style={{width: '45px', height: '45px', border: '4px solid #f97316', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            <span style={{color: 'white', marginTop: '20px', fontWeight: 'bold', fontSize: '18px'}}>{status || 'Processing...'}</span>
        </div>
      )}

      <h3 style={{ textTransform: 'capitalize', fontSize: '18px', marginBottom: '15px', color: 'var(--text-main)' }}>Split PDF</h3>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="application/pdf" onChange={handleUpload} />

      {!file ? (
        <label style={{ border: '2px dashed var(--border-color)', padding: '30px', borderRadius: '15px', cursor: 'pointer', display: 'block', color: 'var(--text-muted)', background: 'var(--bg-input)' }} onClick={() => fileInputRef.current.click()}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}><Icons.Upload /></div>
          <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>Tap to Upload</span>
        </label>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
          <div style={{ padding: '15px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', display: 'block' }}>Selected File: {file.name}</span>
            <span style={{ fontSize: '11px', color: '#f97316', fontWeight: 'bold' }}>Every page will be saved as a separate PDF.</span>
          </div>

          {/* 🔴 RENAME FEATURE UI */}
          <div>
             <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px', display: 'block' }}>Base Name (E.g. File_1.pdf, File_2.pdf):</label>
             <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                <input type="text" value={outputPrefix} onChange={(e) => setOutputPrefix(e.target.value)} style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} placeholder="Base file name..." />
                <span style={{ padding: '0 15px', color: 'var(--text-muted)', fontWeight: 'bold', background: 'var(--border-color)', height: '100%', display: 'flex', alignItems: 'center' }}>_1.pdf</span>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
             <button onClick={() => setFile(null)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
             <button onClick={runSplit} disabled={isProcessing} style={{ flex: 2, background: '#f97316', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)', cursor: 'pointer' }}>Split & Save All</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplitPdf;