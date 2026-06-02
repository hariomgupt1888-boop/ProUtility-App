import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Capacitor } from '@capacitor/core'; 
import { Filesystem, Directory } from '@capacitor/filesystem'; 

// --- PREMIUM ICONS ---
const Icons = {
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ChevronDown: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
};

const QrGenerator = ({ onBack, isPremium, setSavedFile, onNotify }) => {
  const [text, setText] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  
  // --- NEW UI STATES ---
  const [activeTab, setActiveTab] = useState('link'); // link, style, color, format
  const [qrColor, setQrColor] = useState('#000000');
  const [fileFormat, setFileFormat] = useState('PNG'); // PNG, JPG, SVG

  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");

  // --- AUTO GENERATE QR ON CHANGE ---
  useEffect(() => {
    if (text.trim()) {
      QRCode.toDataURL(text.trim(), { 
          width: 800, 
          margin: 2,  
          color: { dark: qrColor, light: '#ffffff' }
      })
      .then(url => setQrUrl(url))
      .catch(err => console.error(err));
    } else {
      setQrUrl(""); // Clear QR if text is empty
    }
  }, [text, qrColor]);

  // --- BASE64 HELPER ---
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
  };

 // --- 100% NATIVE DOWNLOAD LOGIC ---
 const handleDownload = async () => {
  if (!qrUrl) return alert("Please enter some text or link to generate a QR Code first!");

  setIsSaving(true);
  try {
      let finalDataUrl = qrUrl;
      let blobObj;

      // Handle SVG separately if selected
      if (fileFormat === 'SVG') {
          const svgString = await QRCode.toString(text.trim(), { type: 'svg', color: { dark: qrColor, light: '#ffffff' } });
          blobObj = new Blob([svgString], { type: 'image/svg+xml' });
      } else if (fileFormat === 'JPG') {
          // Convert PNG dataURL to JPG using Canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.src = qrUrl;
          await new Promise(r => { img.onload = r; });
          canvas.width = img.width; canvas.height = img.height;
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          finalDataUrl = canvas.toDataURL('image/jpeg', 1.0);
          blobObj = await (await fetch(finalDataUrl)).blob();
      } else {
          // Default PNG
          blobObj = await (await fetch(qrUrl)).blob();
      }
      
      const executeDownload = async () => {
          try {
              const ext = fileFormat.toLowerCase();
              const fileName = `ProUtility_QR_${Date.now()}.${ext}`;

              if (Capacitor.isNativePlatform()) {
                  setStatus("Saving to Phone...");
                  try { await Filesystem.requestPermissions(); } catch(e) {}

                  const base64Data = await blobToBase64(blobObj);
                  await Filesystem.writeFile({
                      path: fileName,
                      data: base64Data,
                      directory: Directory.Documents,
                      recursive: true
                  });
              } else {
                  const link = document.createElement('a');
                  link.href = fileFormat === 'SVG' ? URL.createObjectURL(blobObj) : finalDataUrl;
                  link.download = fileName; 
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
              }

              if (onNotify) onNotify(`QR Code Saved as ${fileFormat}! ✅`, false);

          } catch (err) {
              console.error("Save Error:", err);
              alert("⚠️ Storage Permission Required to save the QR Code.");
          } finally {
              // 🧹 CLEANUP (Jhaadu)
              setIsSaving(false);
              setStatus("");
              setText(""); // Form reset
          }
      };

      // 👑 PREMIUM & AD GATE
      if (isPremium) {
          await executeDownload();
      } else {
          if (navigator.onLine) {
              setStatus("Loading Ad...");
              setTimeout(async () => { await executeDownload(); }, 2000);
          } else {
              alert("⚠️ Internet Required!\nFree users need internet to save files. Enable internet or Upgrade to Premium.");
              setIsSaving(false);
              setStatus("");
          }
      }

  } catch(e) {
      console.error("Download Error:", e);
      alert("Something went wrong while saving.");
      setIsSaving(false); setStatus("");
  }
};

  // --- STYLES ---
  const S = {
    wrapper: { position: 'fixed', inset: 0, backgroundColor: '#f8fafc', color: '#0f172a', display: 'flex', flexDirection: 'column', zIndex: 9999, fontFamily: 'sans-serif' },
    header: { height: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', backgroundColor: '#f8fafc' },
    title: { fontSize: '22px', fontWeight: 'bold', margin: 0 },
    closeBtn: { background: 'none', border: 'none', color: '#0f172a', cursor: 'pointer', padding: '5px' },
    
    // 🔴 FIX FOR AD-BLOCK HIDING BUTTONS: Exta paddingBottom
    scrollArea: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', paddingBottom: '120px' },
    
    qrCard: { backgroundColor: 'white', padding: '20px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: '300px', aspectRatio: '1/1', marginBottom: '30px' },
    qrPlaceholder: { color: '#94a3b8', fontSize: '14px', fontWeight: 'bold' },
    qrImage: { width: '100%', height: '100%', objectFit: 'contain' },
    
    tabsWrapper: { display: 'flex', gap: '10px', width: '100%', overflowX: 'auto', paddingBottom: '15px', marginBottom: '10px', scrollbarWidth: 'none' },
    tabBtn: (isActive) => ({ padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', cursor: 'pointer', transition: '0.2s', border: 'none', backgroundColor: isActive ? '#e2e8f0' : 'transparent', color: isActive ? '#0f172a' : '#64748b' }),
    
    tabContent: { width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' },
    
    textarea: { width: '100%', minHeight: '120px', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '16px', outline: 'none', resize: 'none', color: '#0f172a' },
    
    colorRow: { display: 'flex', gap: '12px' },
    colorSwatch: (c, isActive) => ({ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: c, cursor: 'pointer', border: isActive ? '3px solid #0f172a' : '1px solid #cbd5e1', outline: isActive ? '2px solid white' : 'none', outlineOffset: '-4px' }),
    
    selectBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderRadius: '12px', backgroundColor: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold' },
    
    actionRow: { display: 'flex', gap: '15px', width: '100%', marginTop: '30px' },
    btnPrimary: { flex: 1, padding: '16px', borderRadius: '100px', backgroundColor: '#e2e8f0', color: '#94a3b8', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: '0.3s' },
    btnPrimaryActive: { backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' },
    btnSecondary: { flex: 1, padding: '16px', borderRadius: '100px', backgroundColor: 'transparent', border: '2px solid #e2e8f0', color: '#64748b', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }
  };

  const COLORS = ['#000000', '#1d4ed8', '#f97316', '#ef4444', '#16a34a'];

  return (
    <div style={S.wrapper}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>

      {/* AD / PROCESSING OVERLAY */}
      {isSaving && (
        <div style={{position:'absolute', inset:0, background:'rgba(255,255,255,0.9)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:50}}>
            <div style={{width: '45px', height: '45px', border: '4px solid #3b82f6', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            <span style={{color: '#0f172a', marginTop: '20px', fontWeight: 'bold', fontSize: '18px'}}>{status}</span>
        </div>
      )}

      {/* HEADER */}
      <div style={S.header}>
        <h2 style={S.title}>Generate QR code</h2>
        <button onClick={onBack} style={S.closeBtn}><Icons.Close /></button>
      </div>

      {/* SCROLLABLE AREA */}
      <div style={S.scrollArea}>
        
        {/* QR PREVIEW CARD */}
        <div style={S.qrCard}>
            {qrUrl ? (
                <img src={qrUrl} alt="QR Code" style={S.qrImage} />
            ) : (
                <span style={S.qrPlaceholder}>Enter data to generate</span>
            )}
        </div>

        {/* TABS */}
        <div style={S.tabsWrapper}>
            <button style={S.tabBtn(activeTab === 'link')} onClick={() => setActiveTab('link')}>Link</button>
            <button style={S.tabBtn(activeTab === 'style')} onClick={() => setActiveTab('style')}>Style</button>
            <button style={S.tabBtn(activeTab === 'color')} onClick={() => setActiveTab('color')}>Color</button>
            <button style={S.tabBtn(activeTab === 'format')} onClick={() => setActiveTab('format')}>File format</button>
        </div>

        {/* TAB CONTENT */}
        <div style={S.tabContent}>
            
            {/* LINK TAB */}
            {activeTab === 'link' && (
                <textarea 
                    style={S.textarea} 
                    placeholder="Enter URL, Text, or Phone Number here..." 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
            )}

            {/* STYLE TAB (MOCK UI TO MATCH SCREENSHOT) */}
            {activeTab === 'style' && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                    <div>
                        <p style={{fontSize: '14px', color: '#64748b', marginBottom: '10px', fontWeight: 'bold'}}>Dots</p>
                        <div style={{display: 'flex', gap: '10px'}}>
                            <div style={{width: '50px', height: '50px', borderRadius: '12px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><div style={{width: '20px', height: '20px', background: '#0f172a'}}></div></div>
                            <div style={{width: '50px', height: '50px', borderRadius: '12px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><div style={{width: '20px', height: '20px', background: '#0f172a', borderRadius: '6px'}}></div></div>
                            <div style={{width: '50px', height: '50px', borderRadius: '12px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><div style={{width: '20px', height: '20px', background: 'white', borderRadius: '50%'}}></div></div>
                        </div>
                    </div>
                    <div>
                        <p style={{fontSize: '14px', color: '#64748b', marginBottom: '10px', fontWeight: 'bold'}}>Marker border</p>
                        <div style={{display: 'flex', gap: '10px'}}>
                            <div style={{width: '50px', height: '50px', borderRadius: '12px', background: '#e2e8f0', border: '3px solid #0f172a'}}></div>
                            <div style={{width: '50px', height: '50px', borderRadius: '12px', background: '#0f172a', border: '3px solid #0f172a', position: 'relative'}}><div style={{position: 'absolute', inset: '4px', background: '#e2e8f0', borderRadius: '6px'}}></div></div>
                            <div style={{width: '50px', height: '50px', borderRadius: '12px', background: '#e2e8f0', border: '3px solid #0f172a', borderRadius: '50%'}}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* COLOR TAB */}
            {activeTab === 'color' && (
                <div>
                    <p style={{fontSize: '14px', color: '#64748b', marginBottom: '10px', fontWeight: 'bold'}}>QR Color</p>
                    <div style={S.colorRow}>
                        {COLORS.map(c => (
                            <div key={c} style={S.colorSwatch(c, qrColor === c)} onClick={() => setQrColor(c)}></div>
                        ))}
                    </div>
                </div>
            )}

            {/* FORMAT TAB */}
            {activeTab === 'format' && (
                <div>
                    <p style={{fontSize: '14px', color: '#64748b', marginBottom: '10px', fontWeight: 'bold'}}>File format</p>
                    <div style={S.selectBox}>
                        <span>{fileFormat}</span>
                        <Icons.ChevronDown />
                    </div>
                    <div style={{marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px'}}>
                        <div onClick={() => setFileFormat('PNG')} style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: fileFormat === 'PNG' ? '#3b82f6' : '#0f172a', fontWeight: 'bold'}}>
                           {fileFormat === 'PNG' && <span style={{color: '#3b82f6'}}>✔</span>} PNG (Best For Images)
                        </div>
                        <div onClick={() => setFileFormat('JPG')} style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: fileFormat === 'JPG' ? '#3b82f6' : '#0f172a', fontWeight: 'bold'}}>
                           {fileFormat === 'JPG' && <span style={{color: '#3b82f6'}}>✔</span>} JPG
                        </div>
                        <div onClick={() => setFileFormat('SVG')} style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: fileFormat === 'SVG' ? '#3b82f6' : '#0f172a', fontWeight: 'bold'}}>
                           {fileFormat === 'SVG' && <span style={{color: '#3b82f6'}}>✔</span>} SVG (Scalable Vector)
                        </div>
                    </div>
                </div>
            )}

        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div style={S.actionRow}>
            <button 
                onClick={handleDownload} 
                disabled={!qrUrl || isSaving} 
                style={{...S.btnPrimary, ...(qrUrl ? S.btnPrimaryActive : {})}}
            >
                Download
            </button>
            <button style={S.btnSecondary} onClick={() => alert("Editor integration coming soon!")}>
                Open in editor
            </button>
        </div>

      </div>
    </div>
  );
};

export default QrGenerator;