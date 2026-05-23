'use client';
import React, { useState } from 'react';
import { useParams } from 'next/navigation';

export default function PhotoDetailsPage() {
  const params = useParams();
  const id = params?.id;

  // --- STATE VARIJABLE ---
  const [likes, setLikes] = useState(12);
  const [isLiked, setIsLiked] = useState(false);
  
  const [comments, setComments] = useState([
    { id: 1, user: 'Gost 2', text: 'Odlična fotografija! 😍' },
    { id: 2, user: 'Gost 5', text: 'Koji je ovo filter?' }
  ]);
  const [newComment, setNewComment] = useState('');

  // Tagovi i polje za unos novog taga
  const [tags, setTags] = useState(['Samra', 'Gost 3']);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // --- FUNKCIJE ---
  const handleLike = () => {
    setLikes(isLiked ? likes - 1 : likes + 1);
    setIsLiked(!isLiked);
  };

  const handleAddComment = () => {
    if (newComment.trim() !== '') {
      setComments([...comments, { id: Date.now(), user: 'Ja', text: newComment }]);
      setNewComment('');
    }
  };

  // Funkcija za spašavanje novog taga
  const handleAddTag = () => {
    if (newTagInput.trim() !== '') {
      setTags([...tags, newTagInput.trim()]); // Dodaje novi tag u niz
      setNewTagInput(''); // Čisti polje
      setIsAddingTag(false); // Zatvara polje za unos
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

        {/* Glavni kontejner */}
        <div className="flex flex-col md:flex-row gap-8 bg-white/5 border border-white/10 rounded-3xl overflow-hidden p-6">
          
          {/* Lijeva strana: Slika */}
          <div className="flex-1 flex justify-center items-center bg-black/50 rounded-2xl overflow-hidden">
            <img 
            src={`https://picsum.photos/seed/photo-${id}/800/600`} 
            alt={`Slika ${id}`} 
            className="max-w-full h-auto object-contain rounded-xl"
/>
          </div>

          {/* Desna strana: Detalji */}
          <div className="w-full md:w-96 flex flex-col">
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Detalji fotografije</h2>
              <p className="text-sm text-gray-400 mb-4">Postavio: Gost 1</p>
              
              {/* TAGOVI SEKCIJA */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm text-gray-500 mr-2">Tagovi:</span>
                
                {/* Prikaz postojećih tagova */}
                {tags.map((tag, index) => (
                  <span key={index} className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
                    @{tag}
                  </span>
                ))}

                {/* Polje za unos ili dugme "+ Dodaj tag" */}
{isAddingTag ? (
  <div className="flex items-center gap-2">
    <input 
      type="text" 
      value={newTagInput}
      onChange={(e) => setNewTagInput(e.target.value)}
      placeholder="Unesi ime..."
      className="bg-black border border-white/20 rounded-full px-3 py-1 text-xs focus:outline-none focus:border-white/50 w-24 text-white"
      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
      autoFocus
    />
    <button 
      onClick={handleAddTag} 
      className="text-white hover:opacity-70 text-sm transition-opacity"
      title="Spasi"
    >
      ✓
    </button>
    <button 
      onClick={() => setIsAddingTag(false)} 
      className="text-white hover:opacity-70 text-sm transition-opacity"
      title="Odustani"
    >
      ✕
    </button>
  </div>
) : (
  <button 
    onClick={() => setIsAddingTag(true)}
    className="bg-white/10 text-gray-300 hover:bg-white/20 px-3 py-1 rounded-full text-xs transition-colors"
  >
    + Dodaj tag
  </button>
)} 
              </div>
            </div>

            {/* Lajkovi */}
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

            {/* Komentari */}
            <div className="flex-1 overflow-y-auto pr-2 mb-6 space-y-4">
              <h3 className="font-semibold text-gray-300 mb-4">Komentari ({comments.length})</h3>
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white/5 p-3 rounded-xl">
                  <span className="block text-xs text-gray-400 mb-1">{comment.user}</span>
                  <p className="text-sm">{comment.text}</p>
                </div>
              ))}
            </div>

            {/* Novi komentar */}
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