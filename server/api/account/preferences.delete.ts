import { z } from 'zod'
import { createPreferenceRepository } from '../../database/repository'
import { getUserDatabase } from '../../utils/userDatabase'
import { requireSameOrigin, requireSessionUser } from '../../utils/userSession'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'private, no-store')
  requireSameOrigin(event)
  const owner_id = requireSessionUser(event)
  const parsed = z.object({ version: z.number().int().positive() }).strict().safeParse(await readBody(event))
  if (!parsed.success)
    throw createError({ statusCode: 400, statusMessage: 'Reload your saved preference and try again.' })
  let cleared
  try {
    cleared = await createPreferenceRepository(getUserDatabase()).clearPreference(owner_id, parsed.data.version)
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Preferences were not cleared. Your previous preference remains active. Please retry.' })
  }
  if (!cleared)
    throw createError({ statusCode: 409, statusMessage: 'Preferences changed in another tab. Reload the saved version before clearing.' })
  return { preference: null }
})
