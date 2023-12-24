import * as db from './db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { checkHashFormat, parseToken } from '../utils.js'

/**
 * Generates the security information to `rawPassword`.
 * @param { string } rawPassword User password input
 * @returns { string }
 */
export function generateHash(rawPassword) {
  if (typeof rawPassword !== 'string') throw new Error('Raw Password is not a String')
  return bcrypt.hashSync(rawPassword, 10)
}
/**
 * Compares `rawPassword` with the user's one without storing it.
 * @param { string } rawPassword User password input
 * @param { string } hash User's security data
 * @returns { boolean }
 */
export function checkUserPassword(rawPassword, hash) {
  if (typeof rawPassword !== 'string' || typeof hash !== 'string') throw new TypeError('Password and Hash must be a String')
  const hashError = checkHashFormat(hash)[1].error
  if (hashError !== null) throw new Error(`Hash format is invalid: ${hashError.message}`)
  return bcrypt.compareSync(rawPassword, hash)
}
/**
 * Validates and parses the given `token`
 * @param { string } token User's `session_token` cookie value.
 * @returns { Promise<{ status: number; logged: boolean; error: null | { code: string; message: string; } }> }
 * @example ```
 * await parseToken(12345);
 * // Response { status: 400, logged: false, error: { code: 'INVALID_TOKEN_FORMAT', message: 'Token is not a String' } }
 * await parseToken('invalid_token');
 * // Response { status: 400, logged: false, error: { code: 'INVALID_TOKEN_FORMAT', message: 'Token is not a valid Token' } }
 * await parseToken('valid_token_format_with_no_user_id');
 * // Response { status: 404, logged: false, error: { code: 'INVALID_TOKEN_DATA', message: 'Token data is invalid' } }
 * await parseToken('valid_token_format_with_assigned_with_incorrect_users_password');
 * // Response { status: 401, logged: false, error: { code: 'INVALID_TOKEN_SIGNATURE', message: 'Token doesn\'t matches user\'s password' } }
 * ```
 */
export async function validateToken(token) {
  const response = {
    status: 200,
    logged: false,
    error: null
  }

  const [ parsedToken, tokenRes ] = parseToken(token)
  if (parsedToken === null) {
    response.status = tokenRes.status
    response.error = tokenRes.error
    return response
  }

  const userHash = await db.getUserHash(parsedToken.userID)
  if (userHash === null) {
    response.status = 404
    response.error = { code: 'INVALID_TOKEN_DATA', message: 'Token data is invalid' }
    return response
  }

  try {
    if (jwt.verify(token, userHash)) response.logged = true
  } catch (e) {
    if (e.name === 'JsonWebTokenError' && e.message === 'invalid signature') {
      response.status = 401
      response.error = { code: 'INVALID_TOKEN_SIGNATURE', message: 'Token doesn\'t matches user\'s password' }
      return response
    }

    console.error('Failed to verify token', { token, 'user-id': parsedToken.userID, error: e })
    response.status = 500
    response.error = { code: 'FAILED_VERIFY_TOKEN', message: 'Failed to verify token' }
  }

  return response
}