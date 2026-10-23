import { z } from 'zod'

const TEXT = z.string().trim().max(500)
const ID = z.string().regex(/^[a-z0-9_-]+$/i).max(200)
const CURSOR = z.string().max(4096).nullable().optional()
const IDS = z.array(ID).max(2000)
export const ACTION_INPUTS = {
  feed: z.object({
    home_default: z.boolean().optional(),
    default_tags: z.array(TEXT).max(30).optional(),
    trend_country: z.string().regex(/^[A-Z]{2}$/).optional(),
    categories: z.array(TEXT).max(100).optional(),
    q: TEXT.optional(),
    tags: z.array(TEXT).max(30).optional(),
    source_id: ID.optional(),
    cursor: CURSOR,
    from: z.iso.date().optional(),
    source_cursor: CURSOR,
    seen_ids: IDS.optional()
  }).strict(),
  search: z.object({ q: TEXT.optional(), tags: z.array(TEXT).max(30).optional(), domains: z.array(TEXT).max(30).optional(), cursor: CURSOR }).strict(),
  story: z.object({ id: ID }).strict(),
  story_enrichment: z.object({ ids: z.array(ID).min(1).max(5) }).strict(),
  source: z.object({ id: ID }).strict(),
  coverage: z.object({ id: ID }).strict(),
  related: z.object({ id: ID, cursor: CURSOR }).strict(),
  signals: z.object({}).strict()
}

export type ActionName = keyof typeof ACTION_INPUTS
