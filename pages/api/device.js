// pages/api/device.js
import axios from "axios";
import crypto from "crypto";
import { getSession } from "next-auth/react";

const CLIENT_ID = process.env.TUYA_CLIENT_ID;
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET;
const API_ENDPOINT = "https://openapi.tuyaeu.com";

let cachedToken = "";
let tokenExpireTime = 0;

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
  if (cachedToken && Date.now() < tokenExpireTime) {
    return cachedToken;
  }

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

  if (!response.data.success) {
    throw new Error(`Ошибка при получении токена: ${response.data.msg}`);
  }

  cachedToken = response.data.result.access_token;
  tokenExpireTime = Date.now() + response.data.result.expire_time * 1000;
  return cachedToken;
}

export default async function handler(req, res) {
  try {
    // Проверяем авторизацию
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    // Получаем список id устройств из переменной окружения (разделённых запятой)
    const deviceIds = process.env.TUYA_DEVICE_IDS
      ? process.env.TUYA_DEVICE_IDS.split(",").map(id => id.trim())
      : [];

    // Если в query передан конкретный id, используем его, иначе работаем со всеми id из переменной
    const requestedDeviceId = req.query.deviceId;
    const devicesToQuery = requestedDeviceId ? [requestedDeviceId] : deviceIds;

    const token = await getAccessToken();

    // Функция для запроса данных по одному устройству
    async function fetchDeviceData(deviceId) {
      const path = `/v1.0/devices/${deviceId}`;
      const { sign, timestamp } = generateSign("GET", path, "", token);
      const response = await axios.get(`${API_ENDPOINT}${path}`, {
        headers: {
          "client_id": CLIENT_ID,
          "access_token": token,
          "sign": sign,
          "t": timestamp,
          "sign_method": "HMAC-SHA256"
        }
      });
      return response.data;
    }

    // Одновременный запрос данных для всех выбранных устройств
    const data = await Promise.all(devicesToQuery.map(fetchDeviceData));

    res.status(200).json(data);
  } catch (error) {
    console.error("Ошибка в API:", error);
    res.status(500).json({ error: error.message });
  }
}
