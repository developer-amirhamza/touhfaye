"use client";
import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { LuAlignJustify, LuUndo2 } from "react-icons/lu";
import { GrRedo } from "react-icons/gr";
import { TfiQuoteRight } from "react-icons/tfi";
import { PiTextAlignCenter, PiTextAlignLeft, PiTextAlignRight, PiTextBBold, PiTextItalic, PiTextStrikethrough } from "react-icons/pi";
import {
  FaBold,
  FaItalic,
  FaStrikethrough,
  FaCode,
  FaListUl,
  FaListOl,
  FaQuoteRight,
  FaUndo,
  FaRedo,
  FaMinus,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  FaLink,
  FaUnlink,
} from 'react-icons/fa';
import { RiImageAddFill } from 'react-icons/ri';
import { MdAddLink, MdFormatClear, MdLinkOff } from 'react-icons/md';
import { AiOutlineMinus } from 'react-icons/ai';
import { BsListUl } from 'react-icons/bs';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const buttonClass = (isActive: boolean) =>
    `p-1 rounded transition-colors ${
      isActive ? 'bg-gray-300 text-gray-900' : 'text-gray-700 hover:bg-gray-200'
    }`;

  // Get current block type (paragraph or heading)
  const getCurrentBlockType = () => {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    if (editor.isActive('heading', { level: 4 })) return 'h4';
    if (editor.isActive('heading', { level: 5 })) return 'h5';
    if (editor.isActive('heading', { level: 6 })) return 'h6';
    return 'paragraph';
  };

  const handleBlockChange = (value: string) => {
    if (value === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(value.replace('h', ''), 10);
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  // Add / edit a link on the current selection. Pre-fills the existing URL when
  // the cursor is already inside a link; an empty value removes the link.
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL (e.g. https://example.com)', previousUrl || '');
    if (url === null) return; // cancelled
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    // Default bare domains to https:// so the link actually works.
    const href = /^(https?:|mailto:|tel:|\/)/i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  };

  return (
    <div className="bg-gray-100 p-2 flex flex-wrap gap-1 border-b sticky top-0 z-10">
      {/* Dropdown for Paragraph / Headings */}
      <select
        value={getCurrentBlockType()}
        onChange={(e) => handleBlockChange(e.target.value)}
        className="px-2 py-1 border rounded bg-white text-sm cursor-pointer"
      >
        <option value="paragraph">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
        <option value="h5">Heading 5</option>
        <option value="h6">Heading 6</option>
      </select>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Text formatting */}
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass(editor.isActive('bold'))}>
        <PiTextBBold />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass(editor.isActive('italic'))}>
        <PiTextItalic />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={buttonClass(editor.isActive('strike'))}>
        <PiTextStrikethrough />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Text alignment */}
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={buttonClass(editor.isActive({ textAlign: 'left' }))}>
        <PiTextAlignLeft />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={buttonClass(editor.isActive({ textAlign: 'center' }))}>
        <PiTextAlignCenter />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={buttonClass(editor.isActive({ textAlign: 'right' }))}>
        <PiTextAlignRight />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={buttonClass(editor.isActive({ textAlign: 'justify' }))}>
        <LuAlignJustify />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Lists & Blockquote */}
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonClass(editor.isActive('bulletList'))}>
        <BsListUl />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={buttonClass(editor.isActive('orderedList'))}>
        <FaListOl />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={buttonClass(editor.isActive('blockquote'))}>
        <TfiQuoteRight />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Code block & Horizontal rule */}

      <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={buttonClass(false)}>
        <AiOutlineMinus />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Link / Unlink */}
      <button type="button" onClick={setLink} className={buttonClass(editor.isActive('link'))} title="Add / edit link">
        <MdAddLink />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
        className={`${buttonClass(false)} disabled:opacity-40 disabled:cursor-not-allowed`}
        title="Remove link"
      >
        <MdLinkOff />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Image */}
      <button type="button"
        onClick={() => {
          const url = window.prompt('Enter image URL');
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }}
        className="p-2 rounded text-gray-700 hover:bg-gray-200"
      >
        <RiImageAddFill />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Clear formatting & Undo/Redo */}
      <button type="button" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} className={buttonClass(false)}>
        <MdFormatClear />
      </button>
      <button type="button" onClick={() => editor.chain().focus().undo().run()} className={buttonClass(false)}>
        <LuUndo2 />
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} className={buttonClass(false)}>
        <GrRedo />
      </button>
    </div>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      // StarterKit v3 bundles a Link extension — disable it so we can register
      // our own configured instance below (no duplicate-extension warning).
      StarterKit.configure({ link: false } as any),
      Image,
      Link.configure({
        openOnClick: false, // don't navigate away while editing
        autolink: true, // turn typed URLs into links automatically
        linkOnPaste: true,
         // Linked text renders blue + bold everywhere the stored HTML is shown.
        HTMLAttributes: {
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
          class: 'text-blue-600 font-bold underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Write your blog content here...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return <div className="text-center p-4">Loading editor...</div>;

  return (
    <div className="border rounded-lg overflow-hidden  bg-white">
      <MenuBar editor={editor} />
       <EditorContent editor={editor} className="prose prose-lg max-w-none p-4 min-h-75" />
    </div>
  );
};

export default RichTextEditor;