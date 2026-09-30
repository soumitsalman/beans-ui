# Beans UI Design

- Theme: minimalist coffee-bean foreground, dark charcoal background, matte finish, dark mode only.
- Product icons: `./public/*`.
- Dates: `N hrs ago` under 24 hours; `N days ago` from 24 hours to under 3 days; `MMM dd, YYYY` from 3 days onward.
- Counts: humanize trend, publisher, article, and related counts. Render social counts only when greater than zero.
- Trend score: show icons only: fire at 10,000+ with `Hot`, trending-up at 1,000+ with `Trending`; other scores have no visible label. Never render the numeric score. On home and category cards, place the trend indicator inline with the publish date; on other cards, keep it at the category row end.
- Confidence: retain the `High Confidence`, `Moderate Confidence`, and `Low Confidence` Espresso labels and tooltip. Omit missing or unavailable values.
- Source favicon: configured favicon, Google favicon fallback, then system default. Do not show an image placeholder when an article has no image.
- Article social counts: show positive mentions, comments, and likes with icons; omit zero and missing values.
- Header: current date as `Weekday, MMM dd` with a softly glowing live indicator; centered Beans mark; Search, API, and Help improve Beans controls at the end.
- Category tabs: Now and category groups share one row. Scroll only within the tabs when they overflow; the page itself must not overflow horizontally.
- Footer: Cafecito, Publications, API, GitHub, and About links.
- External links append `utm_source=beans.cafecito.tech` and `utm_medium=referral` when absent. Internal routes and same-origin URLs stay unchanged.

## Pages

- Home (`/`): all-category article feed.
- Category (`/categories/{category_slug}`): category description and filtered article feed.
- Article (`/articles/{id}`): article snapshot, Coverage timeline, and Related list.
- Source (`/sources/{id}`): source snapshot and latest articles.
- Search (`/search`): semantic query `q` and normalized tag `tags`; Space commits a tag. Publisher sources are not a search filter.

## Home, category, and source feeds

- Home and category feeds share one vertical panel. Each batch requests one trending article and four latest articles, with IDs from the other feed in `exclude_ids`. De-duplicate by article ID in the UI. If a feed is exhausted, fill the remaining batch from the other feed. One `More` button loads the next batch.
- Keep the existing two-day trending and seven-day latest date windows and category filters. Source feeds show latest items only, selected by the source domain and checked against the source ID, five per page.
- Article cards show source avatar/name and publish time, category and title, trend icon, confidence label, and an optional image linked to its image URL. Put up to two entities and two regions over the image. Append the confidence badge and then `Leans Left` or `Leans Right` to the title. Give the outlined blue/red ideology badge the same size and rounded shape as confidence. Use inline text spacing so either badge starts flush with the title when it wraps to another line. Omit either badge when its value is missing or empty.
- Link a source avatar and name to `/sources/{id}` only when a source ID is present. Article title navigation follows the existing story-ID rule: when `story_id` exists, open `/articles/{article.id}`; otherwise open the original article URL.
- Show up to five distinct other-publisher avatars from the similar-articles feed without a text heading. Show a files icon followed by the `trend.related` count in the same compact row as positive mentions, comments, and likes; omit each zero or missing count. Publisher avatar links also require a source ID.
- Source pages use a header banner with the circular favicon overlapping its lower edge. Display the base URL without its scheme, preceded by a link icon; the outbound link retains its complete normalized URL.

## Article detail

- Load the article snapshot from Beans `/articles/{id}` and its confidence by article ID. Keep the existing detailed snapshot content and place the image on the left as a hot link.
- Coverage uses similar articles in pages of 100 until pagination ends. Keep the first and last articles at the ends of a compact timeline. Group every intermediate article into chronological date-range chips: one on small screens, up to three on medium screens, and up to five on extra-large screens. Each chip shows a bounded set of distinct source favicons and its article count; selecting it opens a height-limited, scrollable list of all articles in that group below the timeline. The page must remain within the viewport at 320px.
- Related uses its own similar-article cursor in pages of five. Keep the existing source favicon, title, and positive social-count row with a `More` button.

## Search

- Keep the existing query/tag input, URL synchronization, five-result pagination, news-only filter, and search API parameters. Render results with the same article card and enrichment as the other feeds.

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

world-politics-and-society:
  - government_and_politics
  - public_policy_and_administration
  - elections_and_voting
  - legal_system_and_justice
  - law_enforcement_and_public_safety
  - human_rights_and_civil_liberties
  - diversity_equity_and_inclusion
  - gender_studies_and_identity
  - lgbtq_issues
  - migration_and_immigration
  - accessibility_and_disability
  - geopolitics_and_international_relations
  - politics_and_global_affairs
  - law_crime_and_public_safety
  - civil_rights_migration_and_society
  - education_and_humanities

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

security-and-defense:
  - military_and_defense
  - homeland_security_and_safety
  - weaponry_and_military_technology

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
