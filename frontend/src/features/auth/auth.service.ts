import api from "../../services/api"

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface AuthResponse {
  user: AuthUser
  token: string
}

// Auth API calls — all in one place
export const authService = {
  register: async (data: RegisterPayload): Promise<AuthResponse> => {
    const res = await api.post("/auth/register", data)
    return res.data.data
  },

  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const res = await api.post("/auth/login", data)
    return res.data.data
  },

  getMe: async (): Promise<AuthUser> => {
    const res = await api.get("/auth/me")
    return res.data.data
  },
}
