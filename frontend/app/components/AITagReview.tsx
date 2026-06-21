'use client';
import React, { useState, useEffect } from 'react';
import { ApiFotografija, ApiAITag, analizirajSliku, prihvatiSveAITagove, odbijSveAITagove, prihvatiAITag, odbijAITag } from '@/lib/api';

const PREVODI = {
  BS: {
    aiTagovi: '🤖 AI Tagovi',
    analizirajSliku: 'Analiziraj sliku',
    prihvatiSve: '✓ Prihvati sve',
    odbijSve: '✕ Odbij sve',
    pregled: '👁️ Pregled',
    // confidence label removed
    ucitavanje: 'Analiza u toku...',
    prikaziSve: 'Prikaži sve',
    sakrij: 'Sakrij',
    noviTagovi: 'Novi AI tagovi su dostupni!',
    nemaTagova: 'AI nije predložio tagove za ovu sliku.',
  },
  EN: {
    aiTagovi: '🤖 AI Tags',
    analizirajSliku: 'Analyze photo',
    prihvatiSve: '✓ Accept all',
    odbijSve: '✕ Reject all',
    pregled: '👁️ Review',
    // confidence label removed
    ucitavanje: 'Analysis in progress...',
    prikaziSve: 'Show all',
    sakrij: 'Hide',
    noviTagovi: 'New AI tags are available!',
    nemaTagova: 'AI did not suggest tags for this photo.',
  }
};

interface AITagReviewProps {
  fotografija: ApiFotografija & { ai_tagovi?: ApiAITag[] };
  onRefresh: () => void;
  jezik: string;
}

export default function AITagReview({ fotografija, onRefresh, jezik }: AITagReviewProps) {
  const t = jezik === 'BS' ? PREVODI.BS : PREVODI.EN;
  const [aiTagovi, setAITagovi] = useState<ApiAITag[]>(fotografija.ai_tagovi || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const autoStartedRef = React.useRef(false);
  const initialPhotoIdRef = React.useRef(fotografija.id);

  useEffect(() => {
    if (initialPhotoIdRef.current !== fotografija.id) {
      initialPhotoIdRef.current = fotografija.id;
      autoStartedRef.current = false;
      setError(null);
    }
    setAITagovi(fotografija.ai_tagovi || []);
  }, [fotografija.id, fotografija.ai_tagovi]);

  useEffect(() => {
    if (autoStartedRef.current) return;
    if ((fotografija.ai_tagovi || []).length > 0) return;

    autoStartedRef.current = true;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        await analizirajSliku(fotografija.id);
        onRefresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Greška pri analizi');
      } finally {
        setLoading(false);
      }
    })();
  }, [fotografija.ai_tagovi, fotografija.id, onRefresh]);

  const pendingTags = aiTagovi.filter(t => t.status === 'PENDING');
  const acceptedTags = aiTagovi.filter(t => t.status === 'ACCEPTED');
  const rejectedTags = aiTagovi.filter(t => t.status === 'REJECTED');

  const handleAnalyze = async () => {
    if (pendingTags.length > 0) return; // Već ima pending tagova
    setLoading(true);
    setError(null);
    try {
      await analizirajSliku(fotografija.id);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri analizi');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAll = async () => {
    setLoading(true);
    try {
      await prihvatiSveAITagove(fotografija.id);
      setAITagovi(prev => prev.map(tag => tag.status === 'PENDING' ? { ...tag, status: 'ACCEPTED' } : tag));
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri prihvatanju');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectAll = async () => {
    setLoading(true);
    try {
      await odbijSveAITagove(fotografija.id);
      setAITagovi(prev => prev.map(tag => tag.status === 'PENDING' ? { ...tag, status: 'REJECTED' } : tag));
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri odbijanju');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOne = async (tagId: number) => {
    setProcessingIds(prev => new Set([...prev, tagId]));
    try {
      await prihvatiAITag(fotografija.id, tagId);
      setAITagovi(prev => prev.map(tag => tag.id === tagId ? { ...tag, status: 'ACCEPTED' } : tag));
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(tagId);
        return newSet;
      });
    }
  };

  const handleRejectOne = async (tagId: number) => {
    setProcessingIds(prev => new Set([...prev, tagId]));
    try {
      await odbijAITag(fotografija.id, tagId);
      setAITagovi(prev => prev.map(tag => tag.id === tagId ? { ...tag, status: 'REJECTED' } : tag));
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(tagId);
        return newSet;
      });
    }
  };

  if (aiTagovi.length === 0) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 space-y-3">
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-all"
        >
          {loading ? t.ucitavanje : t.analizirajSliku}
        </button>
        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}
        {!loading && !error && autoStartedRef.current && (
          <p className="text-sm text-blue-100/80">{t.nemaTagova}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pending tagovi */}
      {pendingTags.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
          <div className="mb-4">
            <p className="font-bold text-yellow-400 mb-3">{t.noviTagovi}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {pendingTags.map(tag => (
                <div
                  key={tag.id}
                  className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-3 py-2 flex items-center gap-2"
                >
                  <span className="text-sm font-bold">{tag.tag_naziv}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kontrolde */}
          <div className="flex gap-2">
            <button
              onClick={handleAcceptAll}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-bold rounded-lg transition-all"
            >
              {t.prihvatiSve}
            </button>
            <button
              onClick={handleRejectAll}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-bold rounded-lg transition-all"
            >
              {t.odbijSve}
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-all"
            >
              {expanded ? t.sakrij : t.pregled}
            </button>
          </div>
        </div>
      )}

      {/* Expanded review mode */}
      {expanded && pendingTags.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
          {pendingTags.map(tag => (
            <div
              key={tag.id}
              className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3"
            >
              <div>
                <p className="font-semibold text-white">{tag.tag_naziv}</p>
                {/* confidence removed from expanded view */}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptOne(tag.id)}
                  disabled={processingIds.has(tag.id)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold rounded transition-all"
                >
                  ✓
                </button>
                <button
                  onClick={() => handleRejectOne(tag.id)}
                  disabled={processingIds.has(tag.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded transition-all"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accepted tagovi */}
      {acceptedTags.length > 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
          <p className="text-xs text-green-400 mb-2 font-bold">✓ Prihvaćeni tagovi</p>
          <div className="flex flex-wrap gap-2">
            {acceptedTags.map(tag => (
              <span
                key={tag.id}
                className="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1 text-xs font-semibold text-green-300"
              >
                {tag.tag_naziv}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Rejected tagovi */}
      {rejectedTags.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <p className="text-xs text-red-400 mb-2 font-bold">✕ Odbijeni tagovi</p>
          <div className="flex flex-wrap gap-2">
            {rejectedTags.map(tag => (
              <span
                key={tag.id}
                className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-1 text-xs font-semibold text-red-300"
              >
                {tag.tag_naziv}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}



