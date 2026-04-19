const prisma = require('../lib/prisma');

const getAll = async (req, res) => {
  try {
    const { brand, condition, minPrice, maxPrice, archived } = req.query;

    const products = await prisma.product.findMany({
      where: {
        archived:  archived === 'true' ? true : false,
        active:    archived === 'true' ? undefined : true,
        brand:     brand     || undefined,
        condition: condition || undefined,
        price: {
          gte: minPrice ? Number(minPrice) : undefined,
          lte: maxPrice ? Number(maxPrice) : undefined,
        },
      },
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
    const { name, price, brand, condition, category, code, stock, description, specs, image, active } = req.body;

    if (!name || !price || !code)
      return res.status(400).json({ error: 'Nombre, precio y código son requeridos' });

    const product = await prisma.product.create({
      data: {
        name, brand, condition, category, code,
        description: description || '',
        specs:       specs       || '',
        image:       image       || '',
        price:   Number(price),
        stock:   Number(stock) || 0,
        monthly: Number((price / 24).toFixed(2)),
        active:  active ?? true,
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

    if (payload.price !== undefined)   payload.price   = Number(payload.price);
    if (payload.stock !== undefined)   payload.stock   = Number(payload.stock);
    if (payload.monthly !== undefined) payload.monthly = Number(payload.monthly);

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
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    console.error('remove:', err);
    if (err.code === 'P2025')
      return res.status(404).json({ error: 'Producto no encontrado' });
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

module.exports = { getAll, getOne, create, update, archive, remove };
