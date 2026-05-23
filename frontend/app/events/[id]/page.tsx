'use client';
import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Mock podaci za slike
const mockFotografije = [
  { id: 1, url: 'https://picsum.photos/seed/slika1/300/200', uploader: 'Gost 1', likes: 5 },
  { id: 2, url: 'https://picsum.photos/seed/slika2/300/200', uploader: 'Gost 2', likes: 12 },
  { id: 3, url: 'https://picsum.photos/seed/slika3/300/200', uploader: 'Gost 3', likes: 0 },
  { id: 4, url: 'https://picsum.photos/seed/slika4/300/200', uploader: 'Gost 4', likes: 8 },
  { id: 5, url: 'https://picsum.photos/seed/slika5/300/200', uploader: 'Gost 5', likes: 21 },
  { id: 6, url: 'https://picsum.photos/seed/slika6/300/200', uploader: 'Gost 6', likes: 3 },
];

export default function EventGalleryPage() {
  // useParams() automatski i bezbjedno uzima id iz linka (npr. iz /events/123 uzima "123")
  const params = useParams();
  const id = params?.id;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header sekcija */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Galerija</h1>
            <p className="text-gray-500 text-sm mt-1">ID događaja: {id}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href={`/events/${id}/upload`} 
              className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Dodaj sliku
            </Link>
            <Link href="/organizer/events" className="text-xs text-gray-500 hover:text-white transition-colors">
              &larr; Nazad na listu
            </Link>
          </div>
        </header>

        {/* Grid sa slikama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {mockFotografije.map((foto) => (
            <Link 
              href={`/photos/${foto.id}`} 
              key={foto.id} 
              className="border border-white/10 bg-white/5 rounded-2xl overflow-hidden hover:border-white/30 transition-colors group cursor-pointer block"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={foto.url} 
                  alt={`Slika ${foto.id}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-sm text-gray-400">{foto.uploader}</span>
                <span className="text-sm font-semibold flex items-center gap-1">
                  <span className="text-red-500">❤️</span> {foto.likes}
                </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}