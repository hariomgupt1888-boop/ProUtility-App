import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../Icons'; 
import { readFile } from '../../utils/pdfUtils';

// 🔴 THE MAGIC ENGINE (With Transparent Highlighter Effect)
const PageRenderer = ({ pdfDoc, pageNum, scale, searchQuery }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [textItems, setTextItems] = useState([]); 

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { rootMargin: '100% 0px' }); 

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let renderTask = null;
    if (isVisible && pdfDoc && canvasRef.current) {
      pdfDoc.getPage(pageNum).then(async (page) => {
        const viewport = page.getViewport({ scale: scale * 1.5 }); 
        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        renderTask = page.render({ canvasContext: ctx, viewport });
        renderTask.promise.catch(err => {
          if (err.name !== 'RenderingCancelledException') console.error("Render error", err);
        });

        const textContent = await page.getTextContent();
        const items = textContent.items.map(item => {
           const transform = window.pdfjsLib.Util.transform(viewport.transform, item.transform);
           return {
               str: item.str,
               x: transform[4],
               y: transform[5] - (Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1])), 
               fontSize: Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]),
               fontFamily: item.fontName
           };
        });
        setTextItems(items);
      });
    }
    return () => {
      if (renderTask) renderTask.cancel(); 
    };
  }, [isVisible, pdfDoc, pageNum, scale]);

  // 🔴 FIX: Semi-transparent background ('rgba(253, 224, 71, 0.5)') like a real highlighter pen!
  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i} style={{ background: 'rgba(253, 224, 71, 0.5)', color: 'transparent', borderRadius: '3px', padding: '0 2px' }}>{part}</mark> 
        : part
    );
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minHeight: '400px', display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
      <canvas 
         ref={canvasRef} 
         style={{ 
            maxWidth: '100%', height: 'auto', 
            background: isVisible ? 'white' : 'transparent', 
            boxShadow: isVisible ? '0 4px 15px rgba(0,0,0,0.3)' : 'none',
         }} 
      />
      
      {isVisible && textItems.length > 0 && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: canvasRef.current?.width || '100%', height: canvasRef.current?.height || '100%', transformOrigin: 'top left', transform: `scale(${canvasRef.current?.clientWidth / canvasRef.current?.width || 1})`, pointerEvents: 'auto' }}>
             {textItems.map((item, index) => (
                <span 
                   key={index} 
                   style={{ 
                      position: 'absolute', 
                      left: `${item.x}px`, 
                      top: `${item.y}px`, 
                      fontSize: `${item.fontSize}px`, 
                      fontFamily: item.fontFamily,
                      color: 'transparent', 
                      cursor: 'text',
                      whiteSpace: 'pre',
                      lineHeight: 1
                   }}
                >
                   {highlightText(item.str, searchQuery)}
                </span>
             ))}
          </div>
      )}
    </div>
  );
};


const ViewPdf = ({ onClose }) => {
  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUI, setShowUI] = useState(false); 
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
     setTimeout(() => setShowUI(true), 10);
  }, []);

  const closeViewer = () => {
     setShowUI(false);
     setTimeout(onClose, 300); 
  };

  const handleUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const uploadedFile = e.target.files[0];
    
    setIsProcessing(true);
    try {
      const buffer = await readFile(uploadedFile);
      if (!window.pdfjsLib) { alert("PDF Engine loading... please try again in a second."); setIsProcessing(false); return; }
      
      const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setFile(uploadedFile);
    } catch (err) { 
      alert('Failed to read file. Ensure it is not encrypted.'); 
    }
    setIsProcessing(false);
    e.target.value = null;
  };

  const zoom = (factor) => {
    setScale(prev => Math.max(0.5, Math.min(3.0, prev + factor)));
  };

  return (
    <div style={{ 
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        background: '#0f172a', zIndex: 9999, display: 'flex', flexDirection: 'column',
        transform: showUI ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' 
    }}>
      
      <div style={{ background: '#1e293b', padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.5)', zIndex: 10 }}>
         
         {!isSearchOpen ? (
             <>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={closeViewer} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                       <Icons.Back />
                    </button>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'white', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                       {file ? file.name : 'PDF Viewer'}
                    </h2>
                 </div>
                 {file && (
                     <button onClick={() => setIsSearchOpen(true)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px' }}>
                        🔍
                     </button>
                 )}
             </>
         ) : (
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                 <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <Icons.Back />
                 </button>
                 <input 
                    type="text" 
                    autoFocus
                    placeholder="Find in document..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1, padding: '8px 15px', borderRadius: '20px', border: 'none', background: '#334155', color: 'white', outline: 'none', fontSize: '14px' }} 
                 />
                 <button onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
             </div>
         )}
      </div>

      <style>
        {`
          ::selection { background: rgba(59, 130, 246, 0.4); color: transparent; }
        `}
      </style>

      <div style={{ flex: 1, overflowY: 'auto', background: '#0f172a', display: 'flex', flexDirection: 'column' }}>
         {!file ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
               <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="application/pdf" onChange={handleUpload} />
               <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', marginBottom: '20px' }}>
                  <Icons.View />
               </div>
               <h3 style={{ color: 'white', marginBottom: '15px', marginTop: 0 }}>No Document Opened</h3>
               <button onClick={() => fileInputRef.current.click()} style={{ background: '#ec4899', color: 'white', padding: '14px 30px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(236, 72, 153, 0.4)' }}>
                 Browse Files
               </button>
               {isProcessing && <p style={{ color: 'var(--text-muted)', marginTop: '15px' }}>Loading Document...</p>}
            </div>
         ) : (
            <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '20px 0 80px 0' }}>
               {Array.from({ length: totalPages }, (_, i) => (
                  <PageRenderer key={i} pdfDoc={pdfDoc} pageNum={i + 1} scale={scale} searchQuery={searchQuery} />
               ))}
            </div>
         )}
      </div>

      {file && (
          <div style={{ background: '#1e293b', padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid #334155', zIndex: 10 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#0f172a', padding: '8px 20px', borderRadius: '12px' }}>
                <button onClick={() => zoom(-0.2)} style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '20px', cursor: 'pointer' }}>-</button>
                <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', minWidth: '50px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
                <button onClick={() => zoom(0.2)} style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '20px', cursor: 'pointer' }}>+</button>
             </div>
          </div>
      )}
    </div>
  );
};

export default ViewPdf;