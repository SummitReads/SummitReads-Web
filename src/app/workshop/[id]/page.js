"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function WorkshopPage() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [tier, setTier] = useState('brief'); // Default to Brief

  useEffect(() => {
    async function getBook() {
      const { data } = await supabase.from('books').select('*').eq('id', id).single();
      if (data) setBook(data);
    }
    if (id) getBook();
  }, [id]);

  if (!book) return <div className="p-20 text-white font-serif">Synthesizing intelligence...</div>;

  return (
    <main className="min-h-screen bg-[#0A0F1A] text-[#E0E0E0] font-serif py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-16 border-b border-white/10 pb-12">
          <h1 className="text-6xl font-bold mb-4 tracking-tight text-white">{book.title}</h1>
          <p className="text-xl text-blue-400 italic">Curation of {book.author}'s First Principles</p>
        </header>

        {/* The Executive Toggle */}
        <div className="flex space-x-4 mb-12 border-b border-white/5 pb-4">
          {['brief', 'standard', 'deep'].map((t) => (
            <button 
              key={t}
              onClick={() => setTier(t)}
              className={`capitalize text-sm tracking-widest transition-all ${tier === t ? 'text-blue-500 font-bold' : 'text-gray-500 hover:text-white'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Dynamic Content Area */}
        <div className="animate-in fade-in duration-700">
          {tier === 'brief' && <p className="text-2xl leading-relaxed text-white">{book.brief_content}</p>}
          
          {tier === 'standard' && <div className="space-y-6 text-lg leading-relaxed">{book.standard_content}</div>}
          
          {tier === 'deep' && (
            <div className="space-y-12">
              {book.deep_content?.map((lab, i) => (
                <div key={i} className="border-l-2 border-blue-500 pl-8 py-2">
                  <h3 className="text-2xl font-bold mb-4 text-white">{lab.title}</h3>
                  <p className="text-gray-400">{lab.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}