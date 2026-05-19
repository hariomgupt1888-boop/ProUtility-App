import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { Capacitor } from '@capacitor/core'; 
import { Filesystem, Directory } from '@capacitor/filesystem'; 

// --- 100% NATIVE ICONS ---
const Icons = {
  Back: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Camera: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Gallery: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Trash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Plus: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  PDF: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Crown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="2 15 2 2 8 8 12 2 16 8 22 2 22 15"/><path d="M2 15h20v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4z"/></svg>,
  Crop: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>,
  Check: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  // 🔴 NAYA: Professional Crop Toolbar Icons
  RotateLeft: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
  RotateRight: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>,
  Reset: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 8v4l3 3"/></svg>
};

const DocScanner = ({ onBack, onNotify }) => {
  const [pages, setPages] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [applyToAll, setApplyToAll] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const [isCropMode, setIsCropMode] = useState(false);
  const cropperRef = useRef(null);

  const [isPremium, setIsPremium] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [pdfName, setPdfName] = useState("ProUtility_Document");
  const [showAddMenu, setShowAddMenu] = useState(false);

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // --- 🪄 MAGIC CANVAS ENGINE ---
  const applyMagicFilter = (imgSrc, filterType, contrastLevel) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        let cVal = contrastLevel / 100;

        if (filterType === 'original') ctx.filter = `contrast(${cVal})`;
        else if (filterType === 'grayscale') ctx.filter = `grayscale(100%) contrast(${cVal + 0.2})`;
        else if (filterType === 'b&w') ctx.filter = `grayscale(100%) contrast(${cVal + 1.5}) brightness(1.15)`;
        else if (filterType === 'magic') ctx.filter = `contrast(${cVal + 0.4}) brightness(1.15) saturate(1.8)`;

        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = imgSrc;
    });
  };

  useEffect(() => {
    if (pages.length > 0 && pages[activeIndex] && !isCropMode) {
        const activePage = pages[activeIndex];
        applyMagicFilter(activePage.src, activePage.filter, activePage.contrast).then(setPreviewData);
    } else {
        setPreviewData(null);
    }
  }, [pages, activeIndex, isCropMode]);

  // --- FILE HANDLING ---
  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPages = [];
    files.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      newPages.push({ id: Date.now() + index, src: url, filter: 'magic', contrast: 100 });
    });

    setPages(prev => [...prev, ...newPages]);
    setActiveIndex(pages.length); 
    e.target.value = null; 
    if(onNotify) onNotify(null, true); 
  };

  const removePage = (indexToRemove) => {
      const updated = pages.filter((_, idx) => idx !== indexToRemove);
      setPages(updated);
      if (activeIndex >= updated.length) {
          setActiveIndex(Math.max(0, updated.length - 1));
      }
      if(onNotify) onNotify(null, true);
  };

  // --- ✂️ PROFESSIONAL CROP LOGIC ---
  const handleCropConfirm = () => {
      const cropper = cropperRef.current?.cropper;
      if (cropper) {
          // 🔴 NAYA: Extract at 100% Original Resolution (No blurriness)
          const croppedDataUrl = cropper.getCroppedCanvas({
              imageSmoothingEnabled: true,
              imageSmoothingQuality: 'high',
              fillColor: '#fff' // Background fix for transparent areas on rotation
          }).toDataURL('image/jpeg', 1.0);
          
          setPages(prev => prev.map((page, idx) => {
              if (idx === activeIndex) return { ...page, src: croppedDataUrl };
              return page;
          }));
          
          setIsCropMode(false);
          if(onNotify) onNotify("Page Cropped! ✂️", true);
      }
  };

  // Crop Toolbar Functions
  const rotateCrop = (degree) => cropperRef.current?.cropper.rotate(degree);
  const resetCrop = () => cropperRef.current?.cropper.reset();

  // --- DRAG AND DROP ---
  const handleDragStart = (e, position) => { dragItem.current = position; };
  const handleDragEnter = (e, position) => { dragOverItem.current = position; };
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
        const copyPages = [...pages];
        const draggedItemContent = copyPages[dragItem.current];
        copyPages.splice(dragItem.current, 1);
        copyPages.splice(dragOverItem.current, 0, draggedItemContent);
        setPages(copyPages);
        setActiveIndex(dragOverItem.current); 
        if(onNotify) onNotify(null, true);
    }
    dragItem.current = null; dragOverItem.current = null;
  };

  const updateActivePage = (updates) => {
      setPages(prev => prev.map((page, idx) => {
          if (applyToAll || idx === activeIndex) return { ...page, ...updates };
          return page;
      }));
  };

  const handleApplyToAllChange = (e) => {
      const isChecked = e.target.checked;
      setApplyToAll(isChecked);
      if (isChecked && pages.length > 0) {
          const { filter, contrast } = pages[activeIndex];
          setPages(prev => prev.map(page => ({ ...page, filter, contrast })));
          if(onNotify) onNotify(null, true); 
      }
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
         const result = reader.result;
         const base64Data = result.split(',')[1];
         resolve(base64Data);
      };
      reader.readAsDataURL(blob);
    });
  };

  // --- 📄 NATIVE PDF GENERATOR ---
  const generateAndSavePDF = async () => {
      if (pages.length === 0) return;
      setShowRenameDialog(false);
      setIsSaving(true);
      
      const executeSave = async () => {
          setStatus("Compiling PDF...");
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          for (let i = 0; i < pages.length; i++) {
              setStatus(`Enhancing Page ${i + 1} of ${pages.length}...`);
              const page = pages[i];
              const processedImg = await applyMagicFilter(page.src, page.filter, page.contrast);
              const imgProps = pdf.getImageProperties(processedImg);
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

              if (i > 0) pdf.addPage();
              pdf.addImage(processedImg, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          }

          setStatus("Saving File...");
          const finalPdfName = `${pdfName || 'Document'}.pdf`;
          const pdfBlob = pdf.output('blob');

          try {
              if (Capacitor.isNativePlatform()) {
                  setStatus("Asking Permission...");
                  await Filesystem.requestPermissions();
                  setStatus("Saving to Phone...");
                  
                  const base64Data = await blobToBase64(pdfBlob);
                  await Filesystem.writeFile({
                      path: finalPdfName,
                      data: base64Data,
                      directory: Directory.Documents 
                  });
              } else {
                  pdf.save(finalPdfName);
              }

              setIsSaving(false); setStatus("");
              if(onNotify) onNotify("PDF Saved to Documents! 📄✅", false, finalPdfName, "Scanned PDF", pdfBlob);

          } catch (error) {
              console.error("Save Error: ", error);
              alert("⚠️ Storage Permission Required!\nPlease allow storage access to save the PDF.");
              setIsSaving(false); setStatus("");
          }
      };

      if (isPremium) {
          await executeSave();
      } else {
          if (navigator.onLine) {
              setStatus("Loading Ad...");
              setTimeout(() => { executeSave(); }, 2000); 
          } else {
              setIsSaving(false);
              alert("⚠️ Internet Required!\n\nFree users need internet to export PDF. Enable internet, or Upgrade to Premium.");
          }
      }
  };

  // --- STYLES ---
  const S = {
    wrapper: { position: 'fixed', inset: 0, backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', zIndex: 9999, color: 'white', fontFamily: 'sans-serif', userSelect: 'none' },
    header: { height: '60px', backgroundColor: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 15px', borderBottom: '1px solid #334155', zIndex:10 },
    workArea: { flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px' },
    checkerboard: { position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)', backgroundSize: '20px 20px' },
    previewImage: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 5 },
    pageTray: { width: '100%', height: '90px', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', padding: '0 10px', gap: '10px', overflowX: 'auto', borderTop: '1px solid #334155', zIndex: 10 },
    thumbnailWrap: (isActive) => ({ position: 'relative', minWidth: '60px', height: '75px', borderRadius: '6px', border: isActive ? '3px solid #3b82f6' : '1px solid #334155', overflow: 'hidden', cursor: 'grab', opacity: isActive ? 1 : 0.6, transition: '0.2s', touchAction: 'manipulation' }),
    thumbnailImg: { width: '100%', height: '100%', objectFit: 'cover' },
    pageNumber: { position: 'absolute', bottom: '2px', right: '2px', background: 'rgba(0,0,0,0.7)', fontSize: '10px', padding: '2px 5px', borderRadius: '4px', fontWeight: 'bold' },
    addBtnSmall: { minWidth: '60px', height: '75px', borderRadius: '6px', border: '2px dashed #475569', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', color: '#94a3b8', cursor: 'pointer', touchAction: 'manipulation' },
    controlsArea: { backgroundColor: '#1e293b', padding: '15px 20px', display: 'flex', flexDirection: 'column', gap: '15px', borderTop: '1px solid #334155', paddingBottom: 'calc(15px + env(safe-area-inset-bottom))', zIndex:10 },
    filterRow: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' },
    filterBtn: (isActive) => ({ flex: 1, padding: '10px 12px', borderRadius: '8px', background: isActive ? '#3b82f6' : '#334155', color: isActive ? 'white' : '#94a3b8', border: 'none', cursor: 'pointer', fontSize:'12px', fontWeight:'bold', whiteSpace: 'nowrap', touchAction: 'manipulation' }),
    sliderBox: { display: 'flex', flexDirection: 'column', gap: '8px' },
    sliderInput: { width: '100%', accentColor: '#3b82f6', height: '4px', cursor:'pointer', touchAction: 'manipulation' },
    pdfButton: { background: 'linear-gradient(90deg, #ec4899, #8b5cf6)', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer', width: '100%', boxShadow: '0 4px 15px rgba(236, 72, 153, 0.3)', touchAction: 'manipulation' }
  };

  return (
    <div style={S.wrapper}>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>

      {/* RENAME PDF DIALOG */}
      {showRenameDialog && (
         <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60}}>
             <div style={{background:'#1e293b', padding:'24px', borderRadius:'16px', width:'85%', maxWidth:'350px', border:'1px solid #334155'}}>
                 <h3 style={{marginTop:0, marginBottom:'15px', color:'white'}}>Save Document</h3>
                 <p style={{fontSize:'12px', color:'#94a3b8', marginBottom:'10px'}}>File Name:</p>
                 <input type="text" value={pdfName} onChange={(e) => setPdfName(e.target.value)} style={{width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid #475569', background:'#0f172a', color:'white', fontSize:'16px', marginBottom:'20px', outline:'none'}} autoFocus />
                 <div style={{display:'flex', gap:'10px'}}>
                     <button onClick={() => setShowRenameDialog(false)} style={{flex:1, padding:'12px', background:'#334155', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', touchAction: 'manipulation'}}>Cancel</button>
                     <button onClick={generateAndSavePDF} style={{flex:1, padding:'12px', background:'#3b82f6', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', touchAction: 'manipulation'}}>Save PDF</button>
                 </div>
             </div>
         </div>
      )}

      {/* ADD PAGE BOTTOM MENU */}
      {showAddMenu && (
        <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'flex-end', zIndex:60}} onClick={() => setShowAddMenu(false)}>
            <div style={{background:'#1e293b', width:'100%', borderTopLeftRadius:'24px', borderTopRightRadius:'24px', padding:'25px 20px', display:'flex', flexDirection:'column', gap:'12px', boxShadow:'0 -10px 40px rgba(0,0,0,0.5)'}} onClick={(e) => e.stopPropagation()}>
                <h3 style={{margin:'0 0 10px 0', color:'white', textAlign:'center', fontSize:'18px'}}>Add New Page</h3>
                <button onClick={() => { cameraInputRef.current.click(); setShowAddMenu(false); }} style={{...S.pdfButton, background:'#3b82f6'}}>
                    <Icons.Camera /> Open Camera
                </button>
                <button onClick={() => { fileInputRef.current.click(); setShowAddMenu(false); }} style={{...S.pdfButton, background:'#334155', boxShadow:'none'}}>
                    <Icons.Gallery /> Choose from Gallery
                </button>
                <button onClick={() => setShowAddMenu(false)} style={{padding:'15px', background:'transparent', border:'none', color:'#ef4444', fontWeight:'bold', fontSize:'16px', marginTop:'5px', cursor:'pointer', touchAction: 'manipulation'}}>
                    Cancel
                </button>
            </div>
        </div>
      )}

      {/* AD / PROCESSING OVERLAY */}
      {isSaving && (
        <div style={{position:'absolute', inset:0, background:'rgba(15,23,42,0.9)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:50}}>
            <div style={{width: '45px', height: '45px', border: '4px solid #3b82f6', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
            <span style={{color: 'white', marginTop: '20px', fontWeight: 'bold', fontSize: '18px'}}>{status}</span>
        </div>
      )}

      {/* HEADER */}
      <div style={S.header}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <button onClick={() => isCropMode ? setIsCropMode(false) : onBack()} style={{background:'none', border:'none', color:'white', cursor:'pointer', touchAction:'manipulation'}}><Icons.Back/></button>
            <span style={{fontWeight:'bold', fontSize:'16px'}}>{isCropMode ? "Crop Page" : "Magic Scanner"}</span>
        </div>
        
        {isCropMode ? (
            <button onClick={handleCropConfirm} style={{padding: '6px 16px', borderRadius:'8px', border:'none', background: '#10b981', color: 'white', fontWeight: 'bold', fontSize: '14px', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer', touchAction:'manipulation'}}>
                Done <Icons.Check/>
            </button>
        ) : (
            <button onClick={() => setIsPremium(!isPremium)} style={{padding: '6px 10px', borderRadius:'20px', border:'none', background: isPremium ? '#f59e0b' : '#334155', color: isPremium ? '#fff' : '#94a3b8', fontWeight: 'bold', fontSize: '11px', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer', touchAction:'manipulation'}}>
                <Icons.Crown/> {isPremium ? "Premium" : "Free"}
            </button>
        )}
      </div>

      {/* HIDDEN INPUTS */}
      <input ref={fileInputRef} type="file" multiple accept="image/*" style={{display:'none'}} onChange={handleFiles} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handleFiles} />

      {/* WORKSPACE */}
      <div style={S.workArea}>
         <div style={S.checkerboard}></div>
         {pages.length === 0 ? (
            <div style={{display:'flex', flexDirection:'column', gap:'20px', zIndex:5, alignItems:'center'}}>
                <Icons.PDF />
                <h2 style={{margin:0, color:'#f8fafc'}}>Scan Documents</h2>
                <p style={{color:'#94a3b8', textAlign:'center', fontSize:'14px', maxWidth:'250px'}}>Use the camera to scan notes, ID cards, or import from gallery.</p>
                <div style={{display:'flex', gap:'15px', marginTop:'10px'}}>
                    <button onClick={() => cameraInputRef.current.click()} style={{background:'#3b82f6', color:'white', padding:'16px 24px', borderRadius:'12px', border:'none', fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px', fontSize:'16px', cursor:'pointer', boxShadow:'0 4px 15px rgba(59, 130, 246, 0.4)', touchAction:'manipulation'}}>
                        <Icons.Camera /> Camera
                    </button>
                    <button onClick={() => fileInputRef.current.click()} style={{background:'#334155', color:'white', padding:'16px 24px', borderRadius:'12px', border:'none', fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px', fontSize:'16px', cursor:'pointer', touchAction:'manipulation'}}>
                        <Icons.Gallery /> Gallery
                    </button>
                </div>
            </div>
         ) : (
             <>
                 {isCropMode ? (
                     <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                         <div style={{ flex: 1, position: 'relative' }}>
                             {/* 🔴 NAYA: Professional ViewMode 2 (Box stays inside image) */}
                             <Cropper
                                 src={pages[activeIndex].src}
                                 style={{ height: '100%', width: '100%', position: 'absolute' }}
                                 ref={cropperRef}
                                 guides={true}
                                 viewMode={2} 
                                 dragMode="move"
                                 background={false}
                                 responsive={true}
                                 autoCropArea={1}
                                 zoomable={true}
                                 checkOrientation={false}
                                 toggleDragModeOnDblclick={false}
                             />
                         </div>
                         {/* 🔴 NAYA: Bottom Crop Toolbar */}
                         <div style={{ height: '70px', background: '#0f172a', display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', borderTop: '1px solid #334155' }}>
                            <button onClick={() => rotateCrop(-90)} style={{ background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '10px 20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                <Icons.RotateLeft /> <span style={{fontSize: '10px'}}>Left</span>
                            </button>
                            <button onClick={resetCrop} style={{ background: '#1e293b', border: '1px solid #334155', color: '#f59e0b', padding: '10px 20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                <Icons.Reset /> <span style={{fontSize: '10px'}}>Reset</span>
                            </button>
                            <button onClick={() => rotateCrop(90)} style={{ background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '10px 20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                <Icons.RotateRight /> <span style={{fontSize: '10px'}}>Right</span>
                            </button>
                         </div>
                     </div>
                 ) : (
                     <>
                         {previewData && <img src={previewData} style={S.previewImage} alt="Scanned Page" />}
                         
                         <button onClick={() => setIsCropMode(true)} style={{position:'absolute', top:'15px', left:'15px', background:'rgba(59, 130, 246, 0.2)', color:'#3b82f6', border:'1px solid rgba(59, 130, 246, 0.5)', padding:'8px', borderRadius:'8px', zIndex:10, cursor:'pointer', touchAction:'manipulation'}}>
                             <Icons.Crop />
                         </button>

                         <button onClick={() => removePage(activeIndex)} style={{position:'absolute', top:'15px', right:'15px', background:'rgba(239, 68, 68, 0.2)', color:'#ef4444', border:'1px solid rgba(239, 68, 68, 0.5)', padding:'8px', borderRadius:'8px', zIndex:10, cursor:'pointer', touchAction:'manipulation'}}>
                             <Icons.Trash />
                         </button>
                     </>
                 )}
             </>
         )}
      </div>

      {/* TRAY & CONTROLS */}
      {!isCropMode && pages.length > 0 && (
          <>
              {/* PAGE TRAY */}
              <div style={S.pageTray}>
                  {pages.map((page, idx) => (
                      <div 
                          key={page.id} 
                          style={S.thumbnailWrap(activeIndex === idx)} 
                          onClick={() => setActiveIndex(idx)}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragEnter={(e) => handleDragEnter(e, idx)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => e.preventDefault()}
                      >
                          <img src={page.src} style={S.thumbnailImg} alt={`Page ${idx + 1}`} />
                          <div style={S.pageNumber}>{idx + 1}</div>
                      </div>
                  ))}
                  <div style={S.addBtnSmall} onClick={() => setShowAddMenu(true)}>
                      <Icons.Plus />
                  </div>
              </div>

              {/* CONTROLS */}
              <div style={S.controlsArea}>
                  <div style={S.filterRow}>
                      <button style={S.filterBtn(pages[activeIndex]?.filter === 'original')} onClick={() => updateActivePage({ filter: 'original' })}>Original</button>
                      <button style={S.filterBtn(pages[activeIndex]?.filter === 'magic')} onClick={() => updateActivePage({ filter: 'magic' })}>Magic Color</button>
                      <button style={S.filterBtn(pages[activeIndex]?.filter === 'b&w')} onClick={() => updateActivePage({ filter: 'b&w' })}>B&W Doc</button>
                      <button style={S.filterBtn(pages[activeIndex]?.filter === 'grayscale')} onClick={() => updateActivePage({ filter: 'grayscale' })}>Grayscale</button>
                  </div>

                  <div style={S.sliderBox}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', fontWeight:'bold' }}>
                          <span>Detail / Contrast</span>
                          <span>{pages[activeIndex]?.contrast}%</span>
                      </div>
                      <input type="range" min="50" max="200" value={pages[activeIndex]?.contrast || 100} onChange={(e) => updateActivePage({ contrast: Number(e.target.value) })} style={S.sliderInput} />
                  </div>

                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'5px'}}>
                      <label style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'#94a3b8', fontWeight:'bold', cursor:'pointer'}}>
                          <input type="checkbox" checked={applyToAll} onChange={handleApplyToAllChange} style={{accentColor:'#ec4899', width:'16px', height:'16px'}} />
                          Apply Filter to All Pages
                      </label>
                      <span style={{fontSize:'12px', color:'#3b82f6', fontWeight:'bold'}}>{pages.length} Pages Ready</span>
                  </div>

                  {/* FINAL EXPORT */}
                  <button onClick={() => setShowRenameDialog(true)} disabled={isSaving} style={S.pdfButton}>
                      Save as PDF <Icons.PDF />
                  </button>
              </div>
          </>
      )}
    </div>
  );
};

export default DocScanner;