import React, { useState, useRef, useEffect } from 'react';
import { removeBackground } from "@imgly/background-removal";
import { Capacitor } from '@capacitor/core'; 
import { Filesystem, Directory } from '@capacitor/filesystem'; 

// --- 100% Native SVG Icons ---
const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Eraser: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20.5H9" /><path d="M8.7 6.7l10.6 10.6c.9.9.9 2.5 0 3.4v0c-.9.9-2.5.9-3.4 0L5.3 10.1c-.9-.9-.9-2.5 0-3.4v0c.9-.9 2.5-.9 3.4 0z" /></svg>,
  Brush: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 4.5l-2.8 2.8" /><path d="M2 2l4.5 4.5" /><path d="M9 9l4 4" /><path d="M10 10l-2.5 2.5a2.5 2.5 0 0 0 3.5 3.5l2.5-2.5" /></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>,
  Upload: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Move: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="19 9 22 12 19 15"/><polyline points="9 19 12 22 15 19"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>,
  Undo: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>,
  Redo: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>,
  Crown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="2 15 2 2 8 8 12 2 16 8 22 2 22 15"/><path d="M2 15h20v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4z"/></svg>
};

const BgRemover = ({ onBack, onNotify }) => {
  const [image, setImage] = useState(null);
  const [imageBlob, setImageBlob] = useState(null); 
  
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0); 
  
  const [isPremium, setIsPremium] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const canvasRef = useRef(null);
  const originalImgRef = useRef(null); 
  
  const [editMode, setEditMode] = useState('move'); 
  const [brushSize, setBrushSize] = useState(30);
  
  const historyRef = useRef([]);
  const redoRef = useRef([]);
  const [historyCount, setHistoryCount] = useState(0);

  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!image && fileInputRef.current) fileInputRef.current.click();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const img = new Image();
      img.crossOrigin = "anonymous"; 
      
      img.onload = () => {
        const MAX_WIDTH = 800;
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const url = canvas.toDataURL('image/jpeg', 0.8);
        setImage(url);
        
        canvas.toBlob((blob) => {
            setImageBlob(blob);
        }, 'image/jpeg', 0.8);
        
        originalImgRef.current = new Image();
        originalImgRef.current.crossOrigin = "anonymous";
        originalImgRef.current.src = url;
      };
      img.src = URL.createObjectURL(file);
      setProcessedImage(null);
      e.target.value = null; 
    }
  };

  // 🔴 YAHAN AAPKA AI DOWNLOAD FIX HAI
  const runAiRemoval = async () => {
    if (!imageBlob) return; 
    setIsProcessing(true);
    setDownloadProgress(0); 
    
    try {
      const config = {
        // 🔴 Path ko "https" force kiya hai taaki Capacitor Android me block na ho
        publicPath: "https://static.imgly.com/@imgly/background-removal/1.4.3/dist/", 
        model: 'small', 
        device: 'cpu', 
        progress: (key, current, total) => {
            const percent = Math.round((current / total) * 100);
            setDownloadProgress(percent);
        }
      };
      
      const blob = await removeBackground(imageBlob, config);
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
      setEditMode('move'); 
      
      historyRef.current = [];
      redoRef.current = [];
      setHistoryCount(0);
      
    } catch (e) {
      console.error("AI Error:", e);
      if (onNotify) onNotify("⚠️ AI couldn't detect subject. Switched to Manual Mode.");
      
      setProcessedImage(image); 
      setEditMode('erase'); 
      historyRef.current = [];
      redoRef.current = [];
      setHistoryCount(0);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (processedImage && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      const img = new Image();
      img.crossOrigin = "anonymous"; 
      img.onload = () => {
        canvasRef.current.width = img.width;
        canvasRef.current.height = img.height;
        ctx.drawImage(img, 0, 0);
        saveHistoryState(); 
      };
      img.src = processedImage;
    }
  }, [processedImage]);

  const saveHistoryState = () => {
    if (canvasRef.current) {
        redoRef.current = [];
        if(historyRef.current.length > 15) historyRef.current.shift(); 
        const stateUrl = canvasRef.current.toDataURL('image/png'); 
        historyRef.current.push(stateUrl);
        setHistoryCount(historyRef.current.length);
    }
  };

  const drawStateToCanvas = (stateUrl) => {
      const img = new Image();
      img.onload = () => {
          if(!canvasRef.current) return;
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(img, 0, 0);
      };
      img.src = stateUrl;
  };

  const handleUndo = () => {
    if (historyRef.current.length > 1) {
        const currentState = historyRef.current.pop();
        redoRef.current.push(currentState);
        const prevState = historyRef.current[historyRef.current.length - 1];
        drawStateToCanvas(prevState);
        setHistoryCount(historyRef.current.length);
    }
  };

  const handleRedo = () => {
      if (redoRef.current.length > 0) {
          const nextState = redoRef.current.pop();
          historyRef.current.push(nextState);
          drawStateToCanvas(nextState);
          setHistoryCount(historyRef.current.length);
      }
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const handlePointerDown = (e) => {
    if (!editMode || editMode === 'move') {
        isDragging.current = true;
        lastPos.current = { x: e.touches ? e.touches[0].clientX : e.clientX, y: e.touches ? e.touches[0].clientY : e.clientY };
        return;
    }
    isDragging.current = true;
    paint(e);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault(); 
    if (editMode === 'move') {
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      setTransform(t => ({ ...t, x: t.x + (cx - lastPos.current.x), y: t.y + (cy - lastPos.current.y) }));
      lastPos.current = { x: cx, y: cy };
      return;
    }
    paint(e);
  };

  const handlePointerUp = () => { 
      if(isDragging.current && (editMode === 'erase' || editMode === 'restore')){ saveHistoryState(); }
      isDragging.current = false; 
  };

  const paint = (e) => {
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getCanvasCoords(e);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;

    if (editMode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (editMode === 'restore') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.clip();
      if (originalImgRef.current) {
         ctx.drawImage(originalImgRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const resetPath = (e) => {
      if(editMode === 'erase' || editMode === 'restore'){
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        handlePointerDown(e);
      } else { handlePointerDown(e); }
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
  };

  const executeDownload = async (dataUrl, fileName, blob) => {
    try {
      if (Capacitor.isNativePlatform()) {
         setIsSaving(true);
         setSaveStatus("Saving to Phone...");
         try { await Filesystem.requestPermissions(); } catch (e) { }

         const base64Data = await blobToBase64(blob);
         
         await Filesystem.writeFile({
           path: fileName,
           data: base64Data,
           directory: Directory.Documents,
           recursive: true
         });
         
         if(onNotify) onNotify("✅ Saved successfully to Documents folder!", false);
      } else {
         const link = document.createElement('a');
         link.download = fileName;
         link.href = dataUrl;
         link.click();
      }
    } catch (error) {
      console.error("Save Error:", error);
      alert("⚠️ Save Failed!\nPlease allow Storage permissions from your phone's App Settings.");
    } finally {
        // 🧹 CLEANUP (Jhaadu)
        setIsSaving(false);
        setSaveStatus("");
        setImage(null);
        setImageBlob(null);
        setProcessedImage(null);
    }
  };

  const handleSave = async () => {
    if (canvasRef.current && !isSaving) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const finalName = `ProUtility_Cutout_${Date.now()}.png`;

            // 👑 PREMIUM & AD GATE LOGIC
            if (isPremium) {
              await executeDownload(dataUrl, finalName, blob);
            } else {
              if (navigator.onLine) {
                setIsSaving(true);
                setSaveStatus("Loading Ad...");
                setTimeout(async () => { await executeDownload(dataUrl, finalName, blob); }, 2000); 
              } else {
                alert("⚠️ Internet Required for Free Users.");
              }
            }

        } catch (e) {
            alert("Failed to process image.");
        }
    }
  };

  const S = {
    wrapper: { position: 'fixed', inset: 0, background: '#0f172a', display: 'flex', flexDirection: 'column', zIndex: 9999, color: 'white', touchAction: 'none', userSelect: 'none' },
    header: { height: '60px', background: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 15px', borderBottom: '1px solid #334155' },
    workArea: { flex: 1, position: 'relative', overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    checkerboard: { position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)', backgroundSize: '20px 20px' },
    container: { transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: 'center', transition: isDragging.current ? 'none' : 'transform 0.1s', position: 'relative' },
    ghostImg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: editMode === 'restore' ? 0.4 : 0, transition: 'opacity 0.3s', pointerEvents: 'none' },
    
    // 🔴 FIX FOR AD MOB BANNER
    bottomBar: { background: '#1e293b', borderTop: '1px solid #334155', paddingBottom: '90px' }, 
    
    actionRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', background: '#0f172a', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' },
    undoGroup: { display: 'flex', gap: '20px' },
    sliderWrapper: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '15px' },
    sliderPreview: { background:'white', borderRadius:'50%', border:'2px solid #2563eb', transition:'0.1s' },
    sliderInput: { width: '130px', accentColor: '#2563eb', height: '4px', cursor:'pointer' },
    tabBar: { display: 'flex', justifyContent: 'space-around', padding: '15px 10px' },
    tabBtn: (isActive) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: isActive ? '#3b82f6' : '#94a3b8', background: 'none', border: 'none', fontSize: '12px', fontWeight: '600', minWidth: '70px', cursor:'pointer' })
  };

  return (
    <div style={S.wrapper}>
      <style>{`.spinner { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      
      {/* 🔴 NAYA BEAUTIFUL PROGRESS UI */}
      {(isProcessing || isSaving) && (
         <div style={{position:'absolute', zIndex:50, inset:0, background:'rgba(15,23,42,0.95)', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: '20px', textAlign: 'center'}}>
             
             {isProcessing ? (
               <>
                 <h2 style={{color: '#f8fafc', marginBottom: '30px', fontSize: '22px'}}>AI Magic in Progress</h2>
                 {/* Premium Progress Bar */}
                 <div style={{width: '100%', maxWidth: '280px', background: '#334155', borderRadius: '20px', height: '14px', overflow: 'hidden', boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)'}}>
                     <div style={{width: `${downloadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #ec4899)', transition: 'width 0.3s ease', borderRadius: '20px'}}></div>
                 </div>
                 
                 <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '280px', marginTop: '10px'}}>
                    <span style={{fontSize:'14px', color:'#94a3b8', fontWeight: 'bold'}}>{downloadProgress < 100 ? 'Downloading Model...' : 'Applying AI...'}</span>
                    <span style={{fontSize:'14px', color:'#3b82f6', fontWeight: 'bold'}}>{downloadProgress}%</span>
                 </div>

                 {downloadProgress < 100 && (
                   <p style={{fontSize:'12px', color:'#64748b', marginTop:'20px', maxWidth: '250px'}}>
                     Downloading AI components (once). Please ensure your internet is active.
                   </p>
                 )}
               </>
             ) : (
               <>
                 <div style={{width: '45px', height: '45px', border: '4px solid #3b82f6', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
                 <span style={{marginTop:'20px', fontWeight:'bold', fontSize:'18px', color:'#f8fafc'}}>{saveStatus}</span>
               </>
             )}
         </div>
      )}

      <div style={S.header}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <button onClick={onBack} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}><Icons.Back/></button>
            <span style={{fontWeight:'bold', fontSize:'16px'}}>BG Remover</span>
        </div>
        
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <button onClick={() => setIsPremium(!isPremium)} style={{padding: '6px 12px', borderRadius:'20px', border:'none', background: isPremium ? '#f59e0b' : '#e2e8f0', color: isPremium ? '#fff' : '#64748b', fontWeight: 'bold', fontSize: '12px', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer'}}>
                <Icons.Crown/> {isPremium ? "Premium" : "Free"}
            </button>

            {processedImage && (
                <button onClick={handleSave} disabled={isSaving} style={{background:'#2563eb', padding:'6px 16px', borderRadius:'20px', border:'none', color:'white', fontSize:'14px', fontWeight:'bold', cursor:'pointer'}}>
                    Save
                </button>
            )}
        </div>
      </div>

      <div style={S.workArea}>
         <div style={S.checkerboard}></div>
         
         {!image ? (
            <div onClick={() => fileInputRef.current.click()} style={{background:'#1e293b', padding:'40px', borderRadius:'24px', border:'2px dashed #475569', display:'flex', flexDirection:'column', alignItems:'center', cursor:'pointer'}}>
               <Icons.Upload />
               <p style={{color:'#f8fafc', fontWeight:'bold', marginTop:'15px', fontSize:'16px'}}>Tap to Upload</p>
               <input ref={fileInputRef} type="file" style={{display:'none'}} accept="image/*" onChange={handleImageUpload} />
            </div>
         ) : (
            <>
               {processedImage ? (
                  <div style={S.container}>
                      <img src={image} style={S.ghostImg} alt="ref" />
                      <canvas 
                          ref={canvasRef} 
                          style={{ maxWidth: '95vw', maxHeight: '75vh', touchAction: 'none' }}
                          onMouseDown={resetPath} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}
                          onTouchStart={resetPath} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}
                      />
                  </div>
               ) : (
                  <img src={image} style={{maxWidth:'95%', maxHeight:'80%', objectFit:'contain', borderRadius:'12px', boxShadow:'0 10px 30px rgba(0,0,0,0.5)'}} alt="Original" />
               )}
            </>
         )}
      </div>

      <div style={S.bottomBar}>
         {processedImage && (
             <div style={S.actionRow}>
                 <div style={S.undoGroup}>
                     <button onClick={handleUndo} disabled={historyCount <= 1} style={{background:'none', border:'none', color: historyCount <= 1 ? '#475569' : 'white', cursor:'pointer'}}><Icons.Undo/></button>
                     <button onClick={handleRedo} disabled={redoRef.current.length === 0} style={{background:'none', border:'none', color: redoRef.current.length === 0 ? '#475569' : 'white', cursor:'pointer'}}><Icons.Redo/></button>
                 </div>

                 {(editMode === 'erase' || editMode === 'restore') && (
                     <div style={S.sliderWrapper}>
                         <div style={{...S.sliderPreview, width: Math.max(10, brushSize/2), height: Math.max(10, brushSize/2)}}></div>
                         <input type="range" min="10" max="100" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} style={S.sliderInput} />
                     </div>
                 )}
             </div>
         )}

         {processedImage ? (
             <div style={S.tabBar}>
                 <button style={S.tabBtn(editMode === 'move')} onClick={() => setEditMode('move')}><Icons.Move /><span>Move</span></button>
                 <button style={S.tabBtn(editMode === 'restore')} onClick={() => setEditMode('restore')}><Icons.Brush /><span>Restore</span></button>
                 <button style={S.tabBtn(editMode === 'erase')} onClick={() => setEditMode('erase')}><Icons.Eraser /><span>Eraser</span></button>
             </div>
         ) : (
             <div style={{padding:'20px', display:'flex', justifyContent:'center'}}>
                 <button 
                     onClick={runAiRemoval} 
                     disabled={!image || isProcessing}
                     style={{background: image ? '#2563eb' : '#334155', color:'white', border:'none', padding:'16px 40px', borderRadius:'30px', fontWeight:'bold', fontSize:'16px', display:'flex', alignItems:'center', gap:'10px', boxShadow: image ? '0 4px 15px rgba(37,99,235,0.4)' : 'none'}}
                 >
                     {isProcessing ? null : <Icons.Check />} 
                     {isProcessing ? 'Processing AI...' : 'Start Cutout'}
                 </button>
             </div>
         )}
      </div>
    </div>
  );
};

export default BgRemover;