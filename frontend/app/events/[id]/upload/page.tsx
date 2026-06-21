'use client';
import React, { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { uploadFotografije, ApiFotografija, getFotografija, prihvatiSveAITagove } from '@/lib/api';
import AITagReview from '@/app/components/AITagReview';

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
    uspjeh: '✓ Objavljeno!',
    greska: 'Greška pri uploadu. Pokušaj ponovo.',
    nisiOdabrala: 'Odaberi barem jednu sliku.',
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
    uspjeh: '✓ Published!',
    greska: 'Upload failed. Please try again.',
    nisiOdabrala: 'Select at least one photo.',
  }
};

export default function UploadPhotoPage() {
  const params = useParams();
  const eventId = Number(params?.id);
  const router = useRouter();

  const jezik = typeof window !== 'undefined'
    ? (localStorage.getItem('izabraniJezik') ?? 'BS')
    : 'BS';
  const t = jezik === 'BS' ? PREVODI.BS : PREVODI.EN;

  const [previews, setPreviews] = useState<{ url: string; file: File }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<ApiFotografija[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set());
  const [savingAll, setSavingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async () => {
    if (previews.length === 0) { setError(t.nisiOdabrala); return; }
    setIsUploading(true);
    setError(null);

    try {
      // Pravi upload na backend
      const files = previews.map(p => p.file);
      const uploadedFiles = await uploadFotografije(eventId, files);

      setUploadedPhotos(uploadedFiles);
      setDone(true);

      // Initialize reviewed set for any image that already has no pending AI tags
      const initiallyReviewed = new Set<number>();
      uploadedFiles.forEach(f => {
        const pending = (f.ai_tagovi || []).some(t => t.status === 'PENDING');
        if (!pending) initiallyReviewed.add(f.id);
      });
      setReviewedIds(initiallyReviewed);

      // Set current to first not-reviewed image (or 0)
      const firstUnreviewedIdx = uploadedFiles.findIndex(f => !initiallyReviewed.has(f.id));
      setCurrentPhotoIndex(firstUnreviewedIdx === -1 ? 0 : firstUnreviewedIdx);
    } catch (err) {
      setError(t.greska);
      setIsUploading(false);
    }
  };

  // Refresh a single photo after tag operations; mark reviewed if no pending tags remain
  const handleRefresh = async (photoId: number) => {
    try {
      const refreshed = await getFotografija(photoId);
      setUploadedPhotos(prev => prev.map(p => p.id === photoId ? refreshed : p));

      const hasPending = (refreshed.ai_tagovi || []).some(t => t.status === 'PENDING');
      if (!hasPending) {
        setReviewedIds(prev => {
          const next = new Set(prev);
          next.add(photoId);
          return next;
        });

        // Move to next unreviewed photo or finish
        const nextIdx = uploadedPhotos.findIndex(p => p.id !== photoId && !reviewedIds.has(p.id));
        // If there is another unreviewed, navigate to it
        if (nextIdx !== -1) {
          setCurrentPhotoIndex(nextIdx);
        } else {
          // All reviewed? check using updated reviewedIds
          const allReviewed = uploadedPhotos.every(p => reviewedIds.has(p.id) || p.id === photoId || ((refreshed.ai_tagovi || []).every(t => t.status !== 'PENDING')));
          if (allReviewed) router.push(`/events/${eventId}?tab=photos`);
        }
      }
    } catch (err) {
      // ignore
    }
  };

  const findPrevUnreviewed = (from: number) => {
    for (let i = from - 1; i >= 0; i--) {
      if (!reviewedIds.has(uploadedPhotos[i].id)) return i;
    }
    return -1;
  };

  const findNextUnreviewed = (from: number) => {
    for (let i = from + 1; i < uploadedPhotos.length; i++) {
      if (!reviewedIds.has(uploadedPhotos[i].id)) return i;
    }
    return -1;
  };

  const handleAcceptAllForAll = async () => {
    if (uploadedPhotos.length === 0) return;
    setSavingAll(true);
    try {
      const toProcess = uploadedPhotos.filter(p => !reviewedIds.has(p.id));
      const results = await Promise.allSettled(toProcess.map(p => prihvatiSveAITagove(p.id)));
      const refreshed = results.map((r, idx) => r.status === 'fulfilled' ? (r.value as ApiFotografija) : toProcess[idx]);
      // Merge refreshed into uploadedPhotos
      setUploadedPhotos(prev => prev.map(p => {
        const found = refreshed.find(r => r.id === p.id);
        return found || p;
      }));
      // Mark all as reviewed
      setReviewedIds(prev => {
        const next = new Set(prev);
        uploadedPhotos.forEach(p => next.add(p.id));
        return next;
      });
      // After saving all, go back to gallery
      router.push(`/events/${eventId}?tab=photos`);
    } catch (err) {
      // ignore
    } finally {
      setSavingAll(false);
    }
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

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Upload zona */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
            onDrop={e => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 hover:border-white/40 bg-white/5'}`}
          >
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
              onChange={e => processFiles(e.target.files)} />
            <div className="text-5xl mb-4">📁</div>
            <p className="font-semibold text-lg mb-2">{t.klikniIliPrevuci}</p>
            <p className="text-sm text-gray-500">{t.formatInfo}</p>
          </div>

          {/* Preview */}
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

          {/* Dugmad i AI review sekcija */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={() => router.push(`/events/${eventId}?tab=photos`)}
                className="flex-1 px-6 py-4 rounded-full border border-white/10 hover:bg-white/5 transition-colors font-semibold"
              >
                {t.odustani}
              </button>
              {!done && (
                <button
                  onClick={handleSubmit}
                  disabled={previews.length === 0 || isUploading}
                  className={`flex-1 px-6 py-4 rounded-full font-bold transition-all ${
                    previews.length === 0
                      ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                      : isUploading
                      ? 'bg-gray-700 text-white cursor-not-allowed'
                      : 'bg-white text-black hover:bg-gray-200 active:scale-[0.98]'
                  }`}
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-3">
                      <span className="inline-block animate-spin text-xl">⏳</span>
                      {t.uploading}
                    </span>
                  ) : (
                    t.objavi
                  )}
                </button>
              )}
              {done && uploadedPhotos.length > 0 && (
                <>
                  <button
                    onClick={handleAcceptAllForAll}
                    disabled={savingAll}
                    className="px-6 py-4 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingAll ? 'Saving...' : (jezik === 'BS' ? 'Prihvati sve tagove za sve slike' : 'Accept all tags for all photos')}
                  </button>
                </>
              )}
            </div>

            {/* AI Tag Review - prikaži nakon uploada */}
            {done && uploadedPhotos.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold">🤖 {jezik === 'BS' ? 'AI tag review' : 'AI tag review'}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const prev = findPrevUnreviewed(currentPhotoIndex);
                        if (prev !== -1) setCurrentPhotoIndex(prev);
                      }}
                      disabled={findPrevUnreviewed(currentPhotoIndex) === -1}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-50"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => {
                        const next = findNextUnreviewed(currentPhotoIndex);
                        if (next !== -1) setCurrentPhotoIndex(next);
                      }}
                      disabled={findNextUnreviewed(currentPhotoIndex) === -1}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-50"
                    >
                      →
                    </button>
                  </div>
                </div>

                <div className="border border-white/10 rounded-3xl p-6 bg-white/5">
                  <img
                    src={uploadedPhotos[currentPhotoIndex]?.url}
                    alt="uploaded"
                    className="w-full max-h-64 object-cover rounded-2xl mb-4"
                  />
                  {reviewedIds.has(uploadedPhotos[currentPhotoIndex]?.id) ? (
                    <div className="text-sm text-green-300 font-semibold">{jezik === 'BS' ? 'Sačuvano i zaključano' : 'Saved and locked'}</div>
                  ) : (
                    <AITagReview
                      fotografija={uploadedPhotos[currentPhotoIndex]}
                      onRefresh={() => handleRefresh(uploadedPhotos[currentPhotoIndex].id)}
                      jezik={jezik}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}