# Beans UI Design

- Theme: minimalist coffee-bean foreground, dark charcoal background, matte finish, dark mode only.
- Product icons: `./public/*`.
- Dates: `N hrs ago` under 24 hours; `N days ago` from 24 hours to under 3 days; `MMM dd, YYYY` from 3 days onward.
- Counts: humanize trend, publisher, article, and related counts. Render social counts only when greater than zero.
- Trend score: show icons only: fire at 10,000+ with `Hot`, trending-up at 1,000+ with `Trending`, and activity below that; expose the corresponding label in a tooltip. Never render the numeric score. On home and category cards, place the trend indicator inline with the publish date; on other cards, keep it at the category row end.
- Confidence: show the corresponding low, medium, or high signal-strength icon in the existing error, warning, or success color. Expose the full `Low Confidence`, `Moderate Confidence`, or `High Confidence` label in a tooltip. Omit missing or unavailable values.
- Source favicon: configured favicon, Google favicon fallback, then system default. Do not show an image placeholder when an article has no image.
- Article social counts: show positive mentions, comments, and likes with icons; omit zero and missing values.
- Header: current date as `Weekday, MMM dd` with a softly glowing live indicator; centered Beans mark; Search, API, and Help improve Beans controls at the end.
- Category tabs: Now and category groups share one row. Scroll only within the tabs when they overflow; the page itself must not overflow horizontally.
- Footer: Feedback opens the same Help improve Beans Tally popup as the header control; Privacy, Terms, Cafecito, Publications, API, GitHub, and About remain links.
- Discovery: Now contains the Trending News heading, news cards and More only. Keep product explanations and methodology on About, and useful descriptive text in SEO metadata. Footer has one About link and no Archive, RSS or How it works links. Home/category/source initial content and article snapshot render on the server; confidence, favicons and full coverage enrich after hydration.
- Canonical site: `https://beans.cafecito.tech`; Fly duplicate host redirects permanently. There is no archive page or route. Search results are noindex,follow. Missing resources return 404/410; temporary upstream failures offer Retry with 503.
- Sharing: story-backed cards and detail pages default to Share Beans coverage; Share original article remains a separate choice using existing publisher attribution. Story-less cards share only the original. All six share controls use the currently selected URL; changing destination clears copy status. Shared Copy/social action icons use a softened #ccc foreground in both the feed-card dialog and article-detail footer.
- External links append `utm_source=beans.cafecito.tech` and `utm_medium=referral` when absent. Internal routes and same-origin URLs stay unchanged.

## Pages

- Home (`/`): trending news across all categories, five articles per batch, without promotional copy. Its Trending News heading uses the same wrapper and typography as category headings.
- About (`/about-beans`): product explanation, signal methodology and corrections. `/methodology` redirects permanently to the About methodology section.
- Category (`/categories/{category_slug}`): category heading, description and filtered article feed, without a Category eyebrow or archive link.
- Article (`/articles/{id}`): article snapshot, Coverage timeline, and Related list, without a Back to news button.
- Source (`/sources/{id}`): source snapshot and latest articles, without a Back to news button.
- Search (`/search`): semantic query `q`, comma-separated normalized `tags`, and comma-separated source domains. Topic spans the container; Tags and Sources share two columns from `md` and stack below it.

## Home, category, and source feeds

- Image-card summaries use near-white text and links over a stronger bottom gradient: opaque stone at the bottom, 85% opacity at 35% of image height, fading to transparent at 70%. Keep the upper image visible, the two-line clamp and summary-before-tags ordering.
- Home and category feeds share one vertical panel. Now requests five trending articles per batch without a category filter. Category batches request one trending article and four latest articles, with IDs from the other feed in `exclude_ids`. De-duplicate by article ID in the UI. If a feed is exhausted, fill the remaining batch from the other feed. One `More` button loads the next batch.
- Keep the existing two-day trending and seven-day latest date windows and category filters. Source feeds show latest items only, selected and checked by the source ID, five per page. Start with English news; on an empty API data array, omit content type, then omit language if still empty. Source pages separate the publisher snapshot and feed with a Nuxt USeparator instead of the Latest news heading.
- Article cards place the prominent source name and muted caption-size publish date on one row, with category below. Confidence, ideology, and trend icons appear in that order on the right at the same small size. Keep the title and optional linked image below. Available summaries use the shared MarkdownSummary renderer and clamp to two lines above entities/regions: over a usable image, or below the title when the image is absent or fails; put up to two entities and two regions over the image, or below the title when no usable image exists. Ideology retains a small L/R character beside its arrow. Confidence tooltips show only the confidence label. Confidence, ideology, and trend labels appear in tooltips; omit missing confidence and ideology.
- Link a source avatar and name to `/sources/{id}` only when a source ID is present. Article title navigation follows the existing story-ID rule: when `story_id` exists, open `/articles/{article.id}`; otherwise open the original article URL.
- Show up to five distinct other-publisher avatars through Nuxt UAvatarGroup from one story-articles request. Let UAvatarGroup provide its default avatar size, overlap, and ring. Place the avatars and positive `trend.related` count at the footer's left; align positive mentions, comments, likes, and the share button at the right. Omit zero and missing counts. Publisher avatar links require a source ID.
- The share trigger is a separate circular, neutral-colored soft button to the right of the informational social-count group. Its small icon remains icon-only, with a tooltip; the button background distinguishes the clickable action. The share modal offers Copy, X, LinkedIn, Reddit, Threads, and Email as six circular icon-only buttons in one row, with tooltips and accessible labels. Story-backed articles default to Beans coverage with a separate original-publisher choice. Every option uses the selected URL. Original mode replaces `utm_source` and `utm_medium` with `beans.cafecito.tech` and `referral` while preserving other query parameters and fragments. Hide the share button only when neither destination is usable.
- Source pages show the circular favicon overlapping the top edge of the publisher card, with details below and no separate banner or lighter banner background. Display the base URL without its scheme, preceded by a link icon; the outbound link retains its complete normalized URL.

## Article detail

- When every coverage article has a valid publication timestamp on the same UTC calendar day, collapse first/middle/last into one centered favicon group and one date label on the timeline. Deduplicate publisher icons, display at most five plus a remaining-source count, and open the existing source orbit for all articles on selection. Different or unknown dates retain the normal chronological layout.
- The snapshot omits the extra Original reporting/Published sentence. Keep the compact source/date row and original title link. Its footer has the ArticleCard divider/padding with direct Copy, X, LinkedIn, Reddit, Threads and Email actions aligned right. These actions share Beans coverage when available, otherwise the original publisher URL; feed cards retain their destination-selecting modal.
- Load the article snapshot from Beans `/articles/{id}` and its confidence by article ID. Reuse the card's source/date row, prominent source-name color, muted date caption, and equal-size confidence, ideology, trend icon group. Link the title to the publisher URL in a new tab, keep the summary directly after it at three lines, then show region/entity tags below the summary. When the summary is absent, tags follow the title. Place the image on the left as a hot link.
- Coverage uses similar articles in pages of 100 until pagination ends. Keep the first and last articles at the ends of a compact timeline. Group every intermediate article into chronological date-range chips: one on small screens, up to three on medium screens, and up to five on extra-large screens. Each multi-source chip shows a bounded UAvatarGroup sample with default styling and its unique-source count; selecting it opens a circular source orbit below, with the selected group's article count in the center. Use the open-orbit reference for up to eight articles and the avatar-wreath reference above eight; deduplicate sources and page wreaths at twelve sources so every source remains accessible. Use the existing dark coffee theme, source links, favicon fallbacks, and source-name/article-count tooltips. A group with one unique source renders a single favicon and date directly on the timeline, without a chip or count. The page must remain within the viewport at 320px.
- Related uses its own similar-article cursor in pages of five. Reuse the card source/favicon and publish-date row for each related item, followed by its linked title and existing positive social counts, with a `More` button.

## Search

- Keep the topic/tag/source inputs, URL synchronization, five-result pagination, news-only filter, and search API parameters. Render results with the same article card and enrichment as the other feeds.

## Category Map
tech-and-innovation:
  - artificial_intelligence_and_machine_learning
  - ai_ethics_and_governance
  - natural_language_processing
  - computer_vision_and_pattern_recognition
  - generative_ai_and_foundation_models
  - mlops_and_model_engineering
  - software_engineering_and_programming
  - web_development_and_internet_technologies
  - mobile_app_development
  - cloud_computing_and_distributed_systems
  - databases_and_data_engineering
  - devops_and_site_reliability
  - programming_languages_and_compilers
  - computer_hardware_and_architecture
  - semiconductor_design_and_fabrication
  - microprocessors_and_chipsets
  - high_performance_computing
  - consumer_electronics_and_gadgets
  - wearable_technology
  - internet_of_things_and_smart_devices
  - embedded_systems_and_firmware
  - robotics_and_autonomous_systems
  - industrial_automation_and_control_systems
  - mechatronics_and_motion_systems
  - drones_and_uncrewed_systems
  - aerospace_engineering
  - aircraft_systems_and_maintenance
  - space_industry_and_launch_systems
  - satellite_systems_and_space_operations
  - artificial_intelligence
  - software_and_data_engineering
  - computing_infrastructure_and_hardware
  - consumer_electronics_and_robotics
  - cybersecurity_and_threat_intelligence
  - privacy_engineering_and_data_protection
  - network_security_and_firewalls
  - identity_and_access_management
  - digital_forensics_and_incident_response
  - cybersecurity_and_privacy

business-and-markets:
  - business_and_management
  - entrepreneurship_and_startups
  - marketing_and_brand_strategy
  - sales_and_customer_growth
  - banking_and_finance
  - investment_and_capital_markets
  - accounting_and_auditing
  - employment_and_workplace
  - career_development_and_professional_skills
  - talent_acquisition_and_recruiting
  - human_resources_and_workforce_planning
  - leadership_and_organizational_development
  - blockchain_and_distributed_ledgers
  - cryptocurrency_and_digital_assets
  - decentralized_finance_and_web3
  - economics_accounting_and_finance
  - business_marketing_and_employment

science-and-health:
  - physics_and_physical_sciences
  - chemistry_and_materials_science
  - mathematics_and_statistics
  - engineering_and_applied_systems
  - nanotechnology_and_nanomaterials
  - scientific_research_methods
  - academic_research
  - human_biology_and_physiology
  - genetics_and_genomics
  - biotechnology_and_bioengineering
  - medical_research_and_healthcare_technology
  - pharmaceuticals_and_drug_development
  - public_health_and_epidemiology
  - infectious_diseases_and_immunity
  - health_and_wellness
  - biology_and_biotechnology
  - physical_sciences_and_mathematics

climate-and-energy:
  - climate_and_environmental_management
  - conservation_and_wildlife
  - earth_sciences_and_natural_resources
  - ocean_and_marine_science
  - water_resources_and_management
  - energy_solar_and_renewable_systems
  - earth_space_climate_and_environment
  - agriculture_and_food_production

world-and-politics:
  - government_and_politics
  - public_policy_and_administration
  - elections_and_voting
  - legal_system_and_justice
  - law_enforcement_and_public_safety
  - geopolitics_and_international_relations
  - politics_and_global_affairs
  - law_crime_and_public_safety
  - education_and_humanities
  - military_and_defense
  - homeland_security_and_safety
  - weaponry_and_military_technology

culture-and-lifestyle:
  - art_and_design
  - animation_and_visual_effects
  - film_and_cinema
  - music_and_music_industry
  - media_and_journalism
  - internet_culture_and_social_media
  - digital_communities_and_online_platforms
  - languages_and_linguistics
  - philosophy_religion_and_spirituality
  - anthropology_and_cultural_studies
  - human_rights_and_civil_liberties
  - diversity_equity_and_inclusion
  - gender_studies_and_identity
  - lgbtq_issues
  - migration_and_immigration
  - accessibility_and_disability
  - civil_rights_migration_and_society
  - history_and_archaeology
  - video_games_and_game_development
  - esports_and_competitive_gaming
  - virtual_reality_and_mixed_reality
  - interactive_entertainment_and_streaming
  - sports_and_athletics
  - television_and_streaming
  - home_and_lifestyle
  - interior_design_and_home_improvement
  - nutrition_food_and_supplements
  - body_and_health
  - elder_care_and_aging
  - child_and_family_care
  - reproductive_and_sexual_health
  - family_and_relationships
  - cannabis_and_cannabinoids
  - alcohol_and_beverages
  - gambling_and_betting
  - sports_and_recreation
  - arts_culture_media_and_entertainment
  - food_dining_and_travel
  - fashion_beauty_and_consumer_affairs
  - home_family_and_pets

industry-and-infrastructure:
  - logistics_and_supply_chain_management
  - transportation_and_mobility
  - freight_shipping_and_ports
  - warehousing_and_inventory_systems
  - fleet_operations_and_routing
  - aviation_and_air_transport
  - housing_and_real_estate
  - architecture_and_building_design
  - construction_and_infrastructure
  - industry_and_manufacturing
  - transportation_and_logistics
  - construction_housing_and_real_estate
