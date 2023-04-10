import db from "../db.js"
import bcrypt from 'bcryptjs'
import tokenService from "../services/tokenService.js"
import mailService from "../services/mailService.js"
import { v4 } from 'uuid'
import dotenv from 'dotenv'
import ApiError from "../exceptions/apiError.js"
import jwt from 'jsonwebtoken'
dotenv.config()

class UserService {
  async registeration(name, email, password) {
    const sqlCheckUserEmail = `SELECT COUNT(*) as count
      FROM users
      WHERE email = "${email}";`
    const sqlRole = `SELECT id
      FROM roles
      WHERE name = 'user';`
    ////if user with same email exist
    const [[isExist]] = await db.execute(sqlCheckUserEmail)
    if (isExist.count) {
      throw ApiError.BadRequest("User with this email already exist")
    }
    const hashPassword = bcrypt.hashSync(password, 7);
    const [[userRoleId]] = await db.execute(sqlRole)
    ///send activation mail
    const ativationLink = v4()
    await mailService.activationMail(email, `${process.env.API_URL}/api/activate/${ativationLink}`)

    ////add user in db
    const sql = `INSERT INTO users (name, email, password, isActivated, activationLink, role_id)
      VALUES ("${name}", "${email}", "${hashPassword}", 0, "${ativationLink}", "${userRoleId.id}");`
    const [newUser] = await db.execute(sql)

    ///add to db user token
    const tokens = tokenService.generateTokens(newUser.insertId, email, password)
    await tokenService.saveToken(newUser.insertId, tokens.refreshToken) ///insertId user id from response
    return { id: newUser.insertId }
  }

  async login(email, password) {
    const sql = `SELECT id, name, password, email, role_id, isActivated
      FROM users
      WHERE email = "${email}";`

    const [[user], _] = await db.execute(sql)
    if (!user) {
      throw ApiError.BadRequest("User with this email not exist")
    }
    if (!user.isActivated) {
      throw ApiError.BadRequest("User with this email not activated")
    }

    const isValidPassword = bcrypt.compareSync(password, user.password)
    if (!isValidPassword) {
      throw ApiError.BadRequest("Autorization error")
    }

    const tokens = tokenService.generateTokens(user.id, user.email, user.password)
    await tokenService.saveToken(user.id, tokens.refreshToken)
    delete user.password
    return { ...tokens, user }
  }

  async user(token) {
    const decodedData = jwt.verify(token, process.env.SECRET_ACCESS)
    if (!decodedData) {
      throw ApiError.UnauthorizedError()
    }
    const sqlUser = `SELECT id, name, role_id, isActivated
    FROM users
    WHERE id = "${decodedData.id}";`
    const user = await db.execute(sqlUser)
    return user
  }

  async getUsers() {
    const sql = `SELECT u.id, u.name, u.email, r.name AS role
      FROM users u
      JOIN roles r ON u.role_id = r.id;`

    const [allUsers, _] = await db.execute(sql)
    return allUsers
  }

  async deleteUser(id) {
    const sql = `DELETE FROM users WHERE id = "${id}";`
    await db.execute(sql)
  }

  async activateMail(link) {
    const sql = `SELECT * FROM users WHERE activationLink = '${link}';`
    const [[user]] = await db.execute(sql)
    if (!user) {
      throw ApiError.BadRequest("Activate link error")
    }
    const sqlActivate = `UPDATE users SET isActivated = TRUE WHERE id = ${user.id};
      `
    await db.execute(sqlActivate)
  }

  async logout(refreshToken) {
    if (!refreshToken) {
      throw ApiError.BadRequest("Logout error")
    }
    const sql = `DELETE FROM tokens WHERE refreshToken = ${refreshToken};`
    await db.execute(sql)
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError()
    }
    const userdData = await tokenService.validateToken(refreshToken)
    const tokenData = await tokenService.findToken(refreshToken)

    if (!userdData || !tokenData) {
      throw ApiError.UnauthorizedError()
    }
    const sqlUser = `SELECT id, email, password
    FROM users
    WHERE id = "${userdData.id}";`
    const [[user], _] = await db.execute(sqlUser)

    const tokens = tokenService.generateTokens(user.id, user.email, user.password)
    await tokenService.saveToken(user.id, tokens.refreshToken)
    return { ...tokens }
  }
}

export default new UserService()