import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Key, ShieldCheck, ShieldAlert, Trash2, Settings2, Info, ExternalLink, Sparkles, CheckCircle2, AlertCircle, Cloud } from 'lucide-react';
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
    ai_gemini_exhausted: boolean;

    qwen_api_key_masked: string;
    qwen_api_key_set: boolean;
    qwen_api_valid: boolean;
    qwen_api_error: string;
    qwen_model: string;
    qwen_endpoint: string;
    ai_qwen_exhausted: boolean;

    ai_token_exhausted: boolean;
    ai_assistant_enabled: boolean;
}

export default function SettingsIndex({ settings }: { settings: Settings }) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const geminiForm = useForm({ gemini_api_key: '' });
    const qwenForm = useForm({ qwen_api_key: '' });
    const aiForm = useForm({
        gemini_model: settings.gemini_model,
        qwen_model: settings.qwen_model,
        qwen_endpoint: settings.qwen_endpoint,
        ai_assistant_enabled: settings.ai_assistant_enabled,
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleGeminiSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        geminiForm.post('/admin/settings/api-key', {
            onSuccess: () => geminiForm.reset(),
        });
    };

    const handleQwenSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        qwenForm.post('/admin/settings/qwen-api-key', {
            onSuccess: () => qwenForm.reset(),
        });
    };

    const handleAiSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        aiForm.put('/admin/settings/ai', {
            preserveScroll: true,
            onSuccess: () => toast.success('AI Settings updated'),
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

                    {/* ═══ Gemini API Configuration ═══ */}
                    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Google Gemini AI</CardTitle>
                                        <CardDescription>Primary AI provider — powers the portfolio assistant.</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {settings.ai_gemini_exhausted && (
                                        <Badge variant="destructive" className="animate-pulse text-[10px]">Exhausted</Badge>
                                    )}
                                    {settings.gemini_api_key_set && (
                                        <Badge className={settings.gemini_api_valid ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                                            {settings.gemini_api_valid ? (
                                                <><CheckCircle2 className="mr-1.5 h-3 w-3" /> Operational</>
                                            ) : (
                                                <><AlertCircle className="mr-1.5 h-3 w-3" /> Error</>
                                            )}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="flex items-start gap-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
                                <Info className="mt-0.5 h-5 w-5 text-blue-500 shrink-0" />
                                <div className="text-sm text-blue-800 dark:text-blue-300">
                                    <p className="font-medium">Primary AI Provider</p>
                                    <p className="mt-1 opacity-80 leading-relaxed">
                                        Get a free key at the <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="font-bold underline hover:text-blue-600 transition-colors inline-flex items-center gap-1">Google AI Studio <ExternalLink size={12} /></a>.
                                        If this key runs out, the system will automatically fallback to Qwen.
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
                                    <p className="text-sm text-neutral-500">No Gemini API Key configured.</p>
                                </div>
                            )}

                            <form onSubmit={handleGeminiSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gemini_api_key" className="text-sm font-semibold">
                                        {settings.gemini_api_key_set ? 'Update Gemini Key' : 'Configure Gemini Key'}
                                    </Label>
                                    <Input
                                        id="gemini_api_key"
                                        type="password"
                                        value={geminiForm.data.gemini_api_key}
                                        onChange={(e) => geminiForm.setData('gemini_api_key', e.target.value)}
                                        placeholder="Paste your AIzaSy... key here"
                                        className="h-11"
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button type="submit" disabled={geminiForm.processing} className="bg-indigo-600 hover:bg-indigo-700">
                                        {geminiForm.processing ? 'Validating...' : 'Save & Verify'}
                                    </Button>
                                    {settings.gemini_api_key_set && (
                                        <Button type="button" variant="outline" className="text-destructive hover:bg-destructive/5" onClick={() => {
                                            if (confirm('Remove Gemini API key?')) {
                                                router.delete('/admin/settings/api-key', {
                                                    onSuccess: () => toast.success('Gemini key removed'),
                                                });
                                            }
                                        }}>
                                            <Trash2 className="mr-2 h-4 w-4" />Revoke
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* ═══ Qwen API Configuration ═══ */}
                    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                                        <Cloud size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Alibaba Cloud Qwen</CardTitle>
                                        <CardDescription>Fallback AI provider — used when Gemini quota is exhausted.</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {settings.ai_qwen_exhausted && (
                                        <Badge variant="destructive" className="animate-pulse text-[10px]">Exhausted</Badge>
                                    )}
                                    {settings.qwen_api_key_set && (
                                        <Badge className={settings.qwen_api_valid ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                                            {settings.qwen_api_valid ? (
                                                <><CheckCircle2 className="mr-1.5 h-3 w-3" /> Operational</>
                                            ) : (
                                                <><AlertCircle className="mr-1.5 h-3 w-3" /> Error</>
                                            )}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="flex items-start gap-4 rounded-lg border border-orange-100 bg-orange-50/50 p-4 dark:border-orange-900/30 dark:bg-orange-950/20">
                                <Info className="mt-0.5 h-5 w-5 text-orange-500 shrink-0" />
                                <div className="text-sm text-orange-800 dark:text-orange-300">
                                    <p className="font-medium">Fallback AI Provider</p>
                                    <p className="mt-1 opacity-80 leading-relaxed">
                                        Get a DashScope API key from <a href="https://www.alibabacloud.com/en/product/model-studio" target="_blank" rel="noopener" className="font-bold underline hover:text-orange-600 transition-colors inline-flex items-center gap-1">Alibaba Cloud Model Studio <ExternalLink size={12} /></a>.
                                        This is only used when Gemini is unavailable.
                                    </p>
                                </div>
                            </div>

                            {settings.qwen_api_key_set ? (
                                <div className="rounded-lg bg-neutral-100 dark:bg-neutral-900 p-4 font-mono text-sm border border-neutral-200 dark:border-neutral-800">
                                    <div className="flex items-center justify-between">
                                        <span className="text-neutral-500">Active Credential:</span>
                                        <span className="text-neutral-900 dark:text-neutral-100">{settings.qwen_api_key_masked}</span>
                                    </div>
                                    {settings.qwen_api_error && (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-destructive">
                                            <ShieldAlert size={14} />
                                            <span>{settings.qwen_api_error}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-lg border-dashed border-2 border-neutral-200 dark:border-neutral-800 p-8 text-center">
                                    <Key className="mx-auto h-8 w-8 text-neutral-300 mb-3" />
                                    <p className="text-sm text-neutral-500">No Qwen API Key configured (optional).</p>
                                </div>
                            )}

                            <form onSubmit={handleQwenSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="qwen_api_key" className="text-sm font-semibold">
                                        {settings.qwen_api_key_set ? 'Update Qwen Key' : 'Configure Qwen Key'}
                                    </Label>
                                    <Input
                                        id="qwen_api_key"
                                        type="password"
                                        value={qwenForm.data.qwen_api_key}
                                        onChange={(e) => qwenForm.setData('qwen_api_key', e.target.value)}
                                        placeholder="Paste your DashScope API key here"
                                        className="h-11"
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button type="submit" disabled={qwenForm.processing} className="bg-orange-600 hover:bg-orange-700">
                                        {qwenForm.processing ? 'Validating...' : 'Save & Verify'}
                                    </Button>
                                    {settings.qwen_api_key_set && (
                                        <Button type="button" variant="outline" className="text-destructive hover:bg-destructive/5" onClick={() => {
                                            if (confirm('Remove Qwen API key?')) {
                                                router.delete('/admin/settings/qwen-api-key', {
                                                    onSuccess: () => toast.success('Qwen key removed'),
                                                });
                                            }
                                        }}>
                                            <Trash2 className="mr-2 h-4 w-4" />Revoke
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* ═══ AI Assistant Configuration ═══ */}
                    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <CardHeader className="bg-neutral-50/50 dark:bg-neutral-900/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                                        <Settings2 size={20} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">AI Assistant Settings</CardTitle>
                                        <CardDescription>Configure models, endpoints, and manage token state.</CardDescription>
                                    </div>
                                </div>
                                {(settings.ai_gemini_exhausted || settings.ai_qwen_exhausted) && (
                                    <Badge variant="destructive" className="animate-pulse">
                                        {settings.ai_gemini_exhausted && settings.ai_qwen_exhausted
                                            ? 'Both Exhausted!'
                                            : settings.ai_gemini_exhausted
                                                ? 'Gemini Exhausted'
                                                : 'Qwen Exhausted'}
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            {(settings.ai_gemini_exhausted || settings.ai_qwen_exhausted) && (
                                <div className="flex items-start gap-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/20">
                                    <ShieldAlert className="mt-0.5 h-5 w-5 text-red-500 shrink-0" />
                                    <div className="text-sm text-red-800 dark:text-red-300">
                                        <p className="font-bold">API Quota Exhausted</p>
                                        <p className="mt-1 opacity-90 leading-relaxed">
                                            {settings.ai_gemini_exhausted && settings.ai_qwen_exhausted
                                                ? 'Both Gemini and Qwen quotas are exhausted. The AI assistant is temporarily unavailable.'
                                                : settings.ai_gemini_exhausted
                                                    ? 'Gemini quota exhausted. The system is using Qwen as fallback.'
                                                    : 'Qwen quota exhausted. Gemini is still operational.'}
                                        </p>
                                        <div className="mt-3">
                                            <Button size="sm" variant="outline" className="bg-white/50 dark:bg-black/50 text-red-600 border-red-200 dark:border-red-800 hover:bg-white dark:hover:bg-black" onClick={() => {
                                                router.post('/admin/settings/ai/reset-exhausted', {}, {
                                                    onSuccess: () => toast.success('All exhaustion flags reset'),
                                                });
                                            }}>
                                                Reset All Exhaustion Flags
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleAiSubmit} className="space-y-6">
                                {/* Gemini Model */}
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
                                    <p className="text-xs text-muted-foreground">e.g. <code>gemini-2.0-flash</code>, <code>gemini-1.5-pro</code></p>
                                </div>

                                {/* Qwen Model */}
                                <div className="space-y-2">
                                    <Label htmlFor="qwen_model" className="text-sm font-semibold">Qwen Model Name</Label>
                                    <Input
                                        id="qwen_model"
                                        type="text"
                                        value={aiForm.data.qwen_model}
                                        onChange={(e) => aiForm.setData('qwen_model', e.target.value)}
                                        placeholder="e.g. qwen-plus"
                                        className="h-11 font-mono text-sm"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">e.g. <code>qwen-plus</code>, <code>qwen-max</code>, <code>qwen-turbo</code></p>
                                </div>

                                {/* Qwen Endpoint */}
                                <div className="space-y-2">
                                    <Label htmlFor="qwen_endpoint" className="text-sm font-semibold">Qwen API Endpoint</Label>
                                    <Input
                                        id="qwen_endpoint"
                                        type="url"
                                        value={aiForm.data.qwen_endpoint}
                                        onChange={(e) => aiForm.setData('qwen_endpoint', e.target.value)}
                                        placeholder="https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions"
                                        className="h-11 font-mono text-xs"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        International: <code>dashscope-intl.aliyuncs.com</code> · China: <code>dashscope.aliyuncs.com</code>
                                    </p>
                                </div>

                                {/* Enable AI */}
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

                    {/* Security Info */}
                    <Card className="border-none shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/10">
                         <CardContent className="py-6">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">Secure Environment</h4>
                                    <p className="text-xs text-neutral-500">All credentials are encrypted at rest and never exposed to the frontend. Gemini → Qwen automatic failover is handled server-side.</p>
                                </div>
                            </div>
                         </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
