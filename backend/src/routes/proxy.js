const express = require('express');
const router  = express.Router();

// Proxy para bajar imágenes externas sin CORS desde el frontend
router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Falta el parámetro url' });

  try {
    const decoded = decodeURIComponent(url);

    // Solo permitir URLs http/https
    if (!/^https?:\/\//i.test(decoded))
      return res.status(400).json({ error: 'URL no válida' });

    const response = await fetch(decoded);
    if (!response.ok)
      return res.status(502).json({ error: `No se pudo bajar la imagen: ${response.status}` });

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/'))
      return res.status(400).json({ error: 'La URL no apunta a una imagen' });

    const buffer = await response.arrayBuffer();
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('proxy-image:', err.message);
    res.status(500).json({ error: 'Error al obtener la imagen' });
  }
});

module.exports = router;
