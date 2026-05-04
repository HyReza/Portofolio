import { Head, Link, router } from '@inertiajs/react';
import { Mail, MailOpen, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Contact { id: number; name: string; email: string; subject: string | null; message: string; is_read: boolean; created_at: string; }
interface PaginatedData { data: Contact[]; total: number; current_page: number; last_page: number; }

export default function ContactIndex({ contacts, unreadCount }: { contacts: PaginatedData; unreadCount: number }) {
    return (
        <>
            <Head title="Contact Inbox" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Contact Inbox</h1>
                    <p className="text-muted-foreground mt-1">{unreadCount} unread message{unreadCount !== 1 ? 's' : ''}.</p>
                </div>

                <Card>
                    <CardHeader><CardTitle>Messages ({contacts.total})</CardTitle></CardHeader>
                    <CardContent>
                        {contacts.data.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center">No messages yet.</p>
                        ) : (
                            <div className="divide-y">
                                {contacts.data.map((contact) => (
                                    <div key={contact.id} className="flex items-center gap-4 py-4">
                                        {contact.is_read ? <MailOpen className="text-muted-foreground h-5 w-5 shrink-0" /> : <Mail className="text-primary h-5 w-5 shrink-0" />}
                                        <Link href={`/admin/contacts/${contact.id}`} className="min-w-0 flex-1 hover:underline">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`truncate ${!contact.is_read ? 'font-bold' : 'font-medium'}`}>
                                                    {contact.subject || 'No Subject'}
                                                </h3>
                                                {!contact.is_read && <Badge>New</Badge>}
                                            </div>
                                            <p className="text-muted-foreground text-sm">{contact.name} · {contact.email}</p>
                                            <p className="text-muted-foreground text-xs line-clamp-1">{contact.message}</p>
                                        </Link>
                                        <div className="text-muted-foreground shrink-0 text-xs">{new Date(contact.created_at).toLocaleDateString()}</div>
                                        <Button size="icon" variant="ghost" onClick={() => { if (confirm('Delete?')) router.delete(`/admin/contacts/${contact.id}`); }}>
                                            <Trash2 className="text-destructive h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
