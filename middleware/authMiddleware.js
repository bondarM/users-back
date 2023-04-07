import jwt from 'jsonwebtoken'
import ApiError from '../exceptions/apiError.js'
import dotenv from 'dotenv'

dotenv.config()

function authMiddleware(req, res, next) {
  if (req?.method === "OPTIONS") {
    next()
  }
  try {
    const token = req.headers.authorization.split(" ")[1]
    if (!token) {
      return next(ApiError.UnauthorizedError())
    }
    const decodedData = jwt.verify(token, process.env.SECRET_ACCESS)
    if (!decodedData) {
      next(ApiError.UnauthorizedError())
    }
    req.user = decodedData
    next()
  } catch (err) {
    next(ApiError.UnauthorizedError())
  }
}

export default authMiddleware