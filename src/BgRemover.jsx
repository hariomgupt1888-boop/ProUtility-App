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
  Upload: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Camera: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Gallery: () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Crop: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/></svg>,
  Background: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Undo: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>,
  Redo: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>,
  Crown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="2 15 2 2 8 8 12 2 16 8 22 2 22 15"/><path d="M2 15h20v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4z"/></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
};

const GAME_TIPS = [
  "Tip: Setting up Pro AI Engine...",
  "Tip: Best quality edges are being calculated.",
  "Tip: We process images for 100% privacy."
];

const BgRemover = ({ onBack, onNotify }) => {
  const [step, setStep] = useState('upload'); 
  const [image, setImage] = useState(null);
  const [imageBlob, setImageBlob] = useState(null); 
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0); 
  const [isPremium, setIsPremium] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Custom Print Configuration
  const [printCopies, setPrintCopies] = useState(6);
  const [photoSize, setPhotoSize] = useState('35x45 mm');

  const [showGuide, setShowGuide] = useState(true); 
  const [bgColor, setBgColor] = useState('transparent'); 
  const [tipIndex, setTipIndex] = useState(0);

  const canvasRef = useRef(null);
  const originalImgRef = useRef(null); 
  const [editMode, setEditMode] = useState('bg'); // Default to BG for instant colors
  const [brushSize, setBrushSize] = useState(30);
  
  const historyRef = useRef([]);
  const redoRef = useRef([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const passportColors = ['transparent', '#005bb5', '#ffffff', '#ff0000', '#38bdf8', '#fbbf24', '#94a3b8'];

  // Auto Close Guide after 5 seconds
  useEffect(() => {
    let timer;
    if (showGuide && step === 'upload') {
      timer = setTimeout(() => setShowGuide(false), 5000);
    }
    return () => clearTimeout(timer);
  }, [showGuide, step]);

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
        // Reduced Max Width slightly to guarantee no memory crash on older phones
        const MAX_WIDTH = 800; 
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

  // 🚀 1. THE PERMANENT DOWNLOADER ENGINE
  const setupOfflineAI = async () => {
    if (!Capacitor.isNativePlatform()) return undefined; 
    
    const assetFolder = 'pro_ai_engine';
    const assets = [
      { url: 'https://unpkg.com/@imgly/background-removal@1.4.5/dist/ort-wasm.wasm', path: `${assetFolder}/ort-wasm.wasm` },
      { url: 'https://unpkg.com/@imgly/background-removal@1.4.5/dist/ort-wasm-simd.wasm', path: `${assetFolder}/ort-wasm-simd.wasm` },
      { url: 'https://unpkg.com/@imgly/background-removal-data@1.4.5/dist/models/small', path: `${assetFolder}/models/small` }
    ];

    try {
      let allExist = true;
      // Step A: Check if files are already permanently saved
      for (const asset of assets) {
        try { 
           await Filesystem.stat({ path: asset.path, directory: Directory.Data }); 
        } catch (e) { 
           allExist = false; 
           break; 
        }
      }

      // Step B: If not saved, download them PERMANENTLY to Directory.Data
      if (!allExist) {
        setSaveStatus("Setting up Pro AI (One-time)...");
        try { await Filesystem.mkdir({ path: `${assetFolder}/models`, directory: Directory.Data, recursive: true }); } catch (e) {}
        
        for (let i = 0; i < assets.length; i++) {
          setDownloadProgress(Math.round(((i + 1) / assets.length) * 100));
          await Filesystem.downloadFile({ 
             url: assets[i].url, 
             path: assets[i].path, 
             directory: Directory.Data 
          });
        }
      }

      // Step C: Generate a local device URL that the AI library can read securely
      const uriRes = await Filesystem.getUri({ path: assetFolder, directory: Directory.Data });
      return Capacitor.convertFileSrc(uriRes.uri) + '/';

    } catch (e) { 
      console.error("Setup Error:", e);
      return undefined; 
    }
  };

  // 🚀 2. THE AI RUNNER
  const runAiRemoval = async () => {
    if (!imageBlob) return; 
    setIsProcessing(true);
    setDownloadProgress(0); 
    setSaveStatus("Initializing...");
    
    try {
      const localPublicPath = await setupOfflineAI();
      
      const config = {
        model: 'small', 
        // Force the AI library to use our permanent local folder instead of the internet!
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
          setStep('edit'); 
          setEditMode('bg'); 
          setIsProcessing(false);
          historyRef.current = [];
          redoRef.current = [];
          setHistoryCount(0);
      }, 500); 
      
    } catch (e) {
      alert("⚠️ Processing Failed: Internet required for first-time setup only.");
      setProcessedImage(image); 
      setStep('edit');
      setEditMode('erase'); 
      setIsProcessing(false);
    }
  };

  // Canvas & Editing Logic
  useEffect(() => {
    if (processedImage && canvasRef.current && step === 'edit') {
      try {
        const ctx = canvasRef.current.getContext('2d');
        const img = new Image();
        img.crossOrigin = "anonymous"; 
        img.onload = () => {
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
          // Enhancing render quality for small model
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0);
          saveHistoryState(); 
        };
        img.src = processedImage;
      } catch (err) {
        console.error("Canvas Render Error:", err);
      }
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
        drawStateToCanvas(historyRef.current[historyRef.current.length - 1]);
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
    if (editMode === 'crop' || editMode === 'bg') {
        isDragging.current = true;
        lastPos.current = { x: e.touches ? e.touches[0].clientX : e.clientX, y: e.touches ? e.touches[0].clientY : e.clientY };
        return;
    }
    isDragging.current = true;
    paint(e);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    if (editMode === 'crop' || editMode === 'bg') {
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
      if (originalImgRef.current) ctx.drawImage(originalImgRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.restore();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const exportImageWithBackground = () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvasRef.current.width;
    exportCanvas.height = canvasRef.current.height;
    const ctx = exportCanvas.getContext('2d');
    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }
    ctx.drawImage(canvasRef.current, 0, 0);
    return exportCanvas.toDataURL('image/png');
  };

  const executeDownload = async (dataUrl, fileName, blob) => {
    try {
      if (Capacitor.isNativePlatform()) {
         try { await Filesystem.requestPermissions(); } catch (e) { }
         const reader = new FileReader();
         reader.readAsDataURL(blob);
         reader.onloadend = async () => {
            const base64Data = reader.result.split(',')[1];
            await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Documents, recursive: true });
            if(onNotify) onNotify("✅ Saved successfully!", false, fileName, 'Image Cutout', blob);
         }
      } else {
         const link = document.createElement('a');
         link.download = fileName;
         link.href = dataUrl;
         link.click();
         if(onNotify) onNotify("✅ Saved to Gallery!");
      }
    } catch (error) {
      alert("⚠️ Save Failed! Allow Storage permissions.");
    } finally {
        setIsSaving(false);
        setSaveStatus("");
    }
  };

  // 🔥 AD LOGIC INCORPORATED IN SAVE
  const handleSave = async () => {
    if (!canvasRef.current || isSaving) return;
    
    setIsSaving(true);
    setSaveStatus("Watching Ad to Save...");
    
    // Simulate 3 seconds Ad duration
    setTimeout(async () => {
        setSaveStatus("Saving Image...");
        const dataUrl = exportImageWithBackground();
        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const finalName = `ProPassport_${Date.now()}.png`;
            await executeDownload(dataUrl, finalName, blob);
        } catch (e) { 
            alert("Failed to process image."); 
            setIsSaving(false);
        }
    }, 3000);
  };

  const checkerboardStyle = {
    backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] font-sans flex flex-col relative overflow-hidden text-white">
      
      {/* 1. AUTO-CLOSING GUIDE MODAL (WITH CROSS) */}
      {showGuide && step === 'upload' && (
        <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => setShowGuide(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full">
               <Icons.Close />
            </button>
            <h2 className="text-2xl font-black text-gray-900 mb-2 text-center mt-2">Photo Guide 📸</h2>
            <p className="text-gray-500 text-sm mb-6 text-center">Perfect passport in 3 simple rules</p>
            
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                <span className="text-xl">✅</span>
                <p className="text-sm font-semibold text-gray-700">Look straight at the camera.</p>
              </div>
              <div className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                <span className="text-xl">☀️</span>
                <p className="text-sm font-semibold text-gray-700">Ensure good face lighting.</p>
              </div>
              <div className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                <span className="text-xl">👤</span>
                <p className="text-sm font-semibold text-gray-700">Single person in the photo.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. LOADING & AD OVERLAY */}
      {(isProcessing || isSaving) && (
         <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 flex-col text-center">
            {isSaving && saveStatus.includes("Ad") ? (
               // FAKE AD UI
               <div className="flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-transparent border-t-yellow-400 rounded-full animate-spin mb-6"></div>
                  <h2 className="text-2xl font-bold text-white mb-2">Sponsor Message</h2>
                  <p className="text-gray-400 text-sm">{saveStatus}</p>
               </div>
            ) : isProcessing ? (
              <div className="bg-gray-900/90 p-8 rounded-3xl border border-blue-500/30 flex flex-col items-center shadow-2xl">
                 <div className="w-20 h-20 mb-6 relative flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-blue-500 rounded-full animate-spin"></div>
                    <span className="font-black text-xl text-white">{downloadProgress}%</span>
                 </div>
                 <h2 className="text-lg font-bold text-white mb-2">{saveStatus || "Processing..."}</h2>
                 <p className="text-xs text-red-400 font-bold mb-2">⚠️ Please do not close the app</p>
                 <p className="text-xs text-gray-400 italic max-w-[200px]">{GAME_TIPS[tipIndex]}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-transparent border-t-green-500 rounded-full animate-spin mb-4"></div>
                <span className="font-bold text-xl text-green-400">{saveStatus}</span>
              </div>
            )}
         </div>
      )}

      {/* 3. TOP HEADER */}
      <div className="flex justify-between items-center p-4 shrink-0 bg-[#0a0f1d]">
        <div className="flex items-center gap-2">
            <button onClick={() => step === 'upload' ? onBack() : setStep(step === 'print' ? 'edit' : 'upload')} className="p-1"><Icons.Back/></button>
            <span className="font-bold text-lg tracking-wide">{step === 'upload' ? 'Select Image' : step === 'print' ? 'Print Settings' : 'Edit Photo'}</span>
        </div>
        <button onClick={() => setIsPremium(!isPremium)} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${isPremium ? 'bg-amber-500 text-white' : 'bg-white/10 text-white'}`}>
            <Icons.Crown/> {isPremium ? "Pro" : "Free"}
        </button>
      </div>

      <input ref={galleryInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
      <input ref={cameraInputRef} type="file" className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />

      {/* 4. MAIN BODY (Flex-1 avoids overlap) */}
      <div className="flex-1 bg-[#151b2b] rounded-t-[2.5rem] flex flex-col relative overflow-hidden shadow-inner w-full max-w-md mx-auto">
         
         <div className="absolute inset-0 opacity-20 pointer-events-none" style={checkerboardStyle}></div>

         {/* STEP A: CAMERA & GALLERY SELECTION */}
         {step === 'upload' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 overflow-y-auto">
                
                <div className="w-full max-w-sm mb-12">
                   <div className="aspect-[3/4] border-2 border-dashed border-blue-500/30 rounded-[2rem] bg-blue-500/5 flex flex-col items-center justify-center shadow-lg">
                      <Icons.Upload />
                      <p className="mt-4 text-gray-400 font-medium text-center px-4">Upload a clear photo with good lighting</p>
                   </div>
                </div>

                {/* Bottom Action Sheet for Camera/Gallery */}
                <div className="w-full flex gap-4 mt-auto pb-4">
                   <button onClick={() => cameraInputRef.current.click()} className="flex-1 bg-gray-800 hover:bg-gray-700 py-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-transform active:scale-95 border border-gray-700 shadow-xl">
                      <div className="text-blue-400"><Icons.Camera /></div>
                      <span className="font-bold text-sm">Camera</span>
                   </button>
                   <button onClick={() => galleryInputRef.current.click()} className="flex-1 bg-gray-800 hover:bg-gray-700 py-5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-transform active:scale-95 border border-gray-700 shadow-xl">
                      <div className="text-blue-400"><Icons.Gallery /></div>
                      <span className="font-bold text-sm">Gallery</span>
                   </button>
                </div>
            </div>
         )}

         {/* STEP B: PREVIEW */}
         {step === 'preview' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 overflow-y-auto">
                <img src={image} className="max-w-full max-h-[50vh] object-contain rounded-2xl shadow-2xl mb-10 border-4 border-gray-700" alt="Original" />
                <button onClick={runAiRemoval} className="bg-blue-600 text-white w-full py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95">
                    <Icons.Check /> Remove Background
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
                           className="max-w-[90vw] max-h-[50vh] touch-none shadow-2xl transition-all" 
                           style={{ backgroundColor: bgColor === 'transparent' ? 'transparent' : bgColor }}
                           onMouseDown={resetPath} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp} onTouchStart={resetPath} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}
                        />
                    </div>
                </div>

                {/* Bottom Tools Sheet */}
                <div className="bg-[#0a0f1d] rounded-t-[2.5rem] p-5 pb-6 flex flex-col gap-4 shadow-2xl shrink-0 border-t border-gray-800 z-20">
                    
                    {/* Tool Settings Row */}
                    <div className="flex justify-between items-center h-[50px]">
                        <div className="flex gap-1 pr-2">
                            <button onClick={handleUndo} disabled={historyCount <= 1} className={`p-2 ${historyCount <= 1 ? 'text-gray-700' : 'text-gray-300 hover:text-white'}`}><Icons.Undo/></button>
                            <button onClick={handleRedo} disabled={redoRef.current.length === 0} className={`p-2 ${redoRef.current.length === 0 ? 'text-gray-700' : 'text-gray-300 hover:text-white'}`}><Icons.Redo/></button>
                        </div>

                        <div className="flex-1 flex items-center justify-end overflow-x-auto no-scrollbar">
                            {(editMode === 'erase' || editMode === 'restore') && (
                                <div className="flex items-center gap-3 w-full justify-end">
                                    <div className="bg-white rounded-full border-2 border-blue-500" style={{ width: Math.max(10, brushSize/2.5), height: Math.max(10, brushSize/2.5) }}></div>
                                    <input type="range" min="10" max="100" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-32 accent-blue-500" />
                                </div>
                            )}

                            {editMode === 'crop' && (
                                <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                                    <span>Pinch/Drag to Crop & Pan</span>
                                </div>
                            )}

                            {editMode === 'bg' && (
                                <div className="flex gap-3 overflow-x-auto pb-1 px-1 snap-x">
                                    {passportColors.map((color, idx) => (
                                        <button 
                                            key={idx} onClick={() => setBgColor(color)}
                                            className={`snap-center flex-shrink-0 w-9 h-9 rounded-full border-2 transition-all ${bgColor === color ? 'border-white scale-110' : 'border-gray-700'}`}
                                            style={{ backgroundColor: color, backgroundImage: color === 'transparent' ? checkerboardStyle.backgroundImage : 'none', backgroundSize: '8px 8px' }}
                                        ></button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Tools Nav */}
                    <div className="flex justify-around items-center pt-2 pb-2 bg-gray-900/50 rounded-2xl border border-gray-800 p-2">
                        <button onClick={() => setEditMode('crop')} className={`flex flex-col items-center gap-1.5 ${editMode === 'crop' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-200'}`}>
                            <Icons.Crop /> <span className="text-[10px] font-bold">Crop/Pan</span>
                        </button>
                        <button onClick={() => setEditMode('bg')} className={`flex flex-col items-center gap-1.5 ${editMode === 'bg' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                            <Icons.Background /> <span className="text-[10px] font-bold">Background</span>
                        </button>
                        <button onClick={() => setEditMode('restore')} className={`flex flex-col items-center gap-1.5 ${editMode === 'restore' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-200'}`}>
                            <Icons.Brush /> <span className="text-[10px] font-bold">Restore</span>
                        </button>
                        <button onClick={() => setEditMode('erase')} className={`flex flex-col items-center gap-1.5 ${editMode === 'erase' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-200'}`}>
                            <Icons.Eraser /> <span className="text-[10px] font-bold">Eraser</span>
                        </button>
                    </div>

                    <button onClick={() => setStep('print')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl text-[15px] shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-colors mt-2">
                        Configure Layout 🖨️
                    </button>
                </div>
            </div>
         )}

         {/* STEP D: CUSTOM PRINT & COPIES SCREEN */}
         {step === 'print' && (
            <div className="flex-1 flex flex-col bg-[#0a0f1d] p-4 h-full z-10">
              
              <div className="flex-1 bg-gray-100 rounded-2xl shadow-inner p-4 overflow-y-auto mb-4 border border-gray-700 flex flex-col">
                <div className="w-full flex justify-between text-gray-500 text-xs font-bold mb-4 uppercase">
                    <span>{photoSize}</span>
                    <span>Preview</span>
                </div>
                {/* Dynamic Grid Layout based on 'printCopies' */}
                <div className={`grid gap-2 ${printCopies <= 4 ? 'grid-cols-2' : printCopies <= 9 ? 'grid-cols-3' : 'grid-cols-4'} w-full mx-auto pb-4`}>
                  {Array.from({ length: printCopies }).map((_, i) => (
                    <div 
                      key={i} 
                      className="aspect-[3/4] border-[1px] border-dashed border-gray-400 flex items-end justify-center overflow-hidden shadow-sm"
                      style={{ backgroundColor: bgColor === 'transparent' ? '#ffffff' : bgColor }}
                    >
                      <img src={exportImageWithBackground()} alt={`copy-${i}`} className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Layout Panel */}
              <div className="bg-gray-900 rounded-3xl p-5 text-white shrink-0 shadow-2xl border border-gray-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 text-sm font-medium">Photo Size</span>
                  <select 
                     value={photoSize} 
                     onChange={(e) => setPhotoSize(e.target.value)}
                     className="bg-gray-800 text-white text-sm font-bold border border-gray-700 rounded-lg px-3 py-1.5 focus:outline-none"
                  >
                     <option value="35x45 mm">35x45 mm (India/UK)</option>
                     <option value="2x2 in">2x2 in (US Visa)</option>
                     <option value="30x40 mm">30x40 mm (UAE)</option>
                     <option value="45x60 mm">45x60 mm (Russia)</option>
                  </select>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-400 text-sm font-medium">Number of Copies</span>
                  <div className="flex items-center gap-4 bg-gray-800 rounded-lg px-2 border border-gray-700">
                      <button onClick={() => setPrintCopies(Math.max(1, printCopies - 1))} className="p-1 text-xl font-bold text-gray-400 hover:text-white">-</button>
                      <span className="font-bold text-lg w-6 text-center">{printCopies}</span>
                      <button onClick={() => setPrintCopies(Math.min(24, printCopies + 1))} className="p-1 text-xl font-bold text-gray-400 hover:text-white">+</button>
                  </div>
                </div>

                <button onClick={handleSave} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                  <span className="text-xl">💾</span> Save HD Format
                </button>
              </div>
            </div>
         )}
      </div>

    </div>
  );
};

export default BgRemover;