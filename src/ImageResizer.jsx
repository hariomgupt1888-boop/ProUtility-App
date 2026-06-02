import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core'; 
import { Filesystem, Directory } from '@capacitor/filesystem'; 
import { Media } from '@capacitor-community/media'; 
import { 
  ArrowLeft, Upload, Zap, FileBarChart, Sliders, 
  ChevronRight, ArrowRight 
} from 'lucide-react';

const Icons = {
  Crown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="2 15 2 2 8 8 12 2 16 8 22 2 22 15"/><path d="M2 15h20v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4z"/></svg>
};

const ImageResizer = ({ onBack, onNotify }) => {
  const [images, setImages] = useState([]);
  const [activeTab, setActiveTab] = useState('quick'); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isPremium, setIsPremium] = useState(false);
  const [status, setStatus] = useState("");

  const [settings, setSettings] = useState({
    quality: 0.7,
    targetKB: 100,
    width: 1080,
    height: 1920,
    manualQuality: 0.8
  });

  const [previewInfo, setPreviewInfo] = useState({ original: 0, compressed: 0 });

  // --- LOGIC ---
  const handleUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        url: URL.createObjectURL(file),
        file: file,
        size: (file.size / 1024).toFixed(0)
      }));
      setImages(newImages);
      if(onNotify) onNotify(null, true);
    }
  };

  useEffect(() => {
    if (images.length === 0) return;
    
    const originalKB = parseInt(images[0].size);
    let estimatedKB = originalKB;

    if (activeTab === 'quick') {
       estimatedKB = Math.floor(originalKB * (settings.quality * 1.2));
    } else if (activeTab === 'size') {
       estimatedKB = settings.targetKB;
    } else if (activeTab === 'manual') {
       estimatedKB = Math.floor(originalKB * settings.manualQuality);
    }

    setPreviewInfo({
      original: originalKB,
      compressed: Math.max(10, Math.min(estimatedKB, originalKB)) 
    });
  }, [images, settings, activeTab]);


  const compressSingleImage = async (url, originalFile) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let w = img.width, h = img.height, q = settings.quality;

        if (activeTab === 'manual') {
          w = parseInt(settings.width) || img.width;
          h = parseInt(settings.height) || img.height;
          q = settings.manualQuality;
        } else if (activeTab === 'size') {
          const scale = Math.min(1, Math.sqrt(settings.targetKB * 1024 / originalFile.size));
          w = img.width * scale;
          h = img.height * scale;
          q = 0.7; 
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', q);
      };
    });
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  // --- 🔴 THE FIX: Advanced Fallback Save Logic for Batch Images ---
  const checkInternetAndDownload = async (fileList) => {
    const executeDownload = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
           setStatus("Saving Images...");
           
           try {
               await Filesystem.requestPermissions();
           } catch (permErr) {
               console.log("Permission bypass: ", permErr);
           }

           let savedToDocs = false;

           for (const item of fileList) {
             const base64Data = await blobToBase64(item.blob);
             const uniqueName = `ProUtility_Resized_${Date.now()}_${Math.floor(Math.random()*1000)}.jpg`;
             
             try {
               // Koshish 1: Save to Gallery
               const savedFile = await Filesystem.writeFile({
                 path: uniqueName,
                 data: base64Data,
                 directory: Directory.Cache 
               });
               await Media.savePhoto({ path: savedFile.uri });
             } catch (mediaErr) {
               // Koshish 2: Fallback to Documents
               console.log("Gallery save failed, falling back to Documents...", mediaErr);
               await Filesystem.writeFile({
                 path: uniqueName,
                 data: base64Data,
                 directory: Directory.Documents
               });
               savedToDocs = true;
             }
           }
           
           // Notify user based on where it was saved
           if (savedToDocs) {
               alert("✅ Saved to Documents!\nSince Gallery permission was denied, we safely saved your images in your phone's Documents folder.");
           } else {
               if (onNotify) onNotify("Images Saved to Gallery! 🖼️", false);
           }

        } 
        else {
           // Web Fallback
           for (const item of fileList) {
               const link = document.createElement('a');
               link.href = URL.createObjectURL(item.blob);
               link.download = item.fileName;
               link.click();
               await new Promise(r => setTimeout(r, 200));
           }
        }

      } catch (error) {
        console.error("Critical Save Error: ", error);
        alert("⚠️ Save Failed!\nPlease allow Storage permissions from your phone's App Settings.");
      } finally {
        // 🧹 JHAADU (Cleanup)
        setIsProcessing(false);
        setStatus("");
        setImages([]); // Ek baar save ho gaya toh screen saaf kar do
      }
    };

    // 👑 Ad Gate Logic
    if (isPremium) {
      await executeDownload();
      return;
    }

    if (navigator.onLine) {
      setStatus("Loading Ad...");
      setTimeout(async () => { await executeDownload(); }, 2000); 
    } else {
      alert("⚠️ Internet Required!\n\nFree users need internet to save images. Enable internet to watch a quick Ad, or Upgrade to Premium for offline saving.");
      setIsProcessing(false);
      setStatus("");
    }
  };

  const handleSave = async () => {
    setIsProcessing(true);
    setStatus("Compressing...");
    
    try {
        const processedFiles = [];
        for (const imgObj of images) {
          const blob = await compressSingleImage(imgObj.url, imgObj.file);
          processedFiles.push({
              blob: blob,
              fileName: `min-${imgObj.file.name}`
          });
        }
        await checkInternetAndDownload(processedFiles);
    } catch (err) {
        console.error("Compression Error", err);
        alert("Failed to compress images.");
        setIsProcessing(false);
        setStatus("");
    }
  };

  // --- STYLES ---
  const containerStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: '#09090b', color: 'white', zIndex: 100, display: 'flex', flexDirection: 'column'
  };

  const bottomSheetStyle = {
    backgroundColor: '#18181b', borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
    padding: '24px', paddingBottom: '100px', boxShadow: '0 -4px 20px rgba(0,0,0,0.5)'
  };

  const tabStyle = (isActive) => ({
    flex: 1, padding: '12px', textAlign: 'center', cursor: 'pointer',
    borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
    color: isActive ? '#60a5fa' : '#71717a', fontWeight: 'bold', fontSize: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    touchAction: 'manipulation'
  });

  const buttonStyle = (isActive) => ({
    flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 'bold', border: '1px solid',
    backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : '#27272a',
    borderColor: isActive ? '#3b82f6' : 'transparent',
    color: isActive ? '#60a5fa' : '#71717a', cursor: 'pointer', touchAction: 'manipulation'
  });

  return (
    <div style={containerStyle}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      
      {isProcessing && (
        <div style={{position: 'absolute', inset: 0, backgroundColor: 'rgba(9,9,11,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10000}}>
            <div style={{width: '45px', height: '45px', border: '4px solid #3b82f6', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            <span style={{color: 'white', marginTop: '20px', fontWeight: 'bold', fontSize: '18px'}}>{status}</span>
        </div>
      )}

      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #27272a' }}>
        <div style={{display:'flex', alignItems:'center'}}>
            <button onClick={onBack} style={{ padding: '8px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', touchAction: 'manipulation' }}>
            <ArrowLeft size={24} />
            </button>
            <h2 style={{ marginLeft: '12px', fontSize: '18px', fontWeight: 'bold' }}>Compress Image</h2>
        </div>

        <button onClick={() => setIsPremium(!isPremium)} style={{padding: '6px 12px', borderRadius:'20px', border:'none', background: isPremium ? '#f59e0b' : '#27272a', color: isPremium ? '#fff' : '#71717a', fontWeight: 'bold', fontSize: '12px', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer', touchAction: 'manipulation'}}>
            <Icons.Crown/> {isPremium ? "Premium" : "Free"}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
        {images.length === 0 ? (
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px', cursor: 'pointer' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', backgroundColor: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Upload size={32} color="#71717a" />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Select Images</span>
            <span style={{ color: '#71717a', fontSize: '14px' }}>Tap to browse gallery</span>
            <input type="file" className="hidden" multiple accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        ) : (
          <div style={{ width: '100%', maxWidth: '300px' }}>
            <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', border: '1px solid #27272a', backgroundColor: '#000' }}>
              <img src={images[0].url} style={{ width: '100%', height: '250px', objectFit: 'contain' }} />
              
              <div style={{ position: 'absolute', bottom: '12px', right: '12px', backgroundColor: 'rgba(0,0,0,0.8)', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '12px', color: '#a1a1aa', textDecoration: 'line-through' }}>{previewInfo.original} KB</span>
                <ArrowRight size={12} color="#fff" />
                <span style={{ fontSize: '14px', color: '#4ade80', fontWeight: 'bold' }}>{previewInfo.compressed} KB</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div style={bottomSheetStyle} className="animate-in slide-in-from-bottom duration-300">
          
          <div style={{ display: 'flex', marginBottom: '24px' }}>
            <div onClick={() => { setActiveTab('quick'); if(onNotify) onNotify(null, true); }} style={tabStyle(activeTab === 'quick')}><Zap size={16}/> Quick</div>
            <div onClick={() => { setActiveTab('size'); if(onNotify) onNotify(null, true); }} style={tabStyle(activeTab === 'size')}><FileBarChart size={16}/> Size</div>
            <div onClick={() => { setActiveTab('manual'); if(onNotify) onNotify(null, true); }} style={tabStyle(activeTab === 'manual')}><Sliders size={16}/> Manual</div>
          </div>

          <div>
            {activeTab === 'quick' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setSettings({...settings, quality: 0.9})} style={buttonStyle(settings.quality === 0.9)}>Low</button>
                  <button onClick={() => setSettings({...settings, quality: 0.7})} style={buttonStyle(settings.quality === 0.7)}>Medium</button>
                  <button onClick={() => setSettings({...settings, quality: 0.5})} style={buttonStyle(settings.quality === 0.5)}>High</button>
                </div>
                <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', color: '#71717a', fontSize: '12px', marginBottom: '8px' }}><span>Best Quality</span><span>Small Size</span></div>
                   <input type="range" min="10" max="90" value={(1-settings.quality)*100} onChange={(e) => setSettings({...settings, quality: 1-(e.target.value/100)})} style={{ width: '100%', accentColor: '#3b82f6' }} />
                </div>
              </div>
            )}

            {activeTab === 'size' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {[100, 200, 500].map(kb => (
                   <button key={kb} onClick={() => setSettings({...settings, targetKB: kb})} style={buttonStyle(settings.targetKB === kb)}>{kb} KB</button>
                ))}
                <div style={{ position: 'relative' }}>
                   <input type="number" value={settings.targetKB} onChange={(e) => setSettings({...settings, targetKB: Number(e.target.value)})} style={{ width: '100%', height: '100%', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '12px', color: 'white', paddingLeft: '12px', fontWeight: 'bold' }} />
                   <span style={{ position: 'absolute', right: '10px', top: '14px', fontSize: '10px', color: '#71717a' }}>KB</span>
                </div>
              </div>
            )}

            {activeTab === 'manual' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                   <label style={{ fontSize: '12px', color: '#71717a' }}>Width</label>
                   <input type="number" value={settings.width} onChange={(e) => setSettings({...settings, width: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: '#27272a', border: 'none', borderRadius: '12px', color: 'white' }} />
                </div>
                <div style={{ flex: 1 }}>
                   <label style={{ fontSize: '12px', color: '#71717a' }}>Height</label>
                   <input type="number" value={settings.height} onChange={(e) => setSettings({...settings, height: e.target.value})} style={{ width: '100%', padding: '12px', backgroundColor: '#27272a', border: 'none', borderRadius: '12px', color: 'white' }} />
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleSave} 
            disabled={isProcessing}
            style={{ 
              width: '100%', padding: '16px', backgroundColor: '#2563eb', color: 'white', 
              border: 'none', borderRadius: '16px', fontWeight: 'bold', fontSize: '16px',
              marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer', opacity: isProcessing ? 0.7 : 1, touchAction: 'manipulation'
            }}
          >
            {isProcessing ? 'Compressing...' : <>Save Images <ChevronRight size={20}/></>}
          </button>

        </div>
      )}
    </div>
  );
};

export default ImageResizer;