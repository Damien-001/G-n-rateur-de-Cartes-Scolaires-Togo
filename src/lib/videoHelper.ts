/**
 * Helper de traitement et de rendu des URLs vidéo pour SukuPass
 * Supporte : YouTube (standard, court, embed, shorts), Loom, Vimeo, Google Drive,
 * et les URLs directes de fichiers vidéo (.mp4, .webm, Supabase Storage, Cloudinary, etc.)
 */

export interface VideoSourceInfo {
  type: 'youtube' | 'vimeo' | 'loom' | 'gdrive' | 'dailymotion' | 'streamable' | 'direct' | 'google_photos_unsupported';
  embedUrl?: string;
  directUrl?: string;
  originalUrl: string;
  isUnsupported?: boolean;
  warning?: string;
}

/** Détecte si l'URL provient de Google Photos (qui bloque l'intégration externe via SAMEORIGIN) */
export function isGooglePhotosUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return /photos\.(google\.com|app\.goo\.gl)/i.test(url);
}

export function parseVideoSource(rawUrl?: string): VideoSourceInfo | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = rawUrl.trim();
  if (!url) return null;

  // Détection explicite de Google Photos (incompatible avec l'intégration web)
  if (isGooglePhotosUrl(url)) {
    return {
      type: 'google_photos_unsupported',
      originalUrl: url,
      isUnsupported: true,
      warning: "Google Photos n'autorise pas la diffusion de vidéos sur des sites web externes (restriction SAMEORIGIN). Utilisez le bouton « Importer une vidéo (.MP4) » ci-dessus pour téléverser directement votre vidéo depuis votre téléphone ou ordinateur !"
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


