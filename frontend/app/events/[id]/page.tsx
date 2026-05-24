'use client';
import React from 'react';
import Link from 'next/link';


export default function EventGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Galerija</h1>
            <p className="text-gray-500 text-sm">ID događaja: {id}</p>
          </div>
          <Link href="/organizer/events" className="text-xs text-gray-500 hover:text-white transition-colors">
            &larr; Nazad na listu
          </Link>
        </header>

        <div className="border-2 border-dashed border-white/10 rounded-[2rem] h-[400px] flex items-center justify-center">
          <p className="text-gray-600 italic">Ovdje Merjem dodaje grid sa slikama...</p>
        </div>
      </div>
    </div>
  );
}