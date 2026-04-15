import Navbar from './components/layout/Navbar/navbar.jsx';
import Filtros from './components/filter/filter';
import styles from './App.module.css';
import ProductCard from './components/products/ProductCard/ProductCard';
import CardModal from './components/products/CardModal/CardModal';


// Ejemplo de data (puedes mover esto a un archivo JSON luego)
const dummyProducts = [
  { id: 1, name: 'Iphone 17 Pro Max', price: '1,300', monthly: '60,00', colors: ['#FF8A00', '#FFFFFF', '#1D2A4D'], image: '/src/assets/iphone.png' },
  { id: 2, name: 'Iphone 17 Pro Max', price: '1,300', monthly: '60,00', colors: ['#FF8A00', '#FFFFFF', '#1D2A4D'], image: '/src/assets/iphone.png' },
  { id: 3, name: 'Iphone 17 Pro Max', price: '1,300', monthly: '60,00', colors: ['#FF8A00', '#FFFFFF', '#1D2A4D'], image: '/src/assets/iphone.png' },
];

function App() {
  return (
    <div className={styles.appWrapper}>
      <Navbar />
      <CardModal />
      <main className={styles.content}>
        <h1 className={styles.mainTitle}>TELÉFONOS</h1>
        <div className={styles.storeLayout}>
          <Filtros />
          <section className={styles.productGrid}>
            {dummyProducts.map(prod => (
              <ProductCard key={prod.id} {...prod} />
            ))}
          </section>
        </div>
      </main>
      {/* El Footer irá aquí después */}
    </div>
  );
}

export default App;