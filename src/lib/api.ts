import axios from "axios";
import { auth } from "./firebase";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1",
  // Render free instances can take ~50 s to wake up after being idle.
  timeout: 60000,
});

// Attach the Firebase ID token (refreshed automatically by the SDK) to every request.
api.interceptors.request.use(async (config) => {
  const user = auth?.currentUser;
  if (user) {
    config.headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }
  return config;
});
