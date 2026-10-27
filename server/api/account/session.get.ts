import { createPreferenceRepository } from '../../database/repository'
import { getUserDatabase } from '../../utils/userDatabase'
import { sessionUser } from '../../utils/userSession'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'private, no-store')
  const owner_id = sessionUser(event)
  if (!owner_id)
    return { signed_in: false, preference: null, error_message: event.context.beans_auth_unavailable ? 'Sign-in is temporarily unavailable. You can continue reading.' : null }
  try {
    return { signed_in: true, preference: await createPreferenceRepository(getUserDatabase()).readPreference(owner_id), error_message: null }
  } catch {
    return { signed_in: true, preference: null, error_message: 'Your preferences could not be loaded. Please retry; your saved preference has not been changed.' }
  }
})
