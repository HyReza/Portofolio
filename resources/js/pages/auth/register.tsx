import { Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { login } from '@/routes';

export default function Register() {
    return (
        <>
            <Head title="Registration Disabled" />
            <div className="flex flex-col items-center justify-center text-center py-8 gap-4 font-sans">
                <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0-6v2m0-8a9 9 0 11-12 12 9 9 0 0112-12z" />
                    </svg>
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-bold text-white">Registrasi Dinonaktifkan</h2>
                    <p className="text-sm text-neutral-400">Pendaftaran akun baru dinonaktifkan untuk publik.</p>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                    Kembali ke halaman{' '}
                    <TextLink href={login()} tabIndex={1} className="text-indigo-400 hover:text-indigo-300">
                        Login
                    </TextLink>
                </div>
            </div>
        </>
    );
}

Register.layout = {
    title: 'Registration Disabled',
    description: 'Pendaftaran akun baru telah dinonaktifkan.',
};
