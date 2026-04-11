import React, { useState, useRef, useEffect } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

// --- 100% NATIVE SVG ICONS ---
const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Download: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Upload: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Sun: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Contrast: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20Z" fill="currentColor"/></svg>,
  Droplet: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
  Grayscale: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="12" cy="12" r="4"/></svg>,
  Rotate: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
  FlipH: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M8 5l-5 7 5 7"/><path d="M16 5l5 7-5 7"/></svg>,
  FlipV: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h20"/><path d="M5 8l7-5 7 5"/><path d="M5 16l7 5 7-5"/></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M5 12H3"/><path d="M21 12h-2"/><path d="M6.34" y1="17.66" x2="4.93" y2="19.07"/><path d="M19.07" y1="4.93" x2="17.66" y2="6.34"/><path d="M6.34" y1="6.34" x2="4.93" y2="4.93"/><path d="M19.07" y1="19.07" x2="17.66" y2="17.66"/></svg>,
  Transform: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9h18v6H3z"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>,
  Crop: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>,
  Check: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  Crown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="2 15 2 2 8 8 12 2 16 8 22 2 22 15"/><path d="M2 15h20v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4z"/></svg>
};

const DEFAULT_SETTINGS = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, rotate: 0, flipX: 1, flipY: 1 };

const PhotoEditor = ({ onBack, onNotify }) => {
  const [image, setImage] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState('adjust'); 
  const [activeFilter, setActiveFilter] = useState('brightness');
  const [isCropMode, setIsCropMode] = useState(false);

  // --- PREMIUM & AD GATEKEEPER STATES ---
  const [isPremium, setIsPremium] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");

  const fileInputRef = useRef(null);
  const cropperRef = useRef(null);

  useEffect(() => { if (!image && fileInputRef.current) fileInputRef.current.click(); }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url); setSettings(DEFAULT_SETTINGS); setIsCropMode(false);
      e.target.value = null; 
      
      if(onNotify) onNotify(null, true);
    }
  };

  const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));
  const handleRotate = () => setSettings(prev => ({ ...prev, rotate: prev.rotate + 90 }));
  const handleFlip = (axis) => {
    if (axis === 'x') updateSetting('flipX', settings.flipX === 1 ? -1 : 1);
    if (axis === 'y') updateSetting('flipY', settings.flipY === 1 ? -1 : 1);
  };

  const handleCropConfirm = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      const croppedDataUrl = cropper.getCroppedCanvas().toDataURL('image/jpeg', 1.0);
      setImage(croppedDataUrl); 
      setIsCropMode(false); 
      if(onNotify) onNotify(null, true); 
    }
  };

  // --- 🔥 THE AD & PREMIUM GATEKEEPER LOGIC ---
  const checkInternetAndDownload = (dataUrl, fileName, blob) => {
    const executeDownload = () => {
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      setIsProcessing(false);
      setStatus("");
      
      // 🔴 NAYA: Passed blob to onNotify
      if(onNotify) onNotify("Photo Saved! ✅", false, fileName, "Edited Photo", blob);
    };

    if (isPremium) {
      executeDownload();
      return;
    }

    if (navigator.onLine) {
      setIsProcessing(true);
      setStatus("Loading Ad...");
      
      setTimeout(() => {
        executeDownload();
      }, 2000); 
    } else {
      alert("⚠️ Internet Required!\n\nFree users need internet to save images. Enable internet to watch a quick Ad, or Upgrade to Premium for offline saving.");
    }
  };

  // --- CANVAS EXPORT ENGINE ---
  const handleSave = () => {
    if (!image || isProcessing) return;
    
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const isRotated = settings.rotate % 180 !== 0;
      canvas.width = isRotated ? img.height : img.width;
      canvas.height = isRotated ? img.width : img.height;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((settings.rotate * Math.PI) / 180);
      ctx.scale(settings.flipX, settings.flipY);
      ctx.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%) grayscale(${settings.grayscale}%)`;
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
      
      // 🔴 THE FIX: Convert DataURL to Blob
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        // Pass blob to the gatekeeper
        checkInternetAndDownload(dataUrl, 'ProUtility_Edited.jpg', blob);
      } catch (err) {
        console.error("Failed to convert to blob", err);
        alert("Failed to save image.");
      }
    };
    img.src = image;
  };

  const getPreviewStyle = () => ({
    filter: `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%) grayscale(${settings.grayscale}%)`,
    transform: `rotate(${settings.rotate}deg) scale(${settings.flipX}, ${settings.flipY})`,
    transition: isCropMode ? 'none' : 'transform 0.3s ease',
    maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
    borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    display: isCropMode ? 'none' : 'block' 
  });

  const S = {
    wrapper: { position: 'fixed', inset: 0, backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', zIndex: 9999, color: 'white', userSelect: 'none', fontFamily: 'sans-serif' },
    header: { height: '60px', backgroundColor: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 15px', borderBottom: '1px solid #334155', zIndex: 10 },
    workArea: { flex: 1, position: 'relative', overflow: 'hidden', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617' },
    checkerboard: { position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)', backgroundSize: '20px 20px' },
    controlsArea: { backgroundColor: '#1e293b', padding: '20px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', display: 'flex', flexDirection: 'column', gap: '15px', borderTop: '1px solid #334155', paddingBottom: 'calc(15px + env(safe-area-inset-bottom))' },
    tabBar: { display: 'flex', background: '#0f172a', borderRadius: '12px', padding: '4px', marginBottom: '5px' },
    tabBtn: (isActive) => ({ flex: 1, padding: '10px', background: isActive ? '#1e293b' : 'transparent', color: isActive ? 'white' : '#64748b', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }),
    optBtn: (isActive) => ({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px', minWidth: '65px', borderRadius: '12px', background: isActive ? '#3b82f6' : '#334155', color: isActive ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer', transition: '0.2s' }),
  };

  return (
    <div style={S.wrapper}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>

      {/* AD PROCESSING OVERLAY */}
      {isProcessing && (
        <div style={{position: 'absolute', inset: 0, backgroundColor: 'rgba(15,23,42,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10000}}>
            <div style={{width: '45px', height: '45px', border: '4px solid #3b82f6', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            <span style={{color: 'white', marginTop: '20px', fontWeight: 'bold', fontSize: '18px'}}>{status}</span>
            <span style={{color: '#94a3b8', fontSize: '12px', marginTop: '8px'}}>Please wait...</span>
        </div>
      )}

      <input type="file" ref={fileInputRef} style={{display:'none'}} accept="image/*" onChange={handleImageUpload} />

      {/* HEADER */}
      <div style={S.header}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <button onClick={onBack} style={{background:'none', border:'none', color:'white'}}><Icons.Back/></button>
            <span style={{fontWeight:'bold', fontSize:'16px'}}>Editor Pro</span>
        </div>
        
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <button onClick={() => setIsPremium(!isPremium)} style={{padding: '6px 12px', borderRadius:'20px', border:'none', background: isPremium ? '#f59e0b' : '#e2e8f0', color: isPremium ? '#fff' : '#64748b', fontWeight: 'bold', fontSize: '12px', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer'}}>
                <Icons.Crown/> {isPremium ? "Premium" : "Free"}
            </button>

            {image && !isCropMode ? (
                <button onClick={handleSave} disabled={isProcessing} style={{background:'#3b82f6', color:'white', padding:'6px 16px', borderRadius:'20px', border:'none', fontWeight:'bold', display:'flex', gap:'5px', alignItems:'center', opacity: isProcessing ? 0.5 : 1}}>
                    Save <Icons.Download />
                </button>
            ) : isCropMode ? (
                <button onClick={handleCropConfirm} style={{background:'#10b981', color:'white', padding:'6px 16px', borderRadius:'20px', border:'none', fontWeight:'bold', display:'flex', gap:'5px', alignItems:'center'}}>
                    Done <Icons.Check />
                </button>
            ) : null}
        </div>
      </div>

      {/* WORKSPACE */}
      <div style={S.workArea}>
         <div style={S.checkerboard}></div>
         {!image ? (
            <div onClick={() => fileInputRef.current.click()} style={{background:'#1e293b', padding:'40px', borderRadius:'24px', border:'2px dashed #475569', display:'flex', flexDirection:'column', alignItems:'center', cursor:'pointer', zIndex: 5}}>
               <Icons.Upload /><p style={{color:'#f8fafc', fontWeight:'bold', marginTop:'15px'}}>Select Photo</p>
            </div>
         ) : (
            <>
                {isCropMode && (
                    <Cropper
                        src={image}
                        style={{ height: '100%', width: '100%' }}
                        ref={cropperRef}
                        guides={true} 
                        viewMode={1} 
                        background={false} 
                        responsive={true}
                        autoCropArea={0.8} 
                    />
                )}
                <img src={image} style={getPreviewStyle()} alt="Preview" />
            </>
         )}
      </div>

      {/* CONTROLS */}
      {image && (
        <div style={S.controlsArea}>
            <div style={S.tabBar}>
                <button style={S.tabBtn(activeTab === 'adjust' && !isCropMode)} onClick={() => { setActiveTab('adjust'); setIsCropMode(false); }}> Adjust </button>
                <button style={S.tabBtn(activeTab === 'transform' && !isCropMode)} onClick={() => { setActiveTab('transform'); setIsCropMode(false); }}> Transform </button>
                <button style={S.tabBtn(isCropMode)} onClick={() => setIsCropMode(true)}> Crop </button>
            </div>

            {!isCropMode && activeTab === 'adjust' && (
                <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', textTransform: 'capitalize', fontWeight:'bold' }}><span>{activeFilter}</span><span>{settings[activeFilter]}</span></div>
                        <input type="range" min={activeFilter === 'grayscale' ? "0" : "0"} max={activeFilter === 'grayscale' ? "100" : "200"} value={settings[activeFilter]} onChange={(e) => updateSetting(activeFilter, Number(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6', cursor:'pointer' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                        <button style={S.optBtn(activeFilter === 'brightness')} onClick={() => setActiveFilter('brightness')}> <Icons.Sun /> <span style={{fontSize:'10px'}}>Bright</span> </button>
                        <button style={S.optBtn(activeFilter === 'contrast')} onClick={() => setActiveFilter('contrast')}> <Icons.Contrast /> <span style={{fontSize:'10px'}}>Contrast</span> </button>
                        <button style={S.optBtn(activeFilter === 'saturation')} onClick={() => setActiveFilter('saturation')}> <Icons.Droplet /> <span style={{fontSize:'10px'}}>Saturate</span> </button>
                        <button style={S.optBtn(activeFilter === 'grayscale')} onClick={() => setActiveFilter('grayscale')}> <Icons.Grayscale /> <span style={{fontSize:'10px'}}>B & W</span> </button>
                    </div>
                </>
            )}

            {!isCropMode && activeTab === 'transform' && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                    <button style={S.optBtn(false)} onClick={handleRotate}> <Icons.Rotate /> <span style={{fontSize:'10px'}}>Rotate</span> </button>
                    <button style={S.optBtn(false)} onClick={() => handleFlip('x')}> <Icons.FlipH /> <span style={{fontSize:'10px'}}>Flip H</span> </button>
                    <button style={S.optBtn(false)} onClick={() => handleFlip('y')}> <Icons.FlipV /> <span style={{fontSize:'10px'}}>Flip V</span> </button>
                </div>
            )}

            {isCropMode && (
                <div style={{color:'#94a3b8', fontSize:'13px', fontWeight:'bold', textAlign:'center', padding:'10px'}}>
                    Adjust the box corners to crop. Tap 'Done' in header to confirm.
                </div>
            )}

            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid #334155', paddingTop:'10px', marginTop:'5px'}}>
                <button onClick={() => {setSettings(DEFAULT_SETTINGS); setIsCropMode(false);}} style={{background:'none', border:'none', color:'#ef4444', fontWeight:'bold', fontSize:'13px', cursor:'pointer'}}>Reset</button>
                <button onClick={() => {setImage(null); fileInputRef.current.click();}} style={{background:'none', border:'none', color:'#3b82f6', fontWeight:'bold', fontSize:'13px', cursor:'pointer'}}>Change Photo</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default PhotoEditor;