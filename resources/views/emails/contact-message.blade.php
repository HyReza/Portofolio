<x-mail::message>
# New Contact Message Received

You have received a new message from your portfolio website.

**From:** {{ $name }} ({{ $email }})

**Message:**
<x-mail::panel>
{{ $messageContent }}
</x-mail::panel>

<x-mail::button :url="config('app.url') . '/admin/contacts'">
View in Dashboard
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
