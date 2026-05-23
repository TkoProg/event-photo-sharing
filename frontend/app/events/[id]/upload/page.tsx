'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function UploadPhotoPage() {
  const params = useParams();
  const id = params?.id;
  
  // Ovdje čuvamo lokalni link od slike koju korisnik izabere
  const [preview, setPreview] = useState<string | null>(null);

  // Funkcija koja se pokreće kada izaberemo fajl
  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Pravimo privremeni URL kako bismo mogli prikazati sliku na ekranu
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
    }
  };

  // Funkcija za slanje (Mock)
  const handleUpload = () => {
    alert("Bravo! Slika je spremna za slanje. (Ovdje će Samra kasnije dodati API poziv prema backendu)");
    // Kada se pošalje, možemo očistiti formu:
    // setPreview(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10 font-sans">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dodaj novu fotografiju</h1>
            <p className="text-gray-500 mt-1">Event ID: {id}</p>
          </div>
          <Link 
            href={`/events/${id}`} 
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            &larr; Nazad na galeriju
          </Link>
        </header>

        {/* Glavni kontejner za upload */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 text-center">
          
          {/* Ako slika NIJE izabrana, prikaži okvir za dodavanje */}
          {!preview ? (
            <div className="border-2 border-dashed border-white/20 rounded-2xl py-24 px-6 flex flex-col items-center justify-center hover:border-white/50 hover:bg-white/10 transition-all relative group overflow-hidden">
              <span className="text-5xl mb-4 group-hover:scale-110 transition-transform">📸</span>
              <p className="text-xl font-semibold mb-2">Klikni ovdje da izabereš sliku</p>
              <p className="text-sm text-gray-500">Podržani formati: JPG, PNG</p>
              
              {/* Nevidljivi input koji prekriva cijeli okvir */}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImagePick}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
            </div>
          ) : (
            /* Ako je slika IZABRANA, prikaži preview i dugmad */
            <div className="flex flex-col items-center animate-in fade-in duration-300">
              <div className="relative rounded-2xl overflow-hidden mb-8 max-h-[400px] border border-white/10 shadow-2xl">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="max-w-full max-h-[400px] object-contain bg-black" 
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => setPreview(null)} 
                  className="px-8 py-3 rounded-xl font-semibold bg-white/10 hover:bg-white/20 transition-colors w-full sm:w-auto"
                >
                  Odaberi drugu
                </button>
                <button 
                  onClick={handleUpload} 
                  className="px-8 py-3 rounded-xl font-semibold bg-white text-black hover:bg-gray-200 transition-colors w-full sm:w-auto shadow-lg shadow-white/10"
                >
                  Pošalji sliku
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}