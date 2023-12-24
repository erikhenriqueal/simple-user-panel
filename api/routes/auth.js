import * as db from '../db.js'
import { checkUserPassword, generateHash } from '../security.js'
import { parseUserUUID, parseUserUsername, parseUserEmail, parseUserPassword } from '../../utils.js'

import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'

import express from 'express'
const router = express.Router()

router.use(cookieParser())

router.post('/login', async (req, res) => {
  const data = {
    uuid: req.body['uuid']?.trim(),
    password: req.body['password']
  }

  const [ UUID, UUIDRes ] = parseUserUUID(data.uuid)
  if (UUIDRes.status !== 200) return res.status(UUIDRes.status).json({ error: UUIDRes.error })
  
  const [ password, passwordRes ] = parseUserPassword(data.password)
  if (passwordRes.status !== 200) return res.status(passwordRes.status).json({ error: passwordRes.error })

  if (!(await db.hasUser(UUID))) return res.status(401).json({ error: { code: 'INVALID_LOGIN_CREDENTIALS', message: 'Invalid Username or E-mail' } })

  const user = await db.getUser(UUID)
  const userHash = await db.getUserHash(user.id)
  if (!checkUserPassword(password, userHash)) return res.status(401).json({ error: { code: 'INVALID_LOGIN_PASSWORD', message: 'Invalid Password' } })

  const token = jwt.sign({ 'user-id': user.id }, userHash)
  res.cookie('session_token', token, { httpOnly: true })
     .cookie('logged', 't')
     .status(200)
     .redirect('/panel.html')
})
router.post('/register', async (req, res) => {
  const data = {
    username: req.body['username']?.trim(),
    email: req.body['email']?.trim(),
    password: req.body['password']?.trim()
  }

  const [ username, usernameRes ] = parseUserUsername(data.username)
  if (usernameRes.error !== null) return res.status(usernameRes.status).json({ error: usernameRes.error })
  
  const [ email, emailRes ] = parseUserEmail(data.email)
  if (emailRes.error !== null) return res.status(emailRes.status).json({ error: emailRes.error })

  if (await db.hasUsername(username)) return res.status(409).json({ error: { code: 'EXISTING_USER_NAME', message: `Username '${username}' is already taken` } })
  if (await db.hasEmail(email)) return res.status(409).json({ error: { code: 'EXISTING_USER_EMAIL', message: `E-mail '${email}' is already taken` } })

  const [ password, passwordRes ] = parseUserPassword(data.password)
  if (passwordRes.error !== null) return res.status(passwordRes.status).json({ error: passwordRes.error })

  try {
    const { id } = await db.addUser({ username, email })
    const hash = generateHash(password)
    await db.addUserHash(id, hash)

    const token = jwt.sign({ 'user-id': id }, hash)

    res.cookie('session_token', token, { httpOnly: true })
       .cookie('logged', 't')
       .status(201)
       .redirect('/panel.html')
  } catch (e) {
    console.error(`Failed to register user:\n- Username: ${username}\n- E-mail: ${email}\n- Error: `, e)
    res.status(500).send({ code: 'UNKNOWN', message: 'Failed to register user' })
  }
})
router.post('/exit', (req, res) => {
  res.clearCookie('session_token', { httpOnly: true })
     .clearCookie('logged')
     .status(200)
     .redirect('/')
})



export default router