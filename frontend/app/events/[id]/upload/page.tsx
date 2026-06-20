'use client';
import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { uploadFotografije } from '@/lib/api';

const PREVODI = {
  BS: {
    nazad: '← Nazad u kontrolnu ploču',
    naslov: 'Dodaj slike i videozapise',
    opis: 'Podijelite najljepše trenutke sa ovog događaja. Možete izabrati više datoteka odjednom.',
    dragDrop: 'Prevucite medije ovdje ili',
    klikni: 'pretražite datoteke',
    podrzano: 'Podržani formati: Slike (JPG, PNG, WEBP) i Videozapisi (MP4, MOV)',
    izabrano: 'Izabrane datoteke',
    ZaposniUpload: 'Započni upload',
    učitavanje: 'Slanje medija na server...',
    uspjeh: 'Uspješno dodano! 🚀',
    greska: 'Greška pri uploadu. Pokušajte ponovo.',
    prazno: 'Niste izabrali nijednu datoteku.'
  },
  EN: {
    nazad: '← Back to dashboard',
    naslov: 'Add photos and videos',
    opis: 'Share the best moments from this event. You can select multiple files at once.',
    dragDrop: 'Drag & drop media here or',
    klikni: 'browse files',
    podrzano: 'Supported formats: Images (JPG, PNG, WEBP) and Videos (MP4, MOV)',
    izabrano: 'Selected files',
    ZaposniUpload: 'Start upload',
    učitavanje: 'Uploading media to server...',
    uspjeh: 'Successfully uploaded! 🚀',
    greska: 'Upload error. Please try again.',
    prazno: 'No files selected.'
  }
};

interface FileWithPreview {
  file: File;
  previewUrl: string;
  isVideo: boolean;
}

export default function UploadMediaPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [jezik, setJezik] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('izabraniJezik') || 'BS';
    }
    return 'BS';
  });

  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = jezik === 'BS' ? PREVODI.BS : PREVODI.EN;

  const processFiles = (files: FileList | null) => {
    if (!files) return;

    const validFiles: FileWithPreview[] = Array.from(files)
      .filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
      .map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
        isVideo: file.type.startsWith('video/')
      }));

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert(t.prazno);
      return;
    }

    setLoading(true);
    setStatusMsg(t.učitavanje);

    try {
      const filesArray = selectedFiles.map(f => f.file);
      await uploadFotografije(Number(eventId), filesArray);
      
      setStatusMsg(t.uspjeh);
      // Oslobodi memoriju od preview URL-ova
      selectedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
      
      setTimeout(() => {
        router.push(`/events/${eventId}?tab=photos`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatusMsg(t.greska);
      setLoading(false);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-12 font-sans flex items-center justify-center">
      <div className="max-w-3xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Link za nazad */}
        <Link href={`/events/${eventId}?tab=photos`} className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors font-medium">
          {t.nazad}
        </Link>

        {/* Naslovna sekcija */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent">
            {t.naslov}
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-xl leading-relaxed">
            {t.opis}
          </p>
        </div>

        {/* Drag & Drop Zona */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            processFiles(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-white/10 hover:border-blue-500/40 bg-white/[0.01] hover:bg-blue-500/[0.02] transition-all rounded-3xl p-8 md:p-12 text-center cursor-pointer group relative"
        >
          <input 
            ref={fileInputRef} 
            type="file" 
            multiple 
            accept="image/*,video/*" 
            className="hidden" 
            onChange={e => processFiles(e.target.files)} 
          />
          
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
            📁
          </div>
          <p className="text-lg font-bold text-gray-200">
            {t.dragDrop} <span className="text-blue-400 underline group-hover:text-blue-300">{t.klikni}</span>
          </p>
          <p className="text-xs text-gray-500 mt-3 max-w-md mx-auto">
            {t.podrzano}
          </p>
        </div>

        {/* Grid sa prelaznim datotekama (Previews) */}
        {selectedFiles.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider uppercase ml-1">
              {t.izabrano} ({selectedFiles.length})
            </h3>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 bg-[#111] p-4 rounded-3xl border border-white/5 max-h-64 overflow-y-auto">
              {selectedFiles.map((item, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group bg-black">
                  {item.isVideo ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-950/20 text-blue-400 p-2 text-center">
                      <span className="text-2xl mb-1">🎬</span>
                      <p className="text-[9px] font-bold truncate w-full px-1">{item.file.name}</p>
                    </div>
                  ) : (
                    <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  )}
                  
                  {/* Dugme za uklanjanje fajla sa liste */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                    className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-500/80 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statusne poruke */}
        {statusMsg && (
          <div className={`p-4 rounded-2xl text-sm font-bold border text-center ${
            statusMsg === t.uspjeh 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : statusMsg === t.greska 
                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                : 'bg-white/5 border-white/10 text-gray-300'
          }`}>
            {statusMsg}
          </div>
        )}

        {/* Glavno dugme za pokretanje uploada */}
        <button 
          onClick={handleUpload} 
          disabled={loading || selectedFiles.length === 0}
          className="w-full bg-white text-black py-4 rounded-full font-bold hover:bg-gray-200 transition-all text-sm active:scale-[0.99] disabled:opacity-30 disabled:pointer-events-none shadow-xl"
        >
          {loading ? '...' : t.ZaposniUpload}
        </button>

      </div>
    </div>
  );
}