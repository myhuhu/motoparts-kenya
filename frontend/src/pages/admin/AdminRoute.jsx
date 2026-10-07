import {
  Bold, Code, Italic, Link as LinkIcon, List, ListOrdered,
  Redo2, Strikethrough, Underline, Undo2,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { sanitizeHtml } from "../../utils/sanitize";

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default function RichTextEditor({ value, onChange, placeholder = "Write a description..." }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = sanitizeHtml(value || "");
    }
  }, [value]);

  const emit = () => onChange(ref.current.innerHTML);

  const run = (command, arg = null) => {
    ref.current.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const addLink = () => {
    const url = window.prompt("Link URL (https://...)");
    if (url && /^(https?:|mailto:|tel:)/i.test(url.trim())) run("createLink", url.trim());
  };

  const wrapCode = () => {
    const text = window.getSelection()?.toString();
    if (text) run("insertHTML", `<code>${escapeHtml(text)}</code>`);
  };

  const tools = [
    { icon: Bold, label: "Bold", action: () => run("bold") },
    { icon: Italic, label: "Italic", action: () => run("italic") },
    { icon: Underline, label: "Underline", action: () => run("underline") },
    { icon: Strikethrough, label: "Strikethrough", action: () => run("strikeThrough") },
    { icon: Code, label: "Code", action: wrapCode },
    { icon: LinkIcon, label: "Link", action: addLink },
    { icon: List, label: "Bulleted list", action: () => run("insertUnorderedList"), gap: true },
    { icon: ListOrdered, label: "Numbered list", action: () => run("insertOrderedList") },
    { icon: Undo2, label: "Undo", action: () => run("undo"), gap: true },
    { icon: Redo2, label: "Redo", action: () => run("redo") },
  ];

  return (
    <div className="overflow-hidden rounded-sm border border-white/10 focus-within:border-ember-500">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-white/10 bg-charcoal-800 px-2 py-1.5">
        {tools.map(({ icon: Icon, label, action, gap }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={action}
            className={`rounded-sm p-1.5 text-white/60 hover:bg-white/10 hover:text-white ${gap ? "ml-2" : ""}`}
          >
            <Icon size={15} />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Product description"
        data-placeholder={placeholder}
        onInput={emit}
        className="rte rich-text min-h-[120px] bg-charcoal-900 px-3 py-2.5 text-sm leading-relaxed outline-none"
      />
    </div>
  );
}