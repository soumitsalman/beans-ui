import { z } from 'zod'
import { PREFERENCE_SCHEMA, normalisePreferences } from '../../../shared/userPreferences'
import { createPreferenceRepository } from '../../database/repository'
import { getUserDatabase } from '../../utils/userDatabase'
import { requireSameOrigin, requireSessionUser } from '../../utils/userSession'

const RAW_LIST = z.array(z.string().max(500)).max(30).default([])
const INPUT = z.object({ preference: z.object({ topic: z.string().max(500).default(''), tags: RAW_LIST, domains: RAW_LIST, exclude_domains: RAW_LIST, languages: RAW_LIST }).strict(), version: z.number().int().min(0) }).strict()
export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'private, no-store')
  requireSameOrigin(event)
  const owner_id = requireSessionUser(event)
  if (Number(getHeader(event, 'content-length')) > 70000) throw createError({ statusCode: 413, statusMessage: 'Preference input is too large.' })
  const body = await readBody(event)
  if (JSON.stringify(body ?? null).length > 70000)
    throw createError({ statusCode: 413, statusMessage: 'Preference input is too large.' })
  const parsed = INPUT.safeParse(body)
  if (!parsed.success)
    throw createError({ statusCode: 400, statusMessage: 'Correct the highlighted preferences.', data: { field_errors: parsed.error.flatten().fieldErrors } })
  const normalized = PREFERENCE_SCHEMA.safeParse(normalisePreferences(parsed.data.preference))
  if (!normalized.success)
    throw createError({ statusCode: 400, statusMessage: 'Correct the highlighted preferences.', data: { field_errors: normalized.error.flatten().fieldErrors } })
  let saved
  try {
    saved = await createPreferenceRepository(getUserDatabase()).savePreference(owner_id, normalized.data, parsed.data.version)
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Preferences were not saved. Your previous preference remains active. Please retry.' })
  }
  if (!saved)
    throw createError({ statusCode: 409, statusMessage: 'Preferences changed in another tab. Reload the saved version before saving again.' })
  return { preference: saved }
})
