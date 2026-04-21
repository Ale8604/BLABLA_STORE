import { useRef } from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaInstagram, FaShieldAlt, FaTruck, FaHeadset } from 'react-icons/fa';
import Navbar from '../../components/layout/Navbar/navbar';
import Footer from '../../components/layout/Footer/Footer';
import CardModal from '../../components/products/CardModal/CardModal';
import UbicacionesSection from '../../components/UbicacionesSection/UbicacionesSection';
import styles from './NosotrosPage.module.css';

const VALORES = [
  { icon: <FaShieldAlt size={28} />, title: 'Garantía real', desc: 'Todos nuestros productos cuentan con garantía oficial y soporte posventa.' },
  { icon: <FaTruck size={28} />,     title: 'Envíos rápidos', desc: 'Coordinamos la entrega de forma ágil para que recibas tu pedido sin demoras.' },
  { icon: <FaHeadset size={28} />,   title: 'Atención personalizada', desc: 'Te asesoramos por WhatsApp en todo momento, antes y después de tu compra.' },
];

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay },
});

const ValorCard = ({ v, delay }) => {
  const ref = useRef(null);

  const onMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width  / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -7;
    const rotY = ((x - cx) / cx) *  7;
    ref.current.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;
  };

  const onMouseLeave = () => {
    ref.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
  };

  return (
    <motion.div {...fade(delay)} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
      <div
        ref={ref}
        className={styles.valorCard}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <div className={styles.valorIcon}>{v.icon}</div>
        <h3 className={styles.valorTitle}>{v.title}</h3>
        <p className={styles.valorDesc}>{v.desc}</p>
        <div className={styles.valorShine} />
      </div>
    </motion.div>
  );
};

const NosotrosPage = () => (
  <div className={styles.page}>
    <Navbar />
    <CardModal />
    <main className={styles.main}>

      <motion.section className={styles.hero} {...fade(0)}>
        <span className={styles.tag}>Acerca de nosotros</span>
        <h1 className={styles.heroTitle}>Tecnología de calidad,<br />al alcance de todos</h1>
        <p className={styles.heroSub}>
          BlaBla Store nació con una misión clara: hacer que la tecnología sea accesible, confiable
          y fácil de adquirir. Somos una tienda especializada en smartphones y accesorios,
          con atención directa y personalizada.
        </p>
      </motion.section>

      <section className={styles.valores}>
        {VALORES.map((v, i) => (
          <ValorCard key={i} v={v} delay={0.1 + i * 0.08} />
        ))}
      </section>

      <UbicacionesSection />

      <motion.section className={styles.contactSection} {...fade(0.3)}>
        <h2 className={styles.contactTitle}>¿Tenés alguna consulta?</h2>
        <p className={styles.contactSub}>Estamos disponibles para ayudarte en todo momento.</p>
        <div className={styles.contactBtns}>
          <a
            href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className={styles.btnWhatsapp}
          >
            <FaWhatsapp size={18} /> Escribinos por WhatsApp
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className={styles.btnInstagram}
          >
            <FaInstagram size={18} /> Seguinos en Instagram
          </a>
        </div>
      </motion.section>

    </main>
    <Footer />
  </div>
);

export default NosotrosPage;
