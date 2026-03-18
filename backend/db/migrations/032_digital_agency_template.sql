-- Digital Agency Template Pack

INSERT INTO setup_templates (name, industry, niche, description, template_type, config_json) VALUES
(
  'Digital Agency',
  'marketing',
  'digital_agency',
  'Full marketing system setup for digital agencies offering SEO, web design, Google Ads, social media marketing, and AI automation services.',
  'full_setup',
  '{
    "keywords": [
      "seo agency singapore",
      "digital marketing agency singapore",
      "web design singapore",
      "website development singapore",
      "google ads agency singapore",
      "local seo singapore",
      "technical seo singapore",
      "social media marketing singapore",
      "ppc agency singapore",
      "ai automation agency singapore"
    ],
    "content_topics": [
      "Why Your Business Needs a Digital Marketing Agency",
      "SEO vs PPC: Which Strategy Is Right for You",
      "How Much Does Web Design Cost in Singapore",
      "The Complete Guide to Local SEO for Singapore Businesses",
      "Technical SEO Checklist for 2025",
      "Social Media Marketing Strategies That Actually Work",
      "Google Ads Budget Guide for Small Businesses",
      "AI Automation for Marketing: What You Need to Know",
      "How to Choose the Right SEO Agency",
      "Case Study: How We Grew Organic Traffic by 300%",
      "Web Design Trends Singapore Businesses Should Know",
      "PPC vs SEO: A Data-Driven Comparison",
      "FAQ: Digital Marketing Services Explained",
      "Top 10 SEO Mistakes Singapore Businesses Make",
      "How AI Is Transforming Digital Marketing in 2025"
    ],
    "page_map": [
      {"slug": "seo-services", "title": "SEO Services", "description": "Dedicated page for organic search optimization services"},
      {"slug": "google-ads-services", "title": "Google Ads Management", "description": "PPC and paid search campaign management"},
      {"slug": "web-design-services", "title": "Web Design & Development", "description": "Custom website design and development"},
      {"slug": "social-media-marketing", "title": "Social Media Marketing", "description": "Social media strategy and management"},
      {"slug": "local-seo", "title": "Local SEO", "description": "Google Business Profile and local search optimization"},
      {"slug": "technical-seo", "title": "Technical SEO", "description": "Site speed, crawlability, and technical audits"},
      {"slug": "ai-automation-services", "title": "AI Automation", "description": "AI-powered marketing automation solutions"},
      {"slug": "case-studies", "title": "Case Studies", "description": "Client success stories and results"},
      {"slug": "pricing", "title": "Pricing", "description": "Transparent service packages and pricing"},
      {"slug": "contact", "title": "Contact Us", "description": "Lead capture and consultation booking"}
    ],
    "page_map_advice": "If your website currently combines multiple services on one page, break them into separate dedicated service pages for better SEO targeting and user experience.",
    "content_clusters": [
      {"cluster": "Service Pages", "topics": ["SEO Services", "Google Ads Management", "Web Design", "Social Media Marketing", "Local SEO", "Technical SEO", "AI Automation"]},
      {"cluster": "Pricing & Comparison", "topics": ["SEO Pricing Guide", "Web Design Pricing Breakdown", "SEO vs PPC Comparison", "Agency vs Freelancer Comparison"]},
      {"cluster": "Local Intent", "topics": ["Best Digital Marketing Agency Singapore", "Top SEO Company Singapore", "Web Design Company Near Me"]},
      {"cluster": "Case Studies", "topics": ["E-Commerce SEO Case Study", "Local Business Growth Case Study", "PPC ROI Case Study"]},
      {"cluster": "FAQ & AI Optimization", "topics": ["Digital Marketing FAQ", "SEO FAQ for Business Owners", "How Does Google Ads Work"]},
      {"cluster": "Authority Articles", "topics": ["State of Digital Marketing in Singapore", "SEO Trends 2025", "Future of AI in Marketing"]}
    ],
    "local_seo": {
      "categories": ["Marketing Agency", "Internet Marketing Service", "Web Designer"],
      "services": ["SEO", "Google Ads Management", "Web Design", "Social Media Marketing", "Content Marketing", "AI Automation"],
      "service_areas": ["Singapore"],
      "gbp_post_ideas": [
        "New case study: How we increased leads by 200% with SEO",
        "Free website audit — limited spots available this month",
        "Google Ads tips: 5 ways to reduce your cost per click",
        "Why every business needs a mobile-first website in 2025"
      ]
    },
    "ads_suggestions": [
      {"campaign": "SEO Services", "keywords": ["seo agency singapore", "seo services singapore", "seo company"], "budget_daily": 40, "ad_copy_angle": "Results-driven SEO with transparent reporting"},
      {"campaign": "Web Design", "keywords": ["web design singapore", "website development company"], "budget_daily": 35, "ad_copy_angle": "Modern, fast websites that convert visitors to customers"},
      {"campaign": "Google Ads Management", "keywords": ["google ads agency", "ppc management singapore"], "budget_daily": 30, "ad_copy_angle": "Maximize ROI with expert PPC management"},
      {"campaign": "Brand Awareness", "keywords": ["digital marketing agency singapore", "marketing company"], "budget_daily": 25, "ad_copy_angle": "Full-service digital marketing for growing businesses"}
    ],
    "crm_pipeline": [
      {"stage": "New Lead", "order": 1},
      {"stage": "Discovery Call", "order": 2},
      {"stage": "Proposal Sent", "order": 3},
      {"stage": "Follow Up", "order": 4},
      {"stage": "Won", "order": 5},
      {"stage": "Lost", "order": 6}
    ],
    "weekly_plan_defaults": [
      "Review keyword rankings and identify quick wins",
      "Publish 1-2 blog articles or service page updates",
      "Schedule social media posts for the week",
      "Monitor and optimize Google Ads campaigns",
      "Review and respond to Google Business Profile reviews",
      "Check analytics for traffic anomalies",
      "Follow up on open proposals and leads"
    ],
    "modules": ["seo", "content", "local_seo", "ads", "social", "creative", "crm", "analytics", "video"]
  }'
)
ON CONFLICT DO NOTHING;
