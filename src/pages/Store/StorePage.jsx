import { useState, useMemo } from 'react';
import Navbar from '../../components/layout/Navbar/navbar.jsx';
import Footer from '../../components/layout/Footer/Footer.jsx';
import Filtros from '../../components/filter/filter';
import styles from './StorePage.module.css';
import ProductCard from '../../components/products/ProductCard/ProductCard';
import CardModal from '../../components/products/CardModal/CardModal';
import { useProducts } from '../../components/context/ProductsContext';

const ALL_BRANDS     = ['Iphone', 'Redmi', 'Samsung'];
const ALL_CONDITIONS = ['Nuevo', 'Usado'];

function StorePage() {
  const { activeProducts } = useProducts();

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

  const filteredProducts = useMemo(() => {
    return activeProducts.filter(p => {
      const min = minPrice === '' ? 0 : Number(minPrice);
      const max = maxPrice === '' ? Infinity : Number(maxPrice);
      if (p.price < min || p.price > max) return false;
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
      if (selectedConditions.length > 0 && !selectedConditions.includes(p.condition)) return false;
      return true;
    });
  }, [activeProducts, minPrice, maxPrice, selectedBrands, selectedConditions]);

  return (
    <div className={styles.appWrapper}>
      <Navbar />
      <CardModal />
      <main className={styles.content}>
        <h1 className={styles.mainTitle}>TELÉFONOS</h1>
        <div className={styles.storeLayout}>
          <Filtros
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPrice={setMinPrice}
            onMaxPrice={setMaxPrice}
            allBrands={ALL_BRANDS}
            selectedBrands={selectedBrands}
            onToggleBrand={toggleBrand}
            allConditions={ALL_CONDITIONS}
            selectedConditions={selectedConditions}
            onToggleCondition={toggleCondition}
          />
          <section className={styles.productGrid}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(prod => (
                <ProductCard key={prod.id} {...prod} price={prod.price.toLocaleString()} />
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No hay productos que coincidan con los filtros.</p>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default StorePage;
