import express from 'express'
import authController from '../controllers/authController.js'
import { check } from 'express-validator'
import authMiddleware from '../middleware/authMiddleware.js'
const authRouter = express.Router()

authRouter.post("/registration",
  [check("email", "email can't be empty").isEmail(),
  check("password", "min length password 6 letters, max - 12").isLength({ max: 12, min: 6 })
  ], authController.registeration)

authRouter.post("/login", authController.login)
authRouter.delete("/logout", authController.logout)
authRouter.get("/activate/:link", authController.activateMail)
authRouter.get("/users", authMiddleware, authController.getUsers)
authRouter.delete("/delete-user", authController.deleteUser)
authRouter.get("/refresh", authController.refresh)

export default authRouter