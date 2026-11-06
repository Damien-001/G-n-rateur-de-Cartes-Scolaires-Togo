export default async function handler(req, res) {
  const rawUrl = req.query?.url;
  const isStream = req.query?.stream === '1' || req.query?.stream === 'true';
  const isPoster = req.query?.poster === '1' || req.query?.poster === 'true';

  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).json({ ok: false, error: 'Paramètre url manquant' });
  }

  const targetUrl = rawUrl.trim();
  if (!/^https?:\/\/(photos\.app\.goo\.gl\/|photos\.google\.com\/share\/)/i.test(targetUrl)) {
    return res.status(400).json({ ok: false, error: 'URL Google Photos partagée invalide' });
  }

  try {
    const response = await fetch(targetUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      return res.status(502).json({ ok: false, error: `Google Photos a répondu avec le statut ${response.status}` });
    }

    const html = await response.text();
    const ogMatch =
      html.match(/property=["']og:image["']\s+content=["'](https:\/\/lh3\.googleusercontent\.com\/[^"']+)["']/i) ||
      html.match(/content=["'](https:\/\/lh3\.googleusercontent\.com\/[^"']+)["']\s+property=["']og:image["']/i) ||
      html.match(/(https:\/\/lh3\.googleusercontent\.com\/pw\/[a-zA-Z0-9_-]+)/i);

    if (!ogMatch || !ogMatch[1]) {
      return res.status(404).json({ ok: false, error: 'Flux vidéo introuvable dans la page Google Photos partagée' });
    }

    const baseLh3 = ogMatch[1].split('=')[0];
    const videoUrl = `${baseLh3}=m22`;
    const posterUrl = `${baseLh3}=w1280-h720-no`;

    // Mode redirection directe pour la balise <video src="/api/resolve-video?stream=1&url=...">
    if (isStream) {
      res.setHeader('Cache-Control', 'public, max-age=1800');
      return res.redirect(302, videoUrl);
    }

    // Mode redirection directe pour la miniature <video poster="/api/resolve-video?poster=1&url=...">
    if (isPoster) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.redirect(302, posterUrl);
    }

    res.setHeader('Cache-Control', 'public, max-age=1800');
    return res.status(200).json({
      ok: true,
      videoUrl,
      posterUrl
    });
  } catch (err) {
    console.error('Erreur api/resolve-video:', err);
    return res.status(500).json({ ok: false, error: 'Erreur interne lors de la résolution Google Photos' });
  }
}

