// pages/index.js
import { useSession } from "next-auth/react";
import Layout from "../components/Layout";
import DeviceCard from "../components/DeviceCard";
import useDevices from "../hooks/useDevices";
import { REFRESH_INTERVAL } from "../config/constants";

export default function Home() {
  const { data: session } = useSession({ required: true });
  const { devicesData, loading, error, fetchDevices } = useDevices(true);

  return (
    <Layout title="Tuya Dashboard">
      <div className="container">
        <div className="header-container">
          <button 
            onClick={() => fetchDevices()} 
            className="refresh-button"
            disabled={loading}
          >
            {loading ? "Обновление..." : "Обновить данные"}
          </button>
        </div>
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => fetchDevices()} className="refresh-button">
              Повторить попытку
            </button>
          </div>
        )}
        
        {loading && !devicesData.length ? (
          <div className="loading">Загрузка данных...</div>
        ) : (
          <div className="devices-grid">
            {devicesData.map((device, index) => (
              <DeviceCard key={device.result.id || index} device={device} />
            ))}
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
          justify-content: flex-end;
          align-items: center;
          margin-bottom: 1.5rem;
          width: 100%;
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
        .loading {
          text-align: center;
          padding: 2rem;
          font-size: 1.2rem;
          color: #555;
        }
        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          text-align: center;
        }
        
        /* Мобильная адаптация */
        @media (max-width: 768px) {
          .container {
            padding: 0.5rem;
          }
          .header-container {
            margin-bottom: 1rem;
          }
          .refresh-button {
            width: 100%;
            padding: 0.7rem;
          }
          .devices-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
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