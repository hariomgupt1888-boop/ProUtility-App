import React, { useState } from 'react';
import QRCode from 'qrcode';

// --- PREMIUM ICONS ---
const Icons = {
  Back: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>),
  Download: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>)
};

// 🔴 Added onNotify here
const QrGenerator = ({ onBack, isPremium, setSavedFile, onNotify }) => {
  const [text, setText] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // --- NAYA: Ad & Saving States ---
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");

  // --- 1. QR GENERATE KARNE KA LOGIC ---
  const generateQR = async () => {
    // Agar input khali hai toh alert do
    if (!text.trim()) {
        return alert("Bhai, please enter a valid URL, Number, or Text!");
    }
    
    setIsGenerating(true);
    try {
      // HD Quality aur High Contrast QR Code generate karna
      const url = await QRCode.toDataURL(text.trim(), { 
          width: 800, // High-Resolution Image
          margin: 2,  // Border margin
          color: {
              dark: '#000000',  // Black dots for best scanning
              light: '#ffffff'  // White background (Even in dark mode)
          }
      });
      setQrUrl(url);
      
      // 🔴 NAYA: Haptic feedback jab QR generate ho
      if(onNotify) onNotify(null, true); 

    } catch (e) { 
      alert("Failed to generate QR Code. Please try again."); 
      console.error(e);
    }
    setIsGenerating(false);
  };

 // --- 2. 100% WORKING DOWNLOAD LOGIC WITH AD GATEKEEPER ---
 const handleDownload = async () => {
  try {
      // Data URL ko asli Blob file mein convert karna
      const res = await fetch(qrUrl);
      const blobObj = await res.blob();
      
      const executeDownload = () => {
          // Native Download Trigger karna
          const link = document.createElement('a');
          link.href = qrUrl;
          link.download = 'ProUtility_QR.png'; 
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setIsSaving(false);
          setStatus("");

          // 🔴 THE FIX: Yahan 'blobObj' bhej rahe hain App.jsx ko!
          if (onNotify) {
              onNotify("QR Code Saved! ✅", false, "ProUtility_QR.png", "QR Code", blobObj);
          }
      };

      if (isPremium) {
          executeDownload();
      } else {
          if (navigator.onLine) {
              setIsSaving(true);
              setStatus("Loading Ad...");
              setTimeout(() => {
                  executeDownload();
              }, 2000); // 2 seconds ad simulation
          } else {
              alert("⚠️ Internet Required!\n\nFree users need internet to save files. Enable internet to watch a quick Ad, or Upgrade to Premium.");
          }
      }

  } catch(e) {
      console.error("Download Error:", e);
      alert("Something went wrong while downloading the file.");
      setIsSaving(false);
      setStatus("");
  }
};

  return (
    <div style={{padding:'20px', height:'100%', background:'var(--bg-main)', display:'flex', flexDirection:'column', transition: 'background-color 0.3s ease', position: 'relative'}}>
      
      {/* AD / PROCESSING OVERLAY */}
      {isSaving && (
        <div style={{position:'absolute', inset:0, background:'rgba(15,23,42,0.9)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:50}}>
            <div style={{width: '45px', height: '45px', border: '4px solid #3b82f6', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            <span style={{color: 'white', marginTop: '20px', fontWeight: 'bold', fontSize: '18px'}}>{status}</span>
        </div>
      )}

      {/* HEADER */}
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'25px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
          <button onClick={onBack} style={{background:'var(--bg-card)', border:'1px solid var(--border-color)', color:'var(--text-main)', borderRadius:'50%', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center', cursor: 'pointer', transition: '0.3s'}}>
            <Icons.Back/>
          </button>
          <h2 style={{margin:0, color:'var(--text-main)', fontSize:'22px'}}>QR Generator</h2>
        </div>
        <div style={{padding: '6px 15px', borderRadius:'20px', background: isPremium ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'var(--bg-input)', color: isPremium ? '#000' : 'var(--text-main)', fontSize:'12px', fontWeight:'bold', boxShadow: isPremium ? '0 4px 10px rgba(245, 158, 11, 0.3)' : 'none'}}>
          {isPremium ? "PRO" : "FREE"}
        </div>
      </div>

      {/* MAIN WORKSPACE */}
      <div style={{flex:1, background:'var(--bg-card)', borderRadius:'24px', padding:'25px 20px', display:'flex', flexDirection:'column', alignItems:'center', border:'1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)'}}>
         
         <p style={{alignSelf: 'flex-start', margin: '0 0 10px 5px', color: 'var(--text-main)', fontWeight: 'bold', fontSize: '14px'}}>Enter Data:</p>
         
         <textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="Type URL, Phone Number, Email, or any Text here..." 
            style={{width:'100%', minHeight:'100px', padding:'15px', borderRadius:'15px', background:'var(--bg-input)', color:'var(--text-main)', border:'1px solid var(--border-color)', marginBottom:'20px', fontSize:'16px', resize:'vertical', fontFamily: 'inherit'}}
         />
         
         <button onClick={generateQR} disabled={isGenerating} style={{width:'100%', padding:'16px', background:'#3b82f6', color:'white', borderRadius:'15px', border:'none', fontWeight:'bold', fontSize:'16px', cursor: isGenerating ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)', transition: '0.2s'}}>
            {isGenerating ? "Generating..." : "Generate QR Code"}
         </button>

         {/* RESULT AREA */}
         {qrUrl && (
           <div style={{marginTop:'35px', textAlign:'center', width:'100%', display:'flex', flexDirection:'column', alignItems:'center', animation: 'fadeIn 0.5s ease'}}>
              <p style={{margin: '0 0 15px 0', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 'bold'}}>Your QR Code is Ready 👇</p>
              
              <div style={{background: 'white', padding: '15px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', marginBottom: '25px'}}>
                  <img src={qrUrl} alt="Generated QR" style={{width:'200px', height:'200px', objectFit:'contain', display: 'block'}}/>
              </div>

              <button onClick={handleDownload} disabled={isSaving} style={{width:'100%', padding:'16px', background:'#10b981', color:'white', borderRadius:'15px', border:'none', fontWeight:'bold', fontSize:'16px', cursor: isSaving ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'}}>
                  <Icons.Download /> Download PNG
              </button>
           </div>
         )}
      </div>

      {/* Simple fade-in animation and spin for the result and overlay */}
      <style>
        {`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        `}
      </style>
    </div>
  );
};

export default QrGenerator;