import jwt from 'jsonwebtoken'
import db from '../db.js'
import dotenv from 'dotenv'

dotenv.config()

class TokenService {
  generateTokens(id, email, password) {
    const payload = {
      id,
      email,
      password
    }
    const accessToken = jwt.sign(payload, process.env.SECRET_ACCESS, { expiresIn: "30s" })
    const refreshToken = jwt.sign(payload, process.env.SECRET_REFRESH, { expiresIn: "30days" })

    return { accessToken, refreshToken }
  }

  async validateToken(token) {
    try {
      const decodedData = jwt.verify(token, process.env.SECRET_REFRESH)
      return decodedData
    } catch (err) {
      return null
    }
  }

  async findToken(token) {
    const sql = `SELECT * FROM refresh_tokens WHERE token = "${token}";`
    const tokenData = await db.execute(sql)
    return tokenData
  }

  async saveToken(userId, refreshToken) {
    const sql = `SELECT * FROM refresh_tokens WHERE user_id = "${userId}";`
    const [[tokenData]] = await db.execute(sql)

    if (tokenData) {
      const sqlUpdate = `UPDATE refresh_tokens SET token = "${refreshToken}" WHERE user_id = "${userId}";`
      await db.execute(sqlUpdate);
    } else {
      const sqlCreate = `INSERT INTO refresh_tokens (user_id, token) VALUES ("${userId}", "${refreshToken}");`
      await db.execute(sqlCreate)
    }
  }
}

export default new TokenService()