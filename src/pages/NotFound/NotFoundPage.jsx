import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/layout/Navbar/navbar';
import styles from './NotFoundPage.module.css';

const NotFoundPage = () => (
  <div className={styles.page}>
    <Navbar />
    <main className={styles.main}>
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <span className={styles.code}>404</span>
        <h1 className={styles.title}>Página no encontrada</h1>
        <p className={styles.sub}>La página que buscás no existe o fue movida.</p>
        <Link to="/" className={styles.btn}>Volver a la tienda</Link>
      </motion.div>
    </main>
  </div>
);

export default NotFoundPage;
