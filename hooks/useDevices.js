// hooks/useDevices.js
import { useState, useEffect, useCallback } from 'react';
import { API_PATHS } from '../config/constants';

export default function useDevices(initialLoad = true, interval = null) {
  const [devicesData, setDevicesData] = useState([]);
  const [prevDevicesData, setPrevDevicesData] = useState([]); // Добавляем для отслеживания изменений
  const [changedParams, setChangedParams] = useState({}); // Для хранения изменившихся параметров
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Функция для обнаружения изменений
  const detectChanges = useCallback((newData, oldData) => {
    if (!oldData.length) return {};

    const changes = {};

    newData.forEach(newDevice => {
      const deviceId = newDevice.result.id;
      const oldDevice = oldData.find(d => d.result.id === deviceId);

      if (!oldDevice) return;

      // Сравниваем статусы
      if (newDevice.result.status && oldDevice.result.status) {
        const changedParams = {};
        let hasChanges = false;

        newDevice.result.status.forEach(newStatus => {
          const oldStatus = oldDevice.result.status.find(s => s.code === newStatus.code);
          if (oldStatus && JSON.stringify(newStatus.value) !== JSON.stringify(oldStatus.value)) {
            changedParams[newStatus.code] = { 
              new: newStatus.value, 
              old: oldStatus.value 
            };
            hasChanges = true;
          }
        });

        if (hasChanges) {
          changes[deviceId] = changedParams;
        }
      }
    });

    return changes;
  }, []);

  // Функция загрузки устройств с отслеживанием изменений
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
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Обнаруживаем изменения перед обновлением данных
      const changes = detectChanges(data, devicesData);
      setChangedParams(changes);

      // Сохраняем предыдущие данные перед обновлением
      setPrevDevicesData(devicesData);
      setDevicesData(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching devices:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [devicesData, detectChanges]);

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
    prevDevicesData,
    changedParams, // Экспортируем изменившиеся параметры
    loading,
    error,
    fetchDevices,
    setDevicesData
  };
}
