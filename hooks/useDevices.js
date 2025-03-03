// hooks/useDevices.js
import { useState, useEffect, useCallback } from 'react';
import { API_PATHS } from '../config/constants';

export default function useDevices(initialLoad = true) {
  const [devicesData, setDevicesData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [changedParams, setChangedParams] = useState({});

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
      
      const data = await res.json();
      console.log("Fetched data:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      // Проверяем, является ли data массивом, если нет — пытаемся извлечь массив из data.devices
      const devicesArray = Array.isArray(data) ? data : (Array.isArray(data.devices) ? data.devices : []);

      setDevicesData(devicesArray);
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
  }, [fetchDevices, initialLoad]);

  return {
    devicesData,
    loading,
    error,
    fetchDevices,
    setDevicesData,
    changedParams,
    setChangedParams
  };
}