import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaCheck, FaSearch, FaPlusCircle } from 'react-icons/fa';
import { useProducts } from '../../../components/context/ProductsContext';
import styles from './Inventario.module.css';

const Inventario = () => {
  const { activeProducts, archivedProducts, archiveProduct } = useProducts();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

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
                  onClick={() => archiveProduct(product.id)}
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
  );
};

export default Inventario;
