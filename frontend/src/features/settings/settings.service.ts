import api from "../../services/api"
import type { AuthUser } from "../auth/auth.service"

export const settingsService = {
  updateProfile: async (name: string): Promise<AuthUser> => {
    const res = await api.patch("/auth/profile", { name })
    return res.data.data
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.patch("/auth/password", { currentPassword, newPassword })
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete("/auth/account")
  },
}
