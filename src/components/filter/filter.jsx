import React from 'react';
import { FaChevronDown } from "react-icons/fa";
import styles from './filter.module.css';

const Filtros = () => {
  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.sidebarTitle}>Filtros</h2>
      
      <div className={styles.filterGroup}>
        <div className={styles.filterHeader}>
          <span>Rango de precio</span>
          <FaChevronDown size={12} />
        </div>
      </div>

      <div className={styles.filterGroup}>
        <div className={styles.filterHeader}>
          <span>Marcas</span>
          <FaChevronDown size={12} />
        </div>
      </div>

      <div className={styles.filterGroup}>
        <div className={styles.filterHeader}>
          <span>Condición</span>
          <FaChevronDown size={12} />
        </div>
      </div>
    </aside>
  );
};

export default Filtros;