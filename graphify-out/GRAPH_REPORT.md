# Graph Report - .  (2026-09-04)

## Corpus Check
- 20 files · ~5,893 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 234 nodes · 240 edges · 31 communities (25 shown, 6 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Lint Tooling
- Feed Requirements
- Product Design Constraints
- Story Detail Route
- Story Card View
- CI Pipeline
- Beans API Client
- Category Taxonomy
- News Data Models
- Story Section
- Source Stack
- Delivery Worklog
- Production Dependencies
- API Integration
- Story Timeline
- Renovate Configuration
- Application Layout
- Category Route
- Category Settings
- API Proxies
- Home Route
- TypeScript Configuration
- Mention Logic
- Stories API Limitation

## God Nodes (most connected - your core abstractions)
1. `Category Taxonomy` - 10 edges
2. `CI Job` - 9 edges
3. `Beans UI Project Guidance` - 9 edges
4. `Beans UI Design Goal` - 9 edges
5. `scripts` - 7 edges
6. `Ignored Built Dependencies` - 6 edges
7. `Beans UI Working Log` - 6 edges
8. `Beans API` - 5 edges
9. `Coding Conventions` - 5 edges
10. `toNewsArticle()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `@tailwindcss/oxide` --semantically_similar_to--> `tailwindcss`  [INFERRED] [semantically similar]
  pnpm-workspace.yaml → package.json
- `Dependency Installation` --semantically_similar_to--> `pnpm Workspace Configuration`  [INFERRED] [semantically similar]
  .github/workflows/ci.yml → pnpm-workspace.yaml
- `vue-demi` --semantically_similar_to--> `Nuxt UI and Vue Stack`  [INFERRED] [semantically similar]
  pnpm-workspace.yaml → AGENTS.md
- `Category Tab` --semantically_similar_to--> `Category Tab Layout`  [INFERRED] [semantically similar]
  design/GOAL.md → AGENTS.md
- `Daily Top Stories` --semantically_similar_to--> `Top Headlines`  [INFERRED] [semantically similar]
  design/GOAL.md → AGENTS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CI Validation Pipeline** — github_workflows_ci_actions_checkout_v6, github_workflows_ci_pnpm_action_setup_v5, github_workflows_ci_actions_setup_node_v6, github_workflows_ci_dependency_installation, github_workflows_ci_lint_validation, github_workflows_ci_typecheck_validation [EXTRACTED 1.00]
- **News Item View Variants** — agents_compressed_news_item_view, agents_snapshot_news_item_view, agents_detailed_news_item_view [EXTRACTED 1.00]
- **Top-Level News Categories** — agents_technology_and_ai, agents_hardware_robotics_and_space, agents_security_privacy_and_defense, agents_business_finance_and_work, agents_transport_logistics_and_infrastructure, agents_science_health_and_medicine, agents_climate_environment_and_energy, agents_lifestyle_family_and_wellbeing, agents_culture_media_and_entertainment, agents_politics_law_and_world_affairs [EXTRACTED 1.00]

## Communities (31 total, 6 thin omitted)

### Community 0 - "Lint Tooling"
Cohesion: 0.10
Nodes (20): eslint, @nuxt/eslint, devDependencies, eslint, @nuxt/eslint, typescript, vue-tsc, name (+12 more)

### Community 1 - "Feed Requirements"
Cohesion: 0.14
Nodes (20): Category Tab Layout, Compressed News Item View, Detailed News Item View, Iterative Page Loading, Latest News, Snapshot News Item View, Three News Item Views, Top Headlines (+12 more)

### Community 2 - "Product Design Constraints"
Cohesion: 0.13
Nodes (18): Centralized Shared Style, Coding Conventions, Composable Typed Architecture, Dark Coffee and Charcoal Theme, Mobile Browser Experience, Nuxt UI Component Preference, Nuxt UI and Vue Stack, Beans UI Project Guidance (+10 more)

### Community 3 - "Story Detail Route"
Cohesion: 0.16
Nodes (15): appendArticles(), articles, articles_cursor, can_load_more_articles, error_message, { fetchArticleMentions, fetchStory, fetchStoryArticles }, loading_more_articles, loading_story (+7 more)

### Community 4 - "Story Card View"
Cohesion: 0.13
Nodes (12): has_trend, primary_category, primary_entity, primary_region, props, published_label, show_detailed_metadata, show_summary (+4 more)

### Community 5 - "CI Pipeline"
Cohesion: 0.18
Nodes (13): pnpm, actions/checkout v6, actions/setup-node v6, CI Job, CI Workflow, Dependency Installation, Lint Validation, Node.js 22 (+5 more)

### Community 6 - "Beans API Client"
Cohesion: 0.24
Nodes (10): ApiEnvelope, ApiQuery, articleToStory(), fetchBeansPage(), normaliseList(), normaliseSource(), pageFrom(), toNewsArticle() (+2 more)

### Community 7 - "Category Taxonomy"
Cohesion: 0.18
Nodes (11): Business Finance and Work, Category Taxonomy, Climate Environment and Energy, Culture Media and Entertainment, Hardware Robotics and Space, Lifestyle Family and Wellbeing, Politics Law and World Affairs, Science Health and Medicine (+3 more)

### Community 8 - "News Data Models"
Cohesion: 0.18
Nodes (10): BeansArticle, BeansPageParams, BeansStory, EspressoSignal, NewsArticle, NewsMention, NewsPage, NewsSource (+2 more)

### Community 9 - "Story Section"
Cohesion: 0.25
Nodes (8): emit, emitLoadMore(), is_carousel, props, skeleton_count, StorySectionMode, StorySectionProps, StorySectionVariant

### Community 10 - "Source Stack"
Cohesion: 0.22
Nodes (6): avatar_size, hidden_source_count, props, source_items, StorySource, StorySourceStackProps

### Community 11 - "Delivery Worklog"
Cohesion: 0.25
Nodes (9): Beans UI Working Log, Client-Side Category Groups, Cursor-Based Beans Feeds, Espresso Signal Cards, Home, Category, and Story Detail Routes, Independent Espresso Analysis Rail, Member Article and Mention Timelines, Reusable Compressed, Snapshot, and Detailed Story Views (+1 more)

### Community 12 - "Production Dependencies"
Cohesion: 0.22
Nodes (9): @iconify-json/lucide, @iconify-json/simple-icons, nuxt, @nuxt/ui, dependencies, @iconify-json/lucide, @iconify-json/simple-icons, nuxt (+1 more)

### Community 13 - "API Integration"
Cohesion: 0.32
Nodes (8): Beans API, Beans API Swagger Specification, Beans News and Trending Stories App, CAFECITO API Key Authentication, Espresso API, Espresso API Swagger Specification, Story Deduplication, Existing APIs

### Community 14 - "Story Timeline"
Cohesion: 0.25
Nodes (4): props, StoryTimelineProps, timeline_events, TimelineEvent

### Community 15 - "Renovate Configuration"
Cohesion: 0.25
Nodes (7): github>nuxt/renovate-config-nuxt, pnpmDedupe, extends, lockFileMaintenance, enabled, packageRules, postUpdateOptions

### Community 17 - "Category Route"
Cohesion: 0.50
Nodes (3): category, route, {
  top_headlines,
  latest_news,
  loading_top_headlines,
  loading_latest_news,
  can_load_more_top_headlines,
  can_load_more_latest_news,
  error_message,
  refreshFeed,
  loadMoreTopHeadlines,
  loadMoreLatestNews
}

### Community 18 - "Category Settings"
Cohesion: 0.67
Nodes (3): CATEGORY_GROUPS, findCategory(), NewsCategory

## Ambiguous Edges - Review These
- `Beans API` → `Story Deduplication`  [AMBIGUOUS]
  AGENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **115 isolated node(s):** `name`, `private`, `type`, `build`, `dev` (+110 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Beans API` and `Story Deduplication`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Beans UI Project Guidance` connect `Product Design Constraints` to `Feed Requirements`, `CI Pipeline`, `API Integration`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Production Dependencies` to `Lint Tooling`, `Product Design Constraints`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **What connects `name`, `private`, `type` to the rest of the system?**
  _115 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Lint Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Feed Requirements` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._
- **Should `Product Design Constraints` be split into smaller, more focused modules?**
  _Cohesion score 0.13071895424836602 - nodes in this community are weakly interconnected._