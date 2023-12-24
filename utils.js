/**
 * - - - - - - - - - - - - - - - - -
 *  Verifying './config.json' file
 * - - - - - - - - - - - - - - - - -
*/

import { existsSync } from 'fs'
if (!existsSync('config.json')) throw new Error('Missing \'config.json\' file')

import config from './config.json' assert { type: 'json' }
if (typeof config !== 'object' || Array.isArray(config)) throw new Error('\'config.json\' isn\'t a valid object')
const { user_id_regexp , user_username_regexp , user_email_regexp , user_hash_regexp } = config

if (!user_id_regexp || typeof user_id_regexp !== 'string') throw new Error('Invalid `user_id_regexp` configuration')
if (!user_username_regexp || typeof user_username_regexp !== 'string') throw new Error('Invalid `user_username_regexp` configuration')
if (!user_email_regexp || typeof user_email_regexp !== 'string') throw new Error('Invalid `user_email_regexp` configuration')
if (!user_hash_regexp || typeof user_hash_regexp !== 'string') throw new Error('Invalid `user_hash_regexp` configuration')

let USER_ID_REGEXP, USER_USERNAME_REGEXP, USER_EMAIL_REGEXP, USER_HASH_REGEXP
try {
  USER_ID_REGEXP = new RegExp(user_id_regexp)
  USER_USERNAME_REGEXP = new RegExp(user_username_regexp)
  USER_EMAIL_REGEXP = new RegExp(user_email_regexp)
  USER_HASH_REGEXP = new RegExp(user_hash_regexp)
} catch (e) {
  console.error('Failed to create RegExp\'s:')
  throw new Error(e)
}

import jwt from 'jsonwebtoken'



/**
 * Tries to validate User's `id`
 * @param { string | number } id User's ID
 * @returns { [ null | number, { status: number; error: null | { code: string; message: string; } } ] }
 */
export function parseUserID(id) {
  const response = [null, { status: 200, error: null }]
  if (typeof id === 'string') {
    if (id.trim().length === 0) {
      response[1].status = 400
      response[1].error = { code: 'INVALID_USER_ID_LENGTH', message: 'User id String is null' }
    } else if (!USER_ID_REGEXP.test(id)) {
      response[1].status = 400
      response[1].error = { code: 'INVALID_USER_ID_FORMAT', message: 'User id isn\'t a valid String' }
    }
  } else if (typeof id === 'number') {
    if (!Number.isSafeInteger(id)) {
      response[1].status = 400
      response[1].error = { code: 'INVALID_USER_ID_FORMAT', message: 'User id isn\'t a Safe Integer' }
    }
  } else {
    response[1].status = 400
    response[1].error = { code: 'INVALID_USER_ID_TYPE', message: 'User id must be a Number or String' }
  }

  if (response[1].status === 200 && response[1].error === null) response[0] = Number.parseInt(id)

  return response
}
/**
 * 
 * @param { string } username 
 * @returns { [ null | string, { status: number; error: null | { code: string; message: string; } } ] }
 */
export function parseUserUsername(username) {
  const response = [null, { status: 200, error: null }]

  if (typeof username !== 'string') {
    response[1].status = 400
    response[1].error = { code: 'INVALID_USER_NAME_TYPE', message: 'User username must be a String' }
  } else if (username.length < 4) {
    response[1].status = 400
    response[1].error = { code: 'INVALID_USER_NAME_LENGTH', message: 'User username is too short' }
  } else if (username.length > 32) {
    response[1].status = 400
    response[1].error = { code: 'INVALID_USER_NAME_LENGTH', message: 'User username is too long' }
  } else if (!USER_USERNAME_REGEXP.test(username)) {
    response[1].status = 400
    response[1].error = { code: 'INVALID_USER_NAME_FORMAT', message: 'User username have untrusted characters' }
  }

  if (response[1].status === 200 && response[1].error === null) response[0] = username

  return response
}
/**
 * 
 * @param { string } email 
 * @returns { [ null | string, { status: number; error: null | { code: string; message: string; } } ] }
 */
export function parseUserEmail(email) {
  const response = [null, { status: 200, error: null }]

  if (typeof email !== 'string') {
    response[1].status = 400
    response[1].error = { code: 'INVALID_USER_EMAIL_TYPE', message: 'User email must be a String' }
  } else {
    email = email.trim()
    if (email.length > 256) {
      response[1].status = 400
      response[1].error = { code: 'INVALID_USER_EMAIL_LENGTH', message: 'User email is too long' }
    } else if (!USER_EMAIL_REGEXP.test(email)) {
      response[1].status = 400
      response[1].error = { code: 'INVALID_USER_EMAIL_FORMAT', message: 'User email is not a valid E-mail' }
    }
  }

  if (response[1].status === 200 && response[1].error === null) response[0] = email

  return response
}
/**
 * Validates and parses `uuid` into a valid UUID
 * @param { string | number } uuid User Unique ID (id, username or email)
 * @returns { [ null | number | string, { type: null | 'id' | 'username' | 'email'; status: number; error: null | { code: string; message: string; } } ] }
 */
export function parseUserUUID(uuid) {
  const response = [null, { type: null, status: 200, error: null }]

  const [ id, idRes ] = parseUserID(uuid)
  const [ email, emailRes ] = parseUserEmail(uuid)
  const [ username, usernameRes ] = parseUserUsername(uuid)

  if (idRes.error === null) response[0] = id
  else if (emailRes.error === null) response[0] = email
  else if (usernameRes.error === null) response[0] = username
  else {
    response[1].status = 400
    response[1].error = { code: 'INVALID_UUID_FORMAT', message: 'User Unique ID doesn\'t match any format of unique key' }
  }

  return response
}
/**
 * 
 * @param { string } password User's Raw Password
 * @returns { [ null | string, { status: number; error: null | { code: string; message: string; } } ] }
 */
export function parseUserPassword(password) {
  const response = [null, { status: 200, error: null }]

  if (typeof password !== 'string') {
    response[1].status = 400
    response[1].error = { code: 'INVALID_USER_PASSWORD_TYPE', message: 'User password must be a String' }
  } else if (/^(\s.+)|(.+\s)$/.test(password)) {
    response[1].status = 400
    response[1].error = { code: 'INVALID_USER_PASSWORD_FORMAT', message: 'Password can\'t start or end with white spaces' }
  } else if (password.length < 8) {
    response[1].status = 400
    response[1].error = { code: 'INVALID_USER_PASSWORD_LENGTH', message: 'User password is too short' }
  } else if (password.length > 256) {
    response[1].status = 400
    response[1].error = { code: 'INVALID_USER_PASSWORD_LENGTH', message: 'User password is too long' }
  }

  if (response[1].status === 200 && response[1].error === null) response[0] = password

  return response
}
/**
 * 
 * @param { string } hash User's Password Hash
 * @returns { [ null | string, { status: number; error: null | { code: string; message: string; } } ] }
 */
export function checkHashFormat(hash) {
  const response = [null, { status: 200, error: null }]

  if (typeof hash !== 'string') {
    response[1].status = 400
    response[1].error = { code: 'INVALID_HASH_TYPE', message: 'Hash must be a String' }
  } else {
    hash = hash.trim()
    if (hash.length !== 60) {
      response[1].status = 400
      response[1].error = { code: 'INVALID_HASH_LENGTH', message: 'Hash have a invalid length' }
    } else if (!USER_HASH_REGEXP.test(hash)) {
      response[1].status = 400
      response[1].error = { code: 'INVALID_HASH_LENGTH', message: 'Hash format is invalid' }
    }
  }

  if (response[1].status === 200 && response[1].error === null) response[0] = hash

  return response
}
/**
 * 
 * @param { string } token 
 * @return { [ null | { userID: number; }, { status: number; error: null | { code: string; message: string; } } ] }
 */
export function parseToken(token) {
  const response = [null, { status: 200, error: null }]

  if (typeof token !== 'string') {
    response[1].status = 400
    response[1].error = { code: 'INVALID_TOKEN_TYPE', message: 'Token is not a String' }
    return response
  }

  const decoded = jwt.decode(token)
  const user_id = typeof decoded === 'object' && decoded !== null && decoded['user-id'] ? decoded['user-id'] : null
  const [ userID ] = parseUserID(user_id)
  if (userID === null) {
    response.status = 400
    response.error = { code: 'INVALID_TOKEN_FORMAT', message: 'Token is not a valid Token' }
    return response
  }
  
  response[0] = { userID }
  
  return response
}