import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, hasNext, hasPrev, onChange }) {
  if (!hasNext && !hasPrev) return null;
  return (
    <div className="flex items-center justify-center gap-4 mt-10">
      <button
        disabled={!hasPrev}
        onClick={() => onChange(page - 1)}
        className="btn-secondary !px-4 !py-2 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} /> Prev
      </button>
      <span className="text-sm text-white/60">Page {page}</span>
      <button
        disabled={!hasNext}
        onClick={() => onChange(page + 1)}
        className="btn-secondary !px-4 !py-2 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
}
