'use client';
import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { uploadFotografije, ApiFotografija, getFotografija, prihvatiSveAITagove } from '@/lib/api';
import AITagReview from '@/app/components/AITagReview';

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
    ucitavanje: 'Slanje medija na server...',
    uspjeh: 'Uspješno dodano!',
    greska: 'Greška pri uploadu. Pokušajte ponovo.',
    prazno: 'Niste izabrali nijednu datoteku.',
    odustani: 'Odustani',
    nazadGalerija: 'Nazad na galeriju',
    aiReview: 'AI tag review',
    prihvatiSve: 'Prihvati sve tagove za sve slike',
    saving: 'Spremam...',
    sacuvano: 'Sačuvano i zaključano',
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
    ucitavanje: 'Uploading media to server...',
    uspjeh: 'Successfully uploaded!',
    greska: 'Upload error. Please try again.',
    prazno: 'No files selected.',
    odustani: 'Cancel',
    nazadGalerija: 'Back to gallery',
    aiReview: 'AI tag review',
    prihvatiSve: 'Accept all tags for all photos',
    saving: 'Saving...',
    sacuvano: 'Saved and locked',
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

  const [jezik] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('izabraniJezik') || 'BS';
    }
    return 'BS';
  });

  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<ApiFotografija[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set());
  const [savingAll, setSavingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = jezik === 'BS' ? PREVODI.BS : PREVODI.EN;
  const reviewablePhotos = useMemo(
    () => uploadedPhotos.filter((photo) => photo.tip_medija !== 'video'),
    [uploadedPhotos],
  );
  const currentPhoto = reviewablePhotos[currentPhotoIndex];

  const processFiles = (files: FileList | null) => {
    if (!files || done) return;

    const validFiles: FileWithPreview[] = Array.from(files)
      .filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'))
      .map(file => ({
        file,
        previewUrl: URL.createObjectURL(file),
        isVideo: file.type.startsWith('video/')
      }));

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const revokeSelectedUrls = (files = selectedFiles) => {
    files.forEach(file => URL.revokeObjectURL(file.previewUrl));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setStatusMsg(t.prazno);
      return;
    }

    setLoading(true);
    setStatusMsg(t.ucitavanje);

    try {
      const filesArray = selectedFiles.map(item => item.file);
      const uploadedFiles = await uploadFotografije(Number(eventId), filesArray);
      const imagesForReview = uploadedFiles.filter(photo => photo.tip_medija !== 'video');

      revokeSelectedUrls();
      setUploadedPhotos(uploadedFiles);
      setDone(true);
      setLoading(false);
      setStatusMsg(t.uspjeh);

      const initiallyReviewed = new Set<number>();
      imagesForReview.forEach(photo => {
        const aiTagovi = photo.ai_tagovi || [];
        if (aiTagovi.length === 0) return;

        const pending = (photo.ai_tagovi || []).some(tag => tag.status === 'PENDING');
        if (!pending) initiallyReviewed.add(photo.id);
      });
      setReviewedIds(initiallyReviewed);

      const firstUnreviewedIdx = imagesForReview.findIndex(photo => !initiallyReviewed.has(photo.id));
      setCurrentPhotoIndex(firstUnreviewedIdx === -1 ? 0 : firstUnreviewedIdx);

      if (imagesForReview.length === 0 || imagesForReview.every(photo => initiallyReviewed.has(photo.id))) {
        setTimeout(() => {
          router.push(`/events/${eventId}?tab=photos`);
        }, 1500);
      }
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

  const findPrevUnreviewed = (from: number) => {
    for (let i = from - 1; i >= 0; i--) {
      if (!reviewedIds.has(reviewablePhotos[i].id)) return i;
    }
    return -1;
  };

  const findNextUnreviewed = (from: number) => {
    for (let i = from + 1; i < reviewablePhotos.length; i++) {
      if (!reviewedIds.has(reviewablePhotos[i].id)) return i;
    }
    return -1;
  };

  const markReviewedAndMove = (photoId: number, photos: ApiFotografija[]) => {
    const nextReviewedIds = new Set(reviewedIds);
    nextReviewedIds.add(photoId);
    setReviewedIds(nextReviewedIds);

    const nextReviewable = photos.filter(photo => photo.tip_medija !== 'video');
    const nextIdx = nextReviewable.findIndex(photo => !nextReviewedIds.has(photo.id));
    if (nextIdx !== -1) {
      setCurrentPhotoIndex(nextIdx);
      return;
    }

    router.push(`/events/${eventId}?tab=photos`);
  };

  const handleRefresh = async (photoId: number) => {
    try {
      const refreshed = await getFotografija(photoId);
      const nextPhotos = uploadedPhotos.map(photo => photo.id === photoId ? refreshed : photo);
      setUploadedPhotos(nextPhotos);

      const hasPending = (refreshed.ai_tagovi || []).some(tag => tag.status === 'PENDING');
      if (!hasPending) {
        markReviewedAndMove(photoId, nextPhotos);
      }
    } catch {
      setStatusMsg(t.greska);
    }
  };

  const handleAcceptAllForAll = async () => {
    if (reviewablePhotos.length === 0) return;
    setSavingAll(true);
    try {
      const toProcess = reviewablePhotos.filter(photo => !reviewedIds.has(photo.id));
      const results = await Promise.allSettled(toProcess.map(photo => prihvatiSveAITagove(photo.id)));
      const refreshed = results.map((result, idx) =>
        result.status === 'fulfilled' ? result.value : toProcess[idx]
      );

      setUploadedPhotos(prev => prev.map(photo => {
        const found = refreshed.find(item => item.id === photo.id);
        return found || photo;
      }));

      setReviewedIds(new Set(reviewablePhotos.map(photo => photo.id)));
      router.push(`/events/${eventId}?tab=photos`);
    } catch {
      setStatusMsg(t.greska);
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-12 font-sans flex items-center justify-center">
      <div className="max-w-3xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Link href={`/events/${eventId}?tab=photos`} className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors font-medium">
          {t.nazad}
        </Link>

        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent">
            {t.naslov}
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-xl leading-relaxed">
            {t.opis}
          </p>
        </div>

        {!done && (
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
        )}

        {selectedFiles.length > 0 && !done && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider uppercase ml-1">
              {t.izabrano} ({selectedFiles.length})
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 bg-[#111] p-4 rounded-3xl border border-white/5 max-h-64 overflow-y-auto">
              {selectedFiles.map((item, index) => (
                <div key={`${item.file.name}-${index}`} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group bg-black">
                  {item.isVideo ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-950/20 text-blue-400 p-2 text-center">
                      <span className="text-2xl mb-1">🎬</span>
                      <p className="text-[9px] font-bold truncate w-full px-1">{item.file.name}</p>
                    </div>
                  ) : (
                    <img src={item.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  )}

                  <button
                    type="button"
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

        {statusMsg && (
          <div className={`p-4 rounded-2xl text-sm font-bold border text-center ${
            statusMsg === t.uspjeh
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : statusMsg === t.greska || statusMsg === t.prazno
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-white/5 border-white/10 text-gray-300'
          }`}>
            {statusMsg}
          </div>
        )}

        {!done && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/events/${eventId}?tab=photos`}
              className="flex-1 px-6 py-4 rounded-full border border-white/10 hover:bg-white/5 transition-colors font-semibold text-center"
            >
              {t.odustani}
            </Link>
            <button
              type="button"
              onClick={handleUpload}
              disabled={loading || selectedFiles.length === 0}
              className="flex-1 bg-white text-black py-4 rounded-full font-bold hover:bg-gray-200 transition-all text-sm active:scale-[0.99] disabled:opacity-30 disabled:pointer-events-none shadow-xl"
            >
              {loading ? '...' : t.ZaposniUpload}
            </button>
          </div>
        )}

        {done && reviewablePhotos.length > 0 && currentPhoto && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-lg font-bold">🤖 {t.aiReview}</p>
              <div className="flex gap-2">
                <button
                  type="button"
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
                  type="button"
                  onClick={() => {
                    const next = findNextUnreviewed(currentPhotoIndex);
                    if (next !== -1) setCurrentPhotoIndex(next);
                  }}
                  disabled={findNextUnreviewed(currentPhotoIndex) === -1}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-50"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAllForAll}
                  disabled={savingAll}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {savingAll ? t.saving : t.prihvatiSve}
                </button>
              </div>
            </div>

            <div className="border border-white/10 rounded-3xl p-6 bg-white/5">
              <img
                src={currentPhoto.url}
                alt="Uploaded"
                className="w-full max-h-64 object-cover rounded-2xl mb-4"
              />
              {reviewedIds.has(currentPhoto.id) ? (
                <div className="text-sm text-green-300 font-semibold">{t.sacuvano}</div>
              ) : (
                <AITagReview
                  fotografija={currentPhoto}
                  onRefresh={() => handleRefresh(currentPhoto.id)}
                  jezik={jezik}
                />
              )}
            </div>
          </div>
        )}

        {done && reviewablePhotos.length === 0 && (
          <Link
            href={`/events/${eventId}?tab=photos`}
            className="block w-full bg-white text-black py-4 rounded-full font-bold hover:bg-gray-200 transition-all text-sm text-center shadow-xl"
          >
            {t.nazadGalerija}
          </Link>
        )}
      </div>
    </div>
  );
}
