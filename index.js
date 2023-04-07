import express from 'express'
import dotenv from 'dotenv'
import authRouter from './routes/authRouter.js'
import errorMiddleware from './middleware/errorMiddleware.js'

dotenv.config()

const PORT = process.env.PORT || 5001
const app = express()

app.use(express.json())
app.use("/api", authRouter)
app.use(errorMiddleware)

app.listen(PORT, () => console.log('server get started on port', PORT))
