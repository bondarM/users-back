import { validationResult } from 'express-validator'
import userService from "../services/userService.js"
import ApiError from "../exceptions/apiError.js"
import dotenv from 'dotenv'

dotenv.config()

class AuthController {
  async registeration(req, res, next) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return next(ApiError.BadRequest("Registration error", errors.array()))
      }
      const { name, email, password } = req.body
      const newUser = await userService.registeration(name, email, password)
      res.status(200).json({ message: "User added", newUser })

    } catch (err) {
      next(err)
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body
      const tokens = await userService.login(email, password)
      res.status(200).json({ ...tokens })

    } catch (err) {
      next(err)
    }
  }

  async getUsers(req, res, next) {
    try {
      const allUsers = await userService.getUsers()
      res.status(200).json(allUsers)

    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { id } = req.body
      await userService.deleteUser(id)
      res.status(200).json("User deleted")
      
    } catch (err) {
      next(err)
    }
  }

  async activateMail(req, res, next) {
    try {
      const { link } = req.params
      await userService.activateMail(link)
      return res.redirect(process.env.CLIENT_URL)

    } catch (err) {
      next(err)
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body
      await userService.logout(refreshToken)
      res.status(200)

    } catch (err) {
      next(err)
    }
  }

  async refresh(req, res, next) {
    try {
      const token = req.headers.authorization.split(" ")[1]
      const tokens = await userService.refresh(token)
      res.status(200).json({ ...tokens })

    } catch (err) {
      next(err)
    }
  }
}

export default new AuthController()