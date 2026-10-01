import React, { useState } from 'react';
import { Share2, Copy, Check, X, MessageCircle, Twitter, Facebook, ExternalLink } from 'lucide-react';
import { Song } from '../types';

interface ShareModalProps {
  song: Song | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ song, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!song) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sitdoworld-ai-music.com';
  const shareUrl = `${origin}/?song=${encodeURIComponent(song.id)}`;
  const shareText = `Écoute "${song.title}" (${song.genre}) créée sur SITDOWORLD AI MUSIC Studio 🎵`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: song.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled
      }
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#FF7A00] flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[#0F172A]">Partager ce morceau</h3>
            <p className="text-xs text-slate-500">Diffusez cette production musicale à vos proches</p>
          </div>
        </div>

        {/* Song Mini Preview Card */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
          <img
            src={song.cover_url}
            alt={song.title}
            className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-[#0F172A] truncate">{song.title}</h4>
            <p className="text-xs text-[#64748B] truncate mt-0.5">{song.creator_name} • {song.genre}</p>
            {song.tags && song.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {song.tags.slice(0, 3).map((t) => (
                  <span key={t} className="text-[10px] font-bold text-[#2563EB] bg-blue-50 px-1.5 py-0.2 rounded-sm">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Copy Link Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#0F172A]">Lien direct d'écoute</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 select-all"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-[#2563EB] hover:bg-blue-700 text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>
          {copied && (
            <p className="text-[11px] font-bold text-emerald-600 animate-in fade-in">
              ✓ Lien unique copié dans le presse-papier avec succès !
            </p>
          )}
        </div>

        {/* Social Share Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider text-[10px]">
            Partager directement sur les réseaux
          </label>
          <div className="grid grid-cols-3 gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex flex-col items-center justify-center gap-1 transition-all border border-emerald-200/80 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-[11px] font-bold">WhatsApp</span>
            </a>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex flex-col items-center justify-center gap-1 transition-all border border-slate-200 cursor-pointer"
            >
              <Twitter className="w-5 h-5 text-slate-800" />
              <span className="text-[11px] font-bold">X (Twitter)</span>
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] flex flex-col items-center justify-center gap-1 transition-all border border-blue-200/80 cursor-pointer"
            >
              <Facebook className="w-5 h-5 text-[#2563EB]" />
              <span className="text-[11px] font-bold">Facebook</span>
            </a>
          </div>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={shareNative}
              className="w-full mt-2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>Plus d'options de partage</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
