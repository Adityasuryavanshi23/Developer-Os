import axios from "axios"

// All API calls go through this single axios instance.
// Base URL comes from .env so we don't hardcode it.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
  withCredentials: true,
})

// Attach the JWT token (if stored in localStorage) to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If the server returns 401 (token expired / invalid), clear storage and redirect to login
// Exception: /auth/login and /auth/register — 401 there means wrong credentials, not expired session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? ""
    const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/register")
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default api
