import React, { useState, useRef, useEffect } from 'react';
import { removeBackground } from "@imgly/background-removal";
import { Capacitor } from '@capacitor/core'; 
import { Filesystem, Directory } from '@capacitor/filesystem'; 

// --- ICONS ---
const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Eraser: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20.5H9" /><path d="M8.7 6.7l10.6 10.6c.9.9.9 2.5 0 3.4v0c-.9.9-2.5.9-3.4 0L5.3 10.1c-.9-.9-.9-2.5 0-3.4v0c.9-.9 2.5-.9 3.4 0z" /></svg>,
  Brush: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 4.5l-2.8 2.8" /><path d="M2 2l4.5 4.5" /><path d="M9 9l4 4" /><path d="M10 10l-2.5 2.5a2.5 2.5 0 0 0 3.5 3.5l2.5-2.5" /></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>,
  Upload: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Move: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="19 9 22 12 19 15"/><polyline points="9 19 12 22 15 19"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>,
  Undo: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>,
  Redo: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>,
  Crown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="2 15 2 2 8 8 12 2 16 8 22 2 22 15"/><path d="M2 15h20v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4z"/></svg>,
  Bulb: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1.65.68 2.8 1.5 3.5.76.76 1.23 1.52 1.41 2.5"/></svg>,
  UserFocus: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>,
  ImageSquare: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Border: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="7" y="7" width="10" height="10" rx="1" strokeDasharray="2 2"/></svg>
};

const GAME_TIPS = [
  "Tip: Setting up Pro AI Engine for the first time...",
  "Tip: Best quality edges are being calculated.",
  "Tip: We process images for 100% privacy.",
  "Tip: ProUtility never uploads your data to any server."
];

const BgRemover = ({ onBack, onNotify }) => {
  // Application Flow State
  const [step, setStep] = useState('upload'); // 'upload', 'preview', 'edit', 'print'
  
  // Image & Processing States
  const [image, setImage] = useState(null);
  const [imageBlob, setImageBlob] = useState(null); 
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0); 
  const [isPremium, setIsPremium] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(false); 
  const [bgColor, setBgColor] = useState('transparent'); 
  const [tipIndex, setTipIndex] = useState(0);

  // Canvas & Editing Refs
  const canvasRef = useRef(null);
  const originalImgRef = useRef(null); 
  const [editMode, setEditMode] = useState('move'); // 'move', 'erase', 'restore', 'border'
  const [brushSize, setBrushSize] = useState(30);
  const [borderWidth, setBorderWidth] = useState(0);
  
  // History Refs for Undo/Redo
  const historyRef = useRef([]);
  const redoRef = useRef([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  
  // Pointer Events Refs
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef(null);

  const passportColors = ['transparent', '#005bb5', '#ffffff', '#ff0000', '#f87171', '#4ade80', '#a855f7', '#64748b'];

  useEffect(() => {
    let interval;
    if (isProcessing) {
      interval = setInterval(() => { setTipIndex((prev) => (prev + 1) % GAME_TIPS.length); }, 3000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const img = new Image();
      img.crossOrigin = "anonymous"; 
      img.onload = () => {
        const MAX_WIDTH = 1000; 
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const url = canvas.toDataURL('image/jpeg', 0.9);
        setImage(url);
        canvas.toBlob((blob) => { setImageBlob(blob); }, 'image/jpeg', 0.9);
        
        originalImgRef.current = new Image();
        originalImgRef.current.crossOrigin = "anonymous";
        originalImgRef.current.src = url;
      };
      img.src = URL.createObjectURL(file);
      setProcessedImage(null);
      setBgColor('transparent');
      setStep('preview');
      e.target.value = null; 
    }
  };

  // 🔥 THE SMART FILESYSTEM DOWNLOADER (Offline Engine)
  const setupOfflineAI = async () => {
    if (!Capacitor.isNativePlatform()) return undefined; 
    const assetFolder = 'pro_ai_engine';
    const assets = [
      { url: 'https://unpkg.com/@imgly/background-removal@1.4.5/dist/ort-wasm.wasm', path: `${assetFolder}/ort-wasm.wasm` },
      { url: 'https://unpkg.com/@imgly/background-removal@1.4.5/dist/ort-wasm-simd.wasm', path: `${assetFolder}/ort-wasm-simd.wasm` },
      { url: 'https://unpkg.com/@imgly/background-removal-data@1.4.5/dist/models/medium', path: `${assetFolder}/models/medium` }
    ];

    try {
      let allExist = true;
      for (const asset of assets) {
        try { await Filesystem.stat({ path: asset.path, directory: Directory.Data }); } 
        catch (e) { allExist = false; break; }
      }

      if (!allExist) {
        setSaveStatus("Setting up Pro AI...");
        try { await Filesystem.mkdir({ path: `${assetFolder}/models`, directory: Directory.Data, recursive: true }); } catch (e) {}
        for (let i = 0; i < assets.length; i++) {
          setDownloadProgress(Math.round(((i + 1) / assets.length) * 100));
          await Filesystem.downloadFile({ url: assets[i].url, path: assets[i].path, directory: Directory.Data });
        }
      }
      const uriRes = await Filesystem.getUri({ path: assetFolder, directory: Directory.Data });
      return Capacitor.convertFileSrc(uriRes.uri) + '/';
    } catch (e) { return undefined; }
  };

  const runAiRemoval = async () => {
    if (!imageBlob) return; 
    setIsProcessing(true);
    setDownloadProgress(0); 
    setSaveStatus("Initializing...");
    
    try {
      const localPublicPath = await setupOfflineAI();
      const config = {
        model: 'medium', 
        ...(localPublicPath && { publicPath: localPublicPath }),
        progress: (key, current, total) => {
            const percent = Math.round((current / total) * 100);
            if (key.includes('compute')) setSaveStatus("Extracting Portrait...");
            setDownloadProgress(percent > 99 ? 99 : percent);
        }
      };
      
      const blob = await removeBackground(imageBlob, config);
      const url = URL.createObjectURL(blob);
      setDownloadProgress(100); 
      setSaveStatus(""); 
      
      setTimeout(() => {
          setProcessedImage(url);
          setStep('edit'); // Move to Edit Workspace
          setEditMode('move'); 
          setIsProcessing(false);
          historyRef.current = [];
          redoRef.current = [];
          setHistoryCount(0);
      }, 500); 
      
    } catch (e) {
      alert("⚠️ Request Failed: Please check internet for one-time setup.");
      if (onNotify) onNotify("⚠️ AI couldn't complete. Switched to Manual.");
      setProcessedImage(image); 
      setStep('edit');
      setEditMode('erase'); 
      setIsProcessing(false);
      setSaveStatus("");
    }
  };

  const getProgressText = () => {
    if (saveStatus !== "") return saveStatus; 
    if (downloadProgress < 85) return "Processing Pixels...";
    if (downloadProgress < 100) return "Finalizing Edges...";
    return "Magic Applied! ✨";
  };

  // --- CANVAS DRAWING LOGIC (Erase & Restore) ---
  useEffect(() => {
    if (processedImage && canvasRef.current && step === 'edit') {
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
  }, [processedImage, step]);

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
    if (!editMode || editMode === 'move' || editMode === 'border') {
        isDragging.current = true;
        lastPos.current = { x: e.touches ? e.touches[0].clientX : e.clientX, y: e.touches ? e.touches[0].clientY : e.clientY };
        return;
    }
    isDragging.current = true;
    paint(e);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    if (editMode === 'move' || editMode === 'border') {
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      setTransform(t => ({ ...t, x: t.x + (cx - lastPos.current.x), y: t.y + (cy - lastPos.current.y) }));
      lastPos.current = { x: cx, y: cy };
      return;
    }
    e.preventDefault(); 
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

  // --- EXPORT & SAVE LOGIC ---
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
  };

  const exportImageWithBackground = () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvasRef.current.width;
    exportCanvas.height = canvasRef.current.height;
    const ctx = exportCanvas.getContext('2d');
    
    // Draw Background Color
    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }
    
    // Draw Border if applied
    if (borderWidth > 0) {
       ctx.shadowColor = 'white';
       ctx.shadowBlur = borderWidth * 2;
       ctx.shadowOffsetX = 0;
       ctx.shadowOffsetY = 0;
    }
    
    ctx.drawImage(canvasRef.current, 0, 0);
    return exportCanvas.toDataURL('image/png');
  };

  const executeDownload = async (dataUrl, fileName, blob) => {
    try {
      if (Capacitor.isNativePlatform()) {
         setIsSaving(true);
         setSaveStatus("Saving to Phone...");
         try { await Filesystem.requestPermissions(); } catch (e) { }
         const base64Data = await blobToBase64(blob);
         await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Documents, recursive: true });
         if(onNotify) onNotify("✅ Saved successfully!", false, fileName, 'Image Cutout', blob);
      } else {
         const link = document.createElement('a');
         link.download = fileName;
         link.href = dataUrl;
         link.click();
         if(onNotify) onNotify("✅ Downloaded!");
      }
    } catch (error) {
      alert("⚠️ Save Failed!\nPlease allow Storage permissions.");
    } finally {
        setIsSaving(false);
        setSaveStatus("");
    }
  };

  const handleSave = async () => {
    if (canvasRef.current && !isSaving) {
        const dataUrl = exportImageWithBackground();
        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const finalName = `ProPassport_${Date.now()}.png`;

            if (isPremium) {
              await executeDownload(dataUrl, finalName, blob);
            } else {
              if (navigator.onLine) {
                setIsSaving(true);
                setSaveStatus("Saving Print...");
                setTimeout(async () => { await executeDownload(dataUrl, finalName, blob); }, 2000); 
              } else { alert("⚠️ Internet Required for Free Users."); }
            }
        } catch (e) { alert("Failed to process image."); }
    }
  };

  // Helper for Checkerboard UI
  const checkerboardStyle = {
    backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
  };

  // ==========================================
  // 🌟 THE ULTIMATE PREMIUM UI (Tailwind Based)
  // ==========================================
  return (
    <div className="min-h-screen bg-blue-600 font-sans flex flex-col relative overflow-hidden text-white">
      
      {/* 1. PERFECT ENGLISH GUIDE MODAL */}
      {showGuide && step === 'upload' && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fade-in-up">
            <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">Passport Photo Tips 📸</h2>
            <p className="text-gray-500 text-sm mb-6 text-center">Follow these rules for a perfect cutout</p>
            
            <div className="space-y-4 text-left mb-8">
              <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                <div className="mt-1"><Icons.Bulb /></div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Optimal Lighting</h4>
                  <p className="text-xs text-gray-600">Ensure uniform lighting on your face from both sides.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                <div className="mt-1"><Icons.UserFocus /></div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Straight Posture</h4>
                  <p className="text-xs text-gray-600">Keep your device at eye level and look straight.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                <div className="mt-1"><Icons.ImageSquare /></div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Clear Background</h4>
                  <p className="text-xs text-gray-600">Use a plain background for highest AI precision.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => { setShowGuide(false); fileInputRef.current.click(); }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-95"
            >
              Got it! Open Camera
            </button>
          </div>
        </div>
      )}

      {/* 2. LOADING & PROCESSING OVERLAY */}
      {(isProcessing || isSaving) && (
         <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 flex-col text-center">
            {isProcessing ? (
              <div className="bg-gray-900/90 p-8 rounded-3xl border border-blue-500/30 shadow-[0_0_50px_rgba(37,99,235,0.3)] flex flex-col items-center">
                 <div className="w-20 h-20 mb-6 relative flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-blue-500 rounded-full animate-spin"></div>
                    <span className="font-black text-xl text-white">{downloadProgress}%</span>
                 </div>
                 <h2 className="text-lg font-bold text-white mb-4">{getProgressText()}</h2>
                 <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
                 </div>
                 <p className="text-xs text-gray-400 italic max-w-[200px]">{GAME_TIPS[tipIndex]}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <span className="font-bold text-xl">{saveStatus}</span>
              </div>
            )}
         </div>
      )}

      {/* 3. TOP HEADER (Shrink-0 to prevent squash) */}
      <div className="flex justify-between items-center p-4 shrink-0">
        <div className="flex items-center gap-2">
            <button onClick={() => step === 'upload' ? onBack() : setStep(step === 'print' ? 'edit' : 'upload')} className="p-1"><Icons.Back/></button>
            <span className="font-bold text-lg tracking-wide">
              {step === 'upload' ? 'Pro Passport Maker' : step === 'print' ? 'Print & Copies' : 'Change Background'}
            </span>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={() => setIsPremium(!isPremium)} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${isPremium ? 'bg-amber-500 text-white' : 'bg-white/20 text-white'}`}>
                <Icons.Crown/> {isPremium ? "Pro" : "Free"}
            </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />

      {/* 4. MAIN BODY (Flex-1 and overflow-hidden to fix overlap) */}
      <div className="flex-1 bg-gray-50 rounded-t-[2.5rem] flex flex-col relative overflow-hidden shadow-[0_-10px_20px_rgba(0,0,0,0.1)] w-full max-w-md mx-auto">
         
         {/* Checkerboard Pattern Base */}
         <div className="absolute inset-0 opacity-40 pointer-events-none" style={checkerboardStyle}></div>

         {/* STEP A: UPLOAD UI */}
         {step === 'upload' && (
            <div className="flex-1 flex items-center justify-center p-6 z-10 overflow-y-auto">
                <div onClick={() => setShowGuide(true)} className="w-full max-w-xs aspect-square border-2 border-dashed border-blue-400 bg-blue-50/80 hover:bg-blue-100 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all shadow-sm">
                   <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md mb-4"><Icons.Upload /></div>
                   <p className="text-xl font-bold text-gray-800">Upload Photo</p>
                   <p className="text-sm text-gray-500 mt-2">Choose from gallery</p>
                </div>
            </div>
         )}

         {/* STEP B: PREVIEW BEFORE PROCESSING */}
         {step === 'preview' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 overflow-y-auto">
                <img src={image} className="max-w-full max-h-[50vh] object-contain rounded-2xl shadow-xl mb-8 border-4 border-white" alt="Original" />
                <button onClick={runAiRemoval} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_10px_20px_rgba(37,99,235,0.3)] flex items-center gap-3 transition-transform active:scale-95">
                    <Icons.Check /> Generate Passport Photo
                </button>
            </div>
         )}

         {/* STEP C: EDITOR UI */}
         {step === 'edit' && (
            <div className="flex-1 flex flex-col z-10 h-full">
                
                {/* Canvas Area */}
                <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
                    <div style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: 'center', transition: isDragging.current ? 'none' : 'transform 0.1s', position: 'relative' }}>
                        
                        <img src={image} className="absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-300" style={{ opacity: editMode === 'restore' ? 0.3 : 0 }} alt="ref" />
                        
                        <canvas 
                           ref={canvasRef} 
                           className="max-w-[90vw] max-h-[50vh] touch-none shadow-2xl border-2 border-white/50 transition-all" 
                           style={{ 
                             backgroundColor: bgColor === 'transparent' ? 'transparent' : bgColor,
                             // Inshot Style Border Effect (Drop Shadow)
                             filter: borderWidth > 0 ? `drop-shadow(0px 0px ${borderWidth}px rgba(255,255,255,1))` : 'none'
                           }}
                           onMouseDown={resetPath} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp} onTouchStart={resetPath} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}
                        />
                    </div>
                </div>

                {/* Bottom Tools Sheet (Dark) - shrink-0 to prevent squashing */}
                <div className="bg-[#0f172a] rounded-t-[2.5rem] p-5 pb-6 flex flex-col gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] shrink-0">
                    
                    {/* Dynamic Sub-menu based on active tool */}
                    <div className="flex justify-between items-center bg-gray-800/50 p-2 rounded-2xl h-[60px]">
                        
                        {/* Undo/Redo Buttons (Always visible on left) */}
                        <div className="flex gap-2 px-2 border-r border-gray-700 pr-4">
                            <button onClick={handleUndo} disabled={historyCount <= 1} className={`p-2 ${historyCount <= 1 ? 'text-gray-600' : 'text-white'}`}><Icons.Undo/></button>
                            <button onClick={handleRedo} disabled={redoRef.current.length === 0} className={`p-2 ${redoRef.current.length === 0 ? 'text-gray-600' : 'text-white'}`}><Icons.Redo/></button>
                        </div>

                        {/* Contextual Slider/Options */}
                        <div className="flex-1 flex items-center justify-end pr-2 overflow-x-auto">
                            {(editMode === 'erase' || editMode === 'restore') && (
                                <div className="flex items-center gap-3 w-full justify-end pl-4">
                                    <div className="bg-white rounded-full border-2 border-blue-500" style={{ width: Math.max(10, brushSize/2.5), height: Math.max(10, brushSize/2.5) }}></div>
                                    <input type="range" min="10" max="100" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-32 accent-blue-500 h-1 cursor-pointer" />
                                </div>
                            )}

                            {editMode === 'border' && (
                                <div className="flex items-center gap-3 w-full justify-end pl-4">
                                    <span className="text-xs text-gray-400 font-bold">Border Size</span>
                                    <input type="range" min="0" max="15" value={borderWidth} onChange={e => setBorderWidth(Number(e.target.value))} className="w-32 accent-white h-1 cursor-pointer" />
                                </div>
                            )}

                            {editMode === 'move' && (
                                <div className="flex gap-2 overflow-x-auto pb-1 px-2 snap-x">
                                    {passportColors.map((color, idx) => (
                                        <button 
                                            key={idx} onClick={() => setBgColor(color)}
                                            className={`snap-center flex-shrink-0 w-8 h-8 rounded-full border-2 transition-transform ${bgColor === color ? 'border-blue-500 scale-125' : 'border-gray-600'}`}
                                            style={{ backgroundColor: color, backgroundImage: color === 'transparent' ? checkerboardStyle.backgroundImage : 'none', backgroundSize: '8px 8px' }}
                                        ></button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Editing Tools Bar */}
                    <div className="flex justify-around items-center pt-2 pb-2">
                        <button onClick={() => setEditMode('move')} className={`flex flex-col items-center gap-1.5 ${editMode === 'move' ? 'text-blue-500' : 'text-gray-400'}`}>
                            <Icons.Move /> <span className="text-[10px] font-bold">Move/BG</span>
                        </button>
                        <button onClick={() => setEditMode('border')} className={`flex flex-col items-center gap-1.5 ${editMode === 'border' ? 'text-white' : 'text-gray-400'}`}>
                            <Icons.Border /> <span className="text-[10px] font-bold">Border</span>
                        </button>
                        <button onClick={() => setEditMode('restore')} className={`flex flex-col items-center gap-1.5 ${editMode === 'restore' ? 'text-blue-500' : 'text-gray-400'}`}>
                            <Icons.Brush /> <span className="text-[10px] font-bold">Restore</span>
                        </button>
                        <button onClick={() => setEditMode('erase')} className={`flex flex-col items-center gap-1.5 ${editMode === 'erase' ? 'text-blue-500' : 'text-gray-400'}`}>
                            <Icons.Eraser /> <span className="text-[10px] font-bold">Eraser</span>
                        </button>
                    </div>

                    {/* Go to Print Button */}
                    <button 
                        onClick={() => setStep('print')} 
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-[15px] shadow-lg transition-colors mt-2"
                    >
                        Generate A4 Print 🖨️
                    </button>
                </div>
            </div>
         )}

         {/* STEP D: PRINT & COPIES SCREEN */}
         {step === 'print' && (
            <div className="flex-1 flex flex-col bg-[#0f172a] p-4 h-full z-10">
              
              {/* A4 Sheet Representation Area */}
              <div className="flex-1 bg-white rounded-xl shadow-2xl p-4 overflow-y-auto mb-4 border-2 border-gray-700">
                <div className="grid grid-cols-3 gap-2">
                  {/* Rendering 12 Copies on the sheet */}
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="aspect-[3/4] border-[1px] border-dashed border-gray-300 flex items-end justify-center overflow-hidden"
                      style={{ backgroundColor: bgColor === 'transparent' ? '#ffffff' : bgColor }}
                    >
                      <img 
                         src={exportImageWithBackground()} 
                         alt={`copy-${i}`} 
                         className="w-full h-full object-contain" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Print Settings & Action Buttons */}
              <div className="bg-gray-800 rounded-2xl p-5 text-white shrink-0 shadow-lg border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 text-sm font-medium">Paper Size:</span>
                  <span className="font-bold bg-blue-600/30 text-blue-400 px-3 py-1 rounded-lg text-sm border border-blue-500/50">A4 Standard</span>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-400 text-sm font-medium">Total Copies:</span>
                  <span className="font-bold text-lg">12</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/50">
                    <span className="text-xl">💾</span> {isSaving ? 'Saving...' : 'Save HD'}
                  </button>
                  <button onClick={() => window.print()} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/50">
                    <span className="text-xl">🖨️</span> Print
                  </button>
                </div>
              </div>
            </div>
         )}
      </div>

      {/* 5. ADVERTISEMENT PLACEHOLDER (Safe Area at Bottom) */}
      <div className="w-full h-14 bg-gray-200 shrink-0 flex items-center justify-center border-t border-gray-300 z-50">
        <span className="text-xs text-gray-500 font-bold tracking-widest uppercase">
          Advertisement Placeholder
        </span>
      </div>

    </div>
  );
};

export default BgRemover;