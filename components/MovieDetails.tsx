import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Star, ShieldCheck, X, Download, Send, ExternalLink,
  Clock, Database, Volume2, MessageSquare, Tv, Lock, Calendar,
  ChevronRight, ImageIcon, Search
} from 'lucide-react';
import { Movie, SeasonInfo } from '../types';

interface MovieDetailsProps {
  movie: Movie;
  onClose: () => void;
  botUsername: string;
  channelLink: string;
}

// Professional tag config - no emoji
const MetaTag: React.FC<{ icon: React.ReactNode; value: string; color: string; bg: string; border: string }> = ({ icon, value, color, bg, border }) => (
  <div className={`flex items-center gap-1.5 ${bg} px-3 py-1.5 rounded-lg border ${border}`}>
    <span className={color}>{icon}</span>
    <span className={`text-xs font-bold ${color}`}>{value}</span>
  </div>
);

// Screenshot viewer overlay
const ScreenshotViewer: React.FC<{ screenshots: string[]; initialIndex: number; onClose: () => void }> = ({ screenshots, initialIndex, onClose }) => {
  const [current, setCurrent] = useState(initialIndex);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
        <X size={20} className="text-white" />
      </button>
      <div className="text-xs text-gray-400 mb-3">{current + 1} / {screenshots.length}</div>
      <img
        src={screenshots[current]}
        alt={`Screenshot ${current + 1}`}
        className="max-w-full max-h-[80vh] object-contain rounded-xl"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex gap-2 mt-4">
        {screenshots.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
            className={`w-2 h-2 rounded-full transition-all ${idx === current ? 'bg-gold w-4' : 'bg-white/30'}`}
          />
        ))}
      </div>
    </motion.div>
  );
};

const MovieDetails: React.FC<MovieDetailsProps> = ({ movie, onClose, botUsername, channelLink }) => {
  const [activeTab, setActiveTab] = useState<'episodes' | 'info'>('episodes');
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const handleWatch = (code: string) => {
    const url = `https://t.me/${botUsername}?start=${code}`;
    // @ts-ignore
    if (window.Telegram?.WebApp) {
      // @ts-ignore
      window.Telegram.WebApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleDownload = (downloadCode?: string, downloadLink?: string, fallbackCode?: string) => {
    if (downloadLink) {
      window.open(downloadLink, '_blank');
    } else if (downloadCode) {
      const url = `https://t.me/${botUsername}?start=${downloadCode}`;
      // @ts-ignore
      if (window.Telegram?.WebApp) {
        // @ts-ignore
        window.Telegram.WebApp.openTelegramLink(url);
      } else {
        window.open(url, '_blank');
      }
    } else if (fallbackCode) {
      handleWatch(fallbackCode);
    }
  };

  const isSeries = movie.category === 'Series' || movie.category === 'Korean Drama' || (movie.episodes && movie.episodes.length > 0);

  const episodesBySeason = useMemo(() => {
    if (!movie.episodes) return {};
    const groups: Record<number, typeof movie.episodes> = {};
    movie.episodes.forEach(ep => {
      const s = ep.season || 1;
      if (!groups[s]) groups[s] = [];
      groups[s].push(ep);
    });
    Object.keys(groups).forEach(season => {
      groups[Number(season)].sort((a, b) => a.number - b.number);
    });
    return groups;
  }, [movie.episodes]);

  const availableSeasons = Object.keys(episodesBySeason).map(Number).sort((a, b) => a - b);

  // Get season info (locked seasons)
  const getSeasonInfo = (seasonNum: number): SeasonInfo | undefined => {
    return movie.seasons?.find(s => s.season === seasonNum);
  };

  const currentSeasonInfo = getSeasonInfo(selectedSeason);
  const isCurrentSeasonLocked = currentSeasonInfo?.isLocked || currentSeasonInfo?.isComingSoon;
  const currentEpisodes = isCurrentSeasonLocked ? [] : (episodesBySeason[selectedSeason] || []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[100] bg-[#000] flex flex-col h-full font-sans"
      >
        {/* Detail Banner - detailBanner (16:9) অথবা thumbnail (2:3) */}
        <div className="absolute top-0 left-0 w-full z-0" style={movie.detailBanner ? { height: '55vw', maxHeight: '55vh' } : { aspectRatio: '2/3', maxHeight: '58vh' }}>
          <img
            src={movie.detailBanner || movie.thumbnail}
            alt={movie.title}
            className="w-full h-full opacity-85"
            style={{ 
              objectFit: 'cover',
              objectPosition: movie.detailBanner ? 'center center' : 'center top',
            }}
            onError={(e) => {
              // fallback to thumbnail if detailBanner fails
              if (movie.detailBanner && e.currentTarget.src !== movie.thumbnail) {
                e.currentTarget.src = movie.thumbnail;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000] via-[#000]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#000]/20 to-transparent" />
        </div>

        {/* Close Button */}
        <div className="absolute top-0 inset-x-0 z-[110] flex justify-between items-center p-4 pt-6 pointer-events-none">
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="pointer-events-auto w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all shadow-lg"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative z-10" style={{ paddingTop: movie.detailBanner ? 'min(52vw, 48vh)' : 'min(55vw, 50vh)' }}>
          <div className="px-5 pb-28 bg-gradient-to-t from-black via-black to-transparent min-h-[60vh]">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Tags Row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-gold text-black px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest shadow-[0_0_10px_rgba(255,215,0,0.3)]">
                  {movie.category}
                </span>
                <span className="bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[10px] font-bold text-gray-200 border border-white/10">
                  {movie.quality || 'HD'}
                </span>
                {movie.year && (
                  <span className="text-gray-400 text-xs font-bold">• {movie.year}</span>
                )}
                {(movie.downloadCode || movie.downloadLink) && (
                  <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-md text-[9px] font-bold border border-green-500/30 flex items-center gap-1">
                    <Download size={9} />
                    DOWNLOAD
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-serif font-black text-white leading-[1.0] mb-4 drop-shadow-2xl">
                {movie.title}
              </h1>

              {/* Professional Metadata Tags - no emoji */}
              {(movie.duration || movie.fileSize || movie.audioLanguage || movie.subtitles || movie.videoQuality) && (
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  {movie.duration && (
                    <MetaTag
                      icon={<Clock size={12} />}
                      value={movie.duration}
                      color="text-purple-300"
                      bg="bg-purple-500/10"
                      border="border-purple-500/20"
                    />
                  )}
                  {movie.fileSize && (
                    <MetaTag
                      icon={<Database size={12} />}
                      value={movie.fileSize}
                      color="text-emerald-300"
                      bg="bg-emerald-500/10"
                      border="border-emerald-500/20"
                    />
                  )}
                  {movie.audioLanguage && (
                    <MetaTag
                      icon={<Volume2 size={12} />}
                      value={movie.audioLanguage}
                      color="text-blue-300"
                      bg="bg-blue-500/10"
                      border="border-blue-500/20"
                    />
                  )}
                  {movie.subtitles && (
                    <MetaTag
                      icon={<MessageSquare size={12} />}
                      value={movie.subtitles}
                      color="text-pink-300"
                      bg="bg-pink-500/10"
                      border="border-pink-500/20"
                    />
                  )}
                  {movie.videoQuality && (
                    <MetaTag
                      icon={<Tv size={12} />}
                      value={movie.videoQuality}
                      color="text-yellow-300"
                      bg="bg-yellow-500/10"
                      border="border-yellow-500/20"
                    />
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-300 mb-6 border-b border-white/8 pb-5">
                <div className="flex items-center gap-1.5 text-gold">
                  <Star size={13} fill="#FFD700" />
                  <span className="text-white">{movie.rating}</span>
                </div>
                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                <span>{movie.views} Views</span>
                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-green-500" /> Verified
                </span>
              </div>

              {/* Action Buttons for Movies */}
              {!isSeries && (
                <div className="flex flex-col gap-3 w-full mb-7">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleWatch(movie.telegramCode)}
                      className="flex-1 bg-gold text-black py-3.5 px-5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:bg-[#ffe033] active:scale-98 transition-all"
                    >
                      <Play size={18} fill="black" />
                      STREAM NOW
                    </button>
                    <button
                      onClick={() => handleDownload(movie.downloadCode, movie.downloadLink, movie.telegramCode)}
                      className="flex-1 bg-[#1a1a1a] border border-white/10 text-white py-3.5 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#222] active:scale-98 transition-all"
                    >
                      {movie.downloadLink ? <ExternalLink size={18} /> : <Download size={18} />}
                      DOWNLOAD
                    </button>
                  </div>
                  <div
                    onClick={() => window.open(channelLink, '_blank')}
                    className="w-full p-3 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/30 flex items-center justify-center cursor-pointer active:scale-98 transition-transform"
                  >
                    <Send size={22} className="text-[#0088cc]" />
                  </div>
                </div>
              )}

              {/* Series Tabs */}
              {isSeries && (
                <div className="flex items-center gap-6 mb-5 border-b border-white/8">
                  <button
                    onClick={() => setActiveTab('episodes')}
                    className={`pb-3 text-xs font-bold tracking-wider uppercase transition-all ${activeTab === 'episodes' ? 'text-gold border-b-2 border-gold' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Episodes
                  </button>
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`pb-3 text-xs font-bold tracking-wider uppercase transition-all ${activeTab === 'info' ? 'text-gold border-b-2 border-gold' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    About
                  </button>
                </div>
              )}

              {/* Content Area */}
              <div className="min-h-[200px]">

                {/* Episodes Tab */}
                {isSeries && activeTab === 'episodes' && (
                  <div>
                    {/* Season Selector */}
                    {availableSeasons.length > 0 && (
                      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
                        {availableSeasons.map(seasonNum => {
                          const sInfo = getSeasonInfo(seasonNum);
                          const locked = sInfo?.isLocked || sInfo?.isComingSoon;
                          return (
                            <button
                              key={seasonNum}
                              onClick={() => setSelectedSeason(seasonNum)}
                              className={`relative px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                selectedSeason === seasonNum
                                  ? locked ? 'bg-yellow-500/80 text-black' : 'bg-gold text-black'
                                  : locked ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' : 'bg-white/8 text-gray-400 hover:text-white border border-white/5'
                              }`}
                            >
                              {locked && <Lock size={10} />}
                              {sInfo?.title || `Season ${seasonNum}`}
                              {locked && (
                                <span className="ml-1 text-[8px] bg-black/20 px-1.5 py-0.5 rounded-full font-extrabold tracking-wide">
                                  SOON
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Season Locked State */}
                    {isCurrentSeasonLocked && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-14 px-6 text-center"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center mb-4">
                          <Lock size={28} className="text-yellow-400" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">
                          {currentSeasonInfo?.title || `Season ${selectedSeason}`} — Coming Soon
                        </h3>
                        {currentSeasonInfo?.releaseDate && (
                          <div className="flex items-center gap-1.5 mt-2 text-yellow-400 text-sm">
                            <Calendar size={13} />
                            <span>{currentSeasonInfo.releaseDate}</span>
                          </div>
                        )}
                        <p className="text-gray-400 text-xs mt-3 leading-relaxed max-w-xs">
                          This season will be available soon. Stay tuned and follow our channel for updates.
                        </p>
                        <button
                          onClick={() => window.open(channelLink, '_blank')}
                          className="mt-5 flex items-center gap-2 bg-[#0088cc]/20 border border-[#0088cc]/40 text-[#0088cc] px-5 py-2.5 rounded-xl text-sm font-bold"
                        >
                          <Send size={14} />
                          Get Notified
                        </button>
                      </motion.div>
                    )}

                    {/* Episode List - when season not locked */}
                    {!isCurrentSeasonLocked && (
                      <div className="space-y-3">
                        {currentEpisodes.length > 0 ? currentEpisodes.map((ep, index) => {
                          const isLocked = ep.isComingSoon || ep.isUpcoming;
                          return (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              key={ep.id}
                              style={{
                                borderRadius: '14px',
                                overflow: 'hidden',
                                background: 'linear-gradient(135deg, #18181c 0%, #141418 100%)',
                                border: isLocked ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(255,255,255,0.07)',
                                opacity: isLocked ? 0.65 : 1,
                                marginBottom: '10px',
                              }}
                            >
                              {/* Episode Thumbnail — full width 16:9 */}
                              <div
                                onClick={() => !isLocked && handleWatch(ep.telegramCode)}
                                style={{
                                  position: 'relative',
                                  width: '100%',
                                  aspectRatio: '16/9',
                                  cursor: isLocked ? 'not-allowed' : 'pointer',
                                  overflow: 'hidden',
                                }}
                              >
                                <img
                                  src={ep.thumbnail || movie.thumbnail}
                                  alt={ep.title}
                                  style={{
                                    width: '100%', height: '100%',
                                    objectFit: 'cover',
                                    filter: ep.thumbnail ? 'none' : 'brightness(0.55) saturate(0.6)',
                                  }}
                                />
                                {/* Gradient overlay */}
                                <div style={{
                                  position: 'absolute', inset: 0,
                                  background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 45%, transparent 70%)',
                                }} />

                                {/* Ep number badge */}
                                <div style={{
                                  position: 'absolute', top: 8, left: 8,
                                  background: 'rgba(0,0,0,0.7)',
                                  backdropFilter: 'blur(8px)',
                                  borderRadius: '6px',
                                  padding: '2px 7px',
                                  fontFamily: "'DM Sans',sans-serif",
                                  fontSize: '10px', fontWeight: 700,
                                  color: '#fff',
                                }}>
                                  EP {ep.number}
                                </div>

                                {/* Duration */}
                                {ep.duration && !isLocked && (
                                  <div style={{
                                    position: 'absolute', top: 8, right: 8,
                                    background: 'rgba(0,0,0,0.7)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '6px',
                                    padding: '2px 7px',
                                    fontFamily: "'DM Sans',sans-serif",
                                    fontSize: '10px', fontWeight: 500,
                                    color: 'rgba(255,255,255,0.8)',
                                  }}>
                                    {ep.duration}
                                  </div>
                                )}

                                {/* Lock */}
                                {isLocked && (
                                  <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'rgba(0,0,0,0.65)',
                                    backdropFilter: 'blur(4px)',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', gap: '4px',
                                  }}>
                                    <Lock size={22} className="text-yellow-400" />
                                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '9px', fontWeight: 800, color: '#FDE68A', letterSpacing: '0.1em' }}>COMING SOON</span>
                                  </div>
                                )}

                                {/* Play overlay */}
                                {!isLocked && (
                                  <div style={{
                                    position: 'absolute', inset: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}>
                                    <div style={{
                                      width: 40, height: 40,
                                      borderRadius: '50%',
                                      background: 'rgba(255,255,255,0.18)',
                                      backdropFilter: 'blur(8px)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      border: '1px solid rgba(255,255,255,0.3)',
                                    }}>
                                      <Play size={16} fill="white" color="white" style={{ marginLeft: '2px' }} />
                                    </div>
                                  </div>
                                )}

                                {/* Title overlay on thumbnail */}
                                <div style={{
                                  position: 'absolute', bottom: 0, left: 0, right: 0,
                                  padding: '8px 10px',
                                }}>
                                  <h4 style={{
                                    fontFamily: "'Outfit',sans-serif",
                                    fontSize: '13px', fontWeight: 700,
                                    color: isLocked ? 'rgba(255,255,255,0.5)' : '#fff',
                                    lineHeight: '1.2',
                                    textShadow: '0 1px 8px rgba(0,0,0,0.9)',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: 'vertical',
                                  }}>
                                    {ep.title}
                                  </h4>
                                </div>
                              </div>

                              {/* Action Row */}
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 12px',
                              }}>
                                {/* Meta */}
                                <div style={{ flex: 1, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {ep.quality && !isLocked && (
                                    <span style={{
                                      fontFamily: "'DM Sans',sans-serif",
                                      fontSize: '9px', fontWeight: 700,
                                      color: '#86EFAC',
                                      background: 'rgba(34,197,94,0.12)',
                                      padding: '2px 7px', borderRadius: '6px',
                                    }}>{ep.quality}</span>
                                  )}
                                  {ep.fileSize && !isLocked && (
                                    <span style={{
                                      fontFamily: "'DM Sans',sans-serif",
                                      fontSize: '9px', fontWeight: 700,
                                      color: '#93C5FD',
                                      background: 'rgba(59,130,246,0.12)',
                                      padding: '2px 7px', borderRadius: '6px',
                                    }}>{ep.fileSize}</span>
                                  )}
                                  {isLocked && ep.releaseDate && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Calendar size={10} className="text-yellow-400" />
                                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '10px', color: '#FDE68A', fontWeight: 600 }}>{ep.releaseDate}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Watch Button */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); if (!isLocked) handleWatch(ep.telegramCode); }}
                                  disabled={isLocked}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    fontFamily: "'Outfit',sans-serif",
                                    fontSize: '11px', fontWeight: 800,
                                    letterSpacing: '0.04em',
                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                    border: 'none',
                                    background: isLocked ? 'rgba(255,255,255,0.06)' : '#fff',
                                    color: isLocked ? 'rgba(255,255,255,0.3)' : '#000',
                                    transition: 'transform 0.15s',
                                  }}
                                >
                                  <Play size={11} fill={isLocked ? 'rgba(255,255,255,0.3)' : '#000'} color={isLocked ? 'rgba(255,255,255,0.3)' : '#000'} />
                                  Watch
                                </button>

                                {/* Download Button */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); if (!isLocked) handleDownload(ep.downloadCode, ep.downloadLink, ep.telegramCode); }}
                                  disabled={isLocked}
                                  style={{
                                    width: 36, height: 36,
                                    borderRadius: '10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: isLocked ? 'not-allowed' : 'pointer',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.06)',
                                    color: isLocked ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.75)',
                                  }}
                                >
                                  {ep.downloadLink ? <ExternalLink size={14} /> : <Download size={14} />}
                                </button>
                              </div>
                            </motion.div>
                          );
                        }) : (
                          <div className="text-center py-16 text-gray-500 text-sm">
                            <div className="mb-3 text-4xl">📺</div>
                            <p className="font-semibold">No episodes available</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Info Tab */}
                {(!isSeries || activeTab === 'info') && (
                  <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                    <p className="text-gray-300 text-sm leading-7 font-medium opacity-90">
                      {movie.description || 'No description available for this content.'}
                    </p>

                    {/* Screenshots Gallery - improved */}
                    {movie.screenshots && movie.screenshots.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <ImageIcon size={14} className="text-gold" />
                            Screenshots
                          </h3>
                          <span className="text-[10px] text-gray-500">{movie.screenshots.length} photos</span>
                        </div>
                        {/* Horizontal scroll gallery - 16:9 */}
                        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2">
                          {movie.screenshots.map((screenshot, idx) => (
                            <div
                              key={idx}
                              className="relative flex-shrink-0 rounded-xl overflow-hidden bg-[#111] border border-white/5 group cursor-pointer hover:border-gold/30 transition-all"
                              style={{ width: '220px', aspectRatio: '16/9' }}
                              onClick={() => { setViewerIndex(idx); setViewerOpen(true); }}
                            >
                              <img
                                src={screenshot}
                                alt={`Screenshot ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm rounded-full p-2">
                                  <Search size={14} className="text-white" />
                                </div>
                              </div>
                              <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-sm text-[8px] text-gray-300 px-1.5 py-0.5 rounded">
                                {idx + 1}/{movie.screenshots.length}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { label: 'Rating', value: `${movie.rating}/10`, showStar: true },
                        { label: 'Genre', value: movie.category },
                        { label: 'Quality', value: movie.quality || 'HD' },
                        { label: 'Year', value: movie.year || 'N/A' },
                        ...(movie.duration ? [{ label: 'Duration', value: movie.duration }] : []),
                        ...(movie.fileSize ? [{ label: 'File Size', value: movie.fileSize }] : []),
                      ].map((item, i) => (
                        <div key={i} className="bg-[#111] p-3 rounded-xl border border-white/5">
                          <span className="text-[10px] text-gray-500 uppercase block mb-1">{item.label}</span>
                          <span className="text-xs text-white font-semibold flex items-center gap-1">
                            {(item as any).showStar && <Star size={12} fill="#FFD700" className="text-gold" />}
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Telegram Join for Series */}
                    {isSeries && (
                      <div
                        onClick={() => window.open(channelLink, '_blank')}
                        className="w-full p-3.5 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/30 flex items-center justify-center gap-3 cursor-pointer active:scale-98 transition-transform"
                      >
                        <Send size={20} className="text-[#0088cc]" />
                        <span className="text-[#0088cc] text-sm font-bold">Join Telegram Channel</span>
                        <ChevronRight size={16} className="text-[#0088cc]" />
                      </div>
                    )}
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Screenshot Fullscreen Viewer */}
      <AnimatePresence>
        {viewerOpen && movie.screenshots && (
          <ScreenshotViewer
            screenshots={movie.screenshots}
            initialIndex={viewerIndex}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default MovieDetails;
