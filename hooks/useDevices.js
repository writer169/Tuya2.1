// hooks/useDevices.js
import { useState, useEffect, useCallback } from 'react';
import { API_PATHS } from '../config/constants';

// Define your priority device ID
const PRIORITY_DEVICE_ID = "bf496ddae64215bd93p0qr";

export default function useDevices(initialLoad = true, interval = null) {
  const [devicesData, setDevicesData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDevices = useCallback(async (deviceId = null) => {
    try {
      setLoading(true);
      const url = deviceId 
        ? `${API_PATHS.DEVICE}?deviceId=${deviceId}` 
        : API_PATHS.DEVICE;
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      
      let data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Sort devices to ensure the priority device is first
      if (Array.isArray(data) && data.length > 1) {
        data = data.sort((a, b) => {
          if (a.result?.id === PRIORITY_DEVICE_ID) return -1;
          if (b.result?.id === PRIORITY_DEVICE_ID) return 1;
          return 0;
        });
      }
      
      setDevicesData(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching devices:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialLoad) {
      fetchDevices();
    }

    // Если указан интервал, настраиваем автообновление
    let intervalId;
    if (interval) {
      intervalId = setInterval(fetchDevices, interval);
    }

    // Очистка интервала при размонтировании
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchDevices, initialLoad, interval]);

  return {
    devicesData,
    loading,
    error,
    fetchDevices,
    setDevicesData
  };
}
