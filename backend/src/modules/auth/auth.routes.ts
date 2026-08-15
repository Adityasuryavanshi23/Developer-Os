import { Router } from "express"
import { register, login, me, updateProfileHandler, changePasswordHandler, deleteAccountHandler } from "./auth.controller"
import { authenticate } from "../../middleware/authenticate"

const router = Router()

// Public
router.post("/register", register)
router.post("/login", login)

// Protected
router.get("/me",              authenticate, me)
router.patch("/profile",       authenticate, updateProfileHandler)
router.patch("/password",      authenticate, changePasswordHandler)
router.delete("/account",      authenticate, deleteAccountHandler)

export default router
