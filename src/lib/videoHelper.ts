/**
 * Helper de traitement et de rendu des URLs vidéo pour SukuPass
 * Supporte : YouTube (standard, court, embed, shorts), Loom, Vimeo, Google Drive,
 * et les URLs directes de fichiers vidéo (.mp4, .webm, Supabase Storage, Cloudinary, etc.)
 */

export interface VideoSourceInfo {
  type: 'youtube' | 'vimeo' | 'loom' | 'gdrive' | 'direct';
  embedUrl?: string;
  directUrl?: string;
  originalUrl: string;
}

export function parseVideoSource(rawUrl?: string): VideoSourceInfo | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = rawUrl.trim();
  if (!url) return null;

  // 1. YouTube
  // Formats: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
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

  // 4. Google Drive
  const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (gdriveMatch && gdriveMatch[1]) {
    return {
      type: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`,
      originalUrl: url
    };
  }

  // 5. Direct video formats or other generic video links
  return {
    type: 'direct',
    directUrl: url,
    originalUrl: url
  };
}
