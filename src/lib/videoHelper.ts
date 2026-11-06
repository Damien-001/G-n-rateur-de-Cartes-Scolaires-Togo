/**
 * Helper de traitement et de rendu des URLs vidéo pour SukuPass
 * Supporte : YouTube (standard, court, embed, shorts), Loom, Vimeo, Google Drive,
 * et les URLs directes de fichiers vidéo (.mp4, .webm, Supabase Storage, Cloudinary, etc.)
 */

export interface VideoSourceInfo {
  type: 'youtube' | 'vimeo' | 'loom' | 'gdrive' | 'dailymotion' | 'streamable' | 'direct' | 'google_photos_private' | 'google_photos_shared';
  embedUrl?: string;
  directUrl?: string;
  originalUrl: string;
  isUnsupported?: boolean;
  warning?: string;
}

/** Détecte si l'URL est un lien Google Photos PRIVÉ (/photo/...) copié depuis la barre d'adresse sans partage */
export function isPrivateGooglePhotosUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return /photos\.google\.com\/(?:u\/\d+\/)?photo\//i.test(url.trim());
}

/** Détecte si l'URL est un lien Google Photos PARTAGÉ (photos.app.goo.gl/... ou photos.google.com/share/...) */
export function isSharedGooglePhotosUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return /photos\.app\.goo\.gl\//i.test(trimmed) || /photos\.google\.com\/share\//i.test(trimmed);
}

/** Retourne true uniquement si le lien Google Photos est un lien privé (/photo/...) non partagé */
export function isGooglePhotosUrl(url?: string): boolean {
  return isPrivateGooglePhotosUrl(url);
}

const SUKUPASS_HOSTED_DEMO_VIDEO = 'https://ptmigsqqamaizizjkspo.supabase.co/storage/v1/object/public/school-assets/platform/videos/sukupass-demo.mp4';
const SUKUPASS_HOSTED_DEMO_POSTER = 'https://ptmigsqqamaizizjkspo.supabase.co/storage/v1/object/public/school-assets/platform/posters/sukupass-demo-poster.jpg';

/**
 * Extrait automatiquement le flux vidéo MP4 direct (=m22) et la miniature depuis un lien de partage Google Photos
 * via notre endpoint serveur local /api/resolve-video (aucune erreur CORS)
 */
export async function resolveGooglePhotosSharedUrl(shareUrl: string): Promise<{ videoUrl: string; posterUrl?: string } | null> {
  const trimmed = shareUrl.trim();
  if (/Bv4gZ1B7XjgD3Pwd9|AF1QipMHC3hjOxa6XECHD5VeyBJZO55lu-7flKuC4E9s/i.test(trimmed)) {
    return {
      videoUrl: SUKUPASS_HOSTED_DEMO_VIDEO,
      posterUrl: SUKUPASS_HOSTED_DEMO_POSTER
    };
  }
  if (!isSharedGooglePhotosUrl(trimmed)) return null;

  try {
    const response = await fetch(`/api/resolve-video?url=${encodeURIComponent(trimmed)}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.ok && data?.videoUrl) {
      return {
        videoUrl: data.videoUrl,
        posterUrl: data.posterUrl
      };
    }
  } catch (e) {
    console.warn('Info: résolution directe via /api/resolve-video:', e);
  }

  return null;
}

export function parseVideoSource(rawUrl?: string): VideoSourceInfo | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = rawUrl.trim();
  if (!url) return null;

  if (/Bv4gZ1B7XjgD3Pwd9|AF1QipMHC3hjOxa6XECHD5VeyBJZO55lu-7flKuC4E9s/i.test(url)) {
    return {
      type: 'direct',
      directUrl: SUKUPASS_HOSTED_DEMO_VIDEO,
      originalUrl: url
    };
  }

  // 0. Flux direct Google Photos (lh3.googleusercontent.com)
  if (/lh3\.googleusercontent\.com\//i.test(url)) {
    const baseUrl = url.split('=')[0];
    const hasVideoParam = /=(?:dv|m18|m22|m37)/i.test(url);
    return {
      type: 'direct',
      directUrl: hasVideoParam ? url : `${baseUrl}=m22`,
      originalUrl: url
    };
  }

  // Lien Google Photos PARTAGÉ (photos.app.goo.gl/... ou photos.google.com/share/...) -> Lecture directe via notre route /api/resolve-video
  if (isSharedGooglePhotosUrl(url)) {
    return {
      type: 'direct',
      directUrl: `/api/resolve-video?stream=1&url=${encodeURIComponent(url)}`,
      originalUrl: url
    };
  }

  // Lien Google Photos PRIVÉ (/photo/...) -> nécessite un lien de partage
  if (isPrivateGooglePhotosUrl(url)) {
    return {
      type: 'google_photos_private',
      originalUrl: url,
      isUnsupported: true,
      warning: "Ce lien Google Photos (/photo/...) est privé et lié uniquement à votre session Google. Dans Google Photos, cliquez sur « Partager > Créer un lien » (lien photos.app.goo.gl/...) et collez-le ici, ou importez directement le fichier .MP4."
    };
  }

  // 1. YouTube (watch?v=ID, youtu.be/ID, embed/ID, shorts/ID, live/ID)
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&rel=0&modestbranding=1`,
      originalUrl: url
    };
  }

  // 2. Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[3]) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}?badge=0&autopause=0`,
      originalUrl: url
    };
  }

  // 3. Loom
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/i);
  if (loomMatch && loomMatch[1]) {
    return {
      type: 'loom',
      embedUrl: `https://www.loom.com/embed/${loomMatch[1]}`,
      originalUrl: url
    };
  }

  // 4. Google Drive (/file/d/ID, open?id=ID, uc?id=ID)
  const gdriveMatch =
    url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i) ||
    url.match(/drive\.google\.com\/(?:open|uc|file)\?.*?id=([a-zA-Z0-9_-]+)/i);
  if (gdriveMatch && gdriveMatch[1]) {
    return {
      type: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`,
      originalUrl: url
    };
  }

  // 5. Dailymotion
  const dmMatch = url.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/i);
  if (dmMatch && dmMatch[1]) {
    return {
      type: 'dailymotion',
      embedUrl: `https://www.dailymotion.com/embed/video/${dmMatch[1]}`,
      originalUrl: url
    };
  }

  // 6. Streamable
  const streamableMatch = url.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/i);
  if (streamableMatch && streamableMatch[1]) {
    return {
      type: 'streamable',
      embedUrl: `https://streamable.com/e/${streamableMatch[1]}`,
      originalUrl: url
    };
  }

  // 7. Dropbox (convertir en lien direct streamable)
  if (/dropbox\.com\//i.test(url)) {
    const directDropbox = url
      .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
      .replace(/[?&]dl=0/g, '');
    return {
      type: 'direct',
      directUrl: directDropbox,
      originalUrl: url
    };
  }

  // 8. Fichiers vidéo directs (.mp4, .webm, .mov, Supabase Storage, etc.)
  return {
    type: 'direct',
    directUrl: url,
    originalUrl: url
  };
}


