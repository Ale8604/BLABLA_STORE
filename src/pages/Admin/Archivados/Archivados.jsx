import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaEyeSlash, FaEye, FaEdit } from 'react-icons/fa';
import { useProducts } from '../../../components/context/ProductsContext';
import styles from './Archivados.module.css';

const Archivados = () => {
  const { archivedProducts, archiveProduct } = useProducts();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [toast, setToast]   = useState(null);

  const filtered = archivedProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSearch = (val) => setSearch(val);

  const handleActivate = (product) => {
    archiveProduct(product.id);
    setToast({ name: product.name, msg: 'Ahora es visible para los clientes' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEdit = (product) => {
    navigate(`/admin/editar?id=${product.id}`);
  };

  return (
    <div className={styles.wrapper}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>ARCHIVADOS</h2>
          <span className={styles.count}>{filtered.length} producto{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className={styles.searchBox}>
          <FaSearch size={13} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por nombre, marca o categoría…"
            className={styles.searchInput}
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className={styles.emptyWrapper}>
          <FaEyeSlash size={48} className={styles.emptyIcon} />
          <p className={styles.emptyText}>
            {search ? `Sin resultados para "${search}"` : 'No hay productos archivados'}
          </p>
        </div>
      ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Marca</th>
                  <th>Precio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td className={styles.nameCell}>
                      <img
                        src={p.image}
                        alt={p.name}
                        className={styles.thumb}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <span>{p.name}</span>
                    </td>
                    <td className={styles.muted}>{p.category}</td>
                    <td className={styles.muted}>{p.brand}</td>
                    <td className={styles.price}>${p.price.toLocaleString()}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.editBtn}
                          onClick={() => handleEdit(p)}
                          title="Editar producto"
                        >
                          <FaEdit size={13} /> Editar
                        </button>
                        <button
                          className={styles.activateBtn}
                          onClick={() => handleActivate(p)}
                          title="Activar y publicar"
                        >
                          <FaEye size={13} /> Activar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <strong>{toast.name}</strong>
            <span>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Archivados;
