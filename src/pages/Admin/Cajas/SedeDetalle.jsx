import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArrowLeft, FaUserPlus, FaUser, FaTimes, FaCheck,
  FaEdit, FaToggleOn, FaToggleOff, FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';
import { api } from '../../../lib/api';
import styles from './SedeDetalle.module.css';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const SedeDetalle = () => {
  const { sedeId }  = useParams();
  const navigate    = useNavigate();
  const now         = new Date();
  const [mes,  setMes]  = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());

  const [sede,      setSede]      = useState(null);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null);
  const [nombre,    setNombre]    = useState('');
  const [saving,    setSaving]    = useState(false);

  const loadSede = useCallback(async () => {
    const data = await api.get(`/sedes/${sedeId}`);
    setSede(data);
  }, [sedeId]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/sedes/${sedeId}/stats?mes=${mes}&anio=${anio}`);
      setStats(data);
    } finally { setLoading(false); }
  }, [sedeId, mes, anio]);

  useEffect(() => { loadSede(); }, [loadSede]);
  useEffect(() => { loadStats(); }, [loadStats]);

  const prevMes = () => { if (mes === 1) { setMes(12); setAnio(a => a - 1); } else setMes(m => m - 1); };
  const nextMes = () => {
    const isCurrentMonth = mes === now.getMonth() + 1 && anio === now.getFullYear();
    if (isCurrentMonth) return;
    if (mes === 12) { setMes(1); setAnio(a => a + 1); } else setMes(m => m + 1);
  };

  const handleSaveVendedor = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    try {
      if (modal === 'create') {
        const v = await api.post('/vendedores', { nombre: nombre.trim(), sedeId: Number(sedeId) });
        setSede(prev => ({ ...prev, vendedores: [...(prev.vendedores || []), v] }));
      } else {
        const v = await api.patch(`/vendedores/${modal.id}`, { nombre: nombre.trim() });
        setSede(prev => ({ ...prev, vendedores: prev.vendedores.map(x => x.id === v.id ? v : x) }));
      }
      setModal(null);
    } finally { setSaving(false); }
  };

  const toggleVendedor = async (v) => {
    await api.patch(`/vendedores/${v.id}`, { activo: !v.activo });
    setSede(prev => ({ ...prev, vendedores: prev.vendedores.map(x => x.id === v.id ? { ...x, activo: !x.activo } : x) }));
  };

  if (!sede) return <div className={styles.loading}>Cargando…</div>;

  const isCurrentMonth = mes === now.getMonth() + 1 && anio === now.getFullYear();

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <button className={styles.btnBack} onClick={() => navigate('/admin/cajas')}>
          <FaArrowLeft size={13} /> Volver
        </button>
        <div>
          <h2 className={styles.pageTitle}>{sede.nombre}</h2>
          {sede.direccion && <p className={styles.pageSub}>{sede.direccion}</p>}
        </div>
        <button className={styles.btnAdd} onClick={() => { setNombre(''); setModal('create'); }}>
          <FaUserPlus size={14} /> Agregar vendedor
        </button>
      </div>

      {/* Selector de mes */}
      <div className={styles.mesSelector}>
        <button className={styles.mesBtn} onClick={prevMes}><FaChevronLeft size={12} /></button>
        <span className={styles.mesLabel}>{MONTHS[mes - 1]} {anio}</span>
        <button className={styles.mesBtn} onClick={nextMes} disabled={isCurrentMonth}><FaChevronRight size={12} /></button>
      </div>

      {/* Stats globales del mes */}
      {!loading && stats && (
        <div className={styles.kpiRow}>
          <div className={styles.kpi}>
            <span className={styles.kpiVal}>{stats.totalVentas}</span>
            <span className={styles.kpiLbl}>Ventas del mes</span>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiVal}>${Number(stats.totalIngresos).toLocaleString()}</span>
            <span className={styles.kpiLbl}>Ingresos del mes</span>
          </div>
          <div className={styles.kpi}>
            <span className={styles.kpiVal}>{sede.vendedores?.filter(v => v.activo).length ?? 0}</span>
            <span className={styles.kpiLbl}>Vendedores activos</span>
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {/* Vendedores */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Vendedores</h3>
          {!sede.vendedores?.length ? (
            <p className={styles.empty}>No hay vendedores en esta sede.</p>
          ) : (
            <div className={styles.vendedorList}>
              {sede.vendedores.map(v => {
                const vStats = stats?.vendedores?.find(x => x.id === v.id);
                return (
                  <motion.div key={v.id} className={`${styles.vendedorRow} ${!v.activo ? styles.vendedorInactivo : ''}`}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                    <div className={styles.vendedorIcon}><FaUser size={14} /></div>
                    <div className={styles.vendedorInfo}>
                      <span className={styles.vendedorNombre}>{v.nombre}</span>
                      <span className={styles.vendedorStats}>
                        {vStats ? `${vStats.ventas} ventas · $${Number(vStats.total).toLocaleString()} · Comisión: $${Number(vStats.comision).toFixed(2)}` : 'Sin ventas este mes'}
                      </span>
                    </div>
                    <div className={styles.vendedorActions}>
                      <button className={styles.iconBtn} onClick={() => { setNombre(v.nombre); setModal(v); }} title="Editar">
                        <FaEdit size={13} />
                      </button>
                      <button className={styles.iconBtn} onClick={() => toggleVendedor(v)} title={v.activo ? 'Desactivar' : 'Activar'}>
                        {v.activo ? <FaToggleOn size={17} className={styles.toggleOn} /> : <FaToggleOff size={17} className={styles.toggleOff} />}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Comisiones del mes */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Comisiones — {MONTHS[mes - 1]} {anio}</h3>
          {loading ? (
            <div className={styles.loadingRows}>
              {[...Array(3)].map((_, i) => <div key={i} className={styles.skeletonRow} />)}
            </div>
          ) : !stats?.vendedores?.length ? (
            <p className={styles.empty}>No hay ventas confirmadas este mes.</p>
          ) : (
            <div className={styles.comisionList}>
              {stats.vendedores.map(v => (
                <div key={v.id} className={styles.comisionRow}>
                  <div className={styles.comisionLeft}>
                    <span className={styles.comisionNombre}>{v.nombre}</span>
                    <span className={styles.comisionSub}>{v.ventas} ventas · ${Number(v.total).toLocaleString()}</span>
                  </div>
                  <div className={styles.comisionAmount}>
                    <span className={styles.comisionVal}>${Number(v.comision).toFixed(2)}</span>
                    <span className={styles.comisionLbl}>comisión</span>
                  </div>
                </div>
              ))}
              <div className={styles.comisionTotal}>
                <span>Total comisiones</span>
                <span>${stats.vendedores.reduce((s, v) => s + v.comision, 0).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal vendedor */}
      <AnimatePresence>
        {modal && (
          <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setModal(null)}>
            <motion.div className={styles.modal} initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }} transition={{ duration: 0.2 }} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>{modal === 'create' ? 'Nuevo vendedor' : 'Editar vendedor'}</h3>
                <button className={styles.modalClose} onClick={() => setModal(null)}><FaTimes size={14} /></button>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Nombre del vendedor</label>
                <input className={styles.input} placeholder="Nombre completo" value={nombre}
                  onChange={e => setNombre(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveVendedor()} />
              </div>
              <div className={styles.modalActions}>
                <button className={styles.btnCancel} onClick={() => setModal(null)}>Cancelar</button>
                <button className={styles.btnSave} onClick={handleSaveVendedor} disabled={!nombre.trim() || saving}>
                  <FaCheck size={12} /> {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SedeDetalle;
