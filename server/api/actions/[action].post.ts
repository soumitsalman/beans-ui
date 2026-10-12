import { createPresentationActions } from '../../utils/presentationActions'

export default defineEventHandler(async (event) => {
  if (Number(getHeader(event, 'content-length')) > 100_000) throw createError({ statusCode: 413, statusMessage: 'Action input too large.' })
  const payload = await readBody(event)
  if (JSON.stringify(payload ?? null).length > 100_000) throw createError({ statusCode: 413, statusMessage: 'Action input too large.' })
  return createPresentationActions(event)(getRouterParam(event, 'action') || '', payload)
})
