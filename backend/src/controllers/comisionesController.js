const prisma = require('../lib/prisma');

const getAll = async (req, res) => {
  try {
    const rules = await prisma.commissionRule.findMany({ orderBy: { categoria: 'asc' } });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener reglas de comisión' });
  }
};

const upsert = async (req, res) => {
  const { categoria, porcentaje } = req.body;
  if (!categoria?.trim())        return res.status(400).json({ error: 'La categoría es requerida' });
  if (porcentaje == null || porcentaje < 0 || porcentaje > 100)
    return res.status(400).json({ error: 'El porcentaje debe estar entre 0 y 100' });
  try {
    const rule = await prisma.commissionRule.upsert({
      where:  { categoria: categoria.trim() },
      update: { porcentaje: Number(porcentaje) },
      create: { categoria: categoria.trim(), porcentaje: Number(porcentaje) },
    });
    res.json(rule);
  } catch (err) {
    console.error('upsert comision:', err);
    res.status(500).json({ error: 'Error al guardar regla' });
  }
};

const remove = async (req, res) => {
  try {
    await prisma.commissionRule.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar regla' });
  }
};

module.exports = { getAll, upsert, remove };
