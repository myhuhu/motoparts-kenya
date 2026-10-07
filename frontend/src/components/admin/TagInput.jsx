import { Plus, X } from "lucide-react";
import { useState } from "react";

export default function TagInput({ id, tags, onChange, placeholder = "Add Model" }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    if (value && !tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      onChange([...tags, value]);
    }
    setDraft("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="input-field flex items-center gap-2 !p-1.5">
      <div className="flex flex-1 flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-sm bg-charcoal-600 px-2 py-1 text-xs">
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="text-white/50 hover:text-white"
              aria-label={`Remove ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-w-[90px] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-white/40"
        />
      </div>
      <button
        type="button"
        onClick={add}
        className="rounded-sm p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
        aria-label="Add model"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}