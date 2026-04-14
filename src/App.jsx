import Navbar from './components/layout/Navbar/Navbar';
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.appContainer}>
      <Navbar />
      
      <main className={styles.mainContent}>
        <h1 className={styles.title}>TELÉFONOS</h1>
        {/* Aquí conectaremos el resto de los componentes */}
      </main>
    </div>
  );
}

export default App;