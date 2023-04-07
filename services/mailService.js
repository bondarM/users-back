import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      }
    })
  }

  async activationMail(email, activationLink) {

      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "Account activation on" + process.env.API_URL,
        text: "",
        html: `<div>
        <h1>Follow the link to verify your email</h1>
        <a href="${activationLink}">Click here</a>
      </div>
      `
      })
  }
}

export default new MailService()