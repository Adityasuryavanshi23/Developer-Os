import { useEffect, useRef } from "react"

// Canvas overlay — draws animated scan lines + floating code particles
// over the bg image to give it a "live" feel
export default function AnimatedBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!

    let animId: number
    let W = window.innerWidth
    let H = window.innerHeight

    function resize() {
      W = canvas!.width  = window.innerWidth
      H = canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    // ── Floating code particles ───────────────────────────────────
    const CHARS = "01アイウエオカキクケコ<>{}[]=>".split("")
    const particles = Array.from({ length: 55 }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      vy:    Math.random() * 0.4 + 0.15,
      char:  CHARS[Math.floor(Math.random() * CHARS.length)],
      alpha: Math.random() * 0.18 + 0.04,
      size:  Math.random() * 9 + 9,
      tick:  0,
      swap:  Math.floor(Math.random() * 90 + 40),
    }))

    // ── Horizontal scan line ──────────────────────────────────────
    let scanY = 0

    let t = 0
    function draw() {
      t++
      ctx.clearRect(0, 0, W, H)

      // Subtle dark vignette so card stands out
      const vignette = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.85)
      vignette.addColorStop(0, "rgba(0,0,0,0)")
      vignette.addColorStop(1, "rgba(0,8,20,0.72)")
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, W, H)

      // Moving scan line
      scanY = (scanY + 0.6) % H
      const sg = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40)
      sg.addColorStop(0,   "rgba(0,200,255,0)")
      sg.addColorStop(0.5, "rgba(0,200,255,0.06)")
      sg.addColorStop(1,   "rgba(0,200,255,0)")
      ctx.fillStyle = sg
      ctx.fillRect(0, scanY - 40, W, 80)

      // Floating code chars
      ctx.font = "bold 12px 'Courier New', monospace"
      for (const p of particles) {
        p.tick++
        if (p.tick > p.swap) {
          p.char  = CHARS[Math.floor(Math.random() * CHARS.length)]
          p.tick  = 0
          p.swap  = Math.floor(Math.random() * 90 + 40)
          p.alpha = Math.random() * 0.18 + 0.04
        }
        p.y += p.vy
        if (p.y > H + 20) {
          p.y = -20
          p.x = Math.random() * W
        }
        ctx.fillStyle = `rgba(0,210,255,${p.alpha})`
        ctx.fillText(p.char, p.x, p.y)
      }

      // Corner bracket decorations (HUD feel)
      drawCornerBrackets(ctx, W, H)

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
        display: "block",
        pointerEvents: "none",
      }}
    />
  )
}

function drawCornerBrackets(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const S = 28   // bracket size
  const M = 18   // margin from edge
  ctx.strokeStyle = "rgba(0,200,255,0.22)"
  ctx.lineWidth = 1.5

  // Top-left
  ctx.beginPath(); ctx.moveTo(M, M + S); ctx.lineTo(M, M); ctx.lineTo(M + S, M); ctx.stroke()
  // Top-right
  ctx.beginPath(); ctx.moveTo(W - M - S, M); ctx.lineTo(W - M, M); ctx.lineTo(W - M, M + S); ctx.stroke()
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(M, H - M - S); ctx.lineTo(M, H - M); ctx.lineTo(M + S, H - M); ctx.stroke()
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(W - M - S, H - M); ctx.lineTo(W - M, H - M); ctx.lineTo(W - M, H - M - S); ctx.stroke()
}
