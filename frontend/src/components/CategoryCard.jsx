import * as Icons from "lucide-react";
import { Link } from "react-router-dom";

export default function CategoryCard({ category }) {
  const Icon = Icons[toPascalCase(category.icon)] || Icons.Package;
  return (
    <Link
      to={`/shop?category=${category.slug}`}
      className="card flex flex-col items-center gap-3 p-6 text-center hover:border-ember-500/60 hover:-translate-y-0.5 transition-all"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ember-500/10 text-ember-500">
        <Icon size={22} />
      </div>
      <div>
        <p className="font-medium text-sm">{category.name}</p>
        <p className="text-xs text-white/40">{category.product_count} items</p>
      </div>
    </Link>
  );
}

function toPascalCase(str = "") {
  return str
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}
