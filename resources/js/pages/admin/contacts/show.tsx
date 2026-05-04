import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Contact { id: number; name: string; email: string; subject: string | null; message: string; is_read: boolean; ip_address: string | null; created_at: string; }

export default function ContactShow({ contact }: { contact: Contact }) {
    return (
        <>
            <Head title={`Message: ${contact.subject || 'No Subject'}`} />
            <div className="mx-auto max-w-2xl space-y-6">
                <Link href="/admin/contacts">
                    <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" />Back to Inbox</Button>
                </Link>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{contact.subject || 'No Subject'}</CardTitle>
                            <Badge variant={contact.is_read ? 'secondary' : 'default'}>{contact.is_read ? 'Read' : 'New'}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2 text-sm">
                            <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><span className="font-medium">{contact.name}</span> · <a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a></div>
                            <div className="text-muted-foreground text-xs">{new Date(contact.created_at).toLocaleString()} · IP: {contact.ip_address || 'N/A'}</div>
                        </div>
                        <div className="bg-muted rounded-lg p-4">
                            <p className="whitespace-pre-wrap text-sm">{contact.message}</p>
                        </div>
                        <a href={`mailto:${contact.email}?subject=Re: ${contact.subject || ''}`}>
                            <Button className="w-full">Reply via Email</Button>
                        </a>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
