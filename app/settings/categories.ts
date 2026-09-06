export interface NewsCategory {
  slug: string
  label: string
  description: string
  category_values: string[]
}

export const CATEGORY_GROUPS: NewsCategory[] = [
  {
    slug: 'technology',
    label: 'Technology',
    description: 'AI, software, data, cloud, and the systems shaping them.',
    category_values: [
      'artificial_intelligence_and_machine_learning',
      'ai_ethics_and_governance',
      'natural_language_processing',
      'computer_vision_and_pattern_recognition',
      'generative_ai_and_foundation_models',
      'mlops_and_model_engineering',
      'software_engineering_and_programming',
      'web_development_and_internet_technologies',
      'mobile_app_development',
      'cloud_computing_and_distributed_systems',
      'databases_and_data_engineering',
      'devops_and_site_reliability',
      'programming_languages_and_compilers'
    ]
  },
  {
    slug: 'robotics',
    label: 'Hardware, Robotics & Space',
    description: 'Chips, machines, mobility, aerospace, and exploration.',
    category_values: [
      'computer_hardware_and_architecture',
      'semiconductor_design_and_fabrication',
      'microprocessors_and_chipsets',
      'high_performance_computing',
      'consumer_electronics_and_gadgets',
      'wearable_technology',
      'internet_of_things_and_smart_devices',
      'embedded_systems_and_firmware',
      'robotics_and_autonomous_systems',
      'industrial_automation_and_control_systems',
      'mechatronics_and_motion_systems',
      'drones_and_uncrewed_systems',
      'aerospace_engineering',
      'aircraft_systems_and_maintenance',
      'space_industry_and_launch_systems',
      'satellite_systems_and_space_operations'
    ]
  },
  {
    slug: 'security',
    label: 'Security',
    description: 'Cybersecurity, privacy, safety, and defense technology.',
    category_values: [
      'cybersecurity_and_threat_intelligence',
      'privacy_engineering_and_data_protection',
      'network_security_and_firewalls',
      'identity_and_access_management',
      'digital_forensics_and_incident_response',
      'military_and_defense',
      'homeland_security_and_safety',
      'weaponry_and_military_technology'
    ]
  },
  {
    slug: 'business',
    label: 'Business',
    description: 'Markets, companies, careers, and the changing economy.',
    category_values: [
      'business_and_management',
      'entrepreneurship_and_startups',
      'marketing_and_brand_strategy',
      'sales_and_customer_growth',
      'banking_and_finance',
      'investment_and_capital_markets',
      'accounting_and_auditing',
      'employment_and_workplace',
      'career_development_and_professional_skills',
      'talent_acquisition_and_recruiting',
      'human_resources_and_workforce_planning',
      'leadership_and_organizational_development'
    ]
  },
  {
    slug: 'transport-logistics-and-infrastructure',
    label: 'Logistics',
    description: 'Supply chains, cities, construction, and movement.',
    category_values: [
      'logistics_and_supply_chain_management',
      'transportation_and_mobility',
      'freight_shipping_and_ports',
      'warehousing_and_inventory_systems',
      'fleet_operations_and_routing',
      'aviation_and_air_transport',
      'housing_and_real_estate',
      'architecture_and_building_design',
      'construction_and_infrastructure'
    ]
  },
  {
    slug: 'science-health-and-medicine',
    label: 'Science',
    description: 'Research, biology, medicine, and scientific discovery.',
    category_values: [
      'physics_and_physical_sciences',
      'chemistry_and_materials_science',
      'mathematics_and_statistics',
      'engineering_and_applied_systems',
      'nanotechnology_and_nanomataterials',
      'scientific_research_methods',
      'academic_research',
      'human_biology_and_physiology',
      'genetics_and_genomics',
      'biotechnology_and_bioengineering',
      'medical_research_and_healthcare_technology',
      'pharmaceuticals_and_drug_development',
      'public_health_and_epidemiology',
      'infectious_diseases_and_immunity'
    ]
  },
  {
    slug: 'climate-environment-and-energy',
    label: 'Climate',
    description: 'Climate, natural systems, resources, and energy.',
    category_values: [
      'climate_and_environmental_management',
      'conservation_and_wildlife',
      'earth_sciences_and_natural_resources',
      'ocean_and_marine_science',
      'water_resources_and_management',
      'energy_solar_and_renewable_systems'
    ]
  },
  {
    slug: 'lifestyle-family-and-wellbeing',
    label: 'Lifestyle',
    description: 'Home, family, health, food, and personal life.',
    category_values: [
      'home_and_lifestyle',
      'interior_design_and_home_improvement',
      'nutrition_food_and_supplements',
      'body_and_health',
      'elder_care_and_aging',
      'child_and_family_care',
      'reproductive_and_sexual_health',
      'family_and_relationships',
      'cannabis_and_cannabinoids',
      'alcohol_and_beverages',
      'gambling_and_betting'
    ]
  },
  {
    slug: 'culture',
    label: 'Culture',
    description: 'Arts, media, communities, games, and entertainment.',
    category_values: [
      'art_and_design',
      'animation_and_visual_effects',
      'film_and_cinema',
      'music_and_music_industry',
      'media_and_journalism',
      'internet_culture_and_social_media',
      'digital_communities_and_online_platforms',
      'languages_and_linguistics',
      'philosophy_religion_and_spirituality',
      'anthropology_and_cultural_studies',
      'history_and_archaeology',
      'video_games_and_game_development',
      'esports_and_competitive_gaming',
      'virtual_reality_and_mixed_reality',
      'interactive_entertainment_and_streaming'
    ]
  },
  {
    slug: 'politics',
    label: 'Politics',
    description: 'Government, law, public life, and global affairs.',
    category_values: [
      'government_and_politics',
      'public_policy_and_administration',
      'elections_and_voting',
      'legal_system_and_justice',
      'law_enforcement_and_public_safety',
      'human_rights_and_civil_liberties',
      'diversity_equity_and_inclusion',
      'gender_studies_and_identity',
      'lgbtq_issues',
      'migration_and_immigration',
      'accessibility_and_disability',
      'geopolitics_and_international_relations',
      'blockchain_and_distributed_ledgers',
      'cryptocurrency_and_digital_assets',
      'decentralized_finance_and_web3'
    ]
  }
]

export function findCategory(slug: string): NewsCategory | undefined {
  return CATEGORY_GROUPS.find(category => category.slug === slug)
}
