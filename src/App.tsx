import React, { useState, useEffect, Suspense, lazy } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { FileOpener } from '@capacitor-community/file-opener';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Camera } from '@capacitor/camera'; 
import QRCode from 'qrcode'; 
import './ProUtility.css';

import ImageResizer from './ImageResizer';
import PhotoEditor from './PhotoEditor'; 
import BgRemover from './BgRemover';
import DocScanner from "./DocScanner";
import SmartPrinter from './SmartPrinter'; 
import QrGenerator from './QrGenerator';   
const PdfTools = lazy(() => import('./PdfTools'));
const PdfSecurity = lazy(() => import('./PdfSecurity')); 

// --- 💾 DATABASE HELPER (INDEXED-DB) ---
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ProUtilityDB', 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('recentFiles')) {
        db.createObjectStore('recentFiles', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('DB Error');
  });
};

const saveFileToDB = async (fileData) => {
  const db = await initDB();
  const tx = db.transaction('recentFiles', 'readwrite');
  tx.objectStore('recentFiles').put(fileData);
  return tx.complete;
};

const getFilesFromDB = async () => {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction('recentFiles', 'readonly');
    const store = tx.objectStore('recentFiles');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a,b) => b.id - a.id));
  });
};

const clearDB = async () => {
  const db = await initDB();
  const tx = db.transaction('recentFiles', 'readwrite');
  tx.objectStore('recentFiles').clear();
  return tx.complete;
};

// --- AD STRIP ---
const PdfAdStrip = () => (
  <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000, boxShadow: '0 -4px 15px rgba(0,0,0,0.03)', backdropFilter: 'blur(5px)' }}>
    <span style={{fontSize:'9px', color:'var(--text-muted)', letterSpacing:'1px', fontWeight:'700', marginBottom:'2px', textTransform:'uppercase'}}>ADVERTISEMENT</span>
    <div style={{width:'90%', height:'35px', background:'var(--bg-input)', borderRadius:'6px', border:'1px dashed var(--border-color)', display:'flex', alignItems:'center', justifyContent:'center'}}>
       <span style={{color:'var(--text-muted)', fontSize:'11px', fontWeight:'500'}}>Google AdMob Space</span>
    </div>
  </div>
);

// --- ICONS ---
const Icons = {
  Remover: () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>),
  Enhancer: () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1" /><path d="M7 12h10"/></svg>),
  Resizer: () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>),
  Editor: () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="14.31" y1="8" x2="20.05" y2="17.94"/><line x1="9.69" y1="8" x2="21.17" y2="8"/><line x1="7.38" y1="12" x2="13.12" y2="2.06"/><line x1="9.69" y1="16" x2="3.95" y2="6.06"/><line x1="14.31" y1="16" x2="2.83" y2="16"/><line x1="16.62" y1="12" x2="10.88" y2="21.94"/></svg>),
  PDF: () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>),
  Printer: () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>),
  QR: () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><path d="M3 14h4v4H3z"/><path d="M10 3v4"/><path d="M21 10h-4"/><path d="M3 10h18"/></svg>),
  Menu: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Crown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="2 15 2 2 8 8 12 2 16 8 22 2 22 15"/><path d="M2 15h20v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4z"/></svg>
};

// --- TOOLS ARRAY ---
const TOOLS = [
  { id: 'pdf', title: 'PDF Master', subtitle: 'Merge & Split & More', icon: <Icons.PDF />, color: 'blue', large: true },
  { id: 'remover', title: 'Background Remover', subtitle: 'Magic Erase', icon: <Icons.Remover />, color: 'purple' },
  { id: 'scanner', title: 'Doc Scanner', subtitle: 'Magical Scanner', icon: <Icons.Enhancer />, color: 'pink' },
  { id: 'resizer', title: 'Photo Resizer', subtitle: 'Compress Img', icon: <Icons.Resizer />, color: 'orange' },
  { id: 'editor', title: 'Photo Editor', subtitle: 'Image Editor', icon: <Icons.Editor />, color: 'green' },
  { id: 'printer', title: 'Smart Printer', subtitle: 'Print Docs', icon: <Icons.Printer />, color: 'teal' }, 
  { id: 'qr', title: 'QR Generator', subtitle: 'Create Codes', icon: <Icons.QR />, color: 'indigo' } 
];

// --- PROFESSIONAL GRADIENT PALETTE ---
const getProfessionalGradient = (colorName) => {
  const palettes = {
    blue: 'linear-gradient(135deg, #2563eb, #1e3a8a)', 
    purple: 'linear-gradient(135deg, #8b5cf6, #5b21b6)', 
    pink: 'linear-gradient(135deg, #ec4899, #be185d)', 
    orange: 'linear-gradient(135deg, #f59e0b, #b45309)', 
    green: 'linear-gradient(135deg, #10b981, #047857)', 
    teal: 'linear-gradient(135deg, #14b8a6, #0f766e)', 
    indigo: 'linear-gradient(135deg, #6366f1, #3730a3)' 
  };
  return palettes[colorName] || palettes.blue;
};

const ToolCard = ({ tool, onClick }) => (
  <div className={`tool-card ${tool.large ? 'large' : 'secondary'}`} 
       style={{ 
         background: getProfessionalGradient(tool.color),
         color: '#ffffff',
         border: '1px solid rgba(255,255,255,0.1)', 
         boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
       }} 
       onClick={() => onClick(tool)}>
    <div className="tool-icon-wrapper" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>{tool.icon}</div>
    <div className={tool.large ? "tool-info" : ""}>
      <div className="tool-title" style={{ fontWeight: '700', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{tool.title}</div>
      <div className="tool-subtitle" style={{ opacity: 0.85 }}>{tool.subtitle}</div>
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---
const ProUtilityApp = () => {
  const [selectedTool, setSelectedTool] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [activeModal, setActiveModal] = useState(null); 
  const [recentFiles, setRecentFiles] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchRecentFiles = async () => {
    const files = await getFilesFromDB();
    setRecentFiles(files.slice(0, 11)); 
  };

  // 🔴 UNIVERSAL FILE CATCHER (WhatsApp, File Manager etc.)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const urlListener = CapacitorApp.addListener('appUrlOpen', async (data) => {
      // Agar aayi hui file PDF hai
      if (data.url && (data.url.includes('.pdf') || data.url.startsWith('content://'))) {
        
        triggerHapticAndToast("Importing PDF from external app...");
        
        try {
          // File ko turant Native Fast Engine mein khol do
          await FileOpener.open({
            filePath: data.url,
            contentType: 'application/pdf'
          });
        } catch (error) {
          console.error("External Open Error:", error);
          triggerHapticAndToast("Could not read external file.");
        }
      }
    });

    return () => {
      urlListener.remove();
    };
  }, []);
  
  useEffect(() => {
    fetchRecentFiles();
  }, [activeModal]);

  // 🔴 STARTUP PERMISSIONS (With Timer & Error Alert)
  useEffect(() => {
    const initApp = async () => {
      if (Capacitor.isNativePlatform()) {
        await SplashScreen.hide();
        
        // 1 second ka delay taaki Android ready ho jaye
        setTimeout(async () => {
          try {
            // Camera Permission
            await Camera.requestPermissions();
            // Storage Permission
            await Filesystem.requestPermissions();
          } catch (e) {
            // Agar OS block karega toh humein screen par error dikh jayega
            alert("Permission Blocked by Android: " + JSON.stringify(e));
          }
        }, 1000);
      }
    };
    initApp();
  }, []);

  // 🔴 2. SMART NATIVE BACK BUTTON FIX (NO VIBRATION)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleBackButton = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (isSidebarOpen) {
        setIsSidebarOpen(false); 
      } else if (activeModal) {
        setActiveModal(null); 
      } else if (selectedTool) {
        // Faltu vibration hata diya
        setSelectedTool(null); 
      } else {
        CapacitorApp.exitApp(); 
      }
    });

    return () => {
      handleBackButton.remove();
    };
  }, [isSidebarOpen, activeModal, selectedTool]);

  // 🔴 3. ONLY SAVE VIBRATION
  const triggerHapticAndToast = async (msg, isSmallVibrate = false, savedFileName = null, savedFileType = null, fileBlob = null) => {
    // Sirf tab vibrate hoga jab Save wala kaam ho (savedFileName ho ya message me save likha ho)
    if (savedFileName || (msg && msg.toLowerCase().includes('save'))) {
        try {
            if (navigator.vibrate) navigator.vibrate(50);
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (e) {}
    }
    
    if (msg) {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    }

    if (savedFileName && fileBlob) {
        const newFile = {
            id: Date.now(),
            name: savedFileName,
            type: savedFileType || 'Document', 
            date: new Date().toLocaleDateString(),
            blob: fileBlob 
        };
        await saveFileToDB(newFile);
        fetchRecentFiles();
    }
  };

  // 🔴 4. NATIVE RECENT FILE OPENER FIX
  const handleOpenFile = async (fileRecord) => {
      if(!fileRecord.blob) {
          triggerHapticAndToast("Cannot open file. Data missing.");
          return;
      }
      
      try {
        if (Capacitor.isNativePlatform()) {
          // Asli phone viewer mein kholne ke liye pehle cache mein likhna padta hai
          const base64Data = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = reject;
              reader.onload = () => resolve(reader.result.split(',')[1]);
              reader.readAsDataURL(fileRecord.blob);
          });

          const writeResult = await Filesystem.writeFile({
            path: fileRecord.name,
            data: base64Data,
            directory: Directory.Cache
          });

          await FileOpener.open({
            filePath: writeResult.uri,
            contentType: fileRecord.type.includes('PDF') ? 'application/pdf' : 'image/jpeg'
          });
        } else {
          // Browser Fallback
          const url = window.URL.createObjectURL(fileRecord.blob);
          window.open(url, '_blank');
        }
      } catch (err) {
        console.error("Error opening file: ", err);
        triggerHapticAndToast("Error opening file format.");
      }
  };

  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('proUtilityTheme') || 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') root.classList.add('dark-mode');
    else root.classList.remove('dark-mode');
    localStorage.setItem('proUtilityTheme', themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
      setThemeMode(prev => {
          const newMode = prev === 'dark' ? 'light' : 'dark';
          triggerHapticAndToast(`${newMode === 'dark' ? '🌙 Dark' : '☀️ Light'} Mode Enabled`);
          return newMode;
      });
  };

  // 🔴 5. NO VIBRATION ON NORMAL CLICKS
  const handleToolClick = (tool) => {
      setSelectedTool(tool);
  };
  
  const goBack = () => {
      setSelectedTool(null);
  };
  
  const isDark = themeMode === 'dark';

  const handleRateUs = () => window.open('https://play.google.com/store/apps/', '_blank');
  const handleShareApp = () => {
    const appLink = "https://play.google.com/store/apps/";
    if (navigator.share) {
      navigator.share({ title: 'ProUtility', text: 'Bhai, yeh mast app download kar!', url: appLink }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`Link: ${appLink}`);
      triggerHapticAndToast("Link Copied! Paste to Share."); 
    }
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', width: '100%', backgroundColor: 'var(--bg-main)', transition: 'background-color 0.3s ease', position: 'relative' }}>
      
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: 'var(--text-main)', color: 'var(--bg-main)',
          padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold',
          fontSize: '14px', zIndex: 999999, boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          animation: 'toastFadeInUp 0.3s ease forwards', whiteSpace: 'nowrap'
        }}>
          {toastMessage}
        </div>
      )}

      {/* 🔴 Mobile Touch Card Smoothness & Page Transition CSS */}
      <style>{`
        @keyframes toastFadeInUp { 0% { opacity: 0; transform: translate(-50%, 20px); } 100% { opacity: 1; transform: translate(-50%, 0); } }
        
        /* Naya Smooth Page Load Animation */
        @keyframes pageSlideUp { 
            0% { opacity: 0; transform: translateY(15px); } 
            100% { opacity: 1; transform: translateY(0); } 
        }

        .page-animate {
            animation: pageSlideUp 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        
        .tool-card {
           transition: transform 0.1s ease-out, filter 0.1s ease-out !important;
           -webkit-tap-highlight-color: transparent !important; 
           cursor: pointer;
        }
        
        .tool-card:active {
           transform: scale(0.98) !important;
           filter: brightness(0.9) !important;
        }
      `}</style>

      {isSidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 99999, display: 'flex' }} onClick={() => setIsSidebarOpen(false)}>
          <div style={{ width: '280px', backgroundColor: 'var(--bg-card)', height: '100%', padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: '5px 0 20px rgba(0,0,0,0.3)', transition: 'background-color 0.3s' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '24px', fontWeight: '900' }}>Pro<span style={{color:'#3b82f6'}}>Utility</span></h2>
                <p style={{ margin: 0, color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}>v1.0.5 - Pro Edition</p>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Icons.Close /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <button style={{...sideBtn, color: 'var(--text-main)'}} onClick={() => setIsSidebarOpen(false)}>🏠 Home</button>
              <button style={{...sideBtn, color: 'var(--text-main)'}} onClick={() => { setIsSidebarOpen(false); setActiveModal('recent'); }}>📂 Recent Files</button>
              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '10px 0' }}></div>
              <button style={{...sideBtn, color: 'var(--text-main)'}} onClick={() => { setIsSidebarOpen(false); handleRateUs(); }}>⭐ Rate Us</button>
              <button style={{...sideBtn, color: 'var(--text-main)'}} onClick={() => { setIsSidebarOpen(false); handleShareApp(); }}>📲 Share App</button>
              <button style={{...sideBtn, color: 'var(--text-main)'}} onClick={() => { setIsSidebarOpen(false); setActiveModal('privacy'); }}>🛡️ Privacy Policy</button>
              <button style={{...sideBtn, color: 'var(--text-main)'}} onClick={() => { setIsSidebarOpen(false); setActiveModal('about'); }}>ℹ️ About Version</button>
              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '10px 0' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', color: 'var(--text-main)', fontWeight: 'bold' }}>
                <span style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  {isDark ? '🌙' : '☀️'} {isDark ? 'Dark Mode' : 'Light Mode'}
                </span>
                <div onClick={toggleTheme} style={{ width: '40px', height: '22px', background: isDark ? '#3b82f6' : '#cbd5e1', borderRadius: '20px', position: 'relative', cursor: 'pointer' }}>
                   <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: isDark ? '20px' : '2px', transition: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(3px)' }} onClick={() => setActiveModal(null)}>
          <div style={{ background: 'var(--bg-card)', padding: '25px', borderRadius: '20px', width: '100%', maxWidth: '400px', border: '1px solid var(--border-color)', color: 'var(--text-main)', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            
            <button onClick={() => setActiveModal(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--bg-input)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems:'center', justifyContent:'center', fontWeight: 'bold' }}>✕</button>

            {activeModal === 'recent' && (
              <>
                <h2 style={{margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px'}}>📂 Recent Files <span style={{fontSize: '12px', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '10px'}}>{recentFiles.length}/11</span></h2>
                
                {recentFiles.length === 0 ? (
                    <div style={{ background: 'var(--bg-input)', padding: '30px 20px', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                       No recent files yet.<br/>When you save a PDF or an image, it will appear here for quick access.
                    </div>
                ) : (
                    <div style={{ background: 'var(--bg-input)', borderRadius: '12px', maxHeight: '300px', overflowY: 'auto', padding: '10px' }}>
                        {recentFiles.map((file) => (
                            <div key={file.id} onClick={() => handleOpenFile(file)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-main)', wordBreak: 'break-all' }}>{file.name}</span>
                                    <span style={{ fontSize: '11px', color: '#3b82f6', marginTop: '2px' }}>{file.type} • {file.date}</span>
                                </div>
                                <span style={{fontSize: '18px'}}>👁️</span>
                            </div>
                        ))}
                    </div>
                )}
                
                {recentFiles.length > 0 && (
                    <button onClick={async () => { await clearDB(); setRecentFiles([]); triggerHapticAndToast("History Cleared"); }} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px dashed #ef4444', color: '#ef4444', borderRadius: '10px', marginTop: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Clear History
                    </button>
                )}
              </>
            )}

            {activeModal === 'privacy' && (
              <>
                <h2 style={{margin: '0 0 15px 0'}}>🛡️ Privacy Policy</h2>
                <div style={{ background: 'var(--bg-input)', padding: '15px', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '13px', maxHeight: '250px', overflowY: 'auto', lineHeight: '1.5' }}>
                   <b>Your Data is 100% Yours.</b><br/><br/>
                   At ProUtility, we believe in complete privacy. <b>We do NOT collect, store, or upload any of your files, images, or documents to any external server.</b><br/>
                </div>
              </>
            )}

            {activeModal === 'about' && (
              <div style={{textAlign: 'center', paddingTop: '10px'}}>
                <h2 style={{margin: 0, fontSize: '28px', fontWeight: '900', color: 'var(--text-main)'}}>Pro<span style={{color:'#3b82f6'}}>Utility</span></h2>
                <p style={{margin: '5px 0 20px 0', color: '#3b82f6', fontWeight: 'bold'}}>Version 1.0.5 (Pro Edition)</p>
              </div>
            )}
            
            {activeModal !== 'recent' && (
                <button onClick={() => setActiveModal(null)} style={{width: '100%', padding: '12px', background: '#3b82f6', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer'}}>Close</button>
            )}
          </div>
        </div>
      )}

      {!selectedTool && (
        <div className="app-content" style={{ paddingBottom: '70px' }}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', marginBottom: '10px', minHeight: '65px' }}>
            <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '5px', zIndex: 2 }}><Icons.Menu /></button>
            <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', zIndex: 1, pointerEvents: 'none' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-main)' }}>Pro<span style={{ color: '#3b82f6' }}>Utility</span></h1>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>The Ultimate Toolkit</p>
            </div>
            <button onClick={() => setIsPremium(!isPremium)} style={{ background: isPremium ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'var(--bg-input)', color: isPremium ? '#000' : 'var(--text-main)', border: 'none', padding: '8px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', zIndex: 2 }}><Icons.Crown /> {isPremium ? 'PRO' : 'FREE'}</button>
          </div>

          <div className="tools-grid">
            {TOOLS[0] && <ToolCard tool={TOOLS[0]} onClick={handleToolClick} />}
            <div className="tools-row">{TOOLS.slice(1, 3).map(tool => <ToolCard key={tool.id} tool={tool} onClick={handleToolClick} />)}</div>
            <div className="tools-row">{TOOLS.slice(3, 5).map(tool => <ToolCard key={tool.id} tool={tool} onClick={handleToolClick} />)}</div>
            <div className="tools-row">{TOOLS.slice(5, 7).map(tool => <ToolCard key={tool.id} tool={tool} onClick={handleToolClick} />)}</div>
          </div>
        </div>
      )}

      {selectedTool && (
        <div className="page-animate" style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, backgroundColor: 'var(--bg-main)', zIndex: 50 }}>
          <Suspense fallback={<div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color: 'var(--text-main)'}}>Loading Tool...</div>}>
            
            {selectedTool.id === 'lock' ? <PdfSecurity mode="lock" onBack={goBack} onNotify={triggerHapticAndToast} /> :
             selectedTool.id === 'unlock' ? <PdfSecurity mode="unlock" onBack={goBack} onNotify={triggerHapticAndToast} /> :
             
             selectedTool.id === 'pdf' ? <PdfTools onBack={goBack} onNotify={triggerHapticAndToast} onOpenSecurity={(mode) => setSelectedTool({id: mode})} /> :
             selectedTool.id === 'printer' ? <SmartPrinter onBack={goBack} onNotify={triggerHapticAndToast} /> :
             selectedTool.id === 'qr' ? <QrGenerator onBack={goBack} isPremium={isPremium} onNotify={triggerHapticAndToast} /> :
             selectedTool.id === 'resizer' ? <ImageResizer onBack={goBack} onNotify={triggerHapticAndToast} /> :
             selectedTool.id === 'remover' ? <BgRemover onBack={goBack} onNotify={triggerHapticAndToast} /> :
             selectedTool.id === 'scanner' ? <DocScanner onBack={goBack} onNotify={triggerHapticAndToast} /> :
             selectedTool.id === 'editor' ? <PhotoEditor onBack={goBack} onNotify={triggerHapticAndToast} /> : null
            }
          </Suspense>
        </div>
      )}

      {(!selectedTool || !['remover', 'scanner', 'editor'].includes(selectedTool.id)) && <PdfAdStrip />}
    </div>
  );
};

const sideBtn = { display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 15px', background: 'none', border: 'none', fontSize: '16px', fontWeight: '600', textAlign: 'left', cursor: 'pointer', borderRadius: '10px' };

export default ProUtilityApp;