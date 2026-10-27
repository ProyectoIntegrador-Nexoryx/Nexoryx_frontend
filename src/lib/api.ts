import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1",
  // Render free instances can take ~50 s to wake up after being idle.
  timeout: 60000,
});
