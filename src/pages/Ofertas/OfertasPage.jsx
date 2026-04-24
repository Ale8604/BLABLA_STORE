import { motion } from 'framer-motion';
import { FaTag } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';
import Navbar from '../../components/layout/Navbar/navbar';
import Footer from '../../components/layout/Footer/Footer';
import CardModal from '../../components/products/CardModal/CardModal';
import ProductCard from '../../components/products/ProductCard/ProductCard';
import CardSkeleton from '../../components/skeletons/CardSkeleton';
import { useProducts } from '../../components/context/ProductsContext';
import styles from './OfertasPage.module.css';

const OfertasPage = () => {
  const { activeProducts, loading } = useProducts();

  const now = new Date();
  const ofertas = activeProducts.filter(p => {
    if (!p.discountPercent) return false;
    if (p.offerStart && new Date(p.offerStart) > now) return false;
    if (p.offerEnd   && new Date(p.offerEnd)   < now) return false;
    return true;
  });

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Ofertas — BlaBla Store</title>
        <meta name="description" content="Aprovechá las mejores ofertas en teléfonos y accesorios de BlaBla Store. Productos seleccionados con financiamiento en cuotas." />
      </Helmet>
      <Navbar />
      <CardModal />
      <main className={styles.main}>

        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className={styles.tag}><FaTag size={13} /> Promociones</div>
          <h1 className={styles.title}>Nuestras Ofertas</h1>
          <p className={styles.sub}>Productos seleccionados con financiación disponible en cuotas.</p>
        </motion.div>

        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : ofertas.length === 0 ? (
          <div className={styles.empty}>
            <FaTag size={40} className={styles.emptyIcon} />
            <p>No hay ofertas disponibles en este momento.</p>
            <span>Volvé pronto, actualizamos las promociones frecuentemente.</span>
          </div>
        ) : (
          <motion.div
            className={styles.grid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {ofertas.map(p => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={p.price}
                monthly={p.monthly}
                meses={p.meses}
                image={p.image}
                colorVariants={p.colorVariants}
                discountPercent={p.discountPercent}
                offerStart={p.offerStart}
                offerEnd={p.offerEnd}
              />
            ))}
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OfertasPage;
