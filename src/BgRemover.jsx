import React, { useState, useRef } from 'react';

const BgRemover = ({ onBack }) => {
  const [image, setImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [bgColor, setBgColor] = useState('transparent');
  const [showGuide, setShowGuide] = useState(true); // Popup dikhane ke liye state
  const fileInputRef = useRef(null);

  // Gallery Kholne Ka Function
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // Image Select Hone Par
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      // Yahan AI processing ka function call hoga
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* --- USER GUIDE POPUP (Modal) --- */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">Passport Photo Tips 📸</h2>
            <ul className="text-left text-gray-300 space-y-3 mb-6 text-sm">
              <li>💡 <strong>Lighting:</strong> Chehre par dono taraf se barabar roshni ho.</li>
              <li>🧍‍♂️ <strong>Posture:</strong> Phone aankhon ke level par rakhein, seedha dekhein.</li>
              <li>🏞️ <strong>Background:</strong> Peeche ka hissa thoda plain ho toh AI best cutting karega.</li>
            </ul>
            <button 
              onClick={() => setShowGuide(false)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition"
            >
              Got it! Open Camera
            </button>
          </div>
        </div>
      )}

      {/* --- TOP HEADER --- */}
      <div className="flex items-center justify-between p-4 bg-gray-800 shadow-md">
        <button onClick={onBack} className="text-gray-300 hover:text-white p-2">
          ← Back
        </button>
        <h1 className="text-xl font-bold">Pro Passport Maker</h1>
        <div className="bg-blue-600 text-xs px-3 py-1 rounded-full font-semibold">Free</div>
      </div>

      {/* --- MAIN WORKSPACE --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        
        {/* Hidden File Input Jo Gallery Kholega */}
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleImageChange} 
          className="hidden" 
        />

        {!image ? (
          /* Upload Area */
          <div 
            onClick={handleUploadClick}
            className="border-2 border-dashed border-gray-500 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-800 transition w-full max-w-xs"
          >
            <span className="text-5xl mb-4">📤</span>
            <p className="text-lg font-medium text-gray-300">Tap to Upload Image</p>
            <p className="text-sm text-gray-500 mt-2">Gallery se photo chunein</p>
          </div>
        ) : (
          /* Image Preview Area */
          <div className="flex flex-col items-center w-full">
            <div 
              className="relative w-64 h-80 rounded-xl overflow-hidden shadow-2xl mb-6 flex items-end justify-center"
              style={{ backgroundColor: bgColor }} // Yahan color change hoga
            >
              <img 
                src={processedImage || image} 
                alt="Preview" 
                className="max-h-full max-w-full object-contain drop-shadow-xl"
                style={{ filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.3))' }} // Inshot jaisa halka Stroke/Edge effect
              />
            </div>

            {/* Passport Color Buttons */}
            <div className="w-full bg-gray-800 p-4 rounded-2xl flex justify-around items-center">
              <p className="text-sm text-gray-400 font-medium">Background Color:</p>
              <button onClick={() => setBgColor('transparent')} className="w-10 h-10 rounded-full border-2 border-gray-500 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYNgfQMQcxjCAIfjPQA1EGoYGBoMvNBoGh8EwGAwYI0kG+O/TNxqGhhEADvceXqJb0XQAAAAASUVORK5CYII=')]"></button>
              <button onClick={() => setBgColor('#005bb5')} className="w-10 h-10 rounded-full border-2 border-gray-500 bg-[#005bb5]"></button>
              <button onClick={() => setBgColor('#ffffff')} className="w-10 h-10 rounded-full border-2 border-gray-500 bg-white"></button>
              <button onClick={() => setBgColor('#ff0000')} className="w-10 h-10 rounded-full border-2 border-gray-500 bg-red-600"></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BgRemover;