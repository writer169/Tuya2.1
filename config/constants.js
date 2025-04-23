// config/constants.js
export const DEVICE_TYPES = {
  SOCKET: 'socket',
  AIR_SENSOR: 'airSensor',
  THERMOMETER: 'thermometer',
  POWER_METER: 'powerMeter', // Добавлен новый тип устройства
  UNKNOWN: 'unknown'
};

export const DEVICE_IDS = {
  SOCKETS: ["bf86db6ccc98ec3f63ac0d", "bfcb457736e5303fe8ao1u", "bf014aa7c8cd67fc7fq7ck"],
  AIR_SENSOR: "bf496ddae64215bd93p0qr",
  POWER_METER: "bf988411b50c9f5907jf62", // Добавлен новый ID устройства
  THERMOMETERS: ["bff8525efa6adbe724woag", "bf4496436cae831338sptn"]
};

export const REFRESH_INTERVAL = 60000; // 1 минута в миллисекундах

export const API_PATHS = {
  DEVICE: '/api/device',
  AUTH: '/auth/signin'
};

export const PARAM_LABELS = {
  power: "Состояние",
  voltage: "Напряжение",
  power_consumption: "Мощность",
  timer: "Таймер",
  temperature: "Температура",
  humidity: "Влажность",
  battery: "Батарея",
  co2: "CO₂",
  voc: "ЛОС",
  ch2o: "Формальдегид",
  total_energy: "Потреблено", // Добавлена новая метка
  current_power: "Текущая мощность" // Добавлена новая метка
};