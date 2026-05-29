import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Icons } from '../Icons'; 
import { readFile } from '../../utils/pdfUtils'; // checkInternetAndDownload hata diya gaya hai
import { Filesystem, Directory } from '@capacitor/filesystem'; // Naya Professional Save Import

const MergePdf = ({ onNotify, isPremium }) => {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map((f) => ({ id: Math.random().toString(), file: f, name: f.name }));
    setFiles((prev) => [...prev, ...newFiles]);
    if (onNotify) onNotify(null, true);
    e.target.value = null;
  };

  const moveFile = (index, direction) => {
      const newFiles = [...files];
      if (direction === 'up' && index > 0) {
          [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      } else if (direction === 'down' && index < newFiles.length - 1) {
          [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
      }
      setFiles(newFiles);
  };

  const runMerge = async () => {
    if (files.length < 2) return alert('Select 2+ files');
    setIsProcessing(true); setStatus('Merging PDFs...');
    
    try {
      const merged = await PDFDocument.create();
      for (const f of files) {
        const pdf = await PDFDocument.load(await readFile(f.file));
        const pages = await merged.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      
      // 1. Get PDF Data
      const pdfBytes = await merged.save();
      
      // 2. Convert to Base64 for Direct Save
      let binary = '';
      const bytes = new Uint8Array(pdfBytes);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = window.btoa(binary);

      // 3. SEEDHA PHONE KE DOCUMENTS FOLDER MEIN SAVE (Bina kisi popup ke)
      await Filesystem.writeFile({
        path: `ProUtility_Merged_${Date.now()}.pdf`,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });

      // 4. Success Message aur Clear UI
      if (onNotify) onNotify("✅ PDF Merged & Saved to Documents!");
      setStatus('');
      setIsProcessing(false);
      setFiles([]); // Save hone ke baad file list clear kar dena professional lagta hai

    } catch (error) { 
      console.error("Save Error:", error);
      alert('⚠️ Failed to Save. Phone settings mein jao aur Storage/Files permission allow karo.'); 
      setIsProcessing(false); setStatus('');
    }
  };

  return (
    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border-color)', position: 'relative' }}>
      
      {isProcessing && (
        <div style={{position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '24px'}}>
            <div style={{width: '45px', height: '45px', border: '4px solid #3b82f6', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            <span style={{color: 'white', marginTop: '20px', fontWeight: 'bold', fontSize: '18px'}}>{status || 'Processing...'}</span>
        </div>
      )}

      <h3 style={{ textTransform: 'capitalize', fontSize: '18px', marginBottom: '15px', color: 'var(--text-main)' }}>Merge PDF</h3>
      
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple accept="application/pdf" onChange={handleUpload} />

      <div style={{ minHeight: '200px' }}>
        {files.length === 0 ? (
          <label style={{ border: '2px dashed var(--border-color)', padding: '30px', borderRadius: '15px', cursor: 'pointer', display: 'block', color: 'var(--text-muted)', background: 'var(--bg-input)' }} onClick={() => fileInputRef.current.click()}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}><Icons.Upload /></div>
            <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>Tap to Upload</span>
          </label>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {files.map((f, i) => (
              <div key={f.id} style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', maxWidth: '70%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>{f.name}</span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => moveFile(i, 'up')} style={{ border: 'none', background: 'var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', cursor: 'pointer' }}><Icons.MoveUp /></button>
                  <button onClick={() => moveFile(i, 'down')} style={{ border: 'none', background: 'var(--border-color)', color: 'var(--text-main)', borderRadius: '4px', cursor: 'pointer' }}><Icons.MoveDown /></button>
                </div>
              </div>
            ))}
            <button onClick={() => { if (fileInputRef.current) fileInputRef.current.click(); }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', margin: '10px 0', cursor: 'pointer' }}>+ Add More Files</button>
            <button onClick={() => setFiles([])} style={{ color: '#ef4444', background: 'none', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Clear All</button>
          </div>
        )}
      </div>

      {files.length >= 2 && (
        <button onClick={runMerge} disabled={isProcessing} style={{ background: '#2563eb', color: 'white', padding: '16px', borderRadius: '16px', border: 'none', marginTop: '20px', width: '100%', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)', cursor: 'pointer' }}>
          Merge & Save
        </button>
      )}
    </div>
  );
};

export default MergePdf;