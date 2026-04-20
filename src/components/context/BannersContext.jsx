import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

const BannersContext = createContext();

export const BannersProvider = ({ children }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBanners = useCallback(async () => {
    try {
      const data = await api.get('/banners?all=true');
      setBanners(data);
    } catch (err) {
      console.error('loadBanners:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBanners(); }, [loadBanners]);

  const addBanner = async (banner) => {
    const created = await api.post('/banners', banner);
    setBanners(prev => [...prev, created]);
    return created;
  };

  const updateBanner = async (id, changes) => {
    const updated = await api.put(`/banners/${id}`, changes);
    setBanners(prev => prev.map(b => b.id === id ? updated : b));
    return updated;
  };

  const deleteBanner = async (id) => {
    await api.delete(`/banners/${id}`);
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  const activeBanners = banners.filter(b => b.active);

  return (
    <BannersContext.Provider value={{ banners, activeBanners, loading, addBanner, updateBanner, deleteBanner, loadBanners }}>
      {children}
    </BannersContext.Provider>
  );
};

export const useBanners = () => useContext(BannersContext);
