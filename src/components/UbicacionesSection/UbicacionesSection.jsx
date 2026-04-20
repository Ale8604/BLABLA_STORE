import { useRef } from 'react';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaMapMarkerAlt } from 'react-icons/fa';
import styles from './UbicacionesSection.module.css';

const LOCALES = [
  {
    nombre: 'BlaBla Store · Monte Bianco',
    direccion: 'C.C. Monte Bianco, PB Local 19\nCalle 137, Valencia 2001, Carabobo',
    whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER,
    mapSrc: 'https://maps.google.com/maps?q=Centro+Comercial+Monte+Bianco+Valencia+Carabobo+Venezuela&output=embed&z=16',
  },
  {
    nombre: 'BlaBla Store · Monte Bianco',
    direccion: 'C.C. Monte Bianco, PB Local 19\nCalle 137, Valencia 2001, Carabobo',
    whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER,
    mapSrc: 'https://maps.google.com/maps?q=Centro+Comercial+Monte+Bianco+Valencia+Carabobo+Venezuela&output=embed&z=16',
  },
  {
    nombre: 'BlaBla Store · Monte Bianco',
    direccion: 'C.C. Monte Bianco, PB Local 19\nCalle 137, Valencia 2001, Carabobo',
    whatsapp: import.meta.env.VITE_WHATSAPP_NUMBER,
    mapSrc: 'https://maps.google.com/maps?q=Centro+Comercial+Monte+Bianco+Valencia+Carabobo+Venezuela&output=embed&z=16',
  },
];

const TiltCard = ({ local, index }) => {
  const cardRef = useRef(null);

  const onMouseMove = (e) => {
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width  / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -7;
    const rotY = ((x - cx) / cx) *  7;
    card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.025)`;
  };

  const onMouseLeave = () => {
    cardRef.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)';
  };

  return (
    <motion.div
      className={styles.cardOuter}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
    >
      <div
        ref={cardRef}
        className={styles.card}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <div className={styles.mapWrapper}>
          <iframe
            title={local.nombre}
            src={local.mapSrc}
            className={styles.mapIframe}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className={styles.mapOverlay} />
        </div>

        <div className={styles.cardBody}>
          <div className={styles.cardTop}>
            <div className={styles.pinIcon}><FaMapMarkerAlt size={15} /></div>
            <div>
              <h3 className={styles.cardName}>{local.nombre}</h3>
              <p className={styles.cardAddress}>{local.direccion}</p>
            </div>
          </div>

          <a
            href={`https://wa.me/${local.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className={styles.waBtn}
          >
            <FaWhatsapp size={16} />
            Contactar por WhatsApp
          </a>
        </div>

        <div className={styles.shine} />
      </div>
    </motion.div>
  );
};

const UbicacionesSection = () => (
  <section className={styles.section}>
    <motion.div
      className={styles.header}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <span className={styles.tag}>Dónde encontrarnos</span>
      <h2 className={styles.title}>Nuestras ubicaciones</h2>
      <p className={styles.sub}>Visitanos en nuestras tiendas físicas y conocé nuestros productos de cerca.</p>
    </motion.div>

    <div className={styles.grid}>
      {LOCALES.map((local, i) => (
        <TiltCard key={i} local={local} index={i} />
      ))}
    </div>
  </section>
);

export default UbicacionesSection;
