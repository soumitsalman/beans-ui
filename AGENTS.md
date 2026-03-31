# Project Name: Beans by Project Cafecito
Beans is a news and blogs aggregator. This specific project is UI part of the overall product. The UI is modeled as a smart RSS feed reader that presents contents based on user preference. For data, it uses already operational Beans API & MCP (link and api key provided as environment variable in `.env` file)

## Tech Stack
nuxt, pnpm, nuxt/@ui, vue, tailwindcss

## Development Guideline
### Code Guideline
- public variables/fields: lower_snake_case
- private variables/fields: _prefix_with_underscore_lower_snake_case
- consts: UPPER_SNAKE_CASE
- functions/methods: camelCase
- classes/types/view models: PascalCase
- compact, concise, composables, typed
- separate data model, view model, style/color
- single responsibility principle, plug-and-play
- maximize: use of built-in and imported 3rd party libraries (ex: nuxt/@ui, tailwindcss)
- minimize: basic HTML composition, custom css, scoped css

### Data Models
Source: `app/types/`
- Bean, BeanTrend, BeanExtended - represents an atomic news/blog item. `url` as unique id
- Publisher - represents a source ex: technewsdaily, cryptopulseweekly. `source` as unique id. Maps to `source` field in Bean, BeanTrends, BeanExtended
- Chatter - represents social trend data of a Bean, mapped using `url` field

## Theme & Color
Modern, Minimalist, Dark Coffee Bean, Dark Mode ONLY