// pages/api/device.js
import axios from "axios";
import crypto from "crypto";
import { getSession } from "next-auth/react";

const CLIENT_ID = process.env.TUYA_CLIENT_ID;
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET;
const API_ENDPOINT = "https://openapi.tuyaeu.com";

// Временное кеширование в памяти
// В production лучше использовать Redis или другое внешнее хранилище
let tokenCache = {
  token: "",
  expires: 0
};

let deviceDataCache = {
  data: [],
  timestamp: 0,
  ttl: 60000 // 1 минута кеширования данных устройств
};

function generateSign(method, path, body = "", token = "") {
  const timestamp = Date.now().toString();
  const contentHash = crypto.createHash("sha256").update(body).digest("hex");
  const stringToSign = `${method}\n${contentHash}\n\n${path}`;
  const signStr = CLIENT_ID + token + timestamp + stringToSign;

  return {
    sign: crypto
      .createHmac("sha256", CLIENT_SECRET)
      .update(signStr, "utf8")
      .digest("hex")
      .toUpperCase(),
    timestamp
  };
}

async function getAccessToken() {
  // Проверка валидности кешированного токена
  if (tokenCache.token && Date.now() < tokenCache.expires) {
    return tokenCache.token;
  }

  try {
    const path = "/v1.0/token?grant_type=1";
    const { sign, timestamp } = generateSign("GET", path);

    const response = await axios.get(`${API_ENDPOINT}${path}`, {
      headers: {
        "client_id": CLIENT_ID,
        "sign": sign,
        "t": timestamp,
        "sign_method": "HMAC-SHA256"
      }
    });

    if (!response.data || !response.data.success) {
      throw new Error(`Ошибка при получении токена: ${response.data?.msg || 'Неизвестная ошибка'}`);
    }

    // Обновляем кеш токена
    tokenCache = {
      token: response.data.result.access_token,
      expires: Date.now() + (response.data.result.expire_time * 1000) - 60000 // Вычитаем минуту для безопасности
    };
    
    return tokenCache.token;
  } catch (error) {
    console.error("Ошибка получения токена:", error);
    throw error; // Пробрасываем ошибку выше
  }
}

async function fetchDeviceData(deviceId, token) {
  const path = `/v1.0/devices/${deviceId}`;
  const { sign, timestamp } = generateSign("GET", path, "", token);
  
  try {
    const response = await axios.get(`${API_ENDPOINT}${path}`, {
      headers: {
        "client_id": CLIENT_ID,
        "access_token": token,
        "sign": sign,
        "t": timestamp,
        "sign_method": "HMAC-SHA256"
      }
    });
    
    if (!response.data || !response.data.success) {
      throw new Error(`Ошибка запроса устройства ${deviceId}: ${response.data?.msg || 'Неизвестная ошибка'}`);
    }
    
    return response.data;
  } catch (error) {
    console.error(`Ошибка запроса устройства ${deviceId}:`, error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Поддерживаем только GET-запросы
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Метод не поддерживается' });
  }
  
  try {
    // Проверяем авторизацию
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    // Параметры запроса
    const requestedDeviceId = req.query.deviceId;
    const forceRefresh = req.query.refresh === 'true';
    
    // Получаем список id устройств из переменной окружения
    const deviceIds = process.env.TUYA_DEVICE_IDS
      ? process.env.TUYA_DEVICE_IDS.split(",").map(id => id.trim())
      : [];

    // Если запрашивается конкретное устройство, проверяем его наличие в списке разрешенных
    if (requestedDeviceId && !deviceIds.includes(requestedDeviceId)) {
      return res.status(403).json({ error: "Доступ к устройству запрещен" });
    }

    // Определяем список устройств для запроса
    const devicesToQuery = requestedDeviceId ? [requestedDeviceId] : deviceIds;
    
    // Проверяем кеш, если не требуется принудительное обновление
    if (!forceRefresh && Date.now() - deviceDataCache.timestamp < deviceDataCache.ttl) {
      // Если запрашивается конкретное устройство, фильтруем кеш
      if (requestedDeviceId) {
        const cachedDevice = deviceDataCache.data.find(
          device => device.result && device.result.id === requestedDeviceId
        );
        
        if (cachedDevice) {
          return res.status(200).json([cachedDevice]);
        }
      } else {
        // Возвращаем полный кеш
        return res.status(200).json(deviceDataCache.data);
      }
    }

    // Получаем токен доступа
    const token = await getAccessToken();
    
    // Запрашиваем данные устройств
    const data = await Promise.all(
      devicesToQuery.map(deviceId => fetchDeviceData(deviceId, token))
    );

    // Обновляем кеш, если запрашивались все устройства
    if (!requestedDeviceId) {
      deviceDataCache = {
        data,
        timestamp: Date.now(),
        ttl: deviceDataCache.ttl
      };
    } else if (forceRefresh) {
      // Если запрашивалось одно устройство с обновлением, обновляем его в кеше
      const updatedCacheData = [...deviceDataCache.data];
      const deviceIndex = updatedCacheData.findIndex(
        device => device.result && device.result.id === requestedDeviceId
      );
      
      if (deviceIndex >= 0) {
        updatedCacheData[deviceIndex] = data[0];
      } else {
        updatedCacheData.push(data[0]);
      }
      
      deviceDataCache = {
        data: updatedCacheData,
        timestamp: Date.now(),
        ttl: deviceDataCache.ttl
      };
    }

    // Возвращаем результат
    res.status(200).json(data);
  } catch (error) {
    console.error("API error:", error);
    
    // Возвращаем детальную информацию об ошибке в dev-режиме
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Произошла ошибка при получении данных устройств';
      
    res.status(500).json({ error: errorMessage });
  }
}