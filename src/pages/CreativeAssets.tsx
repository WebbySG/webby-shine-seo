import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Image, FileText, Share2, MapPin, Video, CheckCircle,
  RefreshCw, ThumbsUp, Trash2, Plus, Paintbrush, Palette
} from "lucide-react";
import {
  useClients, useCreativeAssets, useGenerateCreative, useApproveCreativeAsset,
  useRegenerateCreativeAsset, useDeleteCreativeAsset, useBrandProfile, useSaveBrandProfile
} from "@/hooks/use-api";

const statusColor = (s: string): any => {
  const map: Record<string, string> = {
    draft: "secondary", generating: "outline", review: "default",
    approved: "default", published: "default", failed: "destructive",
  };
  return map[s] || "secondary";
};

const STYLE_PRESETS = [
  { value: "clean_modern", label: "Clean Modern" },
  { value: "business_professional", label: "Business Professional" },
  { value: "local_service", label: "Local Service" },
  { value: "bold_promo", label: "Bold Promo" },
  { value: "minimal_editorial", label: "Minimal Editorial" },
  { value: "social_carousel", label: "Social Carousel" },
  { value: "video_thumbnail", label: "Video Thumbnail" },
];

const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Landscape)" },
  { value: "1:1", label: "1:1 (Square)" },
  { value: "4:5", label: "4:5 (Portrait)" },
  { value: "9:16", label: "9:16 (Vertical)" },
  { value: "4:3", label: "4:3 (Standard)" },
];

const ASSET_TYPES = [
  { value: "featured_image", label: "Featured Image" },
  { value: "social_image", label: "Social Image" },
  { value: "gbp_image", label: "GBP Image" },
  { value: "video_thumbnail", label: "Video Thumbnail" },
  { value: "infographic", label: "Infographic" },
  { value: "carousel_image", label: "Carousel Image" },
];

function GenerateModal({ clientId, onGenerated }: { clientId: string; onGenerated: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    source_type: "article", source_id: "", asset_type: "featured_image",
    platform: "", style_preset: "clean_modern", aspect_ratio: "16:9",
    variant_count: 1, custom_prompt: "",
  });
  const generate = useGenerateCreative(clientId);

  const handleGenerate = () => {
    generate.mutate({
      client_id: clientId, ...form,
    }, {
      onSuccess: () => { setOpen(false); onGenerated(); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Generate Asset</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Generate Creative Asset</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Source Type</Label>
              <Select value={form.source_type} onValueChange={v => setForm(f => ({ ...f, source_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="social_post">Social Post</SelectItem>
                  <SelectItem value="gbp_post">GBP Post</SelectItem>
                  <SelectItem value="video_asset">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Source ID</Label>
              <Input value={form.source_id} onChange={e => setForm(f => ({ ...f, source_id: e.target.value }))} placeholder="UUID" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Asset Type</Label>
              <Select value={form.asset_type} onValueChange={v => setForm(f => ({ ...f, asset_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ASSET_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Platform</Label>
              <Input value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} placeholder="e.g. facebook" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Style Preset</Label>
              <Select value={form.style_preset} onValueChange={v => setForm(f => ({ ...f, style_preset: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STYLE_PRESETS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Aspect Ratio</Label>
              <Select value={form.aspect_ratio} onValueChange={v => setForm(f => ({ ...f, aspect_ratio: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ASPECT_RATIOS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Custom Prompt (optional)</Label>
            <Textarea value={form.custom_prompt} onChange={e => setForm(f => ({ ...f, custom_prompt: e.target.value }))} placeholder="Override auto-generated prompt..." rows={3} />
          </div>
          <Button onClick={handleGenerate} disabled={!form.source_id || generate.isPending} className="w-full">
            {generate.isPending ? <><RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Generating...</> : "Generate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssetGrid({ assets, clientId }: { assets: any[]; clientId: string }) {
  const approve = useApproveCreativeAsset(clientId);
  const regenerate = useRegenerateCreativeAsset(clientId);
  const deleteAsset = useDeleteCreativeAsset(clientId);

  if (!assets?.length) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">No creative assets yet.</CardContent></Card>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {assets.map((a: any) => (
        <Card key={a.id} className="overflow-hidden">
          {a.file_url ? (
            <div className="aspect-video bg-muted">
              <img src={a.file_url} alt={a.title || "Creative asset"} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-video bg-muted flex items-center justify-center">
              <Image className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground truncate">{a.title || a.asset_type}</p>
              <Badge variant={statusColor(a.status)}>{a.status}</Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">{a.source_type}</Badge>
              <Badge variant="outline" className="text-xs">{a.style_preset}</Badge>
              <Badge variant="outline" className="text-xs">{a.aspect_ratio}</Badge>
            </div>
            {a.prompt && <p className="text-xs text-muted-foreground line-clamp-2">{a.prompt}</p>}
            <div className="flex gap-1 pt-1">
              {a.status === "review" && (
                <Button size="sm" variant="default" onClick={() => approve.mutate(a.id)}>
                  <ThumbsUp className="h-3 w-3 mr-1" /> Approve
                </Button>
              )}
              {["review", "approved", "failed"].includes(a.status) && (
                <Button size="sm" variant="outline" onClick={() => regenerate.mutate({ assetId: a.id })}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Regen
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => deleteAsset.mutate(a.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CreativeAssets() {
  const [selectedClient, setSelectedClient] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const { data: clients } = useClients();
  const clientId = selectedClient || clients?.[0]?.id || "";

  const { data: allAssets, refetch } = useCreativeAssets(clientId);
  const { data: brand } = useBrandProfile(clientId);
  const saveBrand = useSaveBrandProfile(clientId);

  const [brandForm, setBrandForm] = useState({
    brand_name: "", primary_color: "", secondary_color: "",
    font_style: "", tone: "", logo_url: "", image_style_notes: "",
  });

  // Sync brand form when data loads
  const assets = sourceFilter ? allAssets?.filter((a: any) => a.source_type === sourceFilter) : allAssets;
  const reviewQueue = allAssets?.filter((a: any) => a.status === "review") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Creative Assets</h1>
          <p className="text-muted-foreground">AI-generated images and visual content for all channels</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={clientId} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>
              {clients?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <GenerateModal clientId={clientId} onGenerated={() => refetch()} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Total Assets</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold text-foreground">{allAssets?.length ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Awaiting Review</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold text-foreground">{reviewQueue.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Approved</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold text-foreground">{allAssets?.filter((a: any) => a.status === "approved").length ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Failed</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold text-foreground">{allAssets?.filter((a: any) => a.status === "failed").length ?? 0}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setSourceFilter("")}><Image className="h-4 w-4 mr-1" /> All</TabsTrigger>
          <TabsTrigger value="articles" onClick={() => setSourceFilter("article")}><FileText className="h-4 w-4 mr-1" /> Articles</TabsTrigger>
          <TabsTrigger value="social" onClick={() => setSourceFilter("social_post")}><Share2 className="h-4 w-4 mr-1" /> Social</TabsTrigger>
          <TabsTrigger value="gbp" onClick={() => setSourceFilter("gbp_post")}><MapPin className="h-4 w-4 mr-1" /> GBP</TabsTrigger>
          <TabsTrigger value="videos" onClick={() => setSourceFilter("video_asset")}><Video className="h-4 w-4 mr-1" /> Videos</TabsTrigger>
          <TabsTrigger value="review" onClick={() => setSourceFilter("")}><CheckCircle className="h-4 w-4 mr-1" /> Review Queue</TabsTrigger>
          <TabsTrigger value="brand"><Palette className="h-4 w-4 mr-1" /> Brand</TabsTrigger>
        </TabsList>

        <TabsContent value="all"><AssetGrid assets={assets || []} clientId={clientId} /></TabsContent>
        <TabsContent value="articles"><AssetGrid assets={assets || []} clientId={clientId} /></TabsContent>
        <TabsContent value="social"><AssetGrid assets={assets || []} clientId={clientId} /></TabsContent>
        <TabsContent value="gbp"><AssetGrid assets={assets || []} clientId={clientId} /></TabsContent>
        <TabsContent value="videos"><AssetGrid assets={assets || []} clientId={clientId} /></TabsContent>
        <TabsContent value="review"><AssetGrid assets={reviewQueue} clientId={clientId} /></TabsContent>

        <TabsContent value="brand" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Paintbrush className="h-5 w-5" /> Brand Profile</CardTitle>
              <CardDescription>Define your brand identity to influence AI-generated visuals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Brand Name</Label><Input defaultValue={brand?.brand_name || ""} onChange={e => setBrandForm(f => ({ ...f, brand_name: e.target.value }))} /></div>
                <div><Label>Tone</Label><Input defaultValue={brand?.tone || ""} onChange={e => setBrandForm(f => ({ ...f, tone: e.target.value }))} placeholder="e.g. professional, friendly" /></div>
                <div><Label>Primary Color</Label><Input defaultValue={brand?.primary_color || ""} onChange={e => setBrandForm(f => ({ ...f, primary_color: e.target.value }))} placeholder="#1a73e8" /></div>
                <div><Label>Secondary Color</Label><Input defaultValue={brand?.secondary_color || ""} onChange={e => setBrandForm(f => ({ ...f, secondary_color: e.target.value }))} placeholder="#fbbc04" /></div>
                <div><Label>Font Style</Label><Input defaultValue={brand?.font_style || ""} onChange={e => setBrandForm(f => ({ ...f, font_style: e.target.value }))} placeholder="e.g. sans-serif, modern" /></div>
                <div><Label>Logo URL</Label><Input defaultValue={brand?.logo_url || ""} onChange={e => setBrandForm(f => ({ ...f, logo_url: e.target.value }))} /></div>
              </div>
              <div>
                <Label>Image Style Notes</Label>
                <Textarea defaultValue={brand?.image_style_notes || ""} onChange={e => setBrandForm(f => ({ ...f, image_style_notes: e.target.value }))} placeholder="Additional notes for AI image generation..." rows={3} />
              </div>
              <Button onClick={() => saveBrand.mutate({ client_id: clientId, ...brandForm })} disabled={saveBrand.isPending}>
                {saveBrand.isPending ? "Saving..." : "Save Brand Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
