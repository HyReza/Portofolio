import { useState, type FormEvent } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { useAchievements } from '@/hooks/useGimmicks';

export function ContactForm() {
    const { theme: appTheme, t } = useApp();
    const { unlock } = useAchievements();
    const dk = appTheme === 'dark';
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setStatus('sending');
        try {
            const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token || '', Accept: 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) { 
                setStatus('success'); 
                setForm({ name: '', email: '', message: '' }); 
                unlock('connector');
                setTimeout(() => setStatus('idle'), 5000); 
            }
            else { const d = await res.json(); setErrorMsg(d.message || 'Failed'); setStatus('error'); setTimeout(() => setStatus('idle'), 5000); }
        } catch { setErrorMsg('Network error'); setStatus('error'); setTimeout(() => setStatus('idle'), 5000); }
    };

    const inputCls = `w-full rounded-2xl border px-5 py-3.5 text-sm outline-none transition-all duration-300 ${dk ? 'border-white/5 bg-white/[0.03] text-white placeholder-white/20 focus:border-indigo-500/30 focus:bg-indigo-500/[0.03]' : 'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-indigo-300 focus:bg-white focus:shadow-lg focus:shadow-indigo-500/5'}`;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className={`mb-2 block text-xs font-medium uppercase tracking-wider ${dk ? 'text-white/30' : 'text-gray-400'}`}>{t('Name', 'Nama')}</label>
                    <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder={t('Your name', 'Nama Anda')} />
                </div>
                <div>
                    <label className={`mb-2 block text-xs font-medium uppercase tracking-wider ${dk ? 'text-white/30' : 'text-gray-400'}`}>Email</label>
                    <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} placeholder="you@example.com" />
                </div>
            </div>
            <div>
                <label className={`mb-2 block text-xs font-medium uppercase tracking-wider ${dk ? 'text-white/30' : 'text-gray-400'}`}>{t('Message', 'Pesan')}</label>
                <textarea required rows={5} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} className={`${inputCls} resize-none`} placeholder={t('Tell me about your project...', 'Ceritakan tentang proyek Anda...')} />
            </div>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <button type="submit" disabled={status === 'sending'}
                        className="group inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 8px 25px rgba(99,102,241,0.3)' }}>
                    {status === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
                    {status === 'sending' ? t('Sending...', 'Mengirim...') : t('Send Message', 'Kirim Pesan')}
                </button>
                {status === 'success' && <p className="inline-flex items-center gap-2 text-sm text-emerald-400"><CheckCircle className="h-4 w-4" /> {t('Sent! I\'ll reply soon.', 'Terkirim! Saya akan balas segera.')}</p>}
                {status === 'error' && <p className="inline-flex items-center gap-2 text-sm text-red-400"><AlertCircle className="h-4 w-4" /> {errorMsg}</p>}
            </div>
        </form>
    );
}
