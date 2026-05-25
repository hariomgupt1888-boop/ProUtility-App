import { Capacitor } from '@capacitor/core'; 
import { Filesystem, Directory } from '@capacitor/filesystem'; 

export const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(2) + ' MB';
};

export const readFile = (file) => new Promise((res) => { 
    const r = new FileReader(); 
    r.onload = () => res(r.result); 
    r.readAsArrayBuffer(file); 
});

export const readImage = (file) => new Promise((res) => { 
    const r = new FileReader(); 
    r.onload = () => res(r.result); 
    r.readAsDataURL(file); 
});

export const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = reject;
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.readAsDataURL(blob);
});

export const handleNativeSave = async (blob, fileName, fileType, setStatus, onNotify) => {
    try {
        if (Capacitor.isNativePlatform()) {
            if(setStatus) setStatus("Saving to Phone...");
            const base64Data = await blobToBase64(blob);
            await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Documents });
        } else {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a'); link.href = url; link.download = fileName;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        }
        if (onNotify) onNotify(`${fileName} Saved! ✅`, false, fileName, fileType, blob);
    } catch (error) {
        console.error("Save Error: ", error);
        alert("⚠️ Storage Permission Required!\nPlease allow storage access.");
    }
};

export const checkInternetAndDownload = async (blob, fileName, fileType, isPremium, setStatus, setIsProcessing, onNotify) => {
  if (isPremium) {
    await handleNativeSave(blob, fileName, fileType, setStatus, onNotify);
    if(setIsProcessing) setIsProcessing(false); 
    if(setStatus) setStatus(''); 
    return;
  }
  
  if (navigator.onLine) {
    if(setStatus) setStatus('Loading Ad...');
    setTimeout(async () => {
      await handleNativeSave(blob, fileName, fileType, setStatus, onNotify);
      if(setIsProcessing) setIsProcessing(false); 
      if(setStatus) setStatus('');
    }, 1500); 
  } else {
    alert('⚠️ Internet Required!\nFree users need internet to save files.');
    if(setIsProcessing) setIsProcessing(false); 
    if(setStatus) setStatus('');
  }
};