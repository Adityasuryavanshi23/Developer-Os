import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { User, Lock, Target, Trash2, CheckCircle2, Loader2, AlertTriangle } from "lucide-react"
import { useAuthStore } from "../auth/auth.store"
import { useNavigate } from "react-router-dom"
import { settingsService } from "./settings.service"
import { careerGoalService } from "../learning/learning.service"

// ── Section card wrapper ─────────────────────────────────────────────────────
function Section({ icon: Icon, title, accent = "#00c8ff", children }: {
  icon: React.ElementType
  title: string
  accent?: string
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: "rgba(0,10,30,0.6)",
      border: "1px solid rgba(0,200,255,0.08)",
      borderTop: `2px solid ${accent}`,
      borderRadius: 10, padding: "1.25rem 1.4rem",
      marginBottom: "1rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.1rem" }}>
        <Icon size={16} color={accent} />
        <span style={{ color: "#e2f0ff", fontSize: "0.875rem", fontWeight: 600 }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

// ── Inline success/error messages ────────────────────────────────────────────
function Msg({ type, text }: { type: "success" | "error"; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex", alignItems: "center", gap: "0.45rem",
        marginTop: "0.6rem", fontSize: "0.78rem",
        color: type === "success" ? "#4ade80" : "#fca5a5",
      }}
    >
      {type === "success" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
      {text}
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, setAuth, clearAuth, token } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // ── Profile form ────────────────────────────────────────────────────────────
  const [name, setName] = useState(user?.name ?? "")
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const updateProfile = useMutation({
    mutationFn: () => settingsService.updateProfile(name.trim()),
    onSuccess: (updated) => {
      setAuth(updated, token!)         // update Zustand store → sidebar refreshes
      setProfileMsg({ type: "success", text: "Name updated successfully!" })
      setTimeout(() => setProfileMsg(null), 3000)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setProfileMsg({ type: "error", text: msg ?? "Failed to update profile" })
    },
  })

  // ── Password form ───────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" })
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const changePassword = useMutation({
    mutationFn: () => settingsService.changePassword(pwForm.current, pwForm.newPw),
    onSuccess: () => {
      setPwForm({ current: "", newPw: "", confirm: "" })
      setPwMsg({ type: "success", text: "Password changed successfully!" })
      setTimeout(() => setPwMsg(null), 3000)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setPwMsg({ type: "error", text: msg ?? "Failed to change password" })
    },
  })

  function handlePasswordSubmit() {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      setPwMsg({ type: "error", text: "All fields are required" }); return
    }
    if (pwForm.newPw.length < 6) {
      setPwMsg({ type: "error", text: "New password must be at least 6 characters" }); return
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMsg({ type: "error", text: "New passwords don't match" }); return
    }
    setPwMsg(null)
    changePassword.mutate()
  }

  // ── Career goal ─────────────────────────────────────────────────────────────
  const { data: careerGoal } = useQuery({
    queryKey: ["career-goal"],
    queryFn: careerGoalService.get,
  })

  const [goalForm, setGoalForm] = useState({ title: "", description: "" })
  const [goalMsg, setGoalMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [goalLoaded, setGoalLoaded] = useState(false)

  // Populate form once data loads
  if (careerGoal && !goalLoaded) {
    setGoalForm({ title: careerGoal.title ?? "", description: careerGoal.description ?? "" })
    setGoalLoaded(true)
  }

  const updateGoal = useMutation({
    mutationFn: () => careerGoalService.upsert({ title: goalForm.title.trim(), description: goalForm.description.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-goal"] })
      setGoalMsg({ type: "success", text: "Career goal updated!" })
      setTimeout(() => setGoalMsg(null), 3000)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setGoalMsg({ type: "error", text: msg ?? "Failed to update career goal" })
    },
  })

  // ── Delete account ──────────────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteInput, setDeleteInput] = useState("")

  const deleteAccount = useMutation({
    mutationFn: settingsService.deleteAccount,
    onSuccess: () => {
      clearAuth()
      navigate("/login", { replace: true })
    },
  })

  // ── Avatar helpers ──────────────────────────────────────────────────────────
  const initials = (user?.name ?? "?")
    .trim().split(/\s+/).map((w) => w[0].toUpperCase()).slice(0, 2).join("")

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 560 }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ color: "#e2f0ff", fontSize: "1.6rem", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
          Settings
        </h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.875rem", margin: "0.3rem 0 0" }}>
          Manage your profile and account preferences
        </p>
      </motion.div>

      {/* ── Profile ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Section icon={User} title="Profile" accent="#00c8ff">

          {/* Avatar preview */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.1rem" }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              border: "2px solid rgba(0,200,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 700, color: "#fff",
              boxShadow: "0 0 16px rgba(0,200,255,0.25)",
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ color: "#e2f0ff", fontSize: "0.9rem", fontWeight: 600 }}>{user?.name ?? "—"}</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>{user?.email}</div>
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.68rem", marginTop: "0.15rem" }}>
                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
              </div>
            </div>
          </div>

          {/* Name field */}
          <label style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", display: "block", marginBottom: "0.4rem" }}>
            Full Name
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") updateProfile.mutate() }}
              placeholder="Your name"
              style={inputStyle}
            />
            <SaveBtn
              loading={updateProfile.isPending}
              disabled={!name.trim() || name.trim() === user?.name}
              onClick={() => updateProfile.mutate()}
            />
          </div>
          {profileMsg && <Msg type={profileMsg.type} text={profileMsg.text} />}
        </Section>
      </motion.div>

      {/* ── Password ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Section icon={Lock} title="Change Password" accent="#a78bfa">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div>
              <label style={labelStyle}>Current Password</label>
              <input
                type="password" placeholder="Current password"
                value={pwForm.current}
                onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>New Password</label>
              <input
                type="password" placeholder="Min. 6 characters"
                value={pwForm.newPw}
                onChange={(e) => setPwForm((f) => ({ ...f, newPw: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <input
                type="password" placeholder="Repeat new password"
                value={pwForm.confirm}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") handlePasswordSubmit() }}
                style={inputStyle}
              />
            </div>
          </div>
          {pwMsg && <Msg type={pwMsg.type} text={pwMsg.text} />}
          <div style={{ marginTop: "0.85rem" }}>
            <SaveBtn
              loading={changePassword.isPending}
              disabled={!pwForm.current || !pwForm.newPw || !pwForm.confirm}
              onClick={handlePasswordSubmit}
              label="Change Password"
            />
          </div>
        </Section>
      </motion.div>

      {/* ── Career Goal ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Section icon={Target} title="Career Goal" accent="#f59e0b">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div>
              <label style={labelStyle}>Goal Title</label>
              <input
                placeholder="e.g. Full Stack Developer"
                value={goalForm.title}
                onChange={(e) => setGoalForm((f) => ({ ...f, title: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Description (optional)</label>
              <textarea
                placeholder="What do you want to achieve?"
                value={goalForm.description}
                onChange={(e) => setGoalForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                style={{ ...inputStyle, height: "auto", resize: "vertical", padding: "0.6rem 0.9rem", fontFamily: "inherit" }}
              />
            </div>
          </div>
          {goalMsg && <Msg type={goalMsg.type} text={goalMsg.text} />}
          <div style={{ marginTop: "0.85rem" }}>
            <SaveBtn
              loading={updateGoal.isPending}
              disabled={!goalForm.title.trim()}
              onClick={() => updateGoal.mutate()}
              label="Update Goal"
            />
          </div>
        </Section>
      </motion.div>

      {/* ── Danger Zone ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Section icon={Trash2} title="Danger Zone" accent="#f87171">
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", margin: "0 0 0.85rem", lineHeight: 1.6 }}>
            Deleting your account is <strong style={{ color: "#f87171" }}>permanent and irreversible</strong>. All your tasks, revisions, skills and data will be deleted forever.
          </p>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.3)",
                color: "#f87171", borderRadius: 6,
                padding: "0.45rem 1rem", fontSize: "0.82rem",
                fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "0.4rem",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.15)" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.08)" }}
            >
              <Trash2 size={14} />
              Delete my account
            </button>
          ) : (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
              <p style={{ color: "#fca5a5", fontSize: "0.78rem", marginBottom: "0.6rem" }}>
                Type <strong>DELETE</strong> to confirm:
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  autoFocus
                  placeholder="DELETE"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  style={{ ...inputStyle, borderColor: "rgba(248,113,113,0.3)" }}
                />
                <button
                  onClick={() => deleteAccount.mutate()}
                  disabled={deleteInput !== "DELETE" || deleteAccount.isPending}
                  style={{
                    background: deleteInput === "DELETE" ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(248,113,113,0.4)",
                    color: deleteInput === "DELETE" ? "#f87171" : "rgba(255,255,255,0.2)",
                    borderRadius: 6, padding: "0 0.9rem", height: 42,
                    fontSize: "0.82rem", fontWeight: 600,
                    cursor: deleteInput === "DELETE" ? "pointer" : "not-allowed",
                    flexShrink: 0, transition: "all 0.15s",
                  }}
                >
                  {deleteAccount.isPending ? <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : "Confirm"}
                </button>
                <button
                  onClick={() => { setConfirmDelete(false); setDeleteInput("") }}
                  style={{
                    background: "none", border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.3)", borderRadius: 6,
                    padding: "0 0.7rem", height: 42, cursor: "pointer", fontSize: "0.82rem",
                  }}
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </Section>
      </motion.div>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function SaveBtn({ loading, disabled, onClick, label = "Save" }: {
  loading: boolean; disabled: boolean; onClick: () => void; label?: string
}) {
  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.03 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        background: "linear-gradient(90deg, #0369a1, #0ea5e9)",
        border: "1px solid rgba(0,200,255,0.3)",
        color: "#fff", borderRadius: 6,
        padding: "0 1rem", height: 42,
        fontSize: "0.82rem", fontWeight: 600,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.5 : 1,
        display: "flex", alignItems: "center", gap: "0.35rem",
        flexShrink: 0, transition: "opacity 0.2s",
      }}
    >
      {loading && <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />}
      {loading ? "Saving..." : label}
    </motion.button>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(0,20,50,0.6)",
  border: "1px solid rgba(0,200,255,0.2)",
  borderRadius: 6, height: 42, padding: "0 0.9rem",
  color: "#e2f0ff", fontSize: "0.875rem", outline: "none",
  boxSizing: "border-box",
}

const labelStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.4)", fontSize: "0.75rem",
  display: "block", marginBottom: "0.35rem",
}
