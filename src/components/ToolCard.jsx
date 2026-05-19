// src/components/ToolCard.jsx
import React from 'react';

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

export default ToolCard;