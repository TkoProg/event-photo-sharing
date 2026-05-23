'use client';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function UploadPhotoPage() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 font-sans">
      <div className="max-w-xl mx-auto">
        
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="text-sm text-gray-500 hover:text-white transition-colors mb-8 flex items-center gap-2"
        >
          <span>&larr;</span> Nazad na galeriju
        </button>

        <h1 className="text-3xl font-bold mb-8">Dodaj novu fotografiju</h1>

        {/* Upload Box */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
          
          {!preview ? (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/20 rounded-2xl cursor-pointer hover:border-white/50 hover:bg-white/5 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-10 h-10 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-2 text-sm text-gray-400 font-semibold">Klikni za upload ili prevuci sliku</p>
                <p className="text-xs text-gray-500">PNG, JPG do 5MB</p>
              </div>
              <input type="file" className="hidden" onChange={handleImagePick} accept="image/*" />
            </label>
          ) : (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full h-64 object-cover rounded-2xl shadow-2xl" />
              <button 
                onClick={() => setPreview(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4">
            <button 
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-semibold"
            >
              Odustani
            </button>
            <button 
              disabled={!preview}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${
                preview 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-white/5 text-gray-600 cursor-not-allowed'
              }`}
            >
              Objavi fotografiju
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}