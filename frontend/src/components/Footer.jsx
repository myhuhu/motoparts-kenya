import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-charcoal-900 border-t border-white/10 mt-20">
      <div className="container-page py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <h3 className="font-display text-xl font-bold mb-3">
            Moto<span className="text-ember-500">Parts</span> Kenya
          </h3>
          <p className="text-sm text-white/50 leading-relaxed">
            Genuine and compatible spare parts for Bajaj, Honda, TVS, Yamaha, Suzuki and electric
            motorcycles — delivered across Kenya.
          </p>
          <div className="flex gap-3 mt-4 text-white/50">
            <Facebook size={18} className="hover:text-ember-500 cursor-pointer" />
            <Instagram size={18} className="hover:text-ember-500 cursor-pointer" />
            <Twitter size={18} className="hover:text-ember-500 cursor-pointer" />
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Shop</h4>
          <ul className="space-y-2 text-sm text-white/50">
            <li><Link to="/shop" className="hover:text-ember-500">All Spare Parts</Link></li>
            <li><Link to="/shop?motorcycle_brand=electric" className="hover:text-ember-500">Electric Bike Parts</Link></li>
            <li><Link to="/shop?category=accessories" className="hover:text-ember-500">Accessories</Link></li>
            <li><Link to="/shop?in_stock=true" className="hover:text-ember-500">In Stock Only</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Company</h4>
          <ul className="space-y-2 text-sm text-white/50">
            <li><Link to="/about" className="hover:text-ember-500">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-ember-500">Contact</Link></li>
            <li><Link to="/dashboard" className="hover:text-ember-500">My Account</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Get in Touch</h4>
          <ul className="space-y-2 text-sm text-white/50">
            <li className="flex items-center gap-2"><MapPin size={14} /> Nairobi, Kenya</li>
            <li className="flex items-center gap-2"><Phone size={14} /> +254 700 000 000</li>
            <li className="flex items-center gap-2"><Mail size={14} /> support@motopartskenya.co.ke</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/30">
        © {new Date().getFullYear()} MotoParts Kenya. All rights reserved.
      </div>
    </footer>
  );
}
