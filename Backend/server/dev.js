import dotenv from "dotenv";
dotenv.config();

// Local dev server (npm run dev). The Frontend calls this port via VITE_API_URL.
import { createApp } from "./app.js";

const app = createApp();
const server = app.listen(process.env.PORT, () => {
  console.log(`Server STARTED 📡 on port ${server.address().port}`);
});
