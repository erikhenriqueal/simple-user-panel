import { config as _envConfig } from 'dotenv'
_envConfig()

import { checkHashFormat, parseUserEmail, parseUserID, parseUserUUID, parseUserUsername } from '../utils.js'

/**
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 *  Verifying Environment Variables (as in '.env.example')
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */

const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env
if (!DB_HOST) throw new Error('\'DB_HOST\' isn\'t defined on Environment Variables (\'.env\')')
if (!DB_PORT) throw new Error('\'DB_PORT\' isn\'t defined on Environment Variables (\'.env\')')
if (!DB_USER) throw new Error('\'DB_USER\' isn\'t defined on Environment Variables (\'.env\')')
if (!DB_PASS) throw new Error('\'DB_PASS\' isn\'t defined on Environment Variables (\'.env\')')
if (!DB_NAME) throw new Error('\'DB_NAME\' isn\'t defined on Environment Variables (\'.env\')')

import mysql from 'mysql2/promise'
export const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  namedPlaceholders: true
})



/**
 * - - - - - - - - -
 *  # 'users' TABLE
 * - - - - - - - - -
 */

/**
 * Gets some user from database by its `id`
 * @param { string | number } uuid Target User Unique ID
 * @returns { Promise<null | { id: number; username: string; email: string; }> }
 */
export async function getUser(uuid) {
  const [ parsedUUID, { error: UUIDError } ] = parseUserUUID(uuid)
  if (UUIDError !== null) throw new Error(`Failed to parse User's Unique ID: ${UUIDError.code} - ${UUIDError.message}`)
  const connection = await pool.getConnection()
  const [[ user ]] = await connection.execute('SELECT * FROM `users` WHERE `id`=? OR `username`=? OR `email`=?', parsedUUID)
  connection.release()
  return user || null
}
/**
 * Verifies if some user is on the database
 * @param { string | number } uuid User's Unique ID
 * @returns { Promise<boolean> }
 */
export async function hasUser(uuid) {
  const [ parsedUUID, { error: UUIDError } ] = parseUserUUID(uuid)
  if (UUIDError !== null) throw new Error(`Failed to parse User's Unique ID: ${UUIDError.code} - ${UUIDError.message}`)
  const connection = await pool.getConnection()
  const [[{ size }]] = await connection.execute('SELECT COUNT(*) AS `size` FROM `users` WHERE `id`=? OR `username`=? OR `email`=?', parsedUUID)
  connection.release()
  return size > 0
}
/**
 * Verifies if the `username` is being used
 * @param { string } username Username to check
 * @returns { Promise<boolean> }
 */
export async function hasUsername(username) {
  const [ parsedUsername, { error: usernameError } ] = parseUserUsername(username)
  if (usernameError !== null) throw new Error(`Failed to parse User's Username: ${usernameError.code} - ${usernameError.message}`)
  const connection = await pool.getConnection()
  const [[{ size }]] = await connection.execute('SELECT COUNT(*) AS `size` FROM `users` WHERE `username`=?', parsedUsername)
  connection.release()

  return size > 0
}
/**
 * Verifies if the `email` is being used
 * @param { string } email E-mail to check
 * @returns { Promise<boolean> }
 */
export async function hasEmail(email) {
  const [ parsedEmail, { error: emailError } ] = parseUserEmail(email)
  if (emailError !== null) throw new Error(`Failed to parse User's E-mail: ${emailError.code} - ${emailError.message}`)
  const connection = await pool.getConnection()
  const [[{ size }]] = await connection.execute('SELECT COUNT(*) AS `size` FROM `users` WHERE `email`=?', parsedEmail)
  connection.release()

  return size > 0
}
/**
 * Adds `userData` to database
 * @param { { username: string; email: string; } } userData User's object
 * @returns { Promise<null | { id: number; username: string; email: string; }> }
 */
export async function addUser(userData) {
  if (typeof userData !== 'object' || !userData.username || !userData.email) throw new Error('Invalid User\'s Data')

  const [ username, { error: usernameError } ] = parseUserUsername(userData.username)
  const [ email, { error: emailError } ] = parseUserEmail(userData.email)
  if (usernameError !== null) throw new Error(`Failed to parse User's Username: ${usernameError.code} - ${usernameError.message}`)
  if (emailError !== null) throw new Error(`Failed to parse User's E-mail: ${emailError.code} - ${emailError.message}`)

  const existing = await hasUsername(username) || await hasEmail(email)
  if (existing) throw new Error('User is already in database')

  const connection = await pool.getConnection()
  const [{ insertId: id }] = await connection.execute('INSERT INTO `users` (`username`, `email`) VALUES (?,?)', [ username, email ])
  connection.release()
  
  return await getUser(id)
}
/**
 * Changes an `user` on database
 * @param { string | number } uuid User's Unique ID
 * @param { { username?: string; email?: string; } } changeData User changes object
 * @returns { Promise<null | { id: number; username: string; email: string; }> }
 */
export async function changeUser(uuid, changeData) {
  const [ parsedUUID, { error: UUIDError } ] = parseUserUUID(uuid)
  if (UUIDError !== null) throw new Error(`Failed to parse User's Unique ID: ${UUIDError.code} - ${UUIDError.message}`)

  const [ username, { error: usernameError } ] = changeData.username ? parseUserUsername(changeData.username) : [undefined, { status: 200, error: null }]
  const [ email, { error: emailError } ] = changeData.email ? parseUserEmail(changeData.email) : [undefined, { status: 200, error: null }]
  
  if (usernameError !== null) throw new Error(`Failed to parse User's Username: ${usernameError.code} - ${usernameError.message}`)
  if (emailError !== null) throw new Error(`Failed to parse User's E-mail: ${emailError.code} - ${emailError.message}`)

  const changes = { username, email }

  const changesDefKeys = Object.keys(changes).filter(k => changes[k] !== undefined),
        changesDefEntries = changesDefKeys.map(k => [k, changes[k]]),
        changesDefChanges = Object.fromEntries(changesDefEntries)

  const connection = await pool.getConnection()
  await connection.execute(`UPDATE \`users\` SET ${changesDefKeys.map(k => `\`${k}\`=:${k}`).join(', ')} WHERE \`id\`=:id`, { id: parsedUUID, ...changesDefChanges })
  connection.release()
  
  return await getUser(uuid)
}
/**
 * Deletes the specified user from `users` database
 * @param { string | number } uuid Target user ID
 * @returns { Promise<boolean> }
 */
export async function deleteUser(uuid) {
  const [ parsedUUID, { error: UUIDError } ] = parseUserUUID(uuid)
  if (UUIDError !== null) throw new Error(`Failed to parse User's Unique ID: ${UUIDError.code} - ${UUIDError.message}`)

  const existing = await hasUser(uuid)
  if (!existing) throw new Error('User isn\'t in database')

  const connection = await pool.getConnection()
  const [{ affectedRows }] = await connection.execute('DELETE FROM `users` WHERE `id`=? OR `username`=? OR `email`=?', parsedUUID)
  connection.release()

  return affectedRows > 0
}



/**
 * - - - - - - - - - - -
 *  # 'security' TABLE
 * - - - - - - - - - - -
 */

/**
 * Select User's Security by its `id`
 * @param { number } id User's ID
 * @returns { Promise<null | string> }
 */
export async function getUserHash(id) {
  const [ parsedID, { error: IDError } ] = parseUserID(id)
  if (IDError !== null) throw new Error(`Failed to parse User's ID: ${IDError.code} - ${IDError.message}`)

  const connection = await pool.getConnection()
  const [[ data ]] = await connection.execute('SELECT \`hash\` FROM `security` WHERE `id`=?', parsedID)
  connection.release()
  
  return data?.hash || null
}
/**
 * Deletes the specified user from `security` database
 * @param { number } id User's ID
 * @returns { Promise<boolean> }
 */
export async function hasUserHash(id) {
  const [ parsedID, { error: IDError } ] = parseUserID(id)
  if (IDError !== null) throw new Error(`Failed to parse User's ID: ${IDError.code} - ${IDError.message}`)

  const connection = await pool.getConnection()
  const [[{ size }]] = await connection.execute('SELECT COUNT(*) AS `size` FROM `security` WHERE `id`=?', parsedID)
  connection.release()

  return size > 0
}
/**
 * Stores the user's `hash` in the database
 * @param { number } id User's ID
 * @param { string } hash User's Password Hash
 * @returns { Promise<null | { id: number; hash: string; }> }
 */
export async function addUserHash(id, hash) {
  const [ parsedID, { error: IDError } ] = parseUserID(id)
  if (IDError !== null) throw new Error(`Failed to parse User's ID: ${IDError.code} - ${IDError.message}`)

  const [ parsedHash, { error: hashError } ] = checkHashFormat(hash)
  if (hashError !== null) throw new Error(`Failed to parse Hash: ${hashError.code} - ${hashError.message}`)

  const connection = await pool.getConnection()
  await connection.execute('INSERT INTO `security` (`id`, `hash`) VALUES (?, ?)', [ parsedID, parsedHash ])
  connection.release()

  return { id: parsedID, hash: parsedHash }
}
/**
 * Deletes the specified user from `security` database
 * @param { number } id User's ID
 * @returns { Promise<boolean> }
 */
export async function deleteUserHash(id) {
  const [ parsedID, { error: IDError } ] = parseUserID(id)
  if (IDError !== null) throw new Error(`Failed to parse User's ID: ${IDError.code} - ${IDError.message}`)

  const connection = await pool.getConnection()
  const [{ affectedRows }] = await connection.execute('DELETE FROM `security` WHERE `id`=?', parsedID)
  connection.release()

  return affectedRows > 0
}
/**
 * Updates the user's `hash` in the database
 * @param { number } id User's ID
 * @param { string } newHash New user password hash
 * @returns { Promise<null | string> }
 */
export async function changeUserHash(id, newHash) {
  const [ parsedID, { error: IDError } ] = parseUserID(id)
  if (IDError !== null) throw new Error(`Failed to parse User's ID: ${IDError.code} - ${IDError.message}`)

  const [ parsedHash, { error: hashError } ] = checkHashFormat(newHash)
  if (hashError !== null) throw new Error(`Failed to parse Hash: ${hashError.code} - ${hashError.message}`)

  const connection = await pool.getConnection()
  await connection.execute(`UPDATE \`security\` SET \'hash\'=? WHERE \`id\`=?`, [ parsedHash, parsedID ])
  connection.release()

  return await getUserHash(id)
}