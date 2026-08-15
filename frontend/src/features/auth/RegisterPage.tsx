import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { authService } from "./auth.service"
import { useAuthStore } from "./auth.store"
import AnimatedBg from "@/components/AnimatedBg"

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [serverError, setServerError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterForm) {
    setServerError("")
    try {
      const result = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
      })
      // Pass onboarding=true so GuestRoute doesn't redirect to /dashboard
      setAuth(result.user, result.token, true)
      navigate("/onboarding", { replace: true })
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Something went wrong"
      setServerError(message)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem 1rem",
      overflow: "hidden",
      backgroundImage: "url('/developer os bg image.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}>
      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "rgba(0,4,15,0.65)" }} />
      <AnimatedBg />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative", zIndex: 2,
          width: "100%", maxWidth: 420,
          background: "rgba(0,10,30,0.72)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(0,200,255,0.2)",
          borderRadius: 4, padding: "2.5rem",
          boxShadow: "0 0 0 1px rgba(0,200,255,0.08), 0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(0,200,255,0.1)",
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.7), transparent)",
          borderRadius: "4px 4px 0 0",
        }} />

        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{ marginBottom: "1.75rem" }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 4,
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              border: "1px solid rgba(0,200,255,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "monospace",
              boxShadow: "0 0 12px rgba(0,200,255,0.3)",
            }}>D</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: "0.04em", fontFamily: "monospace" }}>
                DEVELOPER<span style={{ color: "#00c8ff" }}>OS</span>
              </div>
              <div style={{ color: "rgba(0,200,255,0.5)", fontSize: 9, letterSpacing: "0.2em", fontFamily: "monospace" }}>
                AI LEARNING SYSTEM
              </div>
            </div>
          </div>
          <h1 style={{ color: "#e2f0ff", fontSize: "1.5rem", fontWeight: 700, margin: 0, letterSpacing: "0.02em", fontFamily: "monospace" }}>
            NEW USER SETUP
          </h1>
          <p style={{ color: "rgba(0,200,255,0.5)", fontSize: "0.78rem", margin: "0.35rem 0 0", letterSpacing: "0.1em", fontFamily: "monospace" }}>
            INITIALIZE YOUR ACCOUNT
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}
        >
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.35)",
                borderRadius: 3, padding: "0.6rem 0.9rem",
                color: "#fca5a5", fontSize: "0.82rem", fontFamily: "monospace",
              }}
            >
              ⚠ {serverError}
            </motion.div>
          )}

          <CyberField label="FULL NAME" type="text" placeholder="Your Name" reg={register("name")} error={errors.name?.message} />
          <CyberField label="EMAIL ADDRESS" type="email" placeholder="user@domain.com" reg={register("email")} error={errors.email?.message} />
          <CyberField label="PASSWORD" type="password" placeholder="Min. 8 characters" reg={register("password")} error={errors.password?.message} />
          <CyberField label="CONFIRM PASSWORD" type="password" placeholder="••••••••" reg={register("confirmPassword")} error={errors.confirmPassword?.message} />

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(0,200,255,0.4)" }}
            whileTap={{ scale: 0.98 }}
            style={{
              marginTop: "0.4rem",
              background: "linear-gradient(90deg, #0369a1 0%, #0ea5e9 100%)",
              border: "1px solid rgba(0,200,255,0.4)",
              color: "#fff", fontWeight: 700,
              borderRadius: 3, height: 44, width: "100%",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.5 : 1,
              fontSize: "0.82rem", letterSpacing: "0.15em",
              fontFamily: "monospace", transition: "opacity 0.2s",
            }}
          >
            {isSubmitting ? "INITIALIZING..." : "CREATE ACCOUNT →"}
          </motion.button>
        </motion.form>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.78rem", color: "rgba(0,200,255,0.35)", fontFamily: "monospace", letterSpacing: "0.05em" }}>
          EXISTING USER?{" "}
          <Link to="/login" style={{ color: "#00c8ff", fontWeight: 700, textDecoration: "none" }}>SIGN IN</Link>
        </p>

        <div style={{
          marginTop: "1.5rem", paddingTop: "0.75rem",
          borderTop: "1px solid rgba(0,200,255,0.1)",
          display: "flex", justifyContent: "space-between",
          fontSize: "0.68rem", fontFamily: "monospace",
          color: "rgba(0,200,255,0.3)", letterSpacing: "0.08em",
        }}>
          <span>SYS v1.0.0</span>
          <span style={{ color: "rgba(0,255,128,0.5)" }}>● ONLINE</span>
        </div>
      </motion.div>
    </div>
  )
}

function CyberField({ label, type, placeholder, reg, error }: {
  label: string; type: string; placeholder: string; reg: object; error?: string
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <label style={{
        color: "rgba(0,200,255,0.6)", fontSize: "0.7rem",
        fontWeight: 600, letterSpacing: "0.15em", fontFamily: "monospace",
      }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        {...reg}
        style={{
          background: "rgba(0,20,50,0.6)",
          border: "1px solid rgba(0,200,255,0.2)",
          borderRadius: 3, height: 42, padding: "0 0.9rem",
          color: "#e2f0ff", fontSize: "0.88rem",
          outline: "none", width: "100%",
          boxSizing: "border-box" as const,
          fontFamily: "monospace",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(0,200,255,0.7)"
          e.currentTarget.style.boxShadow = "0 0 10px rgba(0,200,255,0.15)"
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(0,200,255,0.2)"
          e.currentTarget.style.boxShadow = "none"
        }}
      />
      {error && (
        <span style={{ color: "#fca5a5", fontSize: "0.75rem", fontFamily: "monospace" }}>▸ {error}</span>
      )}
    </div>
  )
}
