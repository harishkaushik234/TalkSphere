import axios from "axios";

// ✅ Render + Vercel compatible base URL
const BASE_URL = import.meta.env.VITE_API_URL + "/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies with request
});




