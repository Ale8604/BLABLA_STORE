import { FaInstagram, FaWhatsapp, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import logo from '../../../assets/logo.png';
import styles from './Footer.module.css';

const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER;

const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.inner}>

      <div className={styles.socials}>
        <a
          href="https://www.instagram.com/blablastore.ve?igsh=MWJ3aTAyMXUycmptbA=="
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={styles.iconBtn}
          aria-label="Instagram"
        >
          <FaInstagram size={20} />
        </a>
        <a
          href="mailto:contacto@blablastore.com"
          className={styles.iconBtn}
          aria-label="Email"
        >
          <FaEnvelope size={20} />
        </a>
        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={styles.iconBtn}
          aria-label="WhatsApp"
        >
          <FaWhatsapp size={20} />
        </a>
      </div>

      <div className={styles.logoWrapper}>
        <img src={logo} alt="BlaBla Store" className={styles.logo} />
      </div>

      <div className={styles.address}>
        <div className={styles.iconBtn} style={{ flexShrink: 0 }}>
          <FaMapMarkerAlt size={18} />
        </div>
        <p>
          Calle 137, Centro Comercial Monte Bianco,<br />
          PB local 19, Valencia 2001, Carabobo.
        </p>
      </div>

    </div>
  </footer>
);

export default Footer;
