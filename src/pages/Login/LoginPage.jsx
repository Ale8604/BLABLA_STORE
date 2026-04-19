import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../components/context/AuthContext';
import logo from '../../assets/logo.png';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const role = await login(email, password);
      navigate(role === 'ADMIN' ? '/admin/inventario' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        <Link to="/">
          <img src={logo} alt="BlaBla Store" className={styles.logo} />
        </Link>

        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.subtitle}>Ingresá tu cuenta para continuar</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <FaEnvelope className={styles.fieldIcon} size={14} />
            <input
              type="email"
              placeholder="Email"
              className={styles.input}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <FaLock className={styles.fieldIcon} size={14} />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Contraseña"
              className={styles.input}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPass(p => !p)}
              tabIndex={-1}
            >
              {showPass ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
            </button>
          </div>

          {error && (
            <motion.p
              className={styles.error}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className={styles.back}>
          <Link to="/olvide-contrasena">¿Olvidaste tu contraseña?</Link>
        </p>
        <p className={styles.back}>
          <Link to="/">← Volver a la tienda</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
