import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Key, ShieldCheck, ShieldAlert, Trash2, Settings2, Info, ExternalLink, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface Settings {
    gemini_api_key_masked: string;
    gemini_api_key_set: boolean;
    gemini_api_valid: boolean;
    gemini_api_error: string;
    gemini_model: string;
    ai_token_exhausted: boolean;
    ai_assistant_enabled: boolean;
}

export default function SettingsIndex({ settings }: { settings: Settings }) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const form = useForm({ gemini_api_key: '' });
    const aiForm = useForm({
        gemini_model: settings.gemini_model,
        ai_assistant_enabled: settings.ai_assistant_enabled,
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/settings/api-key', { 
            onSuccess: () => {
                form.reset();
            }
        });
    };

    const handleAiSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        aiForm.put('/admin/settings/ai', {
            preserveScroll: true,
            onSuccess: () => toast.success('AI Settings updated')
        });
    };

    return (
        <>
            <Head title="System Settings" />
            <div className="mx-auto max-w-4xl space-y-8 pb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">System Infrastructure</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Configure core services and integration credentials.</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    {/* Gemini API Configuration */}
                    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Google Gemini AI</CardTitle>
                                        <CardDescription>Empower your portfolio with generative intelligence.</CardDescription>
                                    </div>
                                </div>
                                {settings.gemini_api_key_set && (
                                    <Badge className={settings.gemini_api_valid ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                                        {settings.gemini_api_valid ? (
                                            <><CheckCircle2 className="mr-1.5 h-3 w-3" /> Operational</>
                                        ) : (
                                            <><AlertCircle className="mr-1.5 h-3 w-3" /> Configuration Error</>
                                        )}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="flex items-start gap-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
                                <Info className="mt-0.5 h-5 w-5 text-blue-500 shrink-0" />
                                <div className="text-sm text-blue-800 dark:text-blue-300">
                                    <p className="font-medium">Why do I need this?</p>
                                    <p className="mt-1 opacity-80 leading-relaxed">
                                        The Gemini API key is required for the "Ask AI" feature. It allows visitors to interact with your portfolio using natural language.
                                        You can generate a free key at the <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="font-bold underline hover:text-blue-600 transition-colors inline-flex items-center gap-1">Google AI Studio <ExternalLink size={12} /></a>.
                                    </p>
                                </div>
                            </div>

                            {settings.gemini_api_key_set ? (
                                <div className="rounded-lg bg-neutral-100 dark:bg-neutral-900 p-4 font-mono text-sm border border-neutral-200 dark:border-neutral-800">
                                    <div className="flex items-center justify-between">
                                        <span className="text-neutral-500">Active Credential:</span>
                                        <span className="text-neutral-900 dark:text-neutral-100">{settings.gemini_api_key_masked}</span>
                                    </div>
                                    {settings.gemini_api_error && (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-destructive">
                                            <ShieldAlert size={14} />
                                            <span>{settings.gemini_api_error}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-lg border-dashed border-2 border-neutral-200 dark:border-neutral-800 p-8 text-center">
                                    <Key className="mx-auto h-8 w-8 text-neutral-300 mb-3" />
                                    <p className="text-sm text-neutral-500">No API Key configured yet.</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="api_key" className="text-sm font-semibold">
                                        {settings.gemini_api_key_set ? 'Update Secret Key' : 'Configure Secret Key'}
                                    </Label>
                                    <Input
                                        id="api_key"
                                        type="password"
                                        value={form.data.gemini_api_key}
                                        onChange={(e) => form.setData('gemini_api_key', e.target.value)}
                                        placeholder="Paste your AIzaSy... key here"
                                        className="h-11"
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button type="submit" disabled={form.processing} className="bg-indigo-600 hover:bg-indigo-700">
                                        {form.processing ? 'Validating Connection...' : 'Save & Verify Identity'}
                                    </Button>
                                    {settings.gemini_api_key_set && (
                                        <Button type="button" variant="outline" className="text-destructive hover:bg-destructive/5" onClick={() => {
                                            if (confirm('Permanently remove this API key? This will disable AI features.')) {
                                                router.delete('/admin/settings/api-key', {
                                                    onSuccess: () => toast.success('API key removed')
                                                });
                                            }
                                        }}>
                                            <Trash2 className="mr-2 h-4 w-4" />Revoke Key
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* AI Assistant Configuration */}
                    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                                        <Settings2 size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">AI Assistant Settings</CardTitle>
                                        <CardDescription>Configure model and manage token state.</CardDescription>
                                    </div>
                                </div>
                                {settings.ai_token_exhausted && (
                                    <Badge variant="destructive" className="animate-pulse">
                                        Token Exhausted!
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            {settings.ai_token_exhausted && (
                                <div className="flex items-start gap-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/20">
                                    <ShieldAlert className="mt-0.5 h-5 w-5 text-red-500 shrink-0" />
                                    <div className="text-sm text-red-800 dark:text-red-300">
                                        <p className="font-bold">API Quota Exhausted (HTTP 429)</p>
                                        <p className="mt-1 opacity-90 leading-relaxed">
                                            The system detected that your Gemini API key has run out of tokens. The AI assistant has been temporarily disabled for visitors. Please upgrade your API quota or use a different key.
                                        </p>
                                        <div className="mt-3">
                                            <Button size="sm" variant="outline" className="bg-white/50 dark:bg-black/50 text-red-600 border-red-200 dark:border-red-800 hover:bg-white dark:hover:bg-black" onClick={() => {
                                                router.post('/admin/settings/ai/reset-exhausted', {}, {
                                                    onSuccess: () => toast.success('Exhausted flag reset')
                                                });
                                            }}>
                                                Acknowledge & Reset Flag
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleAiSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gemini_model" className="text-sm font-semibold">Gemini Model Name</Label>
                                    <Input
                                        id="gemini_model"
                                        type="text"
                                        value={aiForm.data.gemini_model}
                                        onChange={(e) => aiForm.setData('gemini_model', e.target.value)}
                                        placeholder="e.g. gemini-2.0-flash"
                                        className="h-11 font-mono text-sm"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">Type manually to easily update to newer models (e.g. <code>gemini-2.0-flash</code>, <code>gemini-1.5-pro</code>)</p>
                                </div>

                                <div className="flex items-center gap-3 mt-6 p-4 border rounded-xl bg-neutral-50/50 dark:bg-neutral-900/30">
                                    <div className="flex-1">
                                        <Label className="text-sm font-semibold">Enable AI Assistant</Label>
                                        <p className="text-xs text-muted-foreground mt-1">Show the floating AI widget on the public portfolio.</p>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={aiForm.data.ai_assistant_enabled}
                                        onClick={() => aiForm.setData('ai_assistant_enabled', !aiForm.data.ai_assistant_enabled)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:ring-indigo-600 ${
                                            aiForm.data.ai_assistant_enabled ? 'bg-indigo-600' : 'bg-neutral-200 dark:bg-neutral-700'
                                        }`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${aiForm.data.ai_assistant_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button type="submit" disabled={aiForm.processing || !aiForm.isDirty} className="bg-indigo-600 hover:bg-indigo-700">
                                        {aiForm.processing ? 'Saving...' : 'Save AI Settings'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Additional Security / System Cards could go here */}
                    <Card className="border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/10">
                         <CardContent className="py-6">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">Secure Environment</h4>
                                    <p className="text-xs text-neutral-500">All credentials are encrypted at rest and never exposed to the frontend.</p>
                                </div>
                            </div>
                         </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
