import { ArrowRight, ShieldCheck, Truck, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CategoryCard from "../components/CategoryCard";
import ProductGrid from "../components/ProductGrid";
import productService from "../services/productService";

const HERO_IMG =
  "https://images.unsplash.com/photo-1580310614729-ccd69652491d?auto=format&fit=crop&w=1400&q=70";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([productService.featured(), productService.categories()])
      .then(([f, c]) => {
        setFeatured(f.results || f);
        setCategories(c.results || c);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10">
        <img src={HERO_IMG} alt="Motorcycle spare parts" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950 via-charcoal-950/90 to-charcoal-950/60" />
        <div className="container-page relative py-24 md:py-32 max-w-2xl">
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.05] mb-5">
            Quality Motorcycle Spare Parts. Delivered Across Kenya.
          </h1>
          <p className="text-white/60 text-base md:text-lg mb-8">
            Find genuine and compatible spare parts for Bajaj, Honda, TVS, Yamaha, Suzuki and
            electric motorcycles.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/shop" className="btn-primary">
              Shop Spare Parts <ArrowRight size={16} />
            </Link>
            <Link to="/shop?motorcycle_brand=electric" className="btn-secondary">
              Shop Electric Bike Parts
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-charcoal-900">
        <div className="container-page py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-ember-500" size={22} />
            <span className="text-white/70">Genuine & compatible parts</span>
          </div>
          <div className="flex items-center gap-3">
            <Truck className="text-ember-500" size={22} />
            <span className="text-white/70">Nationwide delivery</span>
          </div>
          <div className="flex items-center gap-3">
            <Zap className="text-ember-500" size={22} />
            <span className="text-white/70">Secure M-Pesa checkout</span>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="font-display text-3xl font-semibold mb-8">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.slice(0, 12).map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl font-semibold">Featured Products</h2>
          <Link to="/shop" className="text-ember-500 text-sm font-medium flex items-center gap-1 hover:underline">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <ProductGrid products={featured} loading={loading} />
      </section>
    </div>
  );
}
