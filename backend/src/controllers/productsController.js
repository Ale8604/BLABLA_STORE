const prisma = require('../lib/prisma');

const getAll = async (req, res) => {
  try {
    const { brand, condition, minPrice, maxPrice, archived, draft } = req.query;

    let where = {};
    if (draft === 'true') {
      where = { draft: true };
    } else if (archived === 'true') {
      where = { archived: true, draft: false };
    } else {
      where = { archived: false, active: true, draft: false };
    }

    if (brand)     where.brand     = brand;
    if (condition) where.condition = condition;
    if (minPrice || maxPrice) {
      where.price = {
        gte: minPrice ? Number(minPrice) : undefined,
        lte: maxPrice ? Number(maxPrice) : undefined,
      };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(products);
  } catch (err) {
    console.error('getAll:', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

const getOne = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    console.error('getOne:', err);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

const create = async (req, res) => {
  console.log('CREATE called, body keys:', Object.keys(req.body));
  try {
    const {
      name, price, brand, condition, category, code, stock,
      description, specs, image, active, archived, entrada, meses,
      colorVariants, ram, storage, draft,
    } = req.body;

    const isDraft = !!draft;

    if (!isDraft) {
      if (!name || !price || !code || !description || !image)
        return res.status(400).json({ error: 'Nombre, precio, código, descripción e imagen son requeridos para publicar' });
    }

    const draftCode = `_draft_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const p       = Number(price)   || 0;
    const ent     = Number(entrada) || 0;
    const mes     = Number(meses)   || 24;
    const monthly = p > 0 ? Number(((p * (1 - ent / 100)) / mes).toFixed(2)) : 0;

    const product = await prisma.product.create({
      data: {
        name:          name          || '',
        brand:         brand         || '',
        condition:     condition     || 'Nuevo',
        category:      category      || 'Teléfonos',
        code:          (code?.trim()) || draftCode,
        description:   description   || '',
        specs:         specs         || '',
        image:         image         || '',
        colorVariants: colorVariants || [],
        ram:           ram           || [],
        storage:       storage       || [],
        price:   p,
        stock:   Number(stock) || 0,
        entrada: ent,
        meses:   mes,
        monthly,
        active:   isDraft ? false : (active ?? true),
        archived: isDraft ? false : (archived ?? false),
        draft:    isDraft,
      },
    });

    res.status(201).json(product);
  } catch (err) {
    console.error('create:', err);
    if (err.code === 'P2002')
      return res.status(409).json({ error: 'El código ya existe' });
    res.status(500).json({ error: err.message || 'Error al crear producto' });
  }
};

const update = async (req, res) => {
  try {
    const id      = Number(req.params.id);
    const payload = { ...req.body };

    if (payload.price   !== undefined) payload.price   = Number(payload.price);
    if (payload.stock   !== undefined) payload.stock   = Number(payload.stock);
    if (payload.entrada !== undefined) payload.entrada = Number(payload.entrada);
    if (payload.meses   !== undefined) payload.meses   = Number(payload.meses);

    if (payload.price !== undefined || payload.entrada !== undefined || payload.meses !== undefined) {
      const current = await prisma.product.findUnique({
        where:  { id },
        select: { price: true, entrada: true, meses: true },
      });
      const p   = payload.price   ?? current.price;
      const ent = payload.entrada ?? current.entrada;
      const mes = payload.meses   ?? current.meses;
      payload.monthly = p > 0 ? Number(((p * (1 - ent / 100)) / mes).toFixed(2)) : 0;
    }

    const product = await prisma.product.update({ where: { id }, data: payload });
    res.json(product);
  } catch (err) {
    console.error('update:', err);
    if (err.code === 'P2025')
      return res.status(404).json({ error: 'Producto no encontrado' });
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

const archive = async (req, res) => {
  try {
    const id      = Number(req.params.id);
    const current = await prisma.product.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: 'Producto no encontrado' });

    const product = await prisma.product.update({
      where: { id },
      data:  { archived: !current.archived },
    });
    res.json(product);
  } catch (err) {
    console.error('archive:', err);
    res.status(500).json({ error: 'Error al archivar producto' });
  }
};

const remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    // Delete related order items first to avoid FK constraint
    await prisma.orderItem.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error('remove:', err);
    if (err.code === 'P2025')
      return res.status(404).json({ error: 'Producto no encontrado' });
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

const setOffer = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { discountPercent, offerStart, offerEnd } = req.body;
    const product = await prisma.product.update({
      where: { id },
      data: {
        discountPercent: discountPercent ?? null,
        offerStart: offerStart ? new Date(offerStart) : null,
        offerEnd:   offerEnd   ? new Date(offerEnd)   : null,
      },
    });
    res.json(product);
  } catch (err) {
    console.error('setOffer:', err);
    res.status(500).json({ error: 'Error al configurar oferta' });
  }
};

module.exports = { getAll, getOne, create, update, archive, remove, setOffer };
