import checkRouter from './routes/check.js'
import usersRouter from './routes/users.js'
import authRouter from './routes/auth.js'

import express from 'express'
const router = express.Router()

router.use(express.json())
router.use(express.urlencoded({ extended: true }))

router.use('/check', checkRouter)
router.use('/users', usersRouter)
router.use('/auth', authRouter)

export default router