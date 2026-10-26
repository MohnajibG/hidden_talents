// Accepts localhost/127.0.0.1/local-network IPs on any port (dev),
// plus the exact origin of the deployed Frontend (FRONTEND_URL).
const LOCAL_ORIGIN_RE =
  /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+):\d+$/;

export const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (LOCAL_ORIGIN_RE.test(origin)) return true;
  return origin === process.env.FRONTEND_URL;
};
