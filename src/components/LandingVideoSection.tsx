import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Sparkles, 
  ShieldCheck, 
  UploadCloud, 
  Camera, 
  ExternalLink,
  Video,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { parseVideoSource, isSharedGooglePhotosUrl, resolveGooglePhotosSharedUrl } from '../lib/videoHelper';

interface LandingVideoSectionProps {
  videoUrl?: string;
  videoTitle?: string;
  videoPoster?: string;
  onStartAuth?: (mode: 'signup' | 'signin') => void;
}

export const LandingVideoSection: React.FC<LandingVideoSectionProps> = ({
  videoUrl,
  videoTitle,
  videoPoster,
  onStartAuth
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [resolvedGPhotoUrl, setResolvedGPhotoUrl] = useState<string | null>(null);
  const [resolvedGPhotoPoster, setResolvedGPhotoPoster] = useState<string | null>(null);

  useEffect(() => {
    setResolvedGPhotoUrl(null);
    setResolvedGPhotoPoster(null);
    if (videoUrl && isSharedGooglePhotosUrl(videoUrl)) {
      resolveGooglePhotosSharedUrl(videoUrl).then(res => {
        if (res?.videoUrl) {
          setResolvedGPhotoUrl(res.videoUrl);
          if (res.posterUrl) setResolvedGPhotoPoster(res.posterUrl);
        }
      });
    }
  }, [videoUrl]);

  const effectiveVideoUrl = resolvedGPhotoUrl || videoUrl;
  const effectivePoster = videoPoster || resolvedGPhotoPoster || undefined;
  const videoSource = parseVideoSource(effectiveVideoUrl);

  const displayTitle = videoTitle?.trim() || "Découvrez SukuPass en action — Les badges scolaires en quelques clics";

  return (
    <section id="demo" className="py-24 bg-gradient-to-b from-[#faf9f6] via-white to-[#faf9f6] relative overflow-hidden border-t border-slate-200/80">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[42rem] h-[24rem] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-12 left-12 w-72 h-72 bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200/70 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider">Démonstration en Vidéo</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]"
          >
            Voyez <span className="text-emerald-600 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 bg-clip-text text-transparent">SukuPass</span> en action
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed"
          >
            {displayTitle}
          </motion.p>
        </div>

        {/* Video Frame Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="double-bezel-outer shadow-2xl shadow-emerald-950/10 max-w-5xl mx-auto"
        >
          <div className="double-bezel-inner overflow-hidden bg-slate-950 rounded-[calc(2.5rem-0.125rem)] border border-slate-800/60 relative">
            
            {/* Top Mac/App style header bar */}
            <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-3 text-[11px] font-mono text-slate-400 font-bold hidden sm:inline">
                  sukupass.tg • Présentation Officielle
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-slate-300 font-mono">1080p HD</span>
              </div>
            </div>

            {/* Video Player Display Area */}
            <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
              
              {videoSource && !videoSource.isUnsupported ? (
                // 1. EMBED (YouTube, Vimeo, Loom, Google Drive)
                videoSource.embedUrl ? (
                  !isPlaying && effectivePoster ? (
                    // Custom poster with click-to-play overlay
                    <div className="relative w-full h-full group cursor-pointer" onClick={() => setIsPlaying(true)}>
                      <img 
                        src={effectivePoster} 
                        alt="Miniature vidéo de présentation" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center group-hover:bg-slate-950/20 transition-all">
                        <div className="w-20 h-20 bg-emerald-600/90 group-hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 group-hover:scale-110 transition-all">
                          <Play className="w-8 h-8 fill-current ml-1" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <iframe
                      src={videoSource.embedUrl}
                      title="Présentation vidéo SukuPass"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )
                ) : (
                  // 2. DIRECT VIDEO FILE (mp4, webm, Supabase Storage, Google Photos stream, etc.)
                  <video
                    src={videoSource.directUrl}
                    poster={effectivePoster}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  >
                    Votre navigateur ne supporte pas la lecture de cette vidéo.
                  </video>
                )
              ) : (
                // 3. PLACEHOLDER QUAND AUCUN LIEN N'EST ENCORE DÉFINI
                <div className="p-8 sm:p-12 text-center max-w-xl mx-auto space-y-5">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
                    <Video className="w-10 h-10 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Vidéo de Démonstration SukuPass
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                      La présentation vidéo officielle est en cours de finalisation.
                      <br className="hidden sm:inline" />
                      Vous êtes administrateur ? Vous pouvez ajouter votre lien vidéo (YouTube, Loom, MP4...) directement depuis la <strong className="text-emerald-400">Console Admin</strong>.
                    </p>
                  </div>
                  {onStartAuth && (
                    <div className="pt-2">
                      <button
                        onClick={() => onStartAuth('signup')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-95"
                      >
                        Tester SukuPass Gratuitement
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </motion.div>

        {/* 3 Quick Value Highlights under Video */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-4"
          >
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900">Import Excel en 3s</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Chargez toutes vos classes d'un coup avec nom, prénom, date de naissance et matricule.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-4"
          >
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900">Webcam Intégrée</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Photographiez vos élèves directement avec la caméra de l'ordinateur sans appareil externe.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-4"
          >
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900">QR Code Anti-Fraude</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Chaque carte possède un code infalsifiable scannable sur place pour vérifier l'élève.
              </p>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
};

