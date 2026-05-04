import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { useCallback, useRef, useState } from 'react';
import { 
    Bold, Italic, Strikethrough, Underline as UnderlineIcon, 
    List, ListOrdered, Quote, Heading1, Heading2, Heading3, 
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Link as LinkIcon, Image as ImageIcon, Loader2, Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TiptapEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export function TiptapEditor({ value, onChange, placeholder }: TiptapEditorProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Link.configure({ openOnClick: false }),
            Image,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-sm sm:prose-base max-w-none focus:outline-none min-h-[200px] p-4 bg-background rounded-b-md border-x border-b border-input',
            },
        },
    });

    const addLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            const res = await fetch('/admin/upload-image', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken },
                body: formData,
            });

            const data = await res.json();
            if (res.ok && data.url) {
                editor.chain().focus().setImage({ src: data.url }).run();
                toast.success('Image uploaded successfully');
            } else {
                toast.error(data.error || 'Failed to upload image');
            }
        } catch (error) {
            toast.error('An error occurred during upload');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (!editor) return null;

    const MenuButton = ({ onClick, isActive, disabled, children }: any) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`p-2 rounded-md transition-colors ${
                isActive ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {children}
        </button>
    );

    return (
        <div className="w-full flex flex-col">
            <div className="flex flex-wrap items-center gap-1 p-2 bg-neutral-50 dark:bg-neutral-900 border rounded-t-md border-input">
                <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
                    <Bold className="w-4 h-4" />
                </MenuButton>
                <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
                    <Italic className="w-4 h-4" />
                </MenuButton>
                <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')}>
                    <UnderlineIcon className="w-4 h-4" />
                </MenuButton>
                <MenuButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}>
                    <Strikethrough className="w-4 h-4" />
                </MenuButton>

                <div className="w-[1px] h-6 bg-neutral-300 dark:bg-neutral-700 mx-1" />

                <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })}>
                    <Heading1 className="w-4 h-4" />
                </MenuButton>
                <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })}>
                    <Heading2 className="w-4 h-4" />
                </MenuButton>
                <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })}>
                    <Heading3 className="w-4 h-4" />
                </MenuButton>

                <div className="w-[1px] h-6 bg-neutral-300 dark:bg-neutral-700 mx-1" />

                <MenuButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })}>
                    <AlignLeft className="w-4 h-4" />
                </MenuButton>
                <MenuButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })}>
                    <AlignCenter className="w-4 h-4" />
                </MenuButton>
                <MenuButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })}>
                    <AlignRight className="w-4 h-4" />
                </MenuButton>
                <MenuButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })}>
                    <AlignJustify className="w-4 h-4" />
                </MenuButton>

                <div className="w-[1px] h-6 bg-neutral-300 dark:bg-neutral-700 mx-1" />

                <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
                    <List className="w-4 h-4" />
                </MenuButton>
                <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
                    <ListOrdered className="w-4 h-4" />
                </MenuButton>
                <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')}>
                    <Quote className="w-4 h-4" />
                </MenuButton>

                <div className="w-[1px] h-6 bg-neutral-300 dark:bg-neutral-700 mx-1" />

                <MenuButton onClick={addLink} isActive={editor.isActive('link')}>
                    <LinkIcon className="w-4 h-4" />
                </MenuButton>
                
                <MenuButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')}>
                    <Code className="w-4 h-4" />
                </MenuButton>
                
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <MenuButton onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                </MenuButton>
            </div>
            
            <EditorContent editor={editor} />
        </div>
    );
}
