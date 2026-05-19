import React, { useState, useRef, useEffect } from 'react';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';
import { Capacitor } from '@capacitor/core'; 
import { Filesystem, Directory } from '@capacitor/filesystem'; 

// --- 100% NATIVE ICONS ---
const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Upload: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Lock: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Unlock: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>,
  View: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Crown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="2 15 2 2 8 8 12 2 16 8 22 2 22 15"/><path d="M2 15h20v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4z"/></svg>,
  // 🔴 NAYA: Password Show/Hide Icons
  Eye: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
};

const readFile = (file) => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsArrayBuffer(file); });

const PdfSecurity = ({ onBack, onNotify, mode = 'lock' }) => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 🔴 NAYA: State for Show/Hide Password
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [status, setStatus] = useState("");

  // Viewer States (For Free Unlock View)
  const [viewerDoc, setViewerDoc] = useState(null);
  const [viewPagesCount, setViewPagesCount] = useState(0);

  const fileInputRef = useRef(null);

  // Load PDF.js for Viewing Unlocked PDF
  useEffect(() => {
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      };
      document.head.appendChild(script);
    }
  }, []);

  // Native Scroll Viewer Logic
  useEffect(() => {
    if (viewerDoc && viewPagesCount > 0) {
        const renderAllPages = async () => {
            for(let i = 1; i <= viewPagesCount; i++) {
                const canvas = document.getElementById(`security-pdf-page-${i}`);
                if(!canvas || canvas.getAttribute('data-rendered') === 'true') continue;
                
                try {
                    const page = await viewerDoc.getPage(i);
                    const viewport = page.getViewport({ scale: window.innerWidth < 600 ? 1.0 : 1.5 });
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                    canvas.setAttribute('data-rendered', 'true');
                } catch(e) { console.log("Render error page", i); }
            }
        };
        setTimeout(renderAllPages, 100);
    }
  }, [viewerDoc, viewPagesCount]);

  const handleUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setFile(e.target.files[0]);
    setPassword("");
    setViewerDoc(null);
    setViewPagesCount(0);
    if(onNotify) onNotify(null, true); 
    e.target.value = null;
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
         const base64Data = reader.result.split(',')[1];
         resolve(base64Data);
      };
      reader.readAsDataURL(blob);
    });
  };

  // 🔴 NAYA: Core Native Saving Logic (Fixed for proper storage access)
  const handleNativeSave = async (blob, fileName, fileType) => {
      try {
          if (Capacitor.isNativePlatform()) {
              setStatus("Saving to Phone...");
              const base64Data = await blobToBase64(blob);
              await Filesystem.writeFile({
                  path: fileName,
                  data: base64Data,
                  directory: Directory.Documents 
              });
          } else {
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a'); 
              link.href = url; 
              link.download = fileName;
              document.body.appendChild(link); 
              link.click(); 
              document.body.removeChild(link);
          }
          if (onNotify) onNotify(`Saved to Documents! ✅`, false, fileName, fileType, blob);
      } catch (error) {
          console.error("Save Error: ", error);
          alert("⚠️ Storage Error!\nPlease ensure you have allowed storage permissions.");
      }
  };

  const checkInternetAndDownload = async (blob, fileName, fileType) => {
    if (isPremium) {
      await handleNativeSave(blob, fileName, fileType);
      setIsProcessing(false);
      setStatus("");
      return;
    }

    if (navigator.onLine) {
      setStatus("Loading Ad...");
      setTimeout(async () => {
          await handleNativeSave(blob, fileName, fileType);
          setIsProcessing(false);
          setStatus("");
      }, 2000); 
    } else {
      setIsProcessing(false);
      setStatus("");
      alert("⚠️ Internet Required!\nFree users need internet to save files. Upgrade to Premium for offline use.");
    }
  };

  // --- 🔒 LOCK PDF LOGIC ---
  const runLock = async () => {
    if (!file) return alert("Upload a PDF first!");
    if (!password) return alert("Enter a strong password!");
    
    setIsProcessing(true);
    setStatus("Locking PDF...");
    try {
        const buffer = await readFile(file);
        const uint8Array = new Uint8Array(buffer);
        const encryptedBytes = await encryptPDF(uint8Array, password);
        
        const blob = new Blob([encryptedBytes], { type: 'application/pdf' });
        await checkInternetAndDownload(blob, `Locked_${file.name}`, "Locked PDF");
    } catch (error) {
        console.error(error);
        alert("Failed to lock. File might already be encrypted or corrupted.");
        setIsProcessing(false);
        setStatus("");
    }
  };

  // --- 🔓 UNLOCK: VIEW (FREE) LOGIC ---
  const runUnlockView = async () => {
    if (!file) return alert("Upload a locked PDF first!");
    if (!password) return alert("Enter the PDF password!");
    
    setIsProcessing(true);
    setStatus("Decrypting...");
    try {
        const buffer = await readFile(file);
        const uint8Array = new Uint8Array(buffer);
        const decryptedBytes = await decryptPDF(uint8Array, password);
        
        const pdfjsDoc = await window.pdfjsLib.getDocument({ data: new Uint8Array(decryptedBytes) }).promise;
        setViewerDoc(pdfjsDoc);
        setViewPagesCount(pdfjsDoc.numPages);
        
        if(onNotify) onNotify("PDF Unlocked Successfully! 🔓", true);
    } catch (error) {
        console.error(error);
        alert("❌ Wrong Password or File is not encrypted!");
    }
    setIsProcessing(false);
    setStatus("");
  };

  // --- 🔓 UNLOCK: DOWNLOAD (PREMIUM) LOGIC ---
  const runUnlockDownload = async () => {
    if(!isPremium) {
        alert("⚠️ This feature is for Premium Users only!\n\nFree users can 'View' the unlocked PDF below for free. Upgrade to Premium to save it permanently without a password.");
        return;
    }
    if (!file || !password) return alert("Upload PDF and enter password!");

    setIsProcessing(true);
    setStatus("Processing Premium Download...");
    try {
        const buffer = await readFile(file);
        const uint8Array = new Uint8Array(buffer);
        const decryptedBytes = await decryptPDF(uint8Array, password);
        
        const blob = new Blob([decryptedBytes], { type: 'application/pdf' });
        const fileName = `Unlocked_${file.name}`;
        
        await handleNativeSave(blob, fileName, "Unlocked PDF");
        
    } catch (error) {
        console.error(error);
        alert("❌ Wrong Password! Could not decrypt the file.");
    }
    setIsProcessing(false);
    setStatus("");
  };

  return (
    <div style={{ padding: '20px', height: '100%', overflowY: 'auto', background: 'var(--bg-main)', color: 'var(--text-main)', transition: 'background-color 0.3s' }}>
      
      {/* PROCESSING SPINNER OVERLAY */}
      {isProcessing && (
        <div style={{position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10000}}>
            <div style={{width: '45px', height: '45px', border: '4px solid #3b82f6', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            <span style={{color: 'white', marginTop: '20px', fontWeight: 'bold', fontSize: '18px'}}>{status}</span>
        </div>
      )}

      <input type="file" ref={fileInputRef} style={{display:'none'}} accept="application/pdf" onChange={handleUpload} />

      {/* HEADER */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'30px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
            <button onClick={onBack} style={{background:'var(--bg-card)', border:'1px solid var(--border-color)', borderRadius:'50%', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-main)', cursor:'pointer', touchAction: 'manipulation'}}><Icons.Back/></button>
            <h2 style={{margin:0, fontSize:'20px', fontWeight:'800', color:'var(--text-main)'}}>
                {mode === 'lock' ? 'Lock PDF' : 'Unlock PDF'}
            </h2>
        </div>
        <button onClick={() => setIsPremium(!isPremium)} style={{padding: '6px 15px', borderRadius:'20px', border:'none', background: isPremium ? '#f59e0b' : 'var(--bg-input)', color: isPremium ? '#000' : 'var(--text-main)', fontWeight: 'bold', fontSize: '12px', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer', touchAction: 'manipulation'}}>
            <Icons.Crown/> {isPremium ? "Premium" : "Free"}
        </button>
      </div>

      {/* MAIN WORKSPACE */}
      <div style={{ background: 'var(--bg-card)', padding: '25px', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
          
          {!file ? (
             <label style={{ border: '2px dashed var(--border-color)', padding: '40px 20px', borderRadius: '15px', cursor: 'pointer', display: 'block', color: 'var(--text-muted)', background: 'var(--bg-input)', touchAction: 'manipulation' }} onClick={() => fileInputRef.current.click()}>
                <div style={{display:'flex', justifyContent:'center', marginBottom:'15px'}}><Icons.Upload /></div>
                <span style={{fontWeight:'600', fontSize:'16px', display:'block'}}>Tap to Select PDF</span>
             </label>
          ) : (
             <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                
                {/* File Info */}
                <div style={{background:'var(--bg-input)', padding:'15px', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'space-between', border:'1px solid var(--border-color)'}}>
                    <span style={{fontSize:'14px', fontWeight:'600', maxWidth:'70%', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'var(--text-main)'}}>{file.name}</span>
                    <button onClick={() => {setFile(null); setPassword(""); setViewerDoc(null);}} style={{color:'#ef4444', background:'none', border:'none', fontSize:'12px', fontWeight:'bold', cursor:'pointer', touchAction: 'manipulation'}}>✕ Remove</button>
                </div>

                {/* 🔴 NAYA: Password Input with Show/Hide Button */}
                <div style={{textAlign: 'left', marginTop: '10px'}}>
                    <p style={{margin:'0 0 8px 0', fontSize:'13px', fontWeight:'bold', color: mode==='lock' ? '#2563eb' : '#ef4444'}}>
                        {mode === 'lock' ? '🔒 Set a strong password:' : '🔓 Enter PDF Password:'}
                    </p>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder={mode === 'lock' ? 'Enter new password...' : 'Enter existing password...'} 
                            style={{width:'100%', padding:'15px', paddingRight: '50px', border:'2px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-main)', borderRadius:'12px', fontSize:'16px'}}
                        />
                        <button 
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px' }}
                        >
                            {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                        </button>
                    </div>
                </div>

                {/* ACTION BUTTONS BASED ON MODE */}
                {mode === 'lock' ? (
                    <button 
                        onClick={runLock} 
                        disabled={isProcessing} 
                        style={{background: '#2563eb', color:'white', padding:'16px', borderRadius:'16px', border:'none', marginTop:'10px', width:'100%', fontWeight:'bold', fontSize:'16px', boxShadow:'0 4px 15px rgba(37,99,235,0.4)', cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', touchAction: 'manipulation'}}
                    >
                        <Icons.Lock /> Lock & Save PDF
                    </button>
                ) : (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px'}}>
                        
                        <button 
                            onClick={runUnlockView} 
                            disabled={isProcessing} 
                            style={{background: '#10b981', color:'white', padding:'16px', borderRadius:'16px', border:'none', width:'100%', fontWeight:'bold', fontSize:'16px', boxShadow:'0 4px 15px rgba(16,185,129,0.4)', cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', touchAction: 'manipulation'}}
                        >
                            <Icons.View /> View PDF (Free)
                        </button>
                        
                        <button 
                            onClick={runUnlockDownload} 
                            disabled={isProcessing} 
                            style={{background: 'transparent', color:'#f59e0b', padding:'14px', borderRadius:'16px', border:'2px solid #f59e0b', width:'100%', fontWeight:'bold', fontSize:'14px', cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', touchAction: 'manipulation'}}
                        >
                            <Icons.Crown /> Download Without Password (Premium)
                        </button>

                    </div>
                )}
             </div>
          )}
      </div>

      {/* VIEWER AREA FOR FREE UNLOCK READS */}
      {mode === 'unlock' && viewerDoc && (
          <div style={{border:'1px solid var(--border-color)', borderRadius:'16px', overflow:'hidden', marginBottom:'20px', animation: 'toastFadeInUp 0.4s ease forwards'}}>
              <div style={{background:'#1e293b', padding:'12px', color:'white', fontWeight:'bold', fontSize:'14px', display:'flex', justifyContent:'space-between'}}>
                  <span>Unlocked Preview</span>
                  <span>{viewPagesCount} Pages</span>
              </div>
              <div style={{height:'450px', background:'var(--bg-input)', overflowY:'auto', padding:'15px 10px', display:'flex', flexDirection:'column', gap:'15px', alignItems:'center'}}>
                  {Array.from({ length: viewPagesCount }).map((_, index) => (
                      <canvas 
                          key={index} 
                          id={`security-pdf-page-${index + 1}`} 
                          style={{maxWidth: '100%', background: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.15)', borderRadius: '4px'}}
                      ></canvas>
                  ))}
              </div>
          </div>
      )}

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes toastFadeInUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default PdfSecurity;