'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function CreateAlbumPage() {
  const [albumName, setAlbumName] = useState('');
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id;

  const handleCreate = () => {
  if (albumName.trim() === '') return;

  const saved = localStorage.getItem('moji_albumi');
  const albums = saved ? JSON.parse(saved) : [
    { id: 1, name: 'Svadba - Najbolji momenti', count: 45 },
    { id: 2, name: 'Pripreme', count: 12 },
  ];

  const noviAlbum = { 
    id: Date.now(), // Generiše unikatni ID
    name: albumName, 
    count: 0 
  };
  
  localStorage.setItem('moji_albumi', JSON.stringify([...albums, noviAlbum]));
  
  router.push(`/events/${eventId}?tab=albums`);
};

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-20 font-sans">
      <div className="max-w-lg mx-auto">
        <button 
          onClick={() => router.replace(`/events/${eventId}?tab=albums`)} 
          className="text-gray-500 hover:text-white mb-8 flex items-center gap-2 transition-colors"
        >
          &larr; Nazad
        </button>

        <h1 className="text-3xl font-bold mb-8 text-white">Novi Album</h1>
        
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Naziv albuma</label>
            <input 
              type="text" 
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              placeholder="Npr. Ljetovanje 2026" 
              className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => router.back()} 
              className="flex-1 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all"
            >
              Odustani
            </button>
            <button 
              onClick={handleCreate}
              className="flex-1 px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-all active:scale-95"
            >
              Kreiraj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}