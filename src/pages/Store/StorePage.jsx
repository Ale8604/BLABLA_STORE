import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FaMobileAlt, FaHeadphones, FaTimes } from 'react-icons/fa';
import Navbar from '../../components/layout/Navbar/navbar.jsx';
import Footer from '../../components/layout/Footer/Footer.jsx';
import Filtros from '../../components/filter/filter';
import Carousel from '../../components/Carousel/Carousel';
import CardSkeleton from '../../components/skeletons/CardSkeleton';
import CarouselSkeleton from '../../components/skeletons/CarouselSkeleton';
import styles from './StorePage.module.css';
import ProductCard from '../../components/products/ProductCard/ProductCard';
import CardModal from '../../components/products/CardModal/CardModal';
import { useProducts } from '../../components/context/ProductsContext';
import { useBanners } from '../../components/context/BannersContext';
import UbicacionesSection from '../../components/UbicacionesSection/UbicacionesSection';

const ALL_CONDITIONS = ['Nuevo', 'Reacondicionado'];

const CATEGORY_META = {
  'Teléfonos':  { icon: <FaMobileAlt size={22} />,  color: '#5b7cfa' },
  'Accesorios': { icon: <FaHeadphones size={22} />, color: '#a78bfa' },
  'Repuestos':  { icon: <FaTimes size={22} />,      color: '#fb923c' },
};

function StorePage() {
  const { activeProducts, loading: loadingProducts } = useProducts();
  const { loading: loadingBanners } = useBanners();
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  const categoria = searchParams.get('categoria') || '';
  const q         = searchParams.get('q')         || '';

  const [minPrice, setMinPrice]             = useState('');
  const [maxPrice, setMaxPrice]             = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedConditions, setSelectedConditions] = useState([]);

  const toggleBrand = (brand) =>
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );

  const toggleCondition = (cond) =>
    setSelectedConditions(prev =>
      prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
    );

  const allBrands = useMemo(
    () => [...new Set(activeProducts.map(p => p.brand))].sort(),
    [activeProducts]
  );

  const filteredProducts = useMemo(() => {
    return activeProducts.filter(p => {
      if (categoria && p.category !== categoria) return false;
      if (q && !`${p.name} ${p.brand} ${p.description}`.toLowerCase().includes(q.toLowerCase())) return false;
      const min = minPrice === '' ? 0 : Number(minPrice);
      const max = maxPrice === '' ? Infinity : Number(maxPrice);
      if (p.price < min || p.price > max) return false;
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
      if (selectedConditions.length > 0 && !selectedConditions.includes(p.condition)) return false;
      return true;
    });
  }, [activeProducts, minPrice, maxPrice, selectedBrands, selectedConditions, categoria, q]);

  const catMeta = CATEGORY_META[categoria];

  const pageTitle = categoria
    ? `${categoria} — BlaBla Store`
    : q
    ? `Resultados para "${q}" — BlaBla Store`
    : 'BlaBla Store — Teléfonos y Accesorios en Venezuela';

  return (
    <div className={styles.appWrapper}>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content="Comprá teléfonos, accesorios y repuestos en Valencia, Venezuela. iPhone, Samsung, Xiaomi y más marcas. Financiamiento en cuotas disponible." />
      </Helmet>
      <Navbar />
      <CardModal />
      <main className={styles.content}>
        {/* Mostrar carousel solo cuando no hay filtro de categoria/búsqueda */}
        {!categoria && !q && (
          loadingBanners ? <CarouselSkeleton /> : <Carousel />
        )}

        {/* Banner de categoría */}
        {categoria && (
          <div className={styles.categoryBanner} style={{ '--cat-color': catMeta?.color || '#5b7cfa' }}>
            <div className={styles.categoryBannerLeft}>
              <span className={styles.categoryBannerIcon}>{catMeta?.icon}</span>
              <div>
                <h2 className={styles.categoryBannerTitle}>{categoria}</h2>
                <p className={styles.categoryBannerSub}>
                  {loadingProducts ? '…' : `${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <button className={styles.clearFilterBtn} onClick={() => navigate('/')}>
              <FaTimes size={12} /> Ver todos
            </button>
          </div>
        )}

        {/* Banner de búsqueda */}
        {q && (
          <div className={styles.searchBanner}>
            <p className={styles.searchBannerText}>
              Resultados para <strong>"{q}"</strong>
              {!loadingProducts && ` — ${filteredProducts.length} encontrado${filteredProducts.length !== 1 ? 's' : ''}`}
            </p>
            <button className={styles.clearFilterBtn} onClick={() => navigate('/')}>
              <FaTimes size={12} /> Limpiar
            </button>
          </div>
        )}

        <div className={styles.storeLayout}>
          <Filtros
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPrice={setMinPrice}
            onMaxPrice={setMaxPrice}
            allBrands={allBrands}
            selectedBrands={selectedBrands}
            onToggleBrand={toggleBrand}
            allConditions={ALL_CONDITIONS}
            selectedConditions={selectedConditions}
            onToggleCondition={toggleCondition}
          />
          <section className={styles.productGrid}>
            {loadingProducts ? (
              Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((prod, i) => (
                <motion.div
                  key={prod.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.38, delay: Math.min(i % 6, 5) * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <ProductCard {...prod} price={prod.price.toLocaleString()} />
                </motion.div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No hay productos que coincidan.</p>
                <span>Probá ajustando los filtros o buscando otro término.</span>
                <button className={styles.emptyStateBtn} onClick={() => navigate('/')}>Ver todos los productos</button>
              </div>
            )}
          </section>
        </div>
        <UbicacionesSection />
      </main>
      <Footer />
    </div>
  );
}

export default StorePage;
