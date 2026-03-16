-- Seed industry templates

INSERT INTO setup_templates (name, industry, niche, description, template_type, config_json) VALUES
(
  'Renovation Contractor',
  'home_services',
  'renovation',
  'Complete SEO and marketing setup for renovation and home improvement contractors.',
  'full_setup',
  '{
    "keywords": ["renovation contractor", "home renovation services", "kitchen renovation", "bathroom renovation", "HDB renovation", "condo renovation", "landed house renovation", "renovation cost singapore", "interior renovation", "renovation package"],
    "content_topics": ["Ultimate Guide to HDB Renovation", "Kitchen Renovation Cost Breakdown", "How to Choose a Renovation Contractor", "Top Renovation Trends This Year", "Bathroom Renovation Ideas on a Budget"],
    "local_seo": {"categories": ["General Contractor", "Home Improvement Store"], "services": ["Kitchen Renovation", "Bathroom Renovation", "Full Home Renovation", "HDB Renovation"], "service_areas": ["Singapore"]},
    "ads_suggestions": [{"campaign": "Renovation Services", "keywords": ["renovation contractor near me", "home renovation quote"], "budget_daily": 30}],
    "modules": ["seo", "content", "local_seo", "ads", "social", "crm"]
  }'
),
(
  'Interior Design Studio',
  'design',
  'interior_design',
  'Marketing setup for interior design firms and studios.',
  'full_setup',
  '{
    "keywords": ["interior design singapore", "interior designer", "HDB interior design", "condo interior design", "modern interior design", "minimalist interior design", "scandinavian interior design", "interior design package", "interior design cost", "best interior designer"],
    "content_topics": ["Interior Design Styles Explained", "How Much Does Interior Design Cost", "Small Space Interior Design Tips", "Choosing the Right Interior Designer", "Color Trends for Home Interiors"],
    "local_seo": {"categories": ["Interior Designer"], "services": ["Residential Interior Design", "Commercial Interior Design", "Space Planning"], "service_areas": ["Singapore"]},
    "ads_suggestions": [{"campaign": "Interior Design", "keywords": ["interior designer near me", "interior design quote"], "budget_daily": 25}],
    "modules": ["seo", "content", "local_seo", "social", "creative", "crm"]
  }'
),
(
  'Tuition Center',
  'education',
  'tuition',
  'Complete digital marketing setup for tuition centers and enrichment programs.',
  'full_setup',
  '{
    "keywords": ["tuition centre singapore", "math tuition", "english tuition", "science tuition", "primary school tuition", "secondary school tuition", "O level tuition", "A level tuition", "tuition centre near me", "best tuition centre"],
    "content_topics": ["How to Choose the Right Tuition Centre", "Benefits of Small Group Tuition", "Preparing for PSLE Exams", "O Level Study Tips", "When Does Your Child Need Tuition"],
    "local_seo": {"categories": ["Tutoring Service", "Education Center"], "services": ["Math Tuition", "English Tuition", "Science Tuition", "PSLE Preparation"], "service_areas": ["Singapore"]},
    "ads_suggestions": [{"campaign": "Tuition Enrollment", "keywords": ["tuition centre near me", "math tuition singapore"], "budget_daily": 20}],
    "modules": ["seo", "content", "local_seo", "social", "ads", "crm"]
  }'
),
(
  'Dental Clinic',
  'healthcare',
  'dental',
  'Marketing setup for dental clinics and dental practices.',
  'full_setup',
  '{
    "keywords": ["dentist singapore", "dental clinic near me", "teeth whitening", "dental implant", "braces cost singapore", "wisdom tooth extraction", "root canal treatment", "dental checkup", "invisalign singapore", "best dentist"],
    "content_topics": ["Complete Guide to Dental Implants", "How Often Should You Visit the Dentist", "Teeth Whitening Options Compared", "Invisalign vs Traditional Braces", "What to Expect During a Root Canal"],
    "local_seo": {"categories": ["Dentist", "Dental Clinic"], "services": ["General Dentistry", "Teeth Whitening", "Dental Implants", "Braces", "Wisdom Tooth Extraction"], "service_areas": ["Singapore"]},
    "ads_suggestions": [{"campaign": "Dental Services", "keywords": ["dentist near me", "dental clinic appointment"], "budget_daily": 35}],
    "modules": ["seo", "content", "local_seo", "ads", "social", "crm"]
  }'
),
(
  'Law Firm',
  'legal',
  'law_firm',
  'Digital marketing setup for law firms and legal practices.',
  'full_setup',
  '{
    "keywords": ["lawyer singapore", "law firm", "divorce lawyer", "criminal lawyer", "corporate lawyer", "employment lawyer", "personal injury lawyer", "family lawyer", "legal advice singapore", "best lawyer"],
    "content_topics": ["What to Look for in a Lawyer", "Understanding Divorce Proceedings", "Employment Rights in Singapore", "When to Hire a Corporate Lawyer", "How Legal Fees Work in Singapore"],
    "local_seo": {"categories": ["Law Firm", "Lawyer"], "services": ["Corporate Law", "Family Law", "Criminal Law", "Employment Law", "Personal Injury"], "service_areas": ["Singapore"]},
    "ads_suggestions": [{"campaign": "Legal Services", "keywords": ["lawyer near me", "legal consultation"], "budget_daily": 40}],
    "modules": ["seo", "content", "local_seo", "ads", "crm"]
  }'
),
(
  'General SME Services',
  'services',
  'general_sme',
  'Versatile marketing setup for small and medium service businesses.',
  'full_setup',
  '{
    "keywords": ["services near me", "professional services", "best service provider", "affordable services", "trusted company", "local business", "service quality", "customer reviews", "service quote", "contact us"],
    "content_topics": ["Why Choose a Local Service Provider", "How to Get the Best Service Quote", "Customer Service Best Practices", "Growing Your Service Business Online", "Building Trust with Reviews"],
    "local_seo": {"categories": ["Business Service"], "services": ["Consultation", "Service Delivery", "Customer Support"], "service_areas": ["Singapore"]},
    "ads_suggestions": [{"campaign": "Service Awareness", "keywords": ["services near me", "get a quote"], "budget_daily": 15}],
    "modules": ["seo", "content", "local_seo", "social", "crm"]
  }'
)
ON CONFLICT DO NOTHING;
