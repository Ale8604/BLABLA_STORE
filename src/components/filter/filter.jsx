import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaCheck } from 'react-icons/fa';
import styles from './filter.module.css';

const collapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit:    { height: 0, opacity: 0 },
  transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
};

const FilterSection = ({ label, isOpen, onToggle, badge, children }) => (
  <div className={styles.filterGroup}>
    <button
      className={`${styles.filterHeader} ${isOpen ? styles.filterHeaderOpen : ''}`}
      onClick={onToggle}
    >
      <span className={styles.filterLabel}>
        {label}
        {badge > 0 && <span className={styles.badge}>{badge}</span>}
      </span>
      <motion.span
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={styles.chevron}
      >
        <FaChevronDown size={11} />
      </motion.span>
    </button>

    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          {...collapse}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const CustomCheckbox = ({ checked, onChange, label }) => (
  <label className={styles.checkLabel} onClick={onChange}>
    <span className={`${styles.checkBox} ${checked ? styles.checkBoxActive : ''}`}>
      <AnimatePresence>
        {checked && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <FaCheck size={8} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
    {label}
  </label>
);

const Filtros = ({
  minPrice, maxPrice, onMinPrice, onMaxPrice,
  allBrands, selectedBrands, onToggleBrand,
  allConditions, selectedConditions, onToggleCondition,
}) => {
  const [openPrice, setOpenPrice]       = useState(false);
  const [openBrands, setOpenBrands]     = useState(false);
  const [openCondition, setOpenCondition] = useState(false);

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.sidebarTitle}>Filtros</h2>

      <FilterSection
        label="Rango de precio"
        isOpen={openPrice}
        onToggle={() => setOpenPrice(p => !p)}
      >
        <div className={styles.priceInputs}>
          <div className={styles.priceField}>
            <span className={styles.pricePrefix}>$</span>
            <input
              type="number"
              placeholder="Mínimo"
              className={styles.priceInput}
              value={minPrice}
              onChange={e => onMinPrice(e.target.value)}
              min={0}
            />
          </div>
          <div className={styles.priceField}>
            <span className={styles.pricePrefix}>$</span>
            <input
              type="number"
              placeholder="Máximo"
              className={styles.priceInput}
              value={maxPrice}
              onChange={e => onMaxPrice(e.target.value)}
              min={0}
            />
          </div>
        </div>
      </FilterSection>

      <FilterSection
        label="Marcas"
        isOpen={openBrands}
        onToggle={() => setOpenBrands(p => !p)}
        badge={selectedBrands.length}
      >
        <div className={styles.checkList}>
          {allBrands.map(brand => (
            <CustomCheckbox
              key={brand}
              label={brand}
              checked={selectedBrands.includes(brand)}
              onChange={() => onToggleBrand(brand)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection
        label="Condición"
        isOpen={openCondition}
        onToggle={() => setOpenCondition(p => !p)}
        badge={selectedConditions.length}
      >
        <div className={styles.checkList}>
          {allConditions.map(cond => (
            <CustomCheckbox
              key={cond}
              label={cond}
              checked={selectedConditions.includes(cond)}
              onChange={() => onToggleCondition(cond)}
            />
          ))}
        </div>
      </FilterSection>
    </aside>
  );
};

export default Filtros;
