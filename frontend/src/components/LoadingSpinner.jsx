import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-white/50">
      <Loader2 className="animate-spin text-ember-500" size={32} />
      <p className="text-sm">{label}</p>
    </div>
  );
}
