"use client";
import { useState } from 'react';
import SubmitModal from './SubmitModal';

export default function SubmitModalButton({ seccion, label }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto bg-rotonda-gold hover:bg-rotonda-gold-dark text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-md text-lg"
      >
        {label}
      </button>

      <SubmitModal 
        seccion={seccion} 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
