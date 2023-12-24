import { config as _envConfig } from 'dotenv'
_envConfig()

/**
 * - - - - - - - - -
 *  Starting Server
 * - - - - - - - - -
 */

import apiRouter from './api/index.js'
import { parseToken } from './api/security.js'

import cookieParser from 'cookie-parser'
import express from 'express'
const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/api', apiRouter)

app.use(async (req, res, next) => {
  const token = req.cookies['session_token']
  if (!token) {
    if (req.cookies['logged'] !== 'f') res.cookie('logged', 'f')
    return next()
  }

  const { logged } = await parseToken(token)
  if (logged) {
    if (req.cookies['logged'] !== 't') res.cookie('logged', 't')
  } else {
    res.clearCookie('session_token', { httpOnly: true })
    if (req.cookies['logged'] !== 'f') res.cookie('logged', 'f')
  }

  next()
})

app.get('/index.html', (_, res) => res.redirect('/'))
app.get('/login.html', (req, res, next) => {
  const loggedIn = req.cookies['logged'] === 't'
  if (loggedIn) return res.redirect('/panel.html')
  next()
})
app.get('/register.html', (req, res, next) => {
  const loggedIn = req.cookies['logged'] === 't'
  if (loggedIn) return res.redirect('/panel.html')
  next()
})
app.get('/panel.html', (req, res, next) => {
  const loggedIn = req.cookies['logged'] === 't'
  if (!loggedIn) return res.redirect('/login.html')
  next()
})

app.use(express.static('public'))

const { SERVER_PORT } = process.env
if (!SERVER_PORT) throw new Error('\'SERVER_PORT\' isn\'t defined on Environment Variables (\'.env\')')
app.listen(SERVER_PORT, () => {
  console.log(`Listening on port ${SERVER_PORT}\nAccess URL: http://localhost:${SERVER_PORT}`)
})