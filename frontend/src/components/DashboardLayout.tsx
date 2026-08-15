import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar"
import { useState } from "react"
import { Menu } from "lucide-react"

// Main layout for all dashboard pages.
// On desktop: fixed sidebar + scrollable main content.
// On mobile: hidden sidebar with hamburger toggle.
export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    // Full viewport — no scroll on this root container
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#020c1b" }}>

      {/* Mobile overlay — tap to close */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 30,
            background: "rgba(0,0,0,0.5)",
            display: "none",
          }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar — fixed height, never scrolls with page */}
      <div
        className={`sidebar-wrapper${sidebarOpen ? " sidebar-open" : ""}`}
        style={{ height: "100vh", flexShrink: 0 }}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main — takes remaining width, scrolls independently */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh" }}>

        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: "none", border: "none",
              color: "rgba(255,255,255,0.6)", cursor: "pointer",
              display: "flex", alignItems: "center", padding: "0.5rem",
            }}
          >
            <Menu size={22} />
          </button>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
            Developer<span style={{ color: "#00c8ff" }}>OS</span>
          </div>
          <div style={{ width: 38 }} />
        </div>

        {/* Content — only this scrolls */}
        <main
          style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}
          className="dashboard-main"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
