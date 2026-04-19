import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaIdCard, FaPhone, FaMapMarkerAlt, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../../components/context/AuthContext';
import logo from '../../assets/logo.png';
import styles from './RegisterPage.module.css';

const Field = ({ icon: Icon, children }) => (
  <div className={styles.field}>
    <Icon className={styles.fieldIcon} size={14} />
    {children}
  </div>
);

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const EMPTY = { nombre: '', apellido: '', cedula: '', telefono: '', direccion: '', email: '', password: '' };
  const [form, setForm]         = useState(EMPTY);
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear la cuenta');
      localStorage.setItem('token', data.token);
      await login(form.email, form.password);
      setForm(EMPTY);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <AnimatePresence>
        {success && (
          <motion.div
            className={styles.successOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className={styles.successCard}
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
              <FaCheckCircle size={52} className={styles.successIcon} />
              <h2 className={styles.successTitle}>¡Cuenta creada!</h2>
              <p className={styles.successText}>Tu registro fue exitoso. Ya podés realizar pedidos en BlaBla Store.</p>
              <button className={styles.successBtn} onClick={() => navigate('/')}>
                Ir a realizar pedido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        <Link to="/"><img src={logo} alt="BlaBla Store" className={styles.logo} /></Link>

        <h1 className={styles.title}>Crear cuenta</h1>
        <p className={styles.subtitle}>Completá tus datos para registrarte</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <Field icon={FaUser}>
              <input className={styles.input} placeholder="Nombre" value={form.nombre}   onChange={e => set('nombre', e.target.value)}   required />
            </Field>
            <Field icon={FaUser}>
              <input className={styles.input} placeholder="Apellido" value={form.apellido} onChange={e => set('apellido', e.target.value)} required />
            </Field>
          </div>

          <div className={styles.row}>
            <Field icon={FaIdCard}>
              <input className={styles.input} placeholder="Cédula" value={form.cedula}   onChange={e => set('cedula', e.target.value)}   required />
            </Field>
            <Field icon={FaPhone}>
              <input className={styles.input} placeholder="Teléfono" type="tel" value={form.telefono} onChange={e => set('telefono', e.target.value)} required />
            </Field>
          </div>

          <Field icon={FaMapMarkerAlt}>
            <input className={styles.input} placeholder="Dirección" value={form.direccion} onChange={e => set('direccion', e.target.value)} required />
          </Field>

          <Field icon={FaEnvelope}>
            <input className={styles.input} type="email" placeholder="Email" value={form.email} onChange={e => set('email', e.target.value)} required autoComplete="email" />
          </Field>

          <Field icon={FaLock}>
            <input
              className={styles.input}
              type={showPass ? 'text' : 'password'}
              placeholder="Contraseña"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
              autoComplete="new-password"
            />
            <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(p => !p)} tabIndex={-1}>
              {showPass ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
            </button>
          </Field>

          {error && (
            <motion.p className={styles.error} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {error}
            </motion.p>
          )}

          <div className={styles.actions}>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear usuario'}
            </button>
            <Link to="/" className={styles.cancelBtn}>Cancelar</Link>
          </div>
        </form>

        <p className={styles.loginLink}>
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
