// components/DeviceCard.js
import { DEVICE_TYPES, DEVICE_IDS, PARAM_LABELS } from '../config/constants';

const getDeviceType = (deviceId) => {
  if (DEVICE_IDS.SOCKETS.includes(deviceId)) {
    return DEVICE_TYPES.SOCKET;
  } else if (deviceId === DEVICE_IDS.AIR_SENSOR) {
    return DEVICE_TYPES.AIR_SENSOR;
  }
  return DEVICE_TYPES.UNKNOWN;
};

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

  if (deviceType === DEVICE_TYPES.SOCKET) {
    const params = {
      power: statusMap.switch_1 ? "Включено" : "Выключено",
    };

    if (statusMap.cur_voltage) {
      params.voltage = `${Math.round(statusMap.cur_voltage / 10)} В`;
    }

    if (statusMap.cur_power && statusMap.cur_power > 0) {
      params.power_consumption = `${Math.round(statusMap.cur_power / 10)} Вт`;
    }

    if (statusMap.countdown_1 && statusMap.countdown_1 > 0) {
      params.timer = `${Math.round(statusMap.countdown_1 / 60)} мин`;
    }

    return params;
  } 
  else if (deviceType === DEVICE_TYPES.AIR_SENSOR) {
    const params = {};
    
    if (statusMap.va_temperature) {
      params.temperature = `${(statusMap.va_temperature / 10).toFixed(1)}°C`;
    }
    
    if (statusMap.va_humidity) {
      params.humidity = `${Math.round(statusMap.va_humidity / 10)}%`;
    }
    
    if (statusMap.co2_value && statusMap.co2_value >= 500) {
      params.co2 = `${Math.round(statusMap.co2_value)} ppm`;
    }
    
    if (statusMap.voc_value && statusMap.voc_value >= 10) {
      params.voc = `${(statusMap.voc_value / 100).toFixed(2)} ppm`;
    }
    
    if (statusMap.ch2o_value && statusMap.ch2o_value >= 10) {
      params.ch2o = `${(statusMap.ch2o_value / 100).toFixed(2)} м.д`;
    }
    
    return params;
  }
  
  return null;
};

export default function DeviceCard({ device, simplified = false }) {
  const { result } = device;
  const { id, name, online, icon } = result;
  const deviceType = getDeviceType(id);
  const fullIconUrl = icon ? `https://images.tuyaus.com/${icon}` : null;
  const params = getDeviceParams(device);

  return (
    <div className={`device-card ${online ? "online" : "offline"} ${deviceType}`}>
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
                {PARAM_LABELS[key] || key}
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

      <style jsx>{`
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
        
        /* Специальные стили для разных типов устройств */
        .device-card.socket {
          border-left: 4px solid #2196f3;
        }
        .device-card.airSensor {
          border-left: 4px solid #9c27b0;
        }
        
        /* Мобильная адаптация */
        @media (max-width: 768px) {
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
      `}</style>
    </div>
  );
}

// Экспортируем вспомогательные функции для использования в других местах
export { getDeviceType, getDeviceParams };