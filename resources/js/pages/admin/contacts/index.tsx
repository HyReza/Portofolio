import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Mail, MailOpen, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Contact { id: number; name: string; email: string; subject: string | null; message: string; is_read: boolean; created_at: string; }
interface PaginatedData { data: Contact[]; total: number; current_page: number; last_page: number; }

export default function ContactIndex({ contacts, unreadCount }: { contacts: PaginatedData; unreadCount: number }) {
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    const handleViewContact = (contact: Contact) => {
        setSelectedContact(contact);
        if (!contact.is_read) {
            router.put(`/admin/contacts/${contact.id}`, { is_read: true }, { preserveScroll: true });
        }
    };

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
                                        <button onClick={() => handleViewContact(contact)} className="min-w-0 flex-1 text-left hover:underline">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`truncate ${!contact.is_read ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                                                    {contact.name}
                                                </h3>
                                                {!contact.is_read && <Badge>New</Badge>}
                                            </div>
                                            <p className="text-muted-foreground text-sm truncate">{contact.email}</p>
                                            <p className="text-muted-foreground text-xs line-clamp-1 mt-1">{contact.message}</p>
                                        </button>
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

            <Dialog open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
                <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
                    {selectedContact && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center justify-between">
                                    Message Details
                                </DialogTitle>
                                <DialogDescription>
                                    Received on {new Date(selectedContact.created_at).toLocaleString()}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                                <div className="rounded-lg border p-3 bg-muted/50">
                                    <div className="flex flex-col gap-1 text-sm">
                                        <div><span className="font-semibold text-muted-foreground">From:</span> <span className="font-medium text-foreground">{selectedContact.name}</span></div>
                                        <div><span className="font-semibold text-muted-foreground">Email:</span> <a href={`mailto:${selectedContact.email}`} className="text-primary hover:underline">{selectedContact.email}</a></div>
                                        {selectedContact.ip_address && <div><span className="font-semibold text-muted-foreground">IP Address:</span> {selectedContact.ip_address}</div>}
                                    </div>
                                </div>
                                <div className="rounded-lg bg-muted p-4">
                                    <p className="whitespace-pre-wrap break-words text-sm text-foreground/90">{selectedContact.message}</p>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <a href={`mailto:${selectedContact.email}`}>
                                        <Button>Reply via Email</Button>
                                    </a>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
