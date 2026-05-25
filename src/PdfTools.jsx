import React, { useState, useEffect } from 'react';
import { Icons } from './components/Icons'; 
import MergePdf from './components/PdfTools/MergePdf';
import CompressPdf from './components/PdfTools/CompressPdf';
import SplitPdf from './components/PdfTools/SplitPdf';
import ImgToPdf from './components/PdfTools/ImgToPdf';
import PdfToImg from './components/PdfTools/PdfToImg';
import WatermarkPdf from './components/PdfTools/WatermarkPdf';
import ExtractText from './components/PdfTools/ExtractText';
import TextToPdf from './components/PdfTools/TextToPdf';
import RenamePdf from './components/PdfTools/RenamePdf';
import PageOps from './components/PdfTools/PageOps';
import EditMetadata from './components/PdfTools/EditMetadata';
import ViewPdf from './components/PdfTools/ViewPdf';

const PdfTools = ({ onBack, onNotify, onOpenSecurity }) => {
  const [activeTool, setActiveTool] = useState('menu');
  const [isPremium, setIsPremium] = useState(false);

  // 🔴 PDF.JS SCRIPT ENGINE
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

  const tools = [
    { id: 'merge', label: 'Merge PDF', icon: <Icons.Merge />, color: '#e11d48', bg: '#ffe4e6' },
    { id: 'split', label: 'Split PDF', icon: <Icons.Split />, color: '#f97316', bg: '#ffedd5' },
    { id: 'compress', label: 'Compress', icon: <Icons.Compress />, color: '#16a34a', bg: '#dcfce7' },
    { id: 'img-to-pdf', label: 'Img to PDF', icon: <Icons.ImgToPdf />, color: '#f59e0b', bg: '#fef3c7' },
    { id: 'pdf-to-img', label: 'PDF to Img', icon: <Icons.PdfToImg />, color: '#f59e0b', bg: '#fef3c7' },
    { id: 'pdf-ocr', label: 'Extract Text', icon: <Icons.OCR />, color: '#14b8a6', bg: '#ccfbf1' },
    { id: 'watermark', label: 'Watermark', icon: <Icons.Watermark />, color: '#0ea5e9', bg: '#e0f2fe' },
    { id: 'edit-metadata', label: 'Edit Metadata', icon: <Icons.Edit />, color: '#8b5cf6', bg: '#ede9fe' },
    { id: 'text-to-pdf', label: 'Text to PDF', icon: <Icons.Text />, color: '#3b82f6', bg: '#ede9fe' },
    { id: 'rotate', label: 'Rotate Pages', icon: <Icons.Rotate />, color: '#8b5cf6', bg: '#e0e7ff' },
    { id: 'delete', label: 'Delete Pages', icon: <Icons.TrashSmall />, color: '#ef4444', bg: '#fee2e2' },
    { id: 'organize', label: 'Organize', icon: <Icons.Organize />, color: '#06b6d4', bg: '#cffafe' },
    { id: 'rename', label: 'Rename PDF', icon: <Icons.Rename />, color: '#64748b', bg: '#dbeafe' },
    { id: 'lock', label: 'Lock PDF', icon: <Icons.Lock />, color: '#1e293b', bg: '#f1f5f9' },
    { id: 'unlock', label: 'Unlock PDF', icon: <Icons.Unlock />, color: '#10b981', bg: '#e0e7ff' },
    { id: 'view', label: 'View PDF', icon: <Icons.View />, color: '#ec4899', bg: '#fce7f3' },
  ];

  const handleToolClick = (toolId) => {
    if (onNotify) onNotify(null, true);
    if (toolId === 'lock' || toolId === 'unlock') {
       if (onOpenSecurity) onOpenSecurity(toolId);
       return;
    }
    
    const allowedTools = ['merge', 'compress', 'split', 'img-to-pdf', 'pdf-to-img', 'watermark', 'pdf-ocr', 'text-to-pdf', 'rename', 'rotate', 'delete', 'organize', 'edit-metadata', 'view', 'menu'];

    if (!allowedTools.includes(toolId)) {
        alert("Yeh tool abhi nayi file mein shift ho raha hai! Abhi baaki tools test kijiye.");
        return;
    }
    setActiveTool(toolId);
  };

  // 🔴 ROUTER ENGINE (All Tools)
  
  if (activeTool === 'merge') { return <div style={{ height: '100%', overflowY: 'auto' }}><div style={{ padding: '20px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '15px' }}><button onClick={() => setActiveTool('menu')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}><Icons.Back /></button><h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Back to Menu</h2></div><MergePdf onNotify={onNotify} isPremium={isPremium} /></div>; }
  if (activeTool === 'compress') { return <div style={{ height: '100%', overflowY: 'auto' }}><div style={{ padding: '20px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '15px' }}><button onClick={() => setActiveTool('menu')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}><Icons.Back /></button><h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Back to Menu</h2></div><CompressPdf onNotify={onNotify} isPremium={isPremium} /></div>; }
  if (activeTool === 'split') { return <div style={{ height: '100%', overflowY: 'auto' }}><div style={{ padding: '20px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '15px' }}><button onClick={() => setActiveTool('menu')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}><Icons.Back /></button><h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Back to Menu</h2></div><SplitPdf onNotify={onNotify} isPremium={isPremium} /></div>; }
  if (activeTool === 'img-to-pdf') { return <div style={{ height: '100%', overflowY: 'auto' }}><div style={{ padding: '20px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '15px' }}><button onClick={() => setActiveTool('menu')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}><Icons.Back /></button><h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Back to Menu</h2></div><ImgToPdf onNotify={onNotify} isPremium={isPremium} /></div>; }
  if (activeTool === 'pdf-to-img') { return <div style={{ height: '100%', overflowY: 'auto' }}><div style={{ padding: '20px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '15px' }}><button onClick={() => setActiveTool('menu')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}><Icons.Back /></button><h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Back to Menu</h2></div><PdfToImg onNotify={onNotify} isPremium={isPremium} /></div>; }
  if (activeTool === 'watermark') { return <div style={{ height: '100%', overflowY: 'auto' }}><div style={{ padding: '20px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '15px' }}><button onClick={() => setActiveTool('menu')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}><Icons.Back /></button><h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Back to Menu</h2></div><WatermarkPdf onNotify={onNotify} isPremium={isPremium} /></div>; }
  if (activeTool === 'pdf-ocr') { return <div style={{ height: '100%', overflowY: 'auto' }}><div style={{ padding: '20px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '15px' }}><button onClick={() => setActiveTool('menu')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}><Icons.Back /></button><h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Back to Menu</h2></div><ExtractText onNotify={onNotify} isPremium={isPremium} /></div>; }
  if (activeTool === 'text-to-pdf') { return <div style={{ height: '100%', overflowY: 'auto' }}><div style={{ padding: '20px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '15px' }}><button onClick={() => setActiveTool('menu')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}><Icons.Back /></button><h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Back to Menu</h2></div><TextToPdf onNotify={onNotify} isPremium={isPremium} /></div>; }
  if (activeTool === 'rename') { return <div style={{ height: '100%', overflowY: 'auto' }}><div style={{ padding: '20px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '15px' }}><button onClick={() => setActiveTool('menu')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}><Icons.Back /></button><h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Back to Menu</h2></div><RenamePdf onNotify={onNotify} isPremium={isPremium} /></div>; }
  if (activeTool === 'rotate') { return <div style={{ height: '100%', overflowY: 'auto' }}><div style={{ padding: '20px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '15px' }}><button onClick={() => setActiveTool('menu')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}><Icons.Back /></button><h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Back to Menu</h2></div><PageOps mode="rotate" onNotify={onNotify} isPremium={isPremium} /></div>; }
  if (activeTool === 'delete') { return <div style={{ height: '100%', overflowY: 'auto' }}><div style={{ padding: '20px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '15px' }}><button onClick={() => setActiveTool('menu')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}><Icons.Back /></button><h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Back to Menu</h2></div><PageOps mode="delete" onNotify={onNotify} isPremium={isPremium} /></div>; }
  if (activeTool === 'organize') { return <div style={{ height: '100%', overflowY: 'auto' }}><div style={{ padding: '20px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '15px' }}><button onClick={() => setActiveTool('menu')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}><Icons.Back /></button><h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Back to Menu</h2></div><PageOps mode="organize" onNotify={onNotify} isPremium={isPremium} /></div>; }
  if (activeTool === 'edit-metadata') {
    return (
      <div style={{ height: '100%', overflowY: 'auto' }}>
        <div style={{ padding: '20px 20px 0 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => setActiveTool('menu')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}><Icons.Back /></button>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Back to Menu</h2>
        </div>
        <EditMetadata onNotify={onNotify} isPremium={isPremium} />
      </div>
    );
  }
// 🔴 VIEW PDF (Full Screen Overlay)
  if (activeTool === 'view') {
    return <ViewPdf onClose={() => setActiveTool('menu')} />;
  }


  // 👇 Main Menu UI 👇
  return (
    <div style={{ padding: '20px', height: '100%', overflowY: 'auto', paddingBottom: '100px', background: 'var(--bg-main)', color: 'var(--text-main)', transition: 'background-color 0.3s' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onBack} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', cursor: 'pointer' }}>
            <Icons.Back />
          </button>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>PDF Master</h2>
        </div>
        <button onClick={() => setIsPremium(!isPremium)} style={{ padding: '6px 15px', borderRadius: '20px', border: 'none', background: isPremium ? '#f59e0b' : 'var(--bg-input)', color: isPremium ? '#000' : 'var(--text-main)', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Icons.Crown /> {isPremium ? 'Premium' : 'Free'}
        </button>
      </div>

      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
          {tools.slice(0, 15).map((t) => (
            <button key={t.id} onClick={() => handleToolClick(t.id)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', aspectRatio: '1/1', padding: '10px' }}>
              <div style={{ background: t.color, color: 'white', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '5px', boxShadow: `0 4px 10px ${t.color}40` }}>{t.icon}</div>
              <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-main)' }}>{t.label}</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: '15px' }}>
          <button onClick={() => handleToolClick('view')} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', display: 'flex', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', width: '100%', padding: '15px', gap: '15px' }}>
            <div style={{ background: tools[15].bg, color: tools[15].color, width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{tools[15].icon}</div>
            <div style={{ textAlign: 'left' }}>
              <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)', fontWeight: '700' }}>{tools[15].label}</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>Read PDFs Smoothly</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfTools;
//