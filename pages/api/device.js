// pages/api/device.js
import axios from "axios";
import crypto from "crypto";
import { getSession } from "next-auth/react";
import redis from "../../lib/redis";

const CLIENT_ID = process.env.TUYA_CLIENT_ID;
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET;
const API_ENDPOINT = "https://openapi.tuyaeu.com";

// Функция для генерации подписи запроса
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

// Получение токена с использованием Redis для кеширования
async function getAccessToken() {
  // Пытаемся получить токен из Redis
  let token = await redis.get("tuya_token");
  if (token) {
    return token;
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
      throw new Error(
        `Ошибка при получении токена: ${response.data?.msg || "Неизвестная ошибка"}`
      );
    }

    token = response.data.result.access_token;
    // TTL токена (в секундах): уменьшаем expire_time на 60 секунд для безопасности
    const ttl = response.data.result.expire_time - 60;
    await redis.set("tuya_token", token, "EX", ttl);

    return token;
  } catch (error) {
    console.error("Ошибка получения токена:", error);
    throw error;
  }
}

// Запрос данных для конкретного устройства
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
      throw new Error(
        `Ошибка запроса устройства ${deviceId}: ${response.data?.msg || "Неизвестная ошибка"}`
      );
    }

    return response.data;
  } catch (error) {
    console.error(`Ошибка запроса устройства ${deviceId}:`, error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Поддерживаем только GET-запросы
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Метод не поддерживается" });
  }

  try {
    // Проверяем авторизацию через next-auth
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    // Извлекаем параметры запроса
    const requestedDeviceId = req.query.deviceId;
    const forceRefresh = req.query.refresh === "true";
    const deviceIds = process.env.TUYA_DEVICE_IDS
      ? process.env.TUYA_DEVICE_IDS.split(",").map((id) => id.trim())
      : [];

    // Если запрашивается конкретное устройство, проверяем его наличие в списке разрешённых
    if (requestedDeviceId && !deviceIds.includes(requestedDeviceId)) {
      return res.status(403).json({ error: "Доступ к устройству запрещен" });
    }

    // Определяем, какие устройства запрашивать
    const devicesToQuery = requestedDeviceId ? [requestedDeviceId] : deviceIds;

    // Если не требуется принудительное обновление, пробуем получить данные устройств из кэша Redis
    if (!forceRefresh) {
      const cachedData = await redis.get("tuya_devices");
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        if (requestedDeviceId) {
          const cachedDevice = parsedData.find(
            (device) => device.result && device.result.id === requestedDeviceId
          );
          if (cachedDevice) {
            return res.status(200).json([cachedDevice]);
          }
        } else {
          return res.status(200).json(parsedData);
        }
      }
    }

    // Получаем актуальный токен доступа
    const token = await getAccessToken();

    // Запрашиваем данные для нужных устройств
    const data = await Promise.all(
      devicesToQuery.map((deviceId) => fetchDeviceData(deviceId, token))
    );

    // Если запрашиваются все устройства, обновляем кэш в Redis на 60 секунд
    if (!requestedDeviceId) {
      await redis.set("tuya_devices", JSON.stringify(data), "EX", 60);
    } else if (forceRefresh) {
      // Если обновляется конкретное устройство, обновляем его в кэше, если он существует
      const cachedData = await redis.get("tuya_devices");
      if (cachedData) {
        let parsedData = JSON.parse(cachedData);
        const deviceIndex = parsedData.findIndex(
          (device) => device.result && device.result.id === requestedDeviceId
        );
        if (deviceIndex >= 0) {
          parsedData[deviceIndex] = data[0];
        } else {
          parsedData.push(data[0]);
        }
        await redis.set("tuya_devices", JSON.stringify(parsedData), "EX", 60);
      }
    }

    // Возвращаем полученные данные
    res.status(200).json(data);
  } catch (error) {
    console.error("API error:", error);
    const errorMessage =
      process.env.NODE_ENV === "development"
        ? error.message
        : "Произошла ошибка при получении данных устройств";
    res.status(500).json({ error: errorMessage });
  }
}
