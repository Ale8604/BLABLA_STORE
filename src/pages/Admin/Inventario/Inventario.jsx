import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaCheck, FaSearch, FaPlusCircle, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '../../../components/context/ProductsContext';
import styles from './Inventario.module.css';

const TOAST_DURATION = 10000;

const Inventario = () => {
  const { activeProducts, archivedProducts, archiveProduct } = useProducts();
  const [search, setSearch]   = useState('');
  const [toast, setToast]     = useState(null);
  const timerRef              = useRef(null);
  const navigate              = useNavigate();

  const dismissToast = () => {
    clearTimeout(timerRef.current);
    setToast(null);
  };

  const handleArchive = (product) => {
    archiveProduct(product.id);
    clearTimeout(timerRef.current);
    setToast({
      productId: product.id,
      productName: product.name,
      wasArchived: !product.archived,
    });
    timerRef.current = setTimeout(dismissToast, TOAST_DURATION);
  };

  const handleUndo = () => {
    if (toast) archiveProduct(toast.productId);
    dismissToast();
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const allVisible = [...activeProducts, ...archivedProducts];

  const filtered = allVisible.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (allVisible.length === 0) {
    return (
      <div className={styles.emptyWrapper}>
        <div className={styles.emptyIcon}>📦</div>
        <p className={styles.emptyText}>No tienes productos en tu inventario</p>
        <button className={styles.addBtn} onClick={() => navigate('/admin/crear')}>
          Agregar Productos <FaPlusCircle size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.topBar}>
        <h2 className={styles.title}>LISTADO DE EXISTENCIA</h2>
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

      <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Precio</th>
            <th>Archivado</th>
            <th>Editar</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(product => (
            <tr key={product.id} className={product.archived ? styles.rowArchived : ''}>
              <td>
                <img src={product.image} alt={product.name} className={styles.productImg} />
              </td>
              <td className={styles.productName}>{product.name}</td>
              <td>
                <span className={`${styles.statusDot} ${product.active ? styles.statusActive : styles.statusInactive}`} />
              </td>
              <td className={styles.price}>${product.price.toLocaleString()}</td>
              <td>
                <button
                  className={`${styles.archiveBtn} ${product.archived ? styles.archiveBtnActive : ''}`}
                  onClick={() => handleArchive(product)}
                  title={product.archived ? 'Restaurar' : 'Archivar'}
                >
                  {product.archived && <FaCheck size={13} />}
                </button>
              </td>
              <td>
                <button
                  className={styles.editBtn}
                  onClick={() => navigate(`/admin/crear?edit=${product.id}`)}
                  title="Editar"
                >
                  <FaEdit size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div
            className={styles.toast}
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0,  opacity: 1, scale: 1    }}
            exit={{    y: 16, opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          >
            <span className={styles.toastMsg}>
              <strong>{toast.productName}</strong> {toast.wasArchived ? 'archivado' : 'restaurado'}
            </span>
            <button className={styles.undoBtn} onClick={handleUndo}>Deshacer</button>
            <button className={styles.toastClose} onClick={dismissToast}><FaTimes size={11} /></button>
            <motion.div
              className={styles.toastProgress}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: TOAST_DURATION / 1000, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventario;
