import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useProducts } from '../../../components/context/ProductsContext';
import styles from './Archivados.module.css';

const Archivados = () => {
  const { archivedProducts, archiveProduct } = useProducts();
  const [search, setSearch]     = useState('');
  const [toast, setToast]       = useState(null);

  const filtered = archivedProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleRestore = (product) => {
    archiveProduct(product.id);
    setToast(product.name);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.topBar}>
        <h2 className={styles.title}>ARCHIVADOS</h2>
        <div className={styles.searchBox}>
          <FaSearch size={13} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar..."
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyWrapper}>
          <FaEyeSlash size={48} className={styles.emptyIcon} />
          <p className={styles.emptyText}>No hay productos archivados</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(product => (
            <div key={product.id} className={styles.card}>
              <div className={styles.imageWrapper}>
                <img src={product.image} alt={product.name} className={styles.image} />
                <div className={styles.overlay}>
                  <button
                    className={styles.restoreBtn}
                    onClick={() => handleRestore(product)}
                    title="Restaurar producto"
                  >
                    <FaEye size={16} />
                  </button>
                </div>
              </div>
              <div className={styles.info}>
                <h4 className={styles.name}>{product.name}</h4>
                <p className={styles.price}>${product.price.toLocaleString()}</p>
                <p className={styles.installments}>
                  Cuotas desde {product.monthly}$ / por mes por 24 meses
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={styles.toast}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
          >
            <strong>{toast}</strong>
            <span>Ahora es visible para los clientes</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Archivados;
