// src/utils/dbUtils.js

export const initDB = () => {
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

export const saveFileToDB = async (fileData) => {
  const db = await initDB();
  const tx = db.transaction('recentFiles', 'readwrite');
  tx.objectStore('recentFiles').put(fileData);
  return tx.complete;
};

export const getFilesFromDB = async () => {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction('recentFiles', 'readonly');
    const store = tx.objectStore('recentFiles');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a,b) => b.id - a.id));
  });
};

export const clearDB = async () => {
  const db = await initDB();
  const tx = db.transaction('recentFiles', 'readwrite');
  tx.objectStore('recentFiles').clear();
  return tx.complete;
};