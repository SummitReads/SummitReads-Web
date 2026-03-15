"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MadLibBuilder({ question, template, hints, onSave }) {
  const [inputs, setInputs] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const [activeInput, setActiveInput] = useState(null);

  const renderTemplate = () => {
    const parts = template.split(/(\{.*?\})/g);
    let inputIndex = 0;
    
    return parts.map((part, i) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        const key = part.slice(1, -1);
        const currentIndex = inputIndex++;
        return (
          <div key={i} className="inline-block relative group">
            <DynamicInput
              isLocked={isLocked}
              placeholder={hints?.[currentIndex] || "..."}
              onFocus={() => setActiveInput(currentIndex)}
              onBlur={() => setActiveInput(null)}
              onChange={(val) => setInputs(prev => ({ ...prev, [key]: val }))}
            />
            {/* Contextual Tooltip for better UX */}
            <AnimatePresence>
              {activeInput === currentIndex && !isLocked && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 5 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-0 top-full z-20 bg-[var(--brand-teal)] text-slate-900 text-xs font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none"
                >
                  Example: {hints?.[currentIndex] || "Be specific..."}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }
      return <span key={i} className="mx-1">{part}</span>;
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel"
      style={{ padding: '48px', margin: '40px 0', border: '1px solid rgba(25, 190, 227, 0.2)' }}
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="pulse-dot"></div>
        <h3 className="text-[var(--brand-teal)] font-bold uppercase tracking-widest text-xs">
          Step 2: Interactive Internalization
        </h3>
      </div>
      
      <h2 className="text-white font-serif text-3xl mb-10 leading-tight">
        {question}
      </h2>

      <div className="text-xl md:text-2xl leading-[2.5] text-slate-100">
        {renderTemplate()}
      </div>

      <div className="mt-12 flex items-center gap-6">
        <button 
          onClick={() => {
            setIsLocked(true);
            onSave(inputs);
          }}
          disabled={isLocked}
          className="btn-primary"
          style={{ padding: '16px 40px', fontSize: '1.1rem', opacity: isLocked ? 0.6 : 1 }}
        >
          {isLocked ? '✓ Strategy Locked' : 'Lock in My Strategy'}
        </button>
        
        {isLocked && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[var(--brand-teal)] font-medium italic">
            Logic added to your Mastery Portfolio.
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

function DynamicInput({ placeholder, onChange, isLocked, onFocus, onBlur }) {
  const [val, setVal] = useState("");
  
  return (
    <input
      type="text"
      value={val}
      disabled={isLocked}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={placeholder}
      className="madlib-input-premium"
      style={{ 
        width: `${Math.max(val.length + 2, placeholder.length + 2)}ch`,
        minWidth: '120px',
        transition: 'all 0.3s ease',
        borderBottom: isLocked ? '2px solid transparent' : '2px solid rgba(25, 190, 227, 0.4)',
        padding: '0 8px',
        margin: '0 4px',
        background: 'rgba(25, 190, 227, 0.03)'
      }}
      onChange={(e) => {
        setVal(e.target.value);
        onChange(e.target.value);
      }}
    />
  );
}