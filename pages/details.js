// pages/details.js
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Layout from "../components/Layout";

const PRIORITY_DEVICE_ID = "bf496ddae64215bd93p0qr";

function formatValue(key, value) {
  if (["create_time", "update_time", "active_time"].includes(key)) {
    return new Date(value * 1000).toLocaleString("ru-RU");
  }
  if (key === "online") {
    return value ? "В сети" : "Не в сети";
  }
  return value;
}

export default function Details() {
  const { data: session } = useSession({ required: true });
  const [devicesData, setDevicesData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDevices() {
      try {
        const res = await fetch("/api/device");
        let data = await res.json();
        
        // Сортируем устройства так, чтобы приоритетное устройство было первым
        data = data.sort((a, b) => {
          if (a.result?.id === PRIORITY_DEVICE_ID) return -1;
          if (b.result?.id === PRIORITY_DEVICE_ID) return 1;
          return 0;
        });
        
        setDevicesData(data);
      } catch (error) {
        setError(error.message);
      }
    }
    fetchDevices();
  }, []);

  if (error) {
    return (
      <Layout>
        <div className="container">
          <h1>Ошибка</h1>
          <p>{error}</p>
          <style jsx>{`
            .container {
              padding: 1rem;
              color: red;
            }
          `}</style>
        </div>
      </Layout>
    );
  }

  if (devicesData.length === 0) {
    return <Layout><div className="container">Загрузка...</div></Layout>;
  }

  return (
    <Layout>
      <div className="container">
        <div className="devicesContainer">
          {devicesData.map((deviceData, index) => {
            const { result, success, t, tid } = deviceData;
            const { status, icon, ...otherFields } = result;
            const fullIconUrl = icon ? `https://images.tuyaus.com/${icon}` : null;
            const onlineStatus = otherFields.online;

            return (
              <div key={index} className="card">
                <h1 className="deviceName">{otherFields.name}</h1>
                {fullIconUrl && (
                  <div className="iconWrapper">
                    <img src={fullIconUrl} alt={otherFields.name} className="deviceIcon" />
                  </div>
                )}
                <div className={`onlineStatus ${onlineStatus ? "online" : "offline"}`}>
                  {onlineStatus ? "В сети" : "Не в сети"}
                </div>

                <h2>Статусы</h2>
                {status && status.length > 0 ? (
                  <table className="dataTable">
                    <thead>
                      <tr>
                        <th>Код</th>
                        <th>Значение</th>
                      </tr>
                    </thead>
                    <tbody>
                      {status.map((item, index) => (
                        <tr key={index}>
                          <td>{item.code}</td>
                          <td>{String(item.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>Нет статусов</p>
                )}

                <h2>Основная информация</h2>
                <table className="dataTable">
                  <tbody>
                    {Object.entries(otherFields).map(([key, value]) => (
                      <tr key={key}>
                        <td className="label">{key}</td>
                        <td>{formatValue(key, value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h2>Дополнительная информация</h2>
                <table className="dataTable">
                  <tbody>
                    <tr>
                      <td className="label">Успешность запроса</td>
                      <td>{success ? "Да" : "Нет"}</td>
                    </tr>
                    <tr>
                      <td className="label">Время (t)</td>
                      <td>{new Date(t).toLocaleString("ru-RU")}</td>
                    </tr>
                    <tr>
                      <td className="label">TID</td>
                      <td>{tid}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        <style jsx>{`
          .container {
            padding: 0.5rem;
            background-color: #f4f4f9;
            min-height: 100vh;
          }
          .devicesContainer {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            flex-wrap: wrap;
          }
          .card {
            flex: 1;
            max-width: 48%;
            background: #fff;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
          }
          .deviceName {
            text-align: center;
            margin-bottom: 0.5rem;
            color: #333;
          }
          .iconWrapper {
            text-align: center;
            margin-bottom: 0.5rem;
          }
          .deviceIcon {
            max-width: 150px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .onlineStatus {
            text-align: center;
            font-size: 1.2rem;
            font-weight: bold;
            padding: 0.5rem;
            margin-bottom: 1rem;
            border-radius: 4px;
            color: #fff;
          }
          .onlineStatus.online {
            background-color: #4caf50;
          }
          .onlineStatus.offline {
            background-color: #f44336;
          }
          h2 {
            margin-top: 1rem;
            margin-bottom: 0.5rem;
            border-bottom: 2px solid #e2e2e2;
            padding-bottom: 0.3rem;
            color: #555;
          }
          .dataTable {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1rem;
            table-layout: fixed;
            word-wrap: break-word;
          }
          .dataTable th,
          .dataTable td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          .dataTable th {
            background-color: #f0f0f0;
            color: #333;
          }
          .label {
            font-weight: bold;
            background-color: #f8f8f8;
            text-transform: capitalize;
            width: 30%;
          }
          @media (max-width: 600px) {
            .card {
              max-width: 100%;
              margin: 0.5rem 0;
            }
            .dataTable th,
            .dataTable td {
              padding: 4px;
            }
            .onlineStatus {
              font-size: 1rem;
              padding: 0.4rem;
            }
          }
        `}</style>
      </div>
    </Layout>
  );
}
