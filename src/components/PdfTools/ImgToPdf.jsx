import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import { Icons } from '../Icons'; 
import { readImage, checkInternetAndDownload } from '../../utils/pdfUtils';

const ImgToPdf = ({ onNotify, isPremium }) => {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [reduceQuality, setReduceQuality] = useState(false);
  const [outputName, setOutputName] = useState('Images_Converted'); // 🔴 RENAME FEATURE
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map((f) => ({ id: Math.random().toString(), file: f, name: f.name }));
    setFiles((prev) => [...prev, ...newFiles]);
    if (onNotify) onNotify(null, true);
    e.target.value = null;
  };

  const runImgToPdf = async () => {
    if (files.length === 0) return;
    if (!outputName.trim()) return alert("Please enter a valid file name!");

    setIsProcessing(true); setStatus('Creating PDF...');
    try {
      const doc = new jsPDF();
      for (let i = 0; i < files.length; i++) {
        const imgData = await readImage(files[i].file);
        const props = doc.getImageProperties(imgData);
        if (i > 0) doc.addPage();
        doc.addImage(imgData, 'JPEG', 0, 0, doc.internal.pageSize.getWidth(), (props.height * doc.internal.pageSize.getWidth()) / props.width, undefined, reduceQuality ? 'FAST' : 'SLOW');
      }
      const blob = doc.output('blob');
      await checkInternetAndDownload(blob, `${outputName}.pdf`, 'Img to PDF', isPremium, setStatus, setIsProcessing, onNotify);
    } catch { 
      alert('Failed to convert images.'); 
      setIsProcessing(false); setStatus(''); 
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

      <h3 style={{ textTransform: 'capitalize', fontSize: '18px', marginBottom: '15px', color: 'var(--text-main)' }}>Image to PDF</h3>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple accept="image/*" onChange={handleUpload} />

      <div style={{ minHeight: '200px' }}>
        {files.length === 0 ? (
          <label style={{ border: '2px dashed var(--border-color)', padding: '30px', borderRadius: '15px', cursor: 'pointer', display: 'block', color: 'var(--text-muted)', background: 'var(--bg-input)' }} onClick={() => fileInputRef.current.click()}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}><Icons.Upload /></div>
            <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>Tap to Upload Images</span>
          </label>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-input)', padding: '15px', borderRadius: '12px', cursor: 'pointer', border: '1px solid var(--border-color)' }}>
               <input type="checkbox" checked={reduceQuality} onChange={(e) => setReduceQuality(e.target.checked)} style={{ width: '18px', height: '18px' }} />
               <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>Reduce Quality (Smaller PDF Size)</span>
            </label>

            <div style={{ maxHeight: '150px', overflowY: 'auto', padding: '5px' }}>
              {files.map((f, i) => (
                <div key={f.id} style={{ padding: '8px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-main)' }}>{f.name}</span>
                </div>
              ))}
            </div>
            
            <button onClick={() => { if (fileInputRef.current) fileInputRef.current.click(); }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', margin: '5px 0', cursor: 'pointer' }}>+ Add More Images</button>

            {/* 🔴 RENAME FEATURE UI */}
            <div style={{ marginTop: '10px' }}>
               <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px', display: 'block' }}>Save As (Rename):</label>
               <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                  <input type="text" value={outputName} onChange={(e) => setOutputName(e.target.value)} style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} placeholder="Enter file name..." />
                  <span style={{ padding: '0 15px', color: 'var(--text-muted)', fontWeight: 'bold', background: 'var(--border-color)', height: '100%', display: 'flex', alignItems: 'center' }}>.pdf</span>
               </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
               <button onClick={() => setFiles([])} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', fontWeight: 'bold', cursor: 'pointer' }}>Clear</button>
               <button onClick={runImgToPdf} disabled={isProcessing} style={{ flex: 2, background: '#f59e0b', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)', cursor: 'pointer' }}>Convert to PDF</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImgToPdf;