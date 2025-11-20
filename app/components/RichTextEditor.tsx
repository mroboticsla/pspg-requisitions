'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import StarterKit from '@tiptap/starter-kit';
// import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Strikethrough } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        code: false,
        codeBlock: false,
      }),
      // Underline,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] px-3 py-2',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-admin-border rounded-admin overflow-hidden focus-within:ring-2 focus-within:ring-admin-accent/20 focus-within:border-admin-accent transition-all bg-white">
      <div className="flex items-center gap-1 p-2 border-b border-admin-border bg-admin-bg-page">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-admin-bg-hover transition-colors ${editor.isActive('bold') ? 'bg-admin-bg-hover text-admin-accent' : 'text-admin-text-secondary'}`}
          title="Negrita"
          type="button"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-admin-bg-hover transition-colors ${editor.isActive('italic') ? 'bg-admin-bg-hover text-admin-accent' : 'text-admin-text-secondary'}`}
          title="Cursiva"
          type="button"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-admin-bg-hover transition-colors ${editor.isActive('underline') ? 'bg-admin-bg-hover text-admin-accent' : 'text-admin-text-secondary'}`}
          title="Subrayado"
          type="button"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded hover:bg-admin-bg-hover transition-colors ${editor.isActive('strike') ? 'bg-admin-bg-hover text-admin-accent' : 'text-admin-text-secondary'}`}
          title="Tachado"
          type="button"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-admin-border mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-admin-bg-hover transition-colors ${editor.isActive('bulletList') ? 'bg-admin-bg-hover text-admin-accent' : 'text-admin-text-secondary'}`}
          title="Lista con viñetas"
          type="button"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-admin-bg-hover transition-colors ${editor.isActive('orderedList') ? 'bg-admin-bg-hover text-admin-accent' : 'text-admin-text-secondary'}`}
          title="Lista numerada"
          type="button"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
