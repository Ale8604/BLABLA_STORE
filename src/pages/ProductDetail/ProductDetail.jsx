import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaShoppingCart } from 'react-icons/fa';
import Navbar from '../../components/layout/Navbar/navbar';
import Footer from '../../components/layout/Footer/Footer';
import CardModal from '../../components/products/CardModal/CardModal';
import { useProducts } from '../../components/context/ProductsContext';
import { useCart } from '../../components/context/CartContext';
import styles from './ProductDetail.module.css';

const ProductDetail = () => {
  const { id }                   = useParams();
  const { products }             = useProducts();
  const { addToCart }            = useCart();
  const navigate                 = useNavigate();

  const product = products.find(p => p.id === Number(id));

  const variants  = Array.isArray(product?.colorVariants) && product.colorVariants.length > 0
    ? product.colorVariants : null;
  const ramOpts     = Array.isArray(product?.ram)     ? product.ram     : [];
  const storageOpts = Array.isArray(product?.storage) ? product.storage : [];

  const [activeImg,     setActiveImg]     = useState(null);
  const [activeColor,   setActiveColor]   = useState(0);
  const [selectedRam,   setSelectedRam]   = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [added,         setAdded]         = useState(false);
  const [swipeDir,      setSwipeDir]      = useState(1);

  useEffect(() => {
    if (product) {
      const first = variants?.[0]?.image || product.image;
      setActiveImg(first);
      setActiveColor(0);
      setSelectedRam(ramOpts[0]  ?? null);
      setSelectedStore(storageOpts[0] ?? null);
    }
  }, [product?.id]);

  const allImages = variants ? variants.map(v => v.image) : (product?.image ? [product.image] : []);

  const handleDragEnd = (_, info) => {
    const threshold = 40;
    if (info.offset.x < -threshold && activeColor < allImages.length - 1) {
      const next = activeColor + 1;
      setSwipeDir(1);
      setActiveColor(next);
      setActiveImg(allImages[next]);
    } else if (info.offset.x > threshold && activeColor > 0) {
      const prev = activeColor - 1;
      setSwipeDir(-1);
      setActiveColor(prev);
      setActiveImg(allImages[prev]);
    }
  };

  if (!product) return (
    <div className={styles.notFound}>
      <p>Producto no encontrado.</p>
      <button onClick={() => navigate('/')}>Volver</button>
    </div>
  );

  const handleAddToCart = () => {
    if (outOfStock) return;
    const specs = [selectedRam, selectedStore].filter(Boolean).join(' / ');
    const colorName = currentVariant?.color ?? '';

    addToCart({
      id:           `${product.id}-${selectedRam}-${selectedStore}-${activeColor}`,
      productId:    product.id,
      name:         product.name,
      specs,
      colorVariant: colorName,
      price:        displayPrice,
      image:        activeImg,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const offerActive = (() => {
    if (!product.discountPercent) return false;
    const now = new Date();
    if (product.offerStart && new Date(product.offerStart) > now) return false;
    if (product.offerEnd   && new Date(product.offerEnd)   < now) return false;
    return true;
  })();
  const displayPrice = offerActive
    ? Math.round(product.price * (1 - product.discountPercent / 100))
    : product.price;

  const selectColor = (i) => {
    setSwipeDir(i > activeColor ? 1 : -1);
    setActiveColor(i);
    if (variants?.[i]) setActiveImg(variants[i].image);
  };

  const currentVariant   = variants?.[activeColor];
  const colorStock       = currentVariant?.stock ?? product.stock ?? 0;
  const outOfStock       = colorStock === 0;
  const lowStock         = !outOfStock && colorStock <= 3;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image,
    description: product.description || product.name,
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: displayPrice,
      availability: (product.stock ?? 0) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{product.name} — BlaBla Store</title>
        <meta name="description" content={product.description || `Comprá ${product.name} en BlaBla Store. Precio: $${displayPrice}. Financiamiento disponible.`} />
        <meta property="og:title" content={`${product.name} — BlaBla Store`} />
        <meta property="og:description" content={product.description || `${product.name} desde $${displayPrice}`} />
        <meta property="og:image" content={product.image} />
        <meta property="og:type" content="product" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <Navbar />
      <CardModal />
      <main className={styles.main}>
        <button className={styles.back} onClick={() => navigate(-1)}>
          <FaArrowLeft size={13} /> Volver
        </button>

        <div className={styles.layout}>

          {/* ── Columna izquierda: imágenes ── */}
          <div className={styles.gallery}>
            {/* Contenedor drag — sin key para que no se desmonte al cambiar imagen */}
            <motion.div
              className={styles.mainImgBox}
              drag={allImages.length > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={handleDragEnd}
              whileDrag={{ cursor: 'grabbing' }}
              style={{ touchAction: 'pan-y' }}
            >
              <AnimatePresence mode="wait" custom={swipeDir}>
                <motion.img
                  key={activeImg}
                  src={activeImg}
                  alt={product.name}
                  className={styles.mainImg}
                  decoding="async"
                  custom={swipeDir}
                  variants={{
                    initial: (dir) => ({ x: dir * 55, opacity: 0 }),
                    animate: { x: 0, opacity: 1 },
                    exit:    (dir) => ({ x: -dir * 55, opacity: 0 }),
                  }}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                  draggable={false}
                />
              </AnimatePresence>
            </motion.div>

            {/* Dots — visibles cuando hay varias imágenes */}
            {allImages.length > 1 && (
              <div className={styles.dotsRow}>
                {allImages.map((_, i) => (
                  <motion.button
                    key={i}
                    className={`${styles.dot} ${activeColor === i ? styles.dotActive : ''}`}
                    onClick={() => selectColor(i)}
                    whileTap={{ scale: 0.85 }}
                  />
                ))}
              </div>
            )}

            {/* Thumbnails — solo desktop */}
            {variants && variants.length > 1 && (
              <div className={styles.thumbRow}>
                {variants.map((v, i) => (
                  <button
                    key={i}
                    className={`${styles.thumb} ${activeColor === i ? styles.thumbActive : ''}`}
                    onClick={() => selectColor(i)}
                  >
                    <img src={v.image} alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Columna derecha: info ── */}
          <div className={styles.info}>
            <span className={styles.brand}>{product.brand}</span>
            <h1 className={styles.name}>{product.name}</h1>

            {offerActive && (
              <div className={styles.discountBadge}>-{product.discountPercent}% OFF</div>
            )}

            <div className={styles.priceRow}>
              <span className={styles.price}>${displayPrice.toLocaleString()}</span>
              {offerActive && (
                <span className={styles.priceOriginal}>${product.price.toLocaleString()}</span>
              )}
              {product.monthly > 0 && (
                <span className={styles.monthly}>
                  Desde ${product.monthly} / mes × {product.meses ?? 24} meses
                </span>
              )}
            </div>

            <div className={styles.divider} />

            {/* Colores */}
            {variants && (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>
                  Color: <strong>{variants[activeColor]?.color ?? ''}</strong>
                </p>
                <div className={styles.colorRow}>
                  {variants.map((v, i) => {
                    const oos = (v.stock ?? 0) === 0;
                    return (
                      <button
                        key={i}
                        className={`${styles.colorDot} ${activeColor === i ? styles.colorDotActive : ''} ${oos ? styles.colorDotOos : ''}`}
                        style={{ backgroundColor: v.color }}
                        onClick={() => selectColor(i)}
                        title={oos ? `${v.color} — Sin stock` : v.color}
                        aria-label={oos ? `${v.color} sin stock` : v.color}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* RAM */}
            {ramOpts.length > 0 && (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>RAM</p>
                <div className={styles.chipRow}>
                  {ramOpts.map(r => (
                    <button
                      key={r}
                      className={`${styles.chip} ${selectedRam === r ? styles.chipActive : ''}`}
                      onClick={() => setSelectedRam(r)}
                    >{r}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Storage */}
            {storageOpts.length > 0 && (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Almacenamiento</p>
                <div className={styles.chipRow}>
                  {storageOpts.map(s => (
                    <button
                      key={s}
                      className={`${styles.chip} ${selectedStore === s ? styles.chipActive : ''}`}
                      onClick={() => setSelectedStore(s)}
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.divider} />

            {/* Descripción */}
            {product.description && (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Descripción</p>
                <p className={styles.descText}>{product.description}</p>
              </div>
            )}

            {/* Specs */}
            {product.specs && (
              <div className={styles.section}>
                <p className={styles.sectionLabel}>Especificaciones</p>
                <p className={styles.descText}>{product.specs}</p>
              </div>
            )}

            {outOfStock && (
              <p className={styles.outOfStockMsg}>Sin stock para este color</p>
            )}
            {lowStock && (
              <p className={styles.lowStockMsg}>¡Solo quedan {colorStock}!</p>
            )}

            <motion.button
              className={`${styles.cartBtn} ${added ? styles.cartBtnAdded : ''} ${outOfStock ? styles.cartBtnDisabled : ''}`}
              onClick={handleAddToCart}
              disabled={outOfStock}
              whileTap={outOfStock ? {} : { scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            >
              <FaShoppingCart size={16} />
              {outOfStock ? 'Sin stock' : added ? '¡Agregado!' : 'Agregar al Carrito'}
            </motion.button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
