// ─── Auth ───────────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

// ─── API Response wrapper ────────────────────────────────────────────────────

// Every backend response follows this shape
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string>
}
