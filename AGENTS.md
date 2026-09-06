# Project: Beans UI
Beans is a news and trending stories tracking app. It reads data feed from Beans API and Espresso API.
- Platform: Web App, optimized for mobile browser experience
- Focus: UI ONLY | Exclude API & Backend Work
- Follow [DATASOURCES](./design/DATASOURCES.md) for skills to fetch data
- Follow [DESIGN](./design/DESIGN.md) for UI design instruction
- Follow [VERIFICATIONS](./design/VERIFICATIONS.md) for thinking through success criteria and inspecting failure modes. think through success criteria and failure modes -> build verification cases -> build guard-rails around failure modes -> implement solution -> verify
- Maintain [WORKLOG](./design/WORKLOG.md) with change details
- Use graphifyy to comprehend code

## Tech Stack
- nuxt, nuxt/@ui, vue: https://ui.nuxt.com/docs/components
- tailwindcss
- pnpm

## Coding Guidelines: Strict Adherence
- public variables/fields: lower_snake_case
- private variables/fields: _prefix_with_underscore_lower_snake_case
- consts: UPPER_SNAKE_CASE
- functions/methods: camelCase
- classes/types/view models: PascalCase
- compact, concise, composables, typed
- separate structure and files for data model, view model, style/color
- single responsibility principle, plug-and-play
- preference: use external utility libraries instead of writing custom code
- preference: use external libraries for humanizing dates and counts instead of creating custom code
- preference: 1st party nuxt@ui components, avoid basicHTML tags
- preference: use tailwindcss, avoid custom css
- preference: use centralized shareable style, avoid per-component scoped style
