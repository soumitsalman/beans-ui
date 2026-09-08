import { CATEGORY_GROUPS } from '../../app/settings/categories'

export default defineEventHandler((event) => {
  const runtime_config = useRuntimeConfig(event)
  const site_url = runtime_config.public.site_url.replace(/\/+$/, '')
  const category_links = CATEGORY_GROUPS
    .map(category => `- [${category.label}](${site_url}/categories/${category.slug}) — ${category.description}`)
    .join('\n')

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')

  return `# Beans

> Beans is Project Cafecito's web news-discovery app. It groups current and trending publisher reporting into related stories, preserves source context, and links readers to original coverage.

## What Beans does

- Presents concise snapshots of publisher reporting; it does not republish complete articles.
- Groups related coverage so readers can inspect the sources and supporting reporting around a story.
- Uses engagement signals and cross-publisher coverage for discovery context. These signals are not a claim that a story is true, complete, or independently verified.
- Provides current news, broad categories, story coverage, chronology, and semantic search in the web interface.

## Canonical pages

- [Live news](${site_url}/)
- [About Beans](${site_url}/about-beans)
- [Sitemap](${site_url}/sitemap.xml)
- [Robots directives](${site_url}/robots.txt)

## Categories

${category_links}

## Programmatic and AI use

- [Beans API documentation](https://developer.cafecito.tech/products/beans) is the canonical surface for API access, filters, semantic search, trend signals, and MCP workflows.
- The web interface is a focused view of the broader Beans API dataset.
- For freshness-sensitive work, retrieve current data through the API rather than assuming this guide or a cached page reflects the latest reporting.

## Product context

- [Project Cafecito](https://cafecito.tech) builds API-first tools for focused information and operational workflows.
- [Espresso](https://espresso.cafecito.tech) is a separate Cafecito product for business intelligence and editorial analysis; it is not original publisher reporting.
`
})
