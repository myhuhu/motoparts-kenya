import { Heart, LayoutDashboard, LogOut, Menu, Moon, Search, ShoppingCart, Sun, User, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Spare Parts" },
  { to: "/shop?motorcycle_brand=", label: "Motorcycles", exact: true },
  { to: "/shop?motorcycle_brand=electric", label: "Electric Bikes" },
  { to: "/shop?category=accessories", label: "Accessories" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/shop?search=${encodeURIComponent(query)}`);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-charcoal-950/95 backdrop-blur border-b border-white/10">
      <div className="container-page flex items-center justify-between h-16 gap-3 sm:gap-4">
        <Link to="/" className="font-display text-xl sm:text-2xl font-bold tracking-tight shrink-0">
          Moto<span className="text-ember-500">Parts</span> Kenya
        </Link>

        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium">
          {LINKS.map((l) => (
            <Link key={l.label} to={l.to} className="text-white/70 hover:text-ember-500 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="hidden md:flex relative min-w-0 flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parts..."
            className="input-field min-w-0 pl-9 !py-2"
          />
        </form>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <button
            onClick={toggleTheme}
            className="text-white/70 hover:text-ember-500 transition-colors"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-pressed={theme === "light"}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {isAuthenticated && (
            <Link to="/wishlist" className="hidden sm:block text-white/70 hover:text-ember-500">
              <Heart size={20} />
            </Link>
          )}
          <Link to="/cart" className="relative text-white/70 hover:text-ember-500">
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-ember-500 text-on-ember text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="hidden sm:flex items-center gap-3">
              {user?.is_staff && (
                <Link to="/admin" className="flex items-center gap-1.5 text-sm text-ember-500 hover:text-ember-400">
                  <LayoutDashboard size={18} /> Admin
                </Link>
              )}
              <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-white/70 hover:text-ember-500">
                <User size={18} /> {user?.first_name || user?.username}
              </Link>
              <button onClick={logout} className="text-white/50 hover:text-red-400" title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden sm:block btn-secondary !px-4 !py-2 text-sm">
              Login
            </Link>
          )}

          <button
            className="xl:hidden text-white/70"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="xl:hidden border-t border-white/10 bg-charcoal-950 px-4 py-4 space-y-4">
          <form onSubmit={handleSearch} className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search parts..."
              className="input-field pl-9"
            />
          </form>
          <nav className="flex flex-col gap-3 text-sm font-medium">
            {LINKS.map((l) => (
              <Link key={l.label} to={l.to} onClick={() => setOpen(false)} className="text-white/70 hover:text-ember-500">
                {l.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                {user?.is_staff && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="text-ember-500 font-semibold">Admin Dashboard</Link>
                )}
                <Link to="/dashboard" onClick={() => setOpen(false)} className="text-white/70 hover:text-ember-500">My Account</Link>
                <button onClick={() => { logout(); setOpen(false); }} className="text-left text-red-400">Logout</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="text-ember-500 font-semibold">Login / Register</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
