import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { request } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { FadeIn, StaggerContainer } from "@/components/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Code, Plus, Copy, Check, FileJson, Globe, Store,
  HelpCircle, List, ShoppingBag, MapPin, Newspaper,
} from "lucide-react";

const schemaTypes = [
  { value: "FAQ", label: "FAQ", icon: HelpCircle, desc: "FAQ page markup for rich results" },
  { value: "LocalBusiness", label: "Local Business", icon: MapPin, desc: "Business NAP + hours for Maps" },
  { value: "Article", label: "Article", icon: Newspaper, desc: "News/blog article markup" },
  { value: "Product", label: "Product", icon: ShoppingBag, desc: "Product with price + reviews" },
  { value: "HowTo", label: "How-To", icon: List, desc: "Step-by-step instructions" },
  { value: "BreadcrumbList", label: "Breadcrumb", icon: Globe, desc: "Navigation breadcrumbs" },
];

export default function SchemaCreator() {
  const { clientId } = useAuth();
  const [selectedType, setSelectedType] = useState("FAQ");
  const [pageUrl, setPageUrl] = useState("");
  const [generatedSchema, setGeneratedSchema] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const { data: markups = [] } = useQuery<any[]>({
    queryKey: ["schema-markups", clientId],
    queryFn: () => request(`/clients/${clientId}/schema-markups`),
  });

  const handleGenerate = () => {
    const templates: Record<string, any> = {
      FAQ: { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [
        { "@type": "Question", name: "What is SEO?", acceptedAnswer: { "@type": "Answer", text: "SEO stands for Search Engine Optimization..." } },
        { "@type": "Question", name: "How long does SEO take?", acceptedAnswer: { "@type": "Answer", text: "SEO typically takes 3-6 months to show results..." } },
      ]},
      LocalBusiness: { "@context": "https://schema.org", "@type": "LocalBusiness", name: "Your Business", address: { "@type": "PostalAddress", streetAddress: "123 Main St", addressLocality: "Singapore", postalCode: "123456", addressCountry: "SG" }, telephone: "+65 1234 5678", openingHours: "Mo-Fr 09:00-18:00" },
      Article: { "@context": "https://schema.org", "@type": "Article", headline: "Article Title", datePublished: new Date().toISOString(), author: { "@type": "Person", name: "Author Name" } },
      Product: { "@context": "https://schema.org", "@type": "Product", name: "Product Name", offers: { "@type": "Offer", price: "99.00", priceCurrency: "SGD" } },
      HowTo: { "@context": "https://schema.org", "@type": "HowTo", name: "How to...", step: [{ "@type": "HowToStep", text: "Step 1..." }] },
      BreadcrumbList: { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "/" }] },
    };
    setGeneratedSchema(templates[selectedType] || templates.FAQ);
  };

  const handleCopy = () => {
    if (generatedSchema) {
      navigator.clipboard.writeText(`<script type="application/ld+json">\n${JSON.stringify(generatedSchema, null, 2)}\n</script>`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    validated: "bg-green-500/10 text-green-500",
    deployed: "bg-blue-500/10 text-blue-500",
  };

  return (
    <FadeIn>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Schema Creator</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate structured data markup for rich search results</p>
        </div>

        <Tabs defaultValue="create">
          <TabsList>
            <TabsTrigger value="create">Create Schema</TabsTrigger>
            <TabsTrigger value="library">Saved Schemas ({markups.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Config */}
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Schema Type</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {schemaTypes.map((type) => (
                        <button key={type.value} onClick={() => setSelectedType(type.value)}
                          className={`p-3 rounded-lg border text-left transition-all ${selectedType === type.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                          <type.icon className={`h-5 w-5 mb-1 ${selectedType === type.value ? "text-primary" : "text-muted-foreground"}`} />
                          <p className="text-xs font-medium text-foreground">{type.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{type.desc}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <Label className="text-xs">Page URL</Label>
                      <Input placeholder="https://yoursite.com/page" value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} />
                    </div>
                    <Button className="w-full gap-2" onClick={handleGenerate}>
                      <Code className="h-4 w-4" /> Generate Schema
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Output */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Generated Markup</CardTitle>
                      {generatedSchema && (
                        <Button size="sm" variant="outline" className="gap-1" onClick={handleCopy}>
                          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? "Copied!" : "Copy"}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {generatedSchema ? (
                      <pre className="bg-muted/50 rounded-lg p-4 text-xs font-mono overflow-auto max-h-[500px] text-foreground">
                        {`<script type="application/ld+json">\n${JSON.stringify(generatedSchema, null, 2)}\n</script>`}
                      </pre>
                    ) : (
                      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                        Select a schema type and click Generate
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="library" className="mt-4">
            <StaggerContainer className="space-y-3">
              {markups.map((m: any) => (
                <FadeIn key={m.id}>
                  <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileJson className="h-4 w-4 text-primary" />
                          <span className="font-medium text-foreground">{m.schema_type}</span>
                          <Badge variant="outline" className={`text-[10px] ${statusColors[m.status] || ""}`}>{m.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{m.page_url}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline">Copy</Button>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>
              ))}
            </StaggerContainer>
          </TabsContent>
        </Tabs>
      </div>
    </FadeIn>
  );
}
