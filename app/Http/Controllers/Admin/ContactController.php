<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/contacts/index', [
            'contacts' => Contact::orderByDesc('created_at')->paginate(20),
            'unreadCount' => Contact::unread()->count(),
        ]);
    }

    public function show(Contact $contact): Response
    {
        $contact->markAsRead();
        return Inertia::render('admin/contacts/show', [
            'contact' => $contact,
        ]);
    }

    public function destroy(Contact $contact): RedirectResponse
    {
        $contact->delete();
        return redirect()->route('admin.contacts.index')
            ->with('success', 'Contact deleted.');
    }
}
