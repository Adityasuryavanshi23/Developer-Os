import { useEffect, useState } from "react"
import Particles from "@tsparticles/react"
import { tsParticles } from "@tsparticles/engine"
import { loadSlim } from "@tsparticles/slim"

// Floating particles background — used on all auth pages
export default function ParticlesBg() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadSlim(tsParticles).then(() => setReady(true))
  }, [])

  if (!ready) return null

  return (
    <Particles
      id="auth-particles"
      style={{ position: "absolute", inset: 0, zIndex: 0 }}
      options={{
        fullScreen: false,
        background: { color: { value: "transparent" } },
        fpsLimit: 60,
        particles: {
          number: { value: 80, density: { enable: true } },
          color: { value: ["#a78bfa", "#818cf8", "#60a5fa", "#f472b6"] },
          shape: { type: "circle" },
          opacity: {
            value: { min: 0.1, max: 0.5 },
            animation: { enable: true, speed: 0.8, sync: false },
          },
          size: {
            value: { min: 1, max: 3 },
            animation: { enable: true, speed: 2, sync: false },
          },
          links: {
            enable: true,
            color: "#a78bfa",
            opacity: 0.12,
            distance: 130,
            width: 1,
          },
          move: {
            enable: true,
            speed: 0.6,
            direction: "none",
            random: true,
            outModes: { default: "bounce" },
          },
        },
        interactivity: {
          events: { onHover: { enable: true, mode: "grab" } },
          modes: { grab: { distance: 140, links: { opacity: 0.3 } } },
        },
        detectRetina: true,
      }}
    />
  )
}
