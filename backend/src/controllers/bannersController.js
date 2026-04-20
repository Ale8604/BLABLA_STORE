const prisma = require('../lib/prisma');

const getAll = async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: req.query.all === 'true' ? {} : { active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(banners);
  } catch (err) {
    console.error('banners getAll:', err);
    res.status(500).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { image, title, link, active, order } = req.body;
    if (!image) return res.status(400).json({ error: 'La imagen es requerida' });
    const banner = await prisma.banner.create({
      data: { image, title: title || '', link: link || '', active: active ?? true, order: order ?? 0 },
    });
    res.status(201).json(banner);
  } catch (err) {
    console.error('banners create:', err);
    res.status(500).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const banner = await prisma.banner.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(banner);
  } catch (err) {
    console.error('banners update:', err);
    res.status(500).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await prisma.banner.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    console.error('banners remove:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, create, update, remove };
