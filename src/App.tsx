import Navbar from './components/layout/Navbar';
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.appContainer}>
      <Navbar />
      
      <main className={styles.main}>
        <h1 className={styles.title}>TELÉFONOS</h1>
        {/* Aquí es donde "uniremos" los productos después */}
      </main>

      {/* El Footer lo crearemos luego */}
    </div>
  );
}

export default App;