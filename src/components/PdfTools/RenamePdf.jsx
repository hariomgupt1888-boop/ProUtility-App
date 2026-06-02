import React, { useState, useRef } from 'react';
import { Icons } from '../Icons'; 
import { formatSize } from '../../utils/pdfUtils'; // checkInternetAndDownload hata diya
import { Filesystem, Directory } from '@capacitor/filesystem'; // Naya Professional Save

const RenamePdf = ({ onNotify, isPremium }) => {
  const [file, setFile] = useState(null);
  const [outputName, setOutputName] = useState(''); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    setOutputName(uploadedFile.name.replace('.pdf', '')); // Pre-fill with old name
    if (onNotify) onNotify(null, true);
    e.target.value = null;
  };

  const runRename = async () => {
    if (!file) return;
    if (!outputName.trim()) return alert("Please enter a new name!");

    setIsProcessing(true); setStatus('Saving File...');
    try {
      // Direct binary copy for ultra-fast renaming without re-encoding
      const blob = file.slice(0, file.size, file.type);
      
      // 1. Convert to Base64
      const base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
      });

      // 💾 Asli Save Function
      const performSave = async () => {
          setStatus("Saving to Phone...");
          try { await Filesystem.requestPermissions(); } catch (e) { console.log("Permission proceed..."); }
          
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
        alert('⚠️ Failed to rename file. Please allow Storage permission.'); 
    } finally {
        // 🧹 CLEANUP (Jhaadu)
        setIsProcessing(false); 
        setStatus(''); 
        setFile(null);
        setOutputName('');
    }
  };

  return (
    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border-color)', position: 'relative' }}>
      
      {isProcessing && (
        <div style={{position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '24px'}}>
            <div style={{width: '45px', height: '45px', border: '4px solid #64748b', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            <span style={{color: 'white', marginTop: '20px', fontWeight: 'bold', fontSize: '18px'}}>{status || 'Processing...'}</span>
        </div>
      )}

      <h3 style={{ textTransform: 'capitalize', fontSize: '18px', marginBottom: '15px', color: 'var(--text-main)' }}>Rename PDF</h3>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="application/pdf" onChange={handleUpload} />

      {!file ? (
        <label style={{ border: '2px dashed var(--border-color)', padding: '30px', borderRadius: '15px', cursor: 'pointer', display: 'block', color: 'var(--text-muted)', background: 'var(--bg-input)' }} onClick={() => fileInputRef.current.click()}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}><Icons.Upload /></div>
          <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>Tap to Upload PDF</span>
        </label>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
          <div style={{ padding: '15px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', display: 'block', marginBottom: '5px' }}>Current Name: {file.name}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Size: {formatSize(file.size)}</span>
          </div>

          <div>
             <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px', display: 'block' }}>New File Name:</label>
             <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                <input type="text" value={outputName} onChange={(e) => setOutputName(e.target.value)} style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} placeholder="Enter new name..." />
                <span style={{ padding: '0 15px', color: 'var(--text-muted)', fontWeight: 'bold', background: 'var(--border-color)', height: '100%', display: 'flex', alignItems: 'center' }}>.pdf</span>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
             <button onClick={() => {setFile(null); setOutputName('');}} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
             <button onClick={runRename} disabled={isProcessing || !outputName.trim()} style={{ flex: 2, background: '#64748b', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(100, 116, 139, 0.4)', cursor: 'pointer', opacity: outputName.trim() ? 1 : 0.6 }}>Rename & Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenamePdf;