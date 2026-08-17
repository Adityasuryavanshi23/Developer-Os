import { NavLink, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuthStore } from "../features/auth/auth.store"
import {
  LayoutDashboard, BookOpen, CheckSquare,
  RefreshCw, BarChart2, Code2, Settings, LogOut, X,
} from "lucide-react"

const navItems = [
  { to: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { to: "/learning",   label: "Learning",   icon: BookOpen },
  { to: "/tasks",      label: "Tasks",      icon: CheckSquare },
  { to: "/revision",   label: "Revision",   icon: RefreshCw },
  { to: "/analytics",  label: "Analytics",  icon: BarChart2 },
  { to: "/interview",  label: "Interview",  icon: Code2 },
  { to: "/settings",   label: "Settings",   icon: Settings },
]

interface SidebarProps {
  onClose?: () => void
}

// Get initials from full name — "Aditya Sur" → "AS", "John" → "J"
function getInitials(name?: string | null) {
  if (!name) return "?"
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("")
}

// Pick a consistent gradient per user based on name char code
const AVATAR_GRADIENTS = [
  ["#0ea5e9", "#0284c7"],   // blue
  ["#8b5cf6", "#6d28d9"],   // purple
  ["#06b6d4", "#0891b2"],   // cyan
  ["#10b981", "#059669"],   // green
  ["#f59e0b", "#d97706"],   // amber
  ["#ec4899", "#db2777"],   // pink
]
function avatarGradient(name?: string | null) {
  if (!name) return AVATAR_GRADIENTS[0]
  const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length
  return AVATAR_GRADIENTS[idx]
}

export default function Sidebar({ onClose }: SidebarProps) {
  const navigate  = useNavigate()
  const { user, clearAuth } = useAuthStore()

  function handleLogout() {
    const name = user?.name?.split(" ")[0] ?? "User"
    clearAuth()
    toast.info(`Goodbye, ${name}!`, { description: "You have been signed out." })
    navigate("/login", { replace: true })
  }

  const initials = getInitials(user?.name)
  const [gradFrom, gradTo] = avatarGradient(user?.name)

  return (
    <aside style={{
      width: 220,
      height: "100%",        // fill the 100vh wrapper — don't grow with page
      overflowY: "auto",     // if nav items overflow, scroll inside sidebar only
      background: "rgba(0,8,24,0.98)",
      borderRight: "1px solid rgba(0,200,255,0.1)",
      display: "flex",
      flexDirection: "column",
      padding: "1.5rem 0",
      flexShrink: 0,
    }}>

      {/* Brand + mobile close button */}
      <div style={{ padding: "0 1.25rem 1.5rem", borderBottom: "1px solid rgba(0,200,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
            border: "1px solid rgba(0,200,255,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "#fff",
            boxShadow: "0 0 10px rgba(0,200,255,0.2)",
          }}>D</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em" }}>
              Developer<span style={{ color: "#00c8ff" }}>OS</span>
            </div>
            <div style={{ color: "rgba(0,200,255,0.4)", fontSize: 10, letterSpacing: "0.05em" }}>
              AI Learning
            </div>
          </div>
        </div>

        {/* Close button — only visible on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            style={{
              background: "none", border: "none",
              color: "rgba(255,255,255,0.4)", cursor: "pointer",
              padding: "0.25rem", display: "none",
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: "0.65rem",
              padding: "0.6rem 0.75rem", borderRadius: 6,
              color: isActive ? "#00c8ff" : "rgba(255,255,255,0.45)",
              background: isActive ? "rgba(0,200,255,0.08)" : "transparent",
              border: isActive ? "1px solid rgba(0,200,255,0.15)" : "1px solid transparent",
              textDecoration: "none", fontSize: "0.875rem",
              fontWeight: isActive ? 600 : 400,
              transition: "all 0.15s",
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: "0.85rem 1.1rem", borderTop: "1px solid rgba(0,200,255,0.08)" }}>

        {/* Avatar + name row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.7rem" }}>

          {/* Avatar circle with initials */}
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
            border: "2px solid rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff",
            letterSpacing: "0.03em",
            boxShadow: `0 0 12px ${gradFrom}55`,
          }}>
            {initials}
          </div>

          {/* Name + email */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              color: "#e2f0ff", fontSize: "0.82rem", fontWeight: 600,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {user?.name ?? <span style={{ color: "rgba(255,255,255,0.15)", fontStyle: "italic" }}>Offline</span>}
            </div>
            <div style={{
              color: "rgba(255,255,255,0.28)", fontSize: "0.68rem",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {user?.email ?? <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.65rem" }}>server unavailable</span>}
            </div>
          </div>
        </div>

        {/* Sign out button */}
        <button
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            background: "none", border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.35)", borderRadius: 6,
            padding: "0.4rem 0.75rem", cursor: "pointer",
            fontSize: "0.78rem", width: "100%", transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#f87171"
            e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.35)"
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
          }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
