import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Icons } from '../Icons'; 
import { Filesystem, Directory } from '@capacitor/filesystem'; 

const TextToPdf = ({ onNotify, isPremium }) => {
  const [textInput, setTextInput] = useState('');
  const [outputName, setOutputName] = useState('Text_Document'); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');

  const runTextToPdf = async () => {
    if (!textInput.trim()) return alert('Please write something first!');
    if (!outputName.trim()) return alert("Please enter a valid file name!");

    setIsProcessing(true); 
    
    try {
      const doc = new jsPDF();
      // Auto-wrap text at 180 width to fit page
      doc.text(doc.splitTextToSize(textInput, 180), 10, 10);
      
      // 💾 Asli Save Function
      const performSave = async () => {
          setStatus("Saving to Phone...");
          try { await Filesystem.requestPermissions(); } catch (e) { console.log("Permission proceed..."); }

          const base64Data = doc.output('datauristring').split(',')[1];
          const finalName = `${outputName}_${Date.now()}.pdf`; // 🔴 Timestamp yahan hai

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
        setTextInput(''); 
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

      <h3 style={{ textTransform: 'capitalize', fontSize: '18px', marginBottom: '15px', color: 'var(--text-main)' }}>Text to PDF</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
        
        <textarea 
          value={textInput} 
          onChange={(e) => setTextInput(e.target.value)} 
          placeholder="Type or paste your text here..." 
          style={{ width: '100%', height: '200px', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '14px', resize: 'none', outline: 'none' }} 
        />

        {/* 🔴 RENAME FEATURE UI */}
        <div>
           <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '5px', display: 'block' }}>Save As (File Name):</label>
           <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
              <input type="text" value={outputName} onChange={(e) => setOutputName(e.target.value)} style={{ flex: 1, padding: '12px', border: 'none', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }} placeholder="Enter file name..." />
              <span style={{ padding: '0 15px', color: 'var(--text-muted)', fontWeight: 'bold', background: 'var(--border-color)', height: '100%', display: 'flex', alignItems: 'center' }}>.pdf</span>
           </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
           <button onClick={() => setTextInput('')} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', fontWeight: 'bold', cursor: 'pointer' }}>Clear</button>
           <button onClick={runTextToPdf} disabled={isProcessing || !textInput.trim()} style={{ flex: 2, background: '#3b82f6', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)', cursor: 'pointer', opacity: textInput.trim() ? 1 : 0.6 }}>Save PDF</button>
        </div>
      </div>
    </div>
  );
};

export default TextToPdf;