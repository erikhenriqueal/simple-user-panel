import * as db from '../db.js'
import { validateToken, checkUserPassword, generateHash } from '../security.js'
import { parseUserID, parseUserUsername, parseUserEmail, parseUserPassword } from '../../utils.js'

import jwt from 'jsonwebtoken'

import express from 'express'
const router = express.Router()

// Checking user's session
router.use(async (req, res, next) => {
  const token = req.cookies['session_token']
  if (!token) return res.status(401).send('User\'s session is unavailable')
  
  const parsedToken = await validateToken(token)
  if (parsedToken.error !== null) return res.clearCookie('logged').clearCookie('session_token').status(401).send('Invalid session')

  const newLogged = parsedToken.logged ? 't' : 'f'
  if (req.cookies['logged'] !== newLogged) res.cookie('logged', newLogged)
  if (parsedToken.logged === false) res.clearCookie('session_cookie', { httpOnly: true })

  next()
})

// Getting it's own user data.
router.get('/', async (req, res) => {
  const userID = getUserID(req.cookies['session_token'])
  const userData = await db.getUser(userID)
  res.json(userData)
})
// Getting public information about user with specified `id`
router.get('/:id', async (req, res) => {
  const [ targetID ] = parseUserID(req.params.id)
  if (targetID === null) return res.status(400).json({ error: { code: 'INVALID_USER_ID', message: 'Specified ID is invalid' } })

  const target = await db.getUser(targetID)
  if (!target) return res.status(404).json(null)

  res.json({ id: target.id, username: target.username })
})

router.put('/username', async (req, res) => {
  const data = {
    username: req.body['username']?.trim()
  }

  const [ username, usernameRes ] = parseUserUsername(data.username)
  if (usernameRes.error !== null) return res.status(usernameRes.status).json({ error: usernameRes.error })

  const userID = getUserID(req.cookies['session_token'])
  const userData = await db.getUser(userID)

  if (username === userData.username) return res.status(409).json({ error: { code: 'SAME_USER_NAME' } })
  if (await db.hasUsername(username)) return res.status(409).json({ error: { code: 'EXISTING_USER_NAME' } })

  await db.changeUser(userID, { username })
  res.sendStatus(200)
})
router.put('/email', async (req, res) => {
  const data = {
    email: req.body['email']?.trim()
  }

  const [ email, emailRes ] = parseUserEmail(data.email)
  if (emailRes.error !== null) return res.status(emailRes.status).json(emailRes.json)

  const userID = getUserID(req.cookies['session_token'])
  const userData = await db.getUser(userID)

  if (email === userData.email) return res.status(409).json({ error: { code: 'SAME_USER_EMAIL' } })
  if (await db.hasEmail(email)) return res.status(409).json({ error: { code: 'EXISTING_USER_EMAIL' } })

  await db.changeUser(userID, { email })
  res.sendStatus(200)
})
router.put('/password', async (req, res) => {
  const data = {
    password: req.body['password'],
    newPassword: req.body['new-password']
  }

  const [ password, passwordRes ] = parseUserPassword(data.password)
  const [ newPassword, newPasswordRes ] = parseUserPassword(data.newPassword)
  
  if (newPasswordRes.error !== null) return res.status(newPasswordRes.status).json({ error: newPasswordRes.error })
  if (passwordRes.error !== null) return res.status(passwordRes.status).json({ error: passwordRes.error })

  const userID = getUserID(req.cookies['session_token'])

  const userHash = await db.getUserHash(userID)
  if (!checkUserPassword(password, userHash)) return res.status(401).json({ error: { code: 'INVALID_PASSWORD' } })
  
  const newUserHash = generateHash(newPassword)
  const changedPassword = await db.changeUserHash(userID, newUserHash)
  if (!changedPassword) return res.status(500).json({ error: { code: 'FAILED_CHANGE_USER_PASSWORD' } })

  res.sendStatus(200)
})

// Deleting specific user.
router.delete('/', async (req, res) => {
  const userID = getUserID(req.cookies['session_token'])

  await db.deleteUser(userID)
  await db.deleteUserHash(userID)

  res.clearCookie('session_token', { httpOnly: true })
     .clearCookie('logged')
     .redirect('/')
})



/**
 * 
 * @param { string } sessionToken Actual User's `session_token`
 * @returns { number } Actual session User's ID
 */
function getUserID(sessionToken) {
  const decodedToken = jwt.decode(sessionToken)
  const userId = decodedToken['user-id']
  return parseUserID(userId)[0]
}



export default router