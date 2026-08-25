'use client';

import { useState, useEffect, useMemo } from 'react';
import { Bot, Save, Loader2, Sparkles, Database, Shield, Zap } from 'lucide-react';
import client from '@/shared/lib/api/client';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Switch } from '@/shared/ui/switch';
import { CRMPageHeader } from '@/shared/components/crm';
import { compareFormValues } from '@/shared/hooks/use-dirty-form';
import { toast } from 'sonner';

export default function AISettingsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [config, setConfig] = useState<any>(null);
  const [initialConfig, setInitialConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isDirty = useMemo(() => {
    if (!config || !initialConfig) return false;
    return !compareFormValues(initialConfig, config);
  }, [config, initialConfig]);

  useEffect(() => {
    client.get('/ai/settings')
      .then(res => {
        const data = res.data?.data || res.data;
        if (data?.config) {
          setConfig(data.config);
          setInitialConfig(JSON.parse(JSON.stringify(data.config)));
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load AI settings.");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!isDirty) return;
    try {
      setSaving(true);
      await client.put('/ai/settings', config);
      setInitialConfig(JSON.parse(JSON.stringify(config)));
      toast.success("AI configuration saved successfully.");
    } catch {
      toast.error("Failed to save AI configuration.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="animate-spin w-8 h-8 text-primary" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <CRMPageHeader
        title="Enterprise AI Platform"
        subtitle="Configure models, tools, and RAG settings for your tenant."
        icon={Sparkles}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model Configuration */}
        <div className="bg-card p-6 rounded-xl border border-border shadow-card space-y-5">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            Provider &amp; Model
          </h2>

          <div className="space-y-2">
            <Label htmlFor="ai-provider">AI Provider</Label>
            <select
              id="ai-provider"
              value={config?.provider || 'gemini'}
              onChange={e => setConfig({ ...config, provider: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium text-foreground shadow-sm transition-all hover:border-border focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/10 outline-none"
            >
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-model">Model Selection</Label>
            <select
              id="ai-model"
              value={config?.model || 'gemini-3.6-flash'}
              onChange={e => setConfig({ ...config, model: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium text-foreground shadow-sm transition-all hover:border-border focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/10 outline-none"
            >
              {config?.provider === 'openai' ? (
                <>
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
                  <option value="gpt-4o">GPT-4o (Reasoning)</option>
                </>
              ) : (
                <>
                  <option value="gemini-3.6-flash">Gemini 3.6 Flash (Fast &amp; Recommended)</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key (BYOK)</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Leave blank to use shared key"
              value={config?.apiKey || ''}
              onChange={e => setConfig({ ...config, apiKey: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Keys are encrypted at rest.</p>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-card p-6 rounded-xl border border-border shadow-card space-y-6">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Capabilities
          </h2>

          {/* Enable AI */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Enable AI Platform</p>
              <p className="text-xs text-muted-foreground mt-0.5">Master toggle for all AI features</p>
            </div>
            <Switch
              checked={config?.isAiEnabled ?? true}
              onCheckedChange={checked => setConfig({ ...config, isAiEnabled: checked })}
            />
          </div>

          {/* RAG */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Database className="w-4 h-4 text-muted-foreground" />
                RAG (Knowledge Base)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Allow AI to read internal documents</p>
            </div>
            <Switch
              checked={config?.useRag ?? true}
              onCheckedChange={checked => setConfig({ ...config, useRag: checked })}
            />
          </div>

          {/* Tool Calling */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                CRM Tool Calling
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Allow AI to fetch live data &amp; take actions</p>
            </div>
            <Switch
              checked={config?.useTools ?? true}
              onCheckedChange={checked => setConfig({ ...config, useTools: checked })}
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
