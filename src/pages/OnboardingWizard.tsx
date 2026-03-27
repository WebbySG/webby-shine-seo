import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useTemplates, useCreateClient } from "@/hooks/use-api";
import { Building2, Globe, Target, Users, Link2, LayoutTemplate, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Rocket, FileText, MapPin, Megaphone, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { label: "Business Basics", icon: Building2 },
  { label: "Website & CMS", icon: Globe },
  { label: "Services & Goals", icon: Target },
  { label: "Competitors", icon: Users },
  { label: "Channels", icon: Link2 },
  { label: "Template", icon: LayoutTemplate },
  { label: "Review & Confirm", icon: CheckCircle2 },
];

const INDUSTRIES = [
  { value: "marketing", label: "Marketing / Agency" },
  { value: "home_services", label: "Home Services" },
  { value: "design", label: "Design" },
  { value: "education", label: "Education" },
  { value: "healthcare", label: "Healthcare" },
  { value: "legal", label: "Legal" },
  { value: "services", label: "General Services" },
  { value: "ecommerce", label: "E-Commerce" },
  { value: "technology", label: "Technology" },
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "real_estate", label: "Real Estate" },
];

const CMS_TYPES = [
  { value: "wordpress", label: "WordPress" },
  { value: "shopify", label: "Shopify" },
  { value: "webflow", label: "Webflow" },
  { value: "squarespace", label: "Squarespace" },
  { value: "custom", label: "Custom / Other" },
  { value: "none", label: "No CMS" },
];

const CHANNELS = [
  { key: "gsc", label: "Google Search Console" },
  { key: "ga4", label: "Google Analytics (GA4)" },
  { key: "gbp", label: "Google Business Profile" },
  { key: "google_ads", label: "Google Ads" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "tiktok", label: "TikTok" },
];

interface WizardData {
  business_name: string;
  website_url: string;
  industry: string;
  niche: string;
  target_location: string;
  primary_services: string;
  business_goals: string;
  preferred_channels: string[];
  cms_type: string;
  competitors: string;
  existing_channels: string[];
  template_id: string;
}

const initialData: WizardData = {
  business_name: "",
  website_url: "",
  industry: "",
  niche: "",
  target_location: "",
  primary_services: "",
  business_goals: "",
  preferred_channels: [],
  cms_type: "",
  competitors: "",
  existing_channels: [],
  template_id: "",
};

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const navigate = useNavigate();
  const templatesQuery = useTemplates(data.industry || undefined);
  const createClient = useCreateClient();

  const update = (fields: Partial<WizardData>) => setData((d) => ({ ...d, ...fields }));

  const selectedTemplate = templatesQuery.data?.find((t: any) => t.id === data.template_id);

  const canNext = () => {
    switch (step) {
      case 0: return !!data.business_name && !!data.industry;
      case 1: return !!data.website_url;
      case 2: return !!data.primary_services;
      case 5: return !!data.template_id;
      default: return true;
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      let domain = data.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const client = await createClient.mutateAsync({ name: data.business_name, domain });
      toast.success("Setup complete! Your marketing system is ready.");
      navigate(`/clients/${client.id}`);
    } catch (e: any) {
      toast.error(e.message || "Setup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm px-4 py-4 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Setup Wizard</h1>
              <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>Skip for now</Button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 md:px-8 pt-4">
        <div className="max-w-4xl mx-auto">
          <Progress value={progress} className="h-1.5" />
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => i < step && setStep(i)}
                className={`flex flex-col items-center gap-1 text-xs transition-colors ${
                  i === step ? "text-primary font-medium" : i < step ? "text-muted-foreground cursor-pointer hover:text-foreground" : "text-muted-foreground/50"
                }`}
              >
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs transition-all ${
                  i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-3.5 w-3.5" />}
                </div>
                <span className="hidden md:block">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-4 md:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          {step === 0 && (
            <StepCard title="Business Basics" description="Tell us about your business.">
              <div className="space-y-4">
                <Field label="Business Name" required>
                  <Input placeholder="e.g. Webby Digital Agency" value={data.business_name} onChange={(e) => update({ business_name: e.target.value })} />
                </Field>
                <Field label="Industry" required>
                  <Select value={data.industry} onValueChange={(v) => update({ industry: v })}>
                    <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Niche (optional)">
                  <Input placeholder="e.g. digital agency, performance marketing" value={data.niche} onChange={(e) => update({ niche: e.target.value })} />
                </Field>
                <Field label="Target Location">
                  <Input placeholder="e.g. Singapore" value={data.target_location} onChange={(e) => update({ target_location: e.target.value })} />
                </Field>
              </div>
            </StepCard>
          )}

          {step === 1 && (
            <StepCard title="Website & CMS" description="Your website and content management setup.">
              <div className="space-y-4">
                <Field label="Website URL" required>
                  <Input placeholder="https://www.example.com" value={data.website_url} onChange={(e) => update({ website_url: e.target.value })} />
                </Field>
                <Field label="CMS Platform">
                  <Select value={data.cms_type} onValueChange={(v) => update({ cms_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select CMS" /></SelectTrigger>
                    <SelectContent>{CMS_TYPES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
            </StepCard>
          )}

          {step === 2 && (
            <StepCard title="Services & Goals" description="What services do you offer and what are your goals?">
              <div className="space-y-4">
                <Field label="Primary Services" required>
                  <Textarea placeholder="List your main services, one per line..." value={data.primary_services} onChange={(e) => update({ primary_services: e.target.value })} rows={4} />
                </Field>
                <Field label="Business Goals">
                  <Textarea placeholder="What are your marketing goals? e.g. more leads, brand awareness, local visibility..." value={data.business_goals} onChange={(e) => update({ business_goals: e.target.value })} rows={3} />
                </Field>
              </div>
            </StepCard>
          )}

          {step === 3 && (
            <StepCard title="Competitors" description="Who are your main competitors?">
              <Field label="Competitor Domains">
                <Textarea placeholder="Enter competitor websites, one per line:&#10;www.competitor1.com&#10;www.competitor2.com" value={data.competitors} onChange={(e) => update({ competitors: e.target.value })} rows={5} />
              </Field>
            </StepCard>
          )}

          {step === 4 && (
            <StepCard title="Channel Connections" description="Which channels do you already use?">
              <div className="space-y-3">
                {CHANNELS.map((ch) => (
                  <label key={ch.key} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                    <Checkbox
                      checked={data.existing_channels.includes(ch.key)}
                      onCheckedChange={(checked) => {
                        update({
                          existing_channels: checked
                            ? [...data.existing_channels, ch.key]
                            : data.existing_channels.filter((c) => c !== ch.key),
                        });
                      }}
                    />
                    <span className="text-sm font-medium">{ch.label}</span>
                  </label>
                ))}
              </div>
            </StepCard>
          )}

          {step === 5 && (
            <StepCard title="Choose a Template" description="Select an industry template to pre-configure your marketing system.">
              <div className="grid gap-3">
                {templatesQuery.data?.length ? (
                  templatesQuery.data.map((t: any) => {
                    const isSelected = data.template_id === t.id;
                    const isPreviewing = previewTemplateId === t.id;
                    const config = t.config_json || {};

                    return (
                      <div key={t.id} className="rounded-xl border-2 transition-all overflow-hidden" style={{
                        borderColor: isSelected ? 'hsl(var(--primary))' : undefined,
                        backgroundColor: isSelected ? 'hsl(var(--primary) / 0.03)' : undefined,
                      }}>
                        <button
                          onClick={() => update({ template_id: t.id })}
                          className="w-full text-left p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">{t.name}</p>
                              <p className="text-sm text-muted-foreground mt-1">{t.description}</p>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                <Badge variant="secondary" className="text-xs">{t.industry}</Badge>
                                <Badge variant="outline" className="text-xs">{t.template_type}</Badge>
                                {config.keywords && <Badge variant="outline" className="text-xs">{config.keywords.length} keywords</Badge>}
                                {config.page_map && <Badge variant="outline" className="text-xs">{config.page_map.length} pages</Badge>}
                                {config.ads_suggestions && <Badge variant="outline" className="text-xs">{config.ads_suggestions.length} ad campaigns</Badge>}
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
                          </div>
                        </button>

                        {/* Preview toggle */}
                        <div className="px-4 pb-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setPreviewTemplateId(isPreviewing ? null : t.id); }}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            {isPreviewing ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {isPreviewing ? "Hide preview" : "Preview what's included"}
                          </button>
                        </div>

                        {/* Preview panel */}
                        {isPreviewing && (
                          <div className="border-t bg-muted/30 p-4 space-y-4">
                            {config.keywords?.length > 0 && (
                              <PreviewSection icon={Target} title="Starter Keywords" count={config.keywords.length}>
                                <div className="flex flex-wrap gap-1.5">
                                  {config.keywords.map((kw: string) => (
                                    <Badge key={kw} variant="secondary" className="text-xs font-normal">{kw}</Badge>
                                  ))}
                                </div>
                              </PreviewSection>
                            )}

                            {config.page_map?.length > 0 && (
                              <PreviewSection icon={FileText} title="Recommended Pages" count={config.page_map.length}>
                                <div className="space-y-1.5">
                                  {config.page_map.map((p: any) => (
                                    <div key={p.slug} className="flex items-start gap-2 text-xs">
                                      <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">/{p.slug}</code>
                                      <span className="text-muted-foreground">{p.description}</span>
                                    </div>
                                  ))}
                                </div>
                                {config.page_map_advice && (
                                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                                    💡 {config.page_map_advice}
                                  </p>
                                )}
                              </PreviewSection>
                            )}

                            {config.content_clusters?.length > 0 && (
                              <PreviewSection icon={BarChart3} title="Content Clusters" count={config.content_clusters.length}>
                                <div className="space-y-2">
                                  {config.content_clusters.map((c: any) => (
                                    <div key={c.cluster}>
                                      <p className="text-xs font-medium">{c.cluster}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {c.topics.map((t: string) => (
                                          <Badge key={t} variant="outline" className="text-xs font-normal">{t}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </PreviewSection>
                            )}

                            {config.ads_suggestions?.length > 0 && (
                              <PreviewSection icon={Megaphone} title="Ad Campaigns" count={config.ads_suggestions.length}>
                                <div className="space-y-2">
                                  {config.ads_suggestions.map((ad: any) => (
                                    <div key={ad.campaign} className="text-xs p-2 rounded bg-background border">
                                      <p className="font-medium">{ad.campaign}</p>
                                      <p className="text-muted-foreground mt-0.5">Budget: ${ad.budget_daily}/day</p>
                                      {ad.ad_copy_angle && <p className="text-muted-foreground italic">"{ad.ad_copy_angle}"</p>}
                                    </div>
                                  ))}
                                </div>
                              </PreviewSection>
                            )}

                            {config.local_seo && (
                              <PreviewSection icon={MapPin} title="Local SEO Setup">
                                <div className="text-xs space-y-1">
                                  <p><span className="font-medium">Categories:</span> {config.local_seo.categories?.join(", ")}</p>
                                  <p><span className="font-medium">Services:</span> {config.local_seo.services?.join(", ")}</p>
                                </div>
                              </PreviewSection>
                            )}




                            {config.weekly_plan_defaults?.length > 0 && (
                              <PreviewSection icon={CheckCircle2} title="Weekly Action Plan">
                                <ul className="text-xs space-y-1 text-muted-foreground">
                                  {config.weekly_plan_defaults.map((item: string) => (
                                    <li key={item} className="flex items-start gap-1.5">
                                      <span className="text-primary mt-0.5">•</span> {item}
                                    </li>
                                  ))}
                                </ul>
                              </PreviewSection>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <LayoutTemplate className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No templates available for this industry yet.</p>
                    <p className="text-xs mt-1">You can still proceed with a manual setup.</p>
                  </div>
                )}
              </div>
            </StepCard>
          )}

          {step === 6 && (
            <StepCard title="Review & Confirm" description="Review your setup before we get started.">
              <div className="space-y-4">
                <ReviewRow label="Business Name" value={data.business_name} />
                <ReviewRow label="Website" value={data.website_url} />
                <ReviewRow label="Industry" value={INDUSTRIES.find((i) => i.value === data.industry)?.label || data.industry} />
                <ReviewRow label="Niche" value={data.niche || "—"} />
                <ReviewRow label="Location" value={data.target_location || "—"} />
                <ReviewRow label="CMS" value={CMS_TYPES.find((c) => c.value === data.cms_type)?.label || "—"} />
                <ReviewRow label="Services" value={data.primary_services || "—"} />
                <ReviewRow label="Goals" value={data.business_goals || "—"} />
                <ReviewRow label="Competitors" value={data.competitors || "None specified"} />
                <ReviewRow label="Existing Channels" value={data.existing_channels.length ? data.existing_channels.join(", ") : "None"} />
                <ReviewRow label="Template" value={selectedTemplate?.name || "None selected"} />

                {/* Template summary in review */}
                {selectedTemplate?.config_json && (
                  <>
                    <Separator />
                    <div className="p-4 rounded-xl bg-muted/50 border">
                      <p className="font-semibold text-sm mb-3">Template will configure:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {selectedTemplate.config_json.keywords && (
                          <div className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5 text-primary" /> {selectedTemplate.config_json.keywords.length} starter keywords</div>
                        )}
                        {selectedTemplate.config_json.page_map && (
                          <div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-primary" /> {selectedTemplate.config_json.page_map.length} page recommendations</div>
                        )}
                        {selectedTemplate.config_json.content_topics && (
                          <div className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-primary" /> {selectedTemplate.config_json.content_topics.length} content topics</div>
                        )}
                        {selectedTemplate.config_json.ads_suggestions && (
                          <div className="flex items-center gap-1.5"><Megaphone className="h-3.5 w-3.5 text-primary" /> {selectedTemplate.config_json.ads_suggestions.length} ad campaigns</div>
                        )}
                        {selectedTemplate.config_json.crm_pipeline && (
                          <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /> {selectedTemplate.config_json.crm_pipeline.length}-stage CRM pipeline</div>
                        )}
                        {selectedTemplate.config_json.weekly_plan_defaults && (
                          <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Weekly action plan</div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-semibold text-sm">What happens next</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Client workspace will be created</li>
                    <li>• Starter keywords will be seeded</li>
                    <li>• Content topics will be generated</li>
                    <li>• Service pages will be recommended</li>
                    <li>• Ad campaigns will be configured</li>
                    <li>• CRM pipeline will be initialized</li>
                    <li>• Activation checklist will be ready</li>
                  </ul>
                </div>
              </div>
            </StepCard>
          )}
        </div>
      </div>

      {/* Footer Nav */}
      <div className="border-t bg-card/50 backdrop-blur-sm px-4 py-4 md:px-8">
        <div className="max-w-2xl mx-auto flex justify-between">
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting ? "Setting up..." : "Complete Setup"} <Rocket className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
      <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-sm whitespace-pre-wrap">{value}</span>
    </div>
  );
}

function PreviewSection({ icon: Icon, title, count, children }: { icon: any; title: string; count?: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold">{title}</span>
        {count !== undefined && <Badge variant="secondary" className="text-xs h-4 px-1.5">{count}</Badge>}
      </div>
      {children}
    </div>
  );
}
