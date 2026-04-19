import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUser, FaIdCard, FaPhone, FaMapMarkerAlt,
  FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheckCircle,
} from 'react-icons/fa';
import logo from '../../assets/logo.png';
import styles from './ForgotPasswordPage.module.css';

const Field = ({ icon: Icon, children }) => (
  <div className={styles.field}>
    <Icon className={styles.fieldIcon} size={14} />
    {children}
  </div>
);

const STEP_EMAIL = 'email';
const STEP_FORM  = 'form';
const STEP_DONE  = 'done';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const [step, setStep]         = useState(STEP_EMAIL);
  const [emailInput, setEmail]  = useState('');
  const [userData, setUserData] = useState(null);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // Paso 1 — buscar cuenta por email
  const handleFind = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:3001/api/auth/find-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUserData(data);
      setStep(STEP_FORM);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Paso 2 — actualizar contraseña
  const handleReset = async (e) => {
    e.preventDefault();
    if (!password) return setError('Ingresá tu nueva contraseña');
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userData.email, cedula: userData.cedula, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep(STEP_DONE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Modal de éxito */}
      <AnimatePresence>
        {step === STEP_DONE && (
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
              <h2 className={styles.successTitle}>¡Datos actualizados!</h2>
              <p className={styles.successText}>
                Tu contraseña fue cambiada correctamente. Ya podés iniciar sesión con tu nueva contraseña.
              </p>
              <button className={styles.successBtn} onClick={() => navigate('/login')}>
                Ir a iniciar sesión
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

        <h1 className={styles.title}>Olvidé mi contraseña</h1>

        {/* ── Paso 1: email ── */}
        {step === STEP_EMAIL && (
          <>
            <p className={styles.subtitle}>Ingresá tu correo para encontrar tu cuenta</p>
            <form className={styles.form} onSubmit={handleFind}>
              <Field icon={FaEnvelope}>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="Correo electrónico"
                  value={emailInput}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </Field>

              {error && (
                <motion.p className={styles.error} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {error}
                </motion.p>
              )}

              <div className={styles.actions}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'Buscando...' : 'Buscar cuenta'}
                </button>
                <Link to="/login" className={styles.cancelBtn}>Cancelar</Link>
              </div>
            </form>
          </>
        )}

        {/* ── Paso 2: formulario pre-relleno ── */}
        {step === STEP_FORM && userData && (
          <>
            <p className={styles.subtitle}>Actualizá tu contraseña</p>
            <form className={styles.form} onSubmit={handleReset}>
              <div className={styles.row}>
                <Field icon={FaUser}>
                  <input className={styles.input} value={userData.nombre || ''} readOnly />
                </Field>
                <Field icon={FaUser}>
                  <input className={styles.input} value={userData.apellido || ''} readOnly />
                </Field>
              </div>

              <div className={styles.row}>
                <Field icon={FaIdCard}>
                  <input className={styles.input} value={userData.cedula || ''} readOnly />
                </Field>
                <Field icon={FaPhone}>
                  <input className={styles.input} value={userData.telefono || ''} readOnly />
                </Field>
              </div>

              <Field icon={FaMapMarkerAlt}>
                <input className={styles.input} value={userData.direccion || ''} readOnly />
              </Field>

              <Field icon={FaEnvelope}>
                <input className={styles.input} value={userData.email} readOnly />
              </Field>

              <Field icon={FaLock}>
                <input
                  className={styles.input}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Ingresá tu nueva contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
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
                  {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
                <button type="button" className={styles.cancelBtn} onClick={() => { setStep(STEP_EMAIL); setError(''); }}>
                  Volver
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
