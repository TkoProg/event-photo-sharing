'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function PhotoDetailsPage() {
  const params = useParams();
  const id = params?.id;

  // React State za upravljanje lajkovima i komentarima
  const [likes, setLikes] = useState(12);
  const [isLiked, setIsLiked] = useState(false);
  
  const [comments, setComments] = useState([
    { id: 1, user: 'Gost 2', text: 'Odlična fotografija! 😍' },
    { id: 2, user: 'Gost 5', text: 'Koji je ovo filter?' }
  ]);
  const [newComment, setNewComment] = useState('');

  // Funkcija za lajkanje
  const handleLike = () => {
    if (isLiked) {
      setLikes(likes - 1);
    } else {
      setLikes(likes + 1);
    }
    setIsLiked(!isLiked);
  };

  // Funkcija za dodavanje komentara
  const handleAddComment = () => {
    if (newComment.trim() !== '') {
      setComments([...comments, { id: Date.now(), user: 'Ja', text: newComment }]);
      setNewComment(''); // Očisti polje nakon slanja
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header - Dugme za nazad */}
        <header className="mb-8">
          <button 
            onClick={() => window.history.back()} 
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            &larr; Nazad na galeriju
          </button>
        </header>

        {/* Glavni kontejner - podijeljen na sliku i komentare */}
        <div className="flex flex-col md:flex-row gap-8 bg-white/5 border border-white/10 rounded-3xl overflow-hidden p-6">
          
          {/* Lijeva strana: Slika */}
          <div className="flex-1 flex justify-center items-center bg-black/50 rounded-2xl overflow-hidden">
            {/* Koristimo dinamički link slike na osnovu ID-ja */}
            <img 
              src={`https://picsum.photos/seed/slika${id}/800/600`} 
              alt={`Slika ${id}`} 
              className="max-w-full h-auto object-contain rounded-xl"
            />
          </div>

          {/* Desna strana: Detalji, Lajkovi i Komentari */}
          <div className="w-full md:w-96 flex flex-col">
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Detalji fotografije</h2>
              <p className="text-sm text-gray-400">Postavio: Gost 1</p>
            </div>

            {/* Sekcija za lajkanje */}
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
              <button 
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  isLiked ? 'bg-red-500/20 text-red-500' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <span>{isLiked ? '❤️' : '🤍'}</span>
                {likes} Lajkova
              </button>
            </div>

            {/* Lista komentara */}
            <div className="flex-1 overflow-y-auto pr-2 mb-6 space-y-4">
              <h3 className="font-semibold text-gray-300 mb-4">Komentari ({comments.length})</h3>
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white/5 p-3 rounded-xl">
                  <span className="block text-xs text-gray-400 mb-1">{comment.user}</span>
                  <p className="text-sm">{comment.text}</p>
                </div>
              ))}
            </div>

            {/* Polje za unos novog komentara */}
            <div className="mt-auto flex gap-2">
              <input 
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Dodaj komentar..." 
                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/30"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button 
                onClick={handleAddComment}
                className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
              >
                Pošalji
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}