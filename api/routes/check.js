import { parseUserUUID, parseUserUsername, parseUserEmail, parseUserPassword } from '../../utils.js'

import cookieParser from 'cookie-parser'

import express from 'express'
const router = express.Router()

router.use(cookieParser())

router.post('/uuid', (req, res) => {
  const data = { uuid: req.body['uuid']?.trim() }
  if (data.uuid === undefined) return res.status(400).json({ error: { code: 'MISSING_DATA', message: 'Key \'uuid\' is undefined on body' } })
  
  const  UUIDRes = parseUserUUID(data.uuid)[1]
  if (UUIDRes.error !== null) return res.status(UUIDRes.status).json({ error: UUIDRes.error })
  if (UUIDRes.type === 'id') return res.status(400).json({ error: { code: 'INVALID_UUID_FORMAT', message: 'User Unique ID doesn\'t match any format of unique key' } })

  res.json({ type: UUIDRes.type })
})
router.post('/username', (req, res) => {
  const data = { username: req.body['username']?.trim() }
  if (data.username === undefined) return res.status(400).json({ error: { code: 'MISSING_DATA', message: 'Key \'username\' is undefined on body' } })
  
  const usernameRes = parseUserUsername(data.username)[1]
  if (usernameRes.error !== null) return res.status(usernameRes.status).json({ error: usernameRes.error })

  res.json({ type: 'username' })
})
router.post('/email', (req, res) => {
  const data = { email: req.body['email']?.trim() }
  if (data.email === undefined) return res.status(400).json({ error: { code: 'MISSING_DATA', message: 'Key \'email\' is undefined on body' } })
  
  const emailRes = parseUserEmail(data.email)[1]
  if (emailRes.error !== null) return res.status(emailRes.status).json({ error: emailRes.error })

  res.json({ type: 'email' })
})
router.post('/password', (req, res) => {
  const data = { password: req.body['password']?.trim() }
  if (data.password === undefined) return res.status(400).json({ error: { code: 'MISSING_DATA', message: 'Key \'password\' is undefined on body' } })
  
  const passwordRes = parseUserPassword(data.password)[1]
  if (passwordRes.error !== null) return res.status(passwordRes.status).json({ error: passwordRes.error })

  res.json({ type: 'password' })
})



export default router