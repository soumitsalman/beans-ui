import type { LocationQuery } from 'vue-router'
import { normaliseTagInput } from './formatters'

export interface SearchRouteCriteria {
  query: string
  tags: string[]
}

function firstQueryValue(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] ?? '').trim()
  return typeof value === 'string' ? value.trim() : ''
}

export function searchCriteriaFromQuery(query: LocationQuery): SearchRouteCriteria {
  const _tags_param = query.tags

  return {
    query: firstQueryValue(query.q),
    tags: normaliseTagInput(
      Array.isArray(_tags_param)
        ? _tags_param.map(item => String(item ?? ''))
        : firstQueryValue(_tags_param)
    )
  }
}

export function toSearchRouteQuery(criteria: SearchRouteCriteria): Record<string, string> {
  const _query: Record<string, string> = {}
  if (criteria.query) _query.q = criteria.query
  if (criteria.tags.length) _query.tags = criteria.tags.join(',')
  return _query
}
