'use client';
import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Photo {
  id: number;
  url: string;
  tags: string[];
  likes: number;
  isLiked: boolean;
  isFavorite: boolean;
  comments: { user: string; text: string }[];
}

const PREVODI = {
  BS: {
    naslov: 'Dodaj fotografije',
    nazad: '← Nazad na galeriju',
    klikniIliPrevuci: 'Klikni za upload ili prevuci slike',
    formatInfo: 'PNG, JPG do 10MB • Više slika odjednom',
    spremnihSlika: 'Odabrane slike',
    objavi: 'Objavi fotografije',
    odustani: 'Odustani',
    uploading: '⏳ Objavljujem...',
    uspjeh: '✅ Objavljeno!',
    dodajTag: 'Dodaj tag (npr. svadba)...',
    tagovi: 'Tagovi za sve slike',
    dodaj: 'Dodaj',
  },
  EN: {
    naslov: 'Add photos',
    nazad: '← Back to gallery',
    klikniIliPrevuci: 'Click to upload or drag images',
    formatInfo: 'PNG, JPG up to 10MB • Multiple images at once',
    spremnihSlika: 'Selected photos',
    objavi: 'Publish photos',
    odustani: 'Cancel',
    uploading: '⏳ Publishing...',
    uspjeh: '✅ Published!',
    dodajTag: 'Add tag (e.g. wedding)...',
    tagovi: 'Tags for all photos',
    dodaj: 'Add',
  }
};

export default function UploadPhotoPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const router = useRouter();

  const [previews, setPreviews] = useState<{ url: string; file: File }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const jezik = typeof window !== 'undefined' ? (localStorage.getItem('izabraniJezik') ?? 'BS') : 'BS';
  const t = jezik === 'BS' ? PREVODI.BS : PREVODI.EN;

  const processFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, { url: reader.result as string, file }]);
        };
        reader.readAsDataURL(file);
      });
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) setTags(prev => [...prev, tag]);
    setNewTag('');
  };

  const handleSubmit = () => {
    if (previews.length === 0) return;
    setIsUploading(true);

    setTimeout(() => {
      // Kreiraj Photo objekte
      const noveSlike: Photo[] = previews.map((p, i) => ({
        id: Date.now() + i,
        url: p.url,
        tags,
        likes: 0,
        isLiked: false,
        isFavorite: false,
        comments: [],
      }));

      // Spremi u localStorage
      const key = `event_photos_${eventId}`;
      const existing: Photo[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([...noveSlike, ...existing]));

      setIsUploading(false);
      setDone(true);

      // Vrati na galeriju nakon 1.5s
      setTimeout(() => router.push(`/events/${eventId}?tab=photos`), 1500);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 font-sans">
      <div className="max-w-2xl mx-auto">

        <button
          onClick={() => router.push(`/events/${eventId}?tab=photos`)}
          className="text-sm text-gray-500 hover:text-white transition-colors mb-8 flex items-center gap-2"
        >
          {t.nazad}
        </button>

        <h1 className="text-3xl font-bold mb-8">{t.naslov}</h1>

        <div className="space-y-6">
          {/* Upload zona */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
            onDrop={e => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 hover:border-white/40 bg-white/5'}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={e => processFiles(e.target.files)}
            />
            <div className="text-5xl mb-4">📁</div>
            <p className="font-semibold text-lg mb-2">{t.klikniIliPrevuci}</p>
            <p className="text-sm text-gray-500">{t.formatInfo}</p>
          </div>

          {/* Preview odabranih slika */}
          {previews.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-400 mb-3">{t.spremnihSlika} ({previews.length})</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {previews.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10">
                    <img src={p.url} alt="preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPreviews(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-black text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tagovi */}
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5">
            <p className="text-sm font-semibold text-gray-400 mb-4">{t.tagovi}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map(tag => (
                <span key={tag} className="bg-white/10 text-sm px-3 py-1 rounded-full flex items-center gap-2">
                  #{tag}
                  <button onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="text-gray-400 hover:text-red-400">✕</button>
                </span>
              ))}
            </div>
            <form onSubmit={handleAddTag} className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder={t.dodajTag}
                className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-white/30 outline-none"
              />
              <button type="submit" className="bg-white text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200">
                {t.dodaj}
              </button>
            </form>
          </div>

          {/* Dugmad */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/events/${eventId}?tab=photos`)}
              className="flex-1 px-6 py-4 rounded-full border border-white/10 hover:bg-white/5 transition-colors font-semibold"
            >
              {t.odustani}
            </button>
            <button
              onClick={handleSubmit}
              disabled={previews.length === 0 || isUploading || done}
              className={`flex-1 px-6 py-4 rounded-full font-bold transition-all ${
                done
                  ? 'bg-green-500 text-white'
                  : previews.length === 0 || isUploading
                  ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-gray-200 active:scale-[0.98]'
              }`}
            >
              {done ? t.uspjeh : isUploading ? t.uploading : t.objavi}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
