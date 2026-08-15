import { Router } from "express"
import { authenticate } from "../../middleware/authenticate"
import { CURRICULUM } from "../../data/curriculum"
import { prisma } from "../../database/prisma"
import { z } from "zod"

const router = Router()

// ── GET /curriculum — list all roadmaps (public, no auth needed) ──────────────
router.get("/", (req, res) => {
  const { category } = req.query as { category?: string }
  const data = category
    ? CURRICULUM.filter((r) => r.category === category)
    : CURRICULUM
  // Return without topics for the list view (lighter payload)
  res.json({
    success: true,
    data: data.map(({ skill, icon, description, category, topics }) => ({
      skill, icon, description, category,
      topicCount: topics.length,
      levels: {
        beginner:     topics.filter((t) => t.level === "beginner").length,
        intermediate: topics.filter((t) => t.level === "intermediate").length,
        advanced:     topics.filter((t) => t.level === "advanced").length,
      },
    })),
  })
})

// ── GET /curriculum/:skill — get full roadmap with all topics ─────────────────
router.get("/:skill", (req, res) => {
  const roadmap = CURRICULUM.find(
    (r) => r.skill.toLowerCase() === decodeURIComponent(req.params["skill"] as string).toLowerCase()
  )
  if (!roadmap) {
    res.status(404).json({ success: false, message: "Roadmap not found" })
    return
  }
  res.json({ success: true, data: roadmap })
})

// ── POST /curriculum/import — import selected topics into user account ─────────
router.post("/import", authenticate, async (req, res, next) => {
  try {
    const { skillName, topicNames } = z.object({
      skillName:  z.string().min(1),
      topicNames: z.array(z.string()).min(1, "Select at least one topic"),
    }).parse(req.body)

    const userId = req.userId!

    // Find the roadmap
    const roadmap = CURRICULUM.find(
      (r) => r.skill.toLowerCase() === skillName.toLowerCase()
    )
    if (!roadmap) {
      res.status(404).json({ success: false, message: "Roadmap not found" })
      return
    }

    // Upsert skill — if user already has this skill, reuse it
    const skill = await prisma.skill.upsert({
      where:  { userId_name: { userId, name: roadmap.skill } },
      update: {},
      create: { userId, name: roadmap.skill },
    })

    // Filter requested topics that exist in roadmap
    const validTopics = roadmap.topics.filter((t) => topicNames.includes(t.name))

    // Get existing topic names for this skill to avoid duplicates
    const existingTopics = await prisma.topic.findMany({
      where:  { userId, skillId: skill.id },
      select: { name: true },
    })
    const existingNames = new Set(existingTopics.map((t) => t.name))

    // Create only new topics
    const toCreate = validTopics.filter((t) => !existingNames.has(t.name))

    if (toCreate.length > 0) {
      await prisma.topic.createMany({
        data: toCreate.map((t) => ({
          userId,
          skillId: skill.id,
          name:    t.name,
          status:  "NOT_STARTED",
        })),
      })
    }

    res.json({
      success: true,
      message: `Imported ${toCreate.length} topics into "${roadmap.skill}" successfully`,
      data: {
        skill,
        imported: toCreate.length,
        skipped:  validTopics.length - toCreate.length,  // already existed
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
