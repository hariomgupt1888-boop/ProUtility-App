import React, { useState, useRef, useEffect } from 'react';

// --- PREMIUM ICONS ---
const Icons = {
  Back: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>),
  Printer: () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>),
  Upload: () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>),
  Info: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>)
};

const SmartPrinter = ({ onBack, onNotify }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  
  const fileInputRef = useRef(null);

  // 🔴 PDF.js ko background mein load karna taaki PDF render ho sake
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

  const handleUpload = (e) => { 
    if (e.target.files && e.target.files[0]) { 
        const selectedFile = e.target.files[0];
        setFile(selectedFile); 
        setPreview(URL.createObjectURL(selectedFile)); 
        
        if(onNotify) onNotify(null, true); // Haptic
    } 
  };
  
  // --- 🖨️ ADVANCED APP-READY PRINT LOGIC (PDF TO IMAGE ENGINE) ---
  const handlePrint = async () => { 
    if (!file || !preview) return alert("Please upload a file first!"); 
    
    if(onNotify) onNotify("Preparing Document for Print... 🖨️");
    setIsPrinting(true);

    try {
        // Hidden Iframe Create Karna
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const isPdf = file.type.includes('pdf');

        if (isPdf) {
            // 🔴 PDF ENGINE: Convert PDF pages to HD Images for Mobile WebView Print
            if(onNotify) onNotify("Rendering PDF Pages... 📄");
            
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
            
            let htmlContent = '<html><body style="margin:0; padding:0;">';
            
            // Har page ko render karke image tag banana
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const page = await pdfDoc.getPage(i);
                // Scale 2.0 HD print quality ke liye hai
                const viewport = page.getViewport({ scale: 2.0 }); 
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                
                // Image tag mein data daalna
                htmlContent += `<img src="${canvas.toDataURL('image/jpeg', 0.9)}" style="width:100%; display:block; margin:0; padding:0; page-break-after:always;" />`;
            }
            htmlContent += '</body></html>';

            // Iframe mein content likhna
            iframe.contentWindow.document.open();
            iframe.contentWindow.document.write(htmlContent);
            iframe.contentWindow.document.close();

            // Render hone ka thoda wait karna, fir print command dena
            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                setIsPrinting(false);
                setTimeout(() => document.body.removeChild(iframe), 2000);
            }, 1500);

        } else {
            // 🔴 IMAGE ENGINE: Direct Print for JPG/PNG
            const htmlContent = `
                <html>
                    <body style="margin:0; display:flex; justify-content:center; align-items:center;">
                        <img src="${preview}" style="max-width:100%; max-height:100%; object-fit:contain;" onload="window.print();" />
                    </body>
                </html>
            `;
            iframe.contentWindow.document.open();
            iframe.contentWindow.document.write(htmlContent);
            iframe.contentWindow.document.close();

            // Cleanup after print dialog closes
            setTimeout(() => {
                setIsPrinting(false);
                document.body.removeChild(iframe);
            }, 2000);
        }

    } catch (error) {
        console.error("Printing failed:", error);
        if(onNotify) onNotify("Error rendering document for print.");
        alert("Failed to start printing. Please try again.");
        setIsPrinting(false);
    }
  };

  return (
    <div style={{padding:'20px', height:'100%', overflowY:'auto', background:'var(--bg-main)', display:'flex', flexDirection:'column', transition: 'background-color 0.3s ease'}}>
      
      {/* HEADER */}
      <div style={{display:'flex', alignItems:'center', gap:'15px', marginBottom:'20px'}}>
        <button onClick={onBack} style={{background:'var(--bg-card)', border:'1px solid var(--border-color)', color:'var(--text-main)', borderRadius:'50%', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
            <Icons.Back/>
        </button>
        <h2 style={{margin:0, color:'var(--text-main)', fontSize:'22px'}}>Smart Printer</h2>
      </div>

      <div style={{flex:1, display:'flex', flexDirection:'column', gap:'20px', paddingBottom: '80px'}}>
          
          {/* OTG INSTRUCTION CARD */}
          <div style={{background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '16px', padding: '15px', display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
              <div style={{color: '#3b82f6', marginTop: '2px'}}><Icons.Info /></div>
              <div>
                  <h4 style={{margin: '0 0 5px 0', color: '#2563eb', fontSize: '15px'}}>How to Print via USB</h4>
                  <ul style={{margin: 0, paddingLeft: '15px', color: 'var(--text-main)', fontSize: '13px', lineHeight: '1.6'}}>
                      <li>Connect your printer to your phone using an <b>OTG Cable</b>.</li>
                      <li>Go to Phone Settings and <b>Turn ON OTG Connection</b> (Mandatory).</li>
                      <li>Ensure your printer's plugin (e.g. HP, Canon) is installed on your phone.</li>
                  </ul>
              </div>
          </div>

          {/* MAIN WORKSPACE */}
          <div style={{background:'var(--bg-card)', borderRadius:'24px', padding:'25px 20px', display:'flex', flexDirection:'column', alignItems:'center', border:'1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)'}}>
            
            <input type="file" ref={fileInputRef} onChange={handleUpload} style={{display:'none'}} accept="image/*,application/pdf"/>

            {!file ? (
              <label onClick={() => fileInputRef.current.click()} style={{textAlign:'center', cursor:'pointer', width:'100%', padding: '20px 0'}}>
                <div style={{width:'90px', height:'90px', background:'var(--bg-input)', color:'#3b82f6', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px auto', border: '2px dashed var(--border-color)'}}>
                    <Icons.Printer/>
                </div>
                <h3 style={{color:'var(--text-main)', margin:'0 0 5px 0'}}>Select File to Print</h3>
                <p style={{color:'var(--text-muted)', fontSize: '13px', margin: 0}}>Supports PDF, JPG, and PNG</p>
                <button style={{marginTop: '20px', background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: '20px auto 0 auto', cursor: 'pointer'}}>
                    <Icons.Upload /> Browse Files
                </button>
              </label>
            ) : (
              <div style={{textAlign:'center', width:'100%'}}>
                
                {/* FILE PREVIEW ZONE */}
                <div style={{background:'var(--bg-input)', padding: '15px', borderRadius:'15px', marginBottom:'20px', display:'flex', flexDirection:'column', alignItems:'center', border: '1px solid var(--border-color)'}}>
                   <div style={{height:'200px', width: '100%', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', borderRadius: '10px', background: '#fff', marginBottom: '15px', border: '1px solid #e2e8f0'}}>
                       {file.type.includes('image') ? (
                           <img src={preview} style={{maxWidth:'100%', maxHeight:'100%', objectFit:'contain'}} alt="preview"/>
                       ) : (
                           <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#ef4444'}}>
                               <span style={{fontSize:'50px'}}>📄</span>
                               <span style={{fontWeight: 'bold', marginTop: '10px'}}>PDF Document</span>
                           </div>
                       )}
                   </div>
                   <span style={{color: 'var(--text-main)', fontSize: '14px', fontWeight: '600', wordBreak: 'break-all'}}>{file.name}</span>
                </div>
                
                {/* PRINT BUTTON */}
                <button onClick={handlePrint} disabled={isPrinting} style={{width:'100%', padding:'16px', background: isPrinting ? '#94a3b8' : '#10b981', color:'white', borderRadius:'15px', border:'none', fontWeight:'bold', fontSize:'16px', cursor: isPrinting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: isPrinting ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.4)', transition: '0.2s'}}>
                    <Icons.Printer /> {isPrinting ? "Processing..." : "Print Now"}
                </button>
                
                {/* CANCEL/RESELECT BUTTON */}
                <button onClick={() => {setFile(null); setPreview(null)}} style={{marginTop:'20px', background:'none', border:'none', color:'#ef4444', fontWeight:'bold', fontSize: '14px', cursor: 'pointer'}}>
                    Choose Another File
                </button>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default SmartPrinter;