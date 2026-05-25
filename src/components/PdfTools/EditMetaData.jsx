import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Icons } from '../Icons'; 
import { readFile, handleNativeSave } from '../../utils/pdfUtils';

const EditMetadata = ({ onNotify, isPremium }) => {
  // 🔴 STRICT PREMIUM LOCK
  if (!isPremium) {
    return (
      <div style={{ background: 'var(--bg-card)', padding: '40px 20px', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <div style={{ width: '80px', height: '80px', background: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: '10px' }}>
           <Icons.Crown />
        </div>
        <h2 style={{ fontSize: '24px', margin: 0, color: 'var(--text-main)', fontWeight: '800' }}>Premium Feature</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', maxWidth: '300px' }}>
          Editing internal PDF properties and metadata is a professional tool reserved for Pro Utility Premium members.
        </p>
        <button style={{ background: '#f59e0b', color: 'white', padding: '14px 30px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', marginTop: '10px', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)', cursor: 'pointer' }}>
          Upgrade to Premium
        </button>
      </div>
    );
  }

  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  
  // Metadata States
  const [metaInfo, setMetaInfo] = useState({ title: '', author: '', subject: '', keywords: '', creator: '' });
  const [outputName, setOutputName] = useState('Professional_Document'); 
  
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadedFile = e.target.files[0];
    
    setIsProcessing(true); setStatus('Reading PDF DNA...');
    try {
      const buffer = await readFile(uploadedFile);
      const pdfDoc = await PDFDocument.load(buffer);
      
      // Extract existing metadata
      setMetaInfo({
          title: pdfDoc.getTitle() || '',
          author: pdfDoc.getAuthor() || '',
          subject: pdfDoc.getSubject() || '',
          keywords: pdfDoc.getKeywords() || '',
          creator: pdfDoc.getCreator() || '',
      });
      
      setFile(uploadedFile);
      setOutputName(uploadedFile.name.replace('.pdf', '') + '_Pro'); 
    } catch (err) { 
      alert('Failed to read file. Ensure it is not encrypted.'); 
    }
    setIsProcessing(false); setStatus('');
    e.target.value = null;
  };

  const handleInputChange = (field, value) => {
      setMetaInfo(prev => ({ ...prev, [field]: value }));
  };

  const runMetadataEditor = async () => {
    if (!outputName.trim()) return alert("Please enter a valid file name!");

    setIsProcessing(true); setStatus("Updating Properties...");
    try {
      const pdfDoc = await PDFDocument.load(await readFile(file));
      
      // Set new metadata
      if (metaInfo.title) pdfDoc.setTitle(metaInfo.title);
      if (metaInfo.author) pdfDoc.setAuthor(metaInfo.author);
      if (metaInfo.subject) pdfDoc.setSubject(metaInfo.subject);
      if (metaInfo.keywords) pdfDoc.setKeywords(metaInfo.keywords);
      if (metaInfo.creator) pdfDoc.setCreator(metaInfo.creator);
      
      const blob = new Blob([await pdfDoc.save()], { type: 'application/pdf' });
      await handleNativeSave(blob, `${outputName}.pdf`, 'Updated PDF');
      if (onNotify) onNotify('Metadata Updated Successfully! 🚀', false);
    } catch (e) { 
        alert('Failed to update PDF properties.'); 
    }
    setIsProcessing(false); setStatus('');
  };

  return (
    <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border-color)', position: 'relative' }}>
      
      {isProcessing && (
        <div style={{position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '24px'}}>
            <div style={{width: '45px', height: '45px', border: '4px solid #8b5cf6', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            <span style={{color: 'white', marginTop: '20px', fontWeight: 'bold', fontSize: '18px'}}>{status || 'Processing...'}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
         <h3 style={{ textTransform: 'capitalize', fontSize: '18px', margin: 0, color: 'var(--text-main)' }}>Edit Metadata</h3>
         <span style={{ background: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>PRO</span>
      </div>

      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="application/pdf" onChange={handleUpload} />

      {!file ? (
        <label style={{ border: '2px dashed var(--border-color)', padding: '30px', borderRadius: '15px', cursor: 'pointer', display: 'block', color: 'var(--text-muted)', background: 'var(--bg-input)' }} onClick={() => fileInputRef.current.click()}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}><Icons.Upload /></div>
          <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>Tap to Upload PDF</span>
        </label>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
          
          <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
             <p style={{ margin: 0, fontSize: '12px', color: '#1e3a8a', fontWeight: '600' }}>Change the internal details of your PDF below.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-input)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Document Title:</label>
                  <input type="text" value={metaInfo.title} onChange={(e) => handleInputChange('title', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', marginTop: '5px', outline: 'none' }} placeholder="e.g. Annual Report 2026" />
              </div>
              <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Author (Name / Company):</label>
                  <input type="text" value={metaInfo.author} onChange={(e) => handleInputChange('author', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', marginTop: '5px', outline: 'none' }} placeholder="e.g. Pro Utility Corp" />
              </div>
              <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Subject:</label>
                  <input type="text" value={metaInfo.subject} onChange={(e) => handleInputChange('subject', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', marginTop: '5px', outline: 'none' }} placeholder="e.g. Financial Details" />
              </div>
              <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Keywords (Comma separated):</label>
                  <input type="text" value={metaInfo.keywords} onChange={(e) => handleInputChange('keywords', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', marginTop: '5px', outline: 'none' }} placeholder="e.g. finance, 2026, confidential" />
              </div>
          </div>

          <div>
             <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px', display: 'block' }}>Save As (Rename):</label>
             <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                <input type="text" value={outputName} onChange={(e) => setOutputName(e.target.value)} style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} placeholder="Enter file name..." />
                <span style={{ padding: '0 15px', color: 'var(--text-muted)', fontWeight: 'bold', background: 'var(--border-color)', height: '100%', display: 'flex', alignItems: 'center' }}>.pdf</span>
             </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
             <button onClick={() => setFile(null)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
             <button onClick={runMetadataEditor} disabled={isProcessing} style={{ flex: 2, background: '#8b5cf6', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)', cursor: 'pointer' }}>Update Properties</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditMetadata;