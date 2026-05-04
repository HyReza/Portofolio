import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Trash2, ExternalLink, Pencil, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Certificate {
    id: number; title: string; issuer: string; credential_id: string | null;
    credential_url: string | null; image: string | null;
    issued_date: string | null; expiry_date: string | null; sort_order: number;
}

export default function CertificateIndex({ certificates }: { certificates: Certificate[] }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const form = useForm({
        title: '', issuer: '', credential_id: '', credential_url: '',
        image: null as File | null, issued_date: '', expiry_date: '', sort_order: 0,
    });

    const handleEdit = (cert: Certificate) => {
        setEditingId(cert.id);
        form.setData({
            title: cert.title || '',
            issuer: cert.issuer || '',
            credential_id: cert.credential_id || '',
            credential_url: cert.credential_url || '',
            image: null,
            issued_date: cert.issued_date ? cert.issued_date.split('T')[0] : '',
            expiry_date: cert.expiry_date ? cert.expiry_date.split('T')[0] : '',
            sort_order: cert.sort_order || 0,
        });
        setDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            form.post(`/admin/certificates/${editingId}`, {
                forceFormData: true,
                headers: { 'X-HTTP-Method-Override': 'PUT' },
                onSuccess: () => { setDialogOpen(false); setEditingId(null); form.reset(); toast.success('Certificate updated!'); },
            });
        } else {
            form.post('/admin/certificates', {
                forceFormData: true,
                onSuccess: () => { setDialogOpen(false); form.reset(); toast.success('Certificate added!'); },
            });
        }
    };

    return (
        <>
            <Head title="Manage Certificates" />
            <div className="mx-auto max-w-5xl space-y-6 pb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Manage your certifications and credentials.</p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); form.reset(); } }}>
                        <DialogTrigger asChild><Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="mr-2 h-4 w-4" />Add</Button></DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader><DialogTitle>{editingId ? 'Edit Certificate' : 'Add Certificate'}</DialogTitle></DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2"><Label>Title</Label><Input value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} required /></div>
                                <div className="space-y-2"><Label>Issuer</Label><Input value={form.data.issuer} onChange={(e) => form.setData('issuer', e.target.value)} required /></div>
                                <div className="grid gap-4 grid-cols-2">
                                    <div className="space-y-2"><Label>Credential ID</Label><Input value={form.data.credential_id} onChange={(e) => form.setData('credential_id', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Credential URL</Label><Input type="url" value={form.data.credential_url} onChange={(e) => form.setData('credential_url', e.target.value)} /></div>
                                </div>
                                <div className="grid gap-4 grid-cols-2">
                                    <div className="space-y-2"><Label>Issued Date</Label><Input type="date" value={form.data.issued_date} onChange={(e) => form.setData('issued_date', e.target.value)} /></div>
                                    <div className="space-y-2"><Label>Expiry Date</Label><Input type="date" value={form.data.expiry_date} onChange={(e) => form.setData('expiry_date', e.target.value)} /></div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Certificate Image {editingId && '(leave empty to keep current)'}</Label>
                                    <Input type="file" accept="image/*" onChange={(e) => form.setData('image', e.target.files?.[0] ?? null)} />
                                </div>
                                <Button type="submit" disabled={form.processing} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    {form.processing ? 'Saving...' : (editingId ? 'Update Certificate' : 'Save Certificate')}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {certificates.length === 0 ? (
                        <Card className="col-span-full"><CardContent className="py-10 text-center"><Award className="mx-auto h-10 w-10 text-neutral-300 mb-3" /><p className="text-muted-foreground text-sm">No certificates yet.</p></CardContent></Card>
                    ) : certificates.map((cert) => (
                        <Card key={cert.id} className="group overflow-hidden border-none shadow-sm ring-1 ring-neutral-200 transition-shadow hover:shadow-md dark:ring-neutral-800">
                            {cert.image && <img src={`/storage/${cert.image}`} alt={cert.title} className="h-40 w-full object-cover" />}
                            <CardContent className="pt-4 space-y-2">
                                <h3 className="font-semibold">{cert.title}</h3>
                                <p className="text-muted-foreground text-sm">{cert.issuer}</p>
                                {cert.credential_id && <Badge variant="outline" className="text-xs">{cert.credential_id}</Badge>}
                                {cert.issued_date && <p className="text-muted-foreground text-xs">{new Date(cert.issued_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>}
                                <div className="flex items-center justify-between pt-2">
                                    {cert.credential_url && (
                                        <a href={cert.credential_url} target="_blank" rel="noopener" className="text-primary flex items-center gap-1 text-xs hover:underline">
                                            <ExternalLink className="h-3 w-3" />Verify
                                        </a>
                                    )}
                                    <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        <Button size="icon" variant="ghost" onClick={() => handleEdit(cert)}><Pencil className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => { if (confirm('Delete?')) router.delete(`/admin/certificates/${cert.id}`); }}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}
