import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Icons } from '../Icons'; 
import { readFile, checkInternetAndDownload, formatSize } from '../../utils/pdfUtils';

const CompressPdf = ({ onNotify, isPremium }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [compressLevel, setCompressLevel] = useState(50);
  const [outputName, setOutputName] = useState('Compressed_PDF'); // 🔴 RENAME FEATURE
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    setOutputName(uploadedFile.name.replace('.pdf', '') + '_Min'); // Auto-fill smart name
    if (onNotify) onNotify(null, true);
    e.target.value = null;
  };

  const runCompress = async () => {
    if (!file) return;
    if (!outputName.trim()) return alert("Please enter a valid file name!");
    
    setIsProcessing(true); setStatus('Compressing...');
    try {
      const pdf = await PDFDocument.load(await readFile(file));
      const blob = new Blob([await pdf.save({ useObjectStreams: false })], { type: 'application/pdf' });
      
      // Premium & Ad logic inside checkInternetAndDownload
      await checkInternetAndDownload(blob, `${outputName}.pdf`, 'Compressed PDF', isPremium, setStatus, setIsProcessing, onNotify);
    } catch { 
      alert('Failed to Compress. Ensure PDF is not locked.'); 
      setIsProcessing(false); setStatus(''); 
    }
  };

  return (
    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border-color)', position: 'relative' }}>
      
      {isProcessing && (
        <div style={{position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '24px'}}>
            <div style={{width: '45px', height: '45px', border: '4px solid #16a34a', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            <span style={{color: 'white', marginTop: '20px', fontWeight: 'bold', fontSize: '18px'}}>{status || 'Processing...'}</span>
        </div>
      )}

      <h3 style={{ textTransform: 'capitalize', fontSize: '18px', marginBottom: '15px', color: 'var(--text-main)' }}>Compress PDF</h3>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="application/pdf" onChange={handleUpload} />

      {!file ? (
        <label style={{ border: '2px dashed var(--border-color)', padding: '30px', borderRadius: '15px', cursor: 'pointer', display: 'block', color: 'var(--text-muted)', background: 'var(--bg-input)' }} onClick={() => fileInputRef.current.click()}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}><Icons.Upload /></div>
          <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>Tap to Upload</span>
        </label>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
          <div style={{ padding: '15px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '5px' }}>Original File: {file.name}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Size: {formatSize(file.size)}</span>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '15px', borderRadius: '12px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Compression Level</p>
            <input type="range" min="10" max="90" value={compressLevel} onChange={(e) => setCompressLevel(e.target.value)} style={{ width: '100%', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
              <span>Better Quality</span><span>Smaller Size</span>
            </div>
            <p style={{ fontSize: '13px', color: '#16a34a', fontWeight: 'bold', marginTop: '10px' }}>Est. Size: ~{formatSize(file.size * (1 - compressLevel / 100))}</p>
          </div>

          {/* 🔴 RENAME FEATURE UI */}
          <div>
             <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px', display: 'block' }}>Save As (Rename):</label>
             <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                <input type="text" value={outputName} onChange={(e) => setOutputName(e.target.value)} style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} placeholder="Enter file name..." />
                <span style={{ padding: '0 15px', color: 'var(--text-muted)', fontWeight: 'bold', background: 'var(--border-color)', height: '100%', display: 'flex', alignItems: 'center' }}>.pdf</span>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
             <button onClick={() => setFile(null)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
             <button onClick={runCompress} disabled={isProcessing} style={{ flex: 2, background: '#16a34a', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(22, 163, 74, 0.4)', cursor: 'pointer' }}>Compress & Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompressPdf;