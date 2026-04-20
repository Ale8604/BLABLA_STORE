import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUserCircle, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa';
import Navbar from '../../components/layout/Navbar/navbar';
import Footer from '../../components/layout/Footer/Footer';
import CardModal from '../../components/products/CardModal/CardModal';
import { useAuth } from '../../components/context/AuthContext';
import { api } from '../../lib/api';
import styles from './PerfilPage.module.css';

const PerfilPage = () => {
  const { user, updateUser } = useAuth();

  const [nombre, setNombre]           = useState(user?.nombre || '');
  const [savingInfo, setSavingInfo]   = useState(false);
  const [infoOk, setInfoOk]           = useState(false);
  const [infoErr, setInfoErr]         = useState('');

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass]         = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [savingPass, setSavingPass]   = useState(false);
  const [passOk, setPassOk]           = useState(false);
  const [passErr, setPassErr]         = useState('');

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    setInfoErr('');
    setInfoOk(false);
    try {
      const updated = await api.patch('/auth/me', { nombre });
      updateUser(updated);
      setInfoOk(true);
      setTimeout(() => setInfoOk(false), 3000);
    } catch (err) {
      setInfoErr(err.message);
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePass = async (e) => {
    e.preventDefault();
    if (newPass.length < 6) { setPassErr('La contraseña debe tener al menos 6 caracteres.'); return; }
    setSavingPass(true);
    setPassErr('');
    setPassOk(false);
    try {
      await api.patch('/auth/me/password', { currentPassword: currentPass, newPassword: newPass });
      setPassOk(true);
      setCurrentPass('');
      setNewPass('');
      setTimeout(() => setPassOk(false), 3000);
    } catch (err) {
      setPassErr(err.message);
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <CardModal />
      <main className={styles.main}>

        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className={styles.avatarCircle}>
            <FaUserCircle size={52} />
          </div>
          <div>
            <h1 className={styles.headerName}>{user?.nombre || 'Mi cuenta'}</h1>
            <p className={styles.headerEmail}>{user?.email}</p>
          </div>
        </motion.div>

        <div className={styles.grid}>

          {/* ── Datos personales ── */}
          <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08, ease: [0.4, 0, 0.2, 1] }}
          >
            <h2 className={styles.cardTitle}>Datos personales</h2>
            <form className={styles.form} onSubmit={handleSaveInfo}>

              <div className={styles.field}>
                <FaUserCircle className={styles.fieldIcon} size={14} />
                <input
                  type="text"
                  placeholder="Nombre"
                  className={styles.input}
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className={styles.field}>
                <FaEnvelope className={styles.fieldIcon} size={14} />
                <input
                  type="email"
                  className={styles.input}
                  value={user?.email || ''}
                  disabled
                  title="El email no se puede cambiar"
                />
              </div>

              {infoErr && <p className={styles.error}>{infoErr}</p>}
              {infoOk  && (
                <p className={styles.success}><FaCheckCircle size={13} /> Datos actualizados</p>
              )}

              <button type="submit" className={styles.btn} disabled={savingInfo}>
                {savingInfo ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </motion.div>

          {/* ── Cambiar contraseña ── */}
          <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.14, ease: [0.4, 0, 0.2, 1] }}
          >
            <h2 className={styles.cardTitle}>Cambiar contraseña</h2>
            <form className={styles.form} onSubmit={handleChangePass}>

              <div className={styles.field}>
                <FaLock className={styles.fieldIcon} size={14} />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Contraseña actual"
                  className={styles.input}
                  value={currentPass}
                  onChange={e => setCurrentPass(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowCurrent(p => !p)} tabIndex={-1}>
                  {showCurrent ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>

              <div className={styles.field}>
                <FaLock className={styles.fieldIcon} size={14} />
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="Nueva contraseña"
                  className={styles.input}
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowNew(p => !p)} tabIndex={-1}>
                  {showNew ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>

              {passErr && <p className={styles.error}>{passErr}</p>}
              {passOk  && (
                <p className={styles.success}><FaCheckCircle size={13} /> Contraseña actualizada</p>
              )}

              <button type="submit" className={styles.btn} disabled={savingPass}>
                {savingPass ? 'Actualizando...' : 'Cambiar contraseña'}
              </button>
            </form>
          </motion.div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PerfilPage;
