import { Router } from "express"
import authRoutes from "../modules/auth/auth.routes"
import careerGoalRoutes from "../modules/users/careerGoal.routes"
import learningRoutes from "../modules/learning/learning.routes"
import taskRoutes from "../modules/tasks/task.routes"
import revisionRoutes from "../modules/revision/revision.routes"
import analyticsRoutes from "../modules/analytics/analytics.routes"
import interviewRoutes from "../modules/interview/interview.routes"
import curriculumRoutes from "../modules/curriculum/curriculum.routes"
import topicContentRoutes from "../modules/topic-content/topicContent.routes"
import routineRoutes from "../modules/routine/routine.routes"

// Main router — all API routes are mounted here under /api prefix
const router = Router()

router.use("/auth", authRoutes)
router.use("/career-goal", careerGoalRoutes)
router.use("/learning", learningRoutes)
router.use("/tasks", taskRoutes)
router.use("/revisions", revisionRoutes)
router.use("/analytics", analyticsRoutes)
router.use("/interview", interviewRoutes)
router.use("/curriculum", curriculumRoutes)
router.use("/topic-content", topicContentRoutes)
router.use("/routine", routineRoutes)

export default router
