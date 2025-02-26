// pages/index.js
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Layout from "../components/Layout";

// Список ID розеток
const SOCKET_IDS = ["bf86db6ccc98ec3f63ac0d", "bfcb457736e5303fe8ao1u", "bf014aa7c8cd67fc7fq7ck"];
// ID датчика воздуха
const AIR_SENSOR_ID = "bf496ddae64215bd93p0qr";

export default function Home() {
  const { data: session } = useSession({ required: true });
  const [devicesData, setDevicesData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Функция для загрузки данных устройств
  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/device");
      const data = await res.json();
      setDevicesData(data);
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Загружаем данные только при первой загрузке
    fetchDevices();
  }, []);

  // Функция для определения типа устройства
  const getDeviceType = (deviceId) => {
    if (SOCKET_IDS.includes(deviceId)) {
      return "socket";
    } else if (deviceId === AIR_SENSOR_ID) {
      return "airSensor";
    }
    return "unknown";
  };

  // Функция для получения параметров устройства
  const getDeviceParams = (device) => {
    if (!device || !device.result || !device.result.online) {
      return null;
    }

    const { id, status } = device.result;
    const deviceType = getDeviceType(id);
    
    // Преобразуем статусы в объект для удобства доступа
    const statusMap = status.reduce((acc, item) => {
      acc[item.code] = item.value;
      return acc;
    }, {});

    if (deviceType === "socket") {
      const params = {
        power: statusMap.switch_1 ? "Включено" : "Выключено",
      };

      // Добавляем напряжение, если оно есть
      if (statusMap.cur_voltage) {
        params.voltage = `${Math.round(statusMap.cur_voltage / 10)} В`;
      }

      // Добавляем мощность, если она больше 0
      if (statusMap.cur_power && statusMap.cur_power > 0) {
        params.power_consumption = `${Math.round(statusMap.cur_power / 10)} Вт`;
      }

      // Добавляем таймер, если он больше 0
      if (statusMap.countdown_1 && statusMap.countdown_1 > 0) {
        params.timer = `${Math.round(statusMap.countdown_1 / 60)} мин`;
      }

      return params;
    } 
    else if (deviceType === "airSensor") {
      const params = {};
      
      // Температура
      if (statusMap.va_temperature) {
        params.temperature = `${(statusMap.va_temperature / 10).toFixed(1)}°C`;
      }
      
      // Влажность
      if (statusMap.va_humidity) {
        params.humidity = `${Math.round(statusMap.va_humidity / 10)}%`;
      }
      
      // CO2, если больше 500 ppm
      if (statusMap.co2_value && statusMap.co2_value >= 500) {
        params.co2 = `${Math.round(statusMap.co2_value)} ppm`;
      }
      
      // ЛОС, если больше 0.1 ppm
      if (statusMap.voc_value && statusMap.voc_value >= 10) {
        params.voc = `${(statusMap.voc_value / 100).toFixed(2)} ppm`;
      }
      
      // Формальдегид, если больше 0.1 м.д
      if (statusMap.ch2o_value && statusMap.ch2o_value >= 10) {
        params.ch2o = `${(statusMap.ch2o_value / 100).toFixed(2)} м.д`;
      }
      
      return params;
    }
    
    return null;
  };

  if (error) {
    return (
      <Layout>
        <div className="container">
          <h1>Ошибка</h1>
          <p>{error}</p>
          <button onClick={fetchDevices} className="refresh-button">
            Повторить попытку
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container">
        <div className="header-container">
          <h1 className="page-title">Tuya Dashboard</h1>
          <button 
            onClick={fetchDevices} 
            className="refresh-button"
            disabled={loading}
          >
            {loading ? "Обновление..." : "Обновить данные"}
          </button>
        </div>
        
        {loading ? (
          <div className="loading">Загрузка данных...</div>
        ) : (
          <div className="devices-grid">
            {devicesData.map((device, index) => {
              const { result } = device;
              const { id, name, online, icon } = result;
              const deviceType = getDeviceType(id);
              const fullIconUrl = icon ? `https://images.tuyaus.com/${icon}` : null;
              const params = getDeviceParams(device);

              return (
                <div 
                  key={index} 
                  className={`device-card ${online ? "online" : "offline"} ${deviceType}`}
                >
                  <div className="device-header">
                    <h2 className="device-name">{name}</h2>
                    <div className={`status-indicator ${online ? "online" : "offline"}`}>
                      {online ? "В сети" : "Не в сети"}
                    </div>
                  </div>
                  
                  {fullIconUrl && (
                    <div className="device-icon-wrapper">
                      <img src={fullIconUrl} alt={name} className="device-icon" />
                    </div>
                  )}
                  
                  {online && params && (
                    <div className="device-params">
                      {Object.entries(params).map(([key, value]) => (
                        <div key={key} className="param-row">
                          <span className="param-name">
                            {key === "power" ? "Состояние" : 
                             key === "voltage" ? "Напряжение" : 
                             key === "power_consumption" ? "Мощность" : 
                             key === "timer" ? "Таймер" : 
                             key === "temperature" ? "Температура" : 
                             key === "humidity" ? "Влажность" : 
                             key === "co2" ? "CO₂" : 
                             key === "voc" ? "ЛОС" : 
                             key === "ch2o" ? "Формальдегид" : 
                             key}
                          </span>
                          <span className={`param-value ${key === "power" ? (value === "Включено" ? "on" : "off") : ""}`}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!online && (
                    <div className="offline-message">
                      Устройство не в сети
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .container {
          padding: 1rem;
          background-color: #f4f4f9;
          min-height: calc(100vh - 80px);
          width: 100%;
          max-width: 100%;
        }
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          width: 100%;
        }
        .page-title {
          margin: 0;
          color: #333;
        }
        .refresh-button {
          background-color: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.5rem 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.3s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .refresh-button:hover {
          background-color: #1976d2;
        }
        .refresh-button:disabled {
          background-color: #90caf9;
          cursor: not-allowed;
        }
        .devices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          width: 100%;
        }
        .device-card {
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          padding: 1.2rem;
          transition: transform 0.3s, box-shadow 0.3s;
          width: 100%;
        }
        .device-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        .device-card.offline {
          opacity: 0.7;
        }
        .device-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          width: 100%;
        }
        .device-name {
          font-size: 1.2rem;
          margin: 0;
          color: #333;
        }
        .status-indicator {
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: bold;
        }
        .status-indicator.online {
          background-color: #4caf50;
          color: white;
        }
        .status-indicator.offline {
          background-color: #f44336;
          color: white;
        }
        .device-icon-wrapper {
          text-align: center;
          margin-bottom: 1rem;
        }
        .device-icon {
          max-width: 80px;
          max-height: 80px;
          border-radius: 8px;
        }
        .device-params {
          margin-top: 1rem;
          width: 100%;
        }
        .param-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #eee;
          width: 100%;
        }
        .param-row:last-child {
          border-bottom: none;
        }
        .param-name {
          font-weight: 500;
          color: #555;
        }
        .param-value {
          font-weight: bold;
          color: #333;
        }
        .param-value.on {
          color: #4caf50;
        }
        .param-value.off {
          color: #f44336;
        }
        .offline-message {
          text-align: center;
          padding: 1.5rem 0;
          color: #888;
          font-style: italic;
        }
        .loading {
          text-align: center;
          padding: 2rem;
          font-size: 1.2rem;
          color: #555;
        }
        
        /* Специальные стили для разных типов устройств */
        .device-card.socket {
          border-left: 4px solid #2196f3;
        }
        .device-card.airSensor {
          border-left: 4px solid #9c27b0;
        }
        
        /* Мобильная адаптация */
        @media (max-width: 768px) {
          .container {
            padding: 0.5rem;
          }
          .header-container {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .page-title {
            font-size: 1.5rem;
            text-align: center;
          }
          .refresh-button {
            width: 100%;
            padding: 0.7rem;
          }
          .devices-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .device-card {
            padding: 1rem;
            margin: 0;
            max-width: 100%;
            width: 100%;
          }
          .device-name {
            font-size: 1rem;
          }
          .status-indicator {
            padding: 0.2rem 0.4rem;
            font-size: 0.7rem;
          }
          .device-icon {
            max-width: 60px;
            max-height: 60px;
          }
        }
        
        /* Промежуточный размер для планшетов */
        @media (min-width: 769px) and (max-width: 1024px) {
          .devices-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }
          .container {
            padding: 0.75rem;
          }
        }
      `}</style>
    </Layout>
  );
          }
