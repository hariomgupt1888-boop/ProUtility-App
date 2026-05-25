import React, { useState, useRef } from 'react';
import { Icons } from '../Icons'; 
import { readFile, checkInternetAndDownload } from '../../utils/pdfUtils';

const ExtractText = ({ onNotify, isPremium }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [outputName, setOutputName] = useState('Extracted_Text'); // 🔴 RENAME FEATURE
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    setOutputName(uploadedFile.name.replace('.pdf', '')); 
    setExtractedText(''); // Reset previous text
    if (onNotify) onNotify(null, true);
    e.target.value = null;
  };

  const runPdfOcr = async () => {
    if (!file) return;
    setIsProcessing(true); setStatus("Scanning Document...");
    try {
      const buffer = await readFile(file);
      const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += `--- Page ${i} ---\n${textContent.items.map(item => item.str).join(" ")}\n\n`;
      }
      
      if(!fullText.trim()) throw new Error("No readable text found");
      setExtractedText(fullText);
      if (onNotify) onNotify("Text Extracted! 📝", false);
    } catch (e) { 
      alert("No readable text found in this PDF (might be an image-only PDF)."); 
    }
    setIsProcessing(false); setStatus("");
  };

  const saveTextFile = async () => {
    if (!outputName.trim()) return alert("Please enter a valid file name!");
    setIsProcessing(true); setStatus("Saving TXT File...");
    const txtBlob = new Blob([extractedText], { type: 'text/plain' });
    await checkInternetAndDownload(txtBlob, `${outputName}.txt`, 'Extracted Text', isPremium, setStatus, setIsProcessing, onNotify);
  };

  return (
    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border-color)', position: 'relative' }}>
      
      {isProcessing && (
        <div style={{position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '24px'}}>
            <div style={{width: '45px', height: '45px', border: '4px solid #14b8a6', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            <span style={{color: 'white', marginTop: '20px', fontWeight: 'bold', fontSize: '18px'}}>{status || 'Processing...'}</span>
        </div>
      )}

      <h3 style={{ textTransform: 'capitalize', fontSize: '18px', marginBottom: '15px', color: 'var(--text-main)' }}>Extract Text from PDF</h3>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="application/pdf" onChange={handleUpload} />

      {!file ? (
        <label style={{ border: '2px dashed var(--border-color)', padding: '30px', borderRadius: '15px', cursor: 'pointer', display: 'block', color: 'var(--text-muted)', background: 'var(--bg-input)' }} onClick={() => fileInputRef.current.click()}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}><Icons.Upload /></div>
          <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>Tap to Upload PDF</span>
        </label>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
          
          {extractedText ? (
             <textarea value={extractedText} readOnly style={{ width: '100%', height: '250px', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '13px', lineHeight: '1.6', outline: 'none', resize: 'none' }} />
          ) : (
             <div style={{background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)'}}>
                <p style={{color: 'var(--text-main)', fontSize: '14px', fontWeight: 'bold', margin: '0 0 5px 0'}}>File: {file.name}</p>
                <p style={{color: 'var(--text-muted)', fontSize: '12px', margin: 0}}>Click "Scan & Extract" to read text.</p>
             </div>
          )}

          {extractedText && (
             <div>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px', display: 'block' }}>Save As (Rename):</label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                   <input type="text" value={outputName} onChange={(e) => setOutputName(e.target.value)} style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} placeholder="Enter file name..." />
                   <span style={{ padding: '0 15px', color: 'var(--text-muted)', fontWeight: 'bold', background: 'var(--border-color)', height: '100%', display: 'flex', alignItems: 'center' }}>.txt</span>
                </div>
             </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
             <button onClick={() => {setFile(null); setExtractedText('');}} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
             
             {!extractedText ? (
                <button onClick={runPdfOcr} disabled={isProcessing} style={{ flex: 2, background: '#14b8a6', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(20, 184, 166, 0.4)', cursor: 'pointer' }}>Scan & Extract</button>
             ) : (
                <button onClick={saveTextFile} disabled={isProcessing} style={{ flex: 2, background: '#3b82f6', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)', cursor: 'pointer' }}>Download TXT</button>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtractText;