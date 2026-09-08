# Beans UI Design
- Theme & Color: Modern, Minimalist, Coffee Bean Foreground, Dark Charcoal Background, Matte Finish, Dark Mode ONLY
- Product Icons: ./public/*
- Dates: humanize | N hrs ago < 24 hrs | N days ago >= 24 hrs and < 3 days | MMM dd, YYYY >= 3 days ago
- Counts: humanize trend.likes, trend.mentions, trend.shares, sources count, articles count
- Trend Score: humaize using icons. fire >= 10000, trending_up >= 1000. Render icon ONLY instead of trend_score value
- Trend Likes, Shares, Comments: render ONLY if value > 0
- Source Favicon: Use system default if not determined
- Article Image: Excude if not exists. Avoid system default
- Header: | {current_date as `Weekday, MMM dd` with a live-indicator icon that has a slight primary glow} (justify start) | {beans_favicon} Beans - (justify-center) | [search_button](/search) [api_button](https://developer.cafecito.tech/products/beans) [contact_button](https://developer.cafecito.tech/contact) - (justify-end) |
- Category tabs: Now + category groups in one row across the content column (`justify-between`). Horizontal scroll only inside the tab row when they overflow; no page-level overflow.
- Footer: [Cafecito](https://cafecito.tech) | [Publications](https://espresso.cafecito.tech) | [API](https://developer.cafecito.tech) | [Github](https://github.com/soumitsalman/beans-ui) | [About](/about-beans)

## Pages
- Home page: shows all news/stories/articles irrespective of category | route `/`
- Category page: shows news/stories/articles from that category | route `/categories/{category_slug}`
- Story page: shows details of that story like title, summary, tags, propagation, related news | route `/stories/{story_id}`
- Search page: search news/articles using semmantic search, tags, sources | route `/search`

### Home Page & Category Page
- Top Headlines: Carousel titled Trending. Exclude if empty. Fetch more when user reaches end of loaded carousel. Allow arrow and gesture scrolling. Visible slides by Tailwind viewport: 1 below `md` (xs/sm), 2 at `md` and above (`md`, `lg`, `xl`). Use next_cursor to load more items when scolling reaches the last item.
- Latest news: List titled Just In. Exclude if empty. Columns by Tailwind viewport: 1 below `md` (xs/sm), 2 at `md` and above (`md`, `lg`, `xl`). Include a `More` button at the end of the list - fetch more items using next_cursor when clicked.
- news item: click navigate_to_story_page("/stories/{article.story_id}") if story_id != null and story_id != missing else navigate_to_original_article(article.url)
- news item: show sources of the the article itself and the similar articles. show <=5 favicons as avatar group + total distinct sources count

#### Layout

```
Trending

+---------------------------------------+
| image if exists                       |
+---------------------------------------+
| categories[0]     date trend_score    |
+---------------------------------------+   --> (click fetches more) 
| title (Bold or Emphasized)            |
| 2-entities 2-regions as tags          |
+---------------------------------------+
| source_favicons_group N sources       |
+---------------------------------------+

---[divider]---

Just In

+-----------------------------------------------------------------------
| image if exists | categories[0]          date trend_score
|                 | title (Bold emphasized)
|                 | 2-entities 2-regions
|                 | summary 2-line truncated
+-----------------------------------------------------------------------
| source_favicons_group N sources |         icon+count mentions, likes, comments (no word labels)
+-----------------------------------------------------------------------
... more items
+---------------+
| More Button   |
+---------------+
```

### Story Page
- Story title, category, regions, entities, last_published_at, summary | use title and summary of which ever top article has both. article_count and source_count sit on the category/date row, right-aligned (`justify-end`), only when each value is > 0.
- Propagation: timeline of (published_at, source_favicon) | show 5 items including the first_published_at and last_published_at. If there are more than 5 group the sources in between. The timeline spans the story column (`w-full`, equal flex columns) with no inner horizontal scroll.
- Coverage (articles_count): List of articles in that story. Limit=5. Use Use next_cursor to fetch more when needed. Latest first. Click goes to article.url

#### Layout

```
[categories[0]] last_published_at          article_count sources_count
title (H3)
summary
3 regions, 3 entities

---(divider)

Propagation

[favicon] ----- [favicon] ----- [favicon] ----- [favicon]
date            date            date            date

---(divider)

Coverage

+------------------------------------------------------------
| source_favicon | source_label     | shares, likes, comments
|                | title            |
+------------------------------------------------------------
... more items
+---------------+
| More Button   |
+---------------+
```

## Category Map
technology_and_ai:
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

hardware_robotics_and_space:
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

security_privacy_and_defense:
  - cybersecurity_and_threat_intelligence
  - privacy_engineering_and_data_protection
  - network_security_and_firewalls
  - identity_and_access_management
  - digital_forensics_and_incident_response
  - military_and_defense
  - homeland_security_and_safety
  - weaponry_and_military_technology

business_finance_and_work:
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

transport_logistics_and_infrastructure:
  - logistics_and_supply_chain_management
  - transportation_and_mobility
  - freight_shipping_and_ports
  - warehousing_and_inventory_systems
  - fleet_operations_and_routing
  - aviation_and_air_transport
  - housing_and_real_estate
  - architecture_and_building_design
  - construction_and_infrastructure

science_health_and_medicine:
  - physics_and_physical_sciences
  - chemistry_and_materials_science
  - mathematics_and_statistics
  - engineering_and_applied_systems
  - nanotechnology_and_nanomataterials
  - scientific_research_methods
  - academic_research
  - human_biology_and_physiology
  - genetics_and_genomics
  - biotechnology_and_bioengineering
  - medical_research_and_healthcare_technology
  - pharmaceuticals_and_drug_development
  - public_health_and_epidemiology
  - infectious_diseases_and_immunity

climate_environment_and_energy:
  - climate_and_environmental_management
  - conservation_and_wildlife
  - earth_sciences_and_natural_resources
  - ocean_and_marine_science
  - water_resources_and_management
  - energy_solar_and_renewable_systems

lifestyle_family_and_wellbeing:
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

culture_media_and_entertainment:
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

politics_law_and_world_affairs:
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
  - blockchain_and_distributed_ledgers
  - cryptocurrency_and_digital_assets
  - decentralized_finance_and_web3