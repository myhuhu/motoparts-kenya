import {
  Car, ChevronDown, ChevronUp, ClipboardList, LayoutDashboard, LayoutGrid,
  LogOut, MapPin, Menu, Settings, Users, X,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors ${
    isActive ? "bg-charcoal-700 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
  }`;

const subLinkClass = ({ isActive }) =>
  `block rounded-sm py-2 pl-11 pr-3 text-sm transition-colors ${
    isActive ? "font-medium text-ember-500" : "text-white/50 hover:text-white"
  }`;

function titleFor(path) {
  if (path === "/admin") return "Dashboard";
  if (path.endsWith("/products/new")) return "Add New Product";
  if (path.startsWith("/admin/products/") && path.endsWith("/edit")) return "Edit Product";
  const titles = {
    products: "Products", categories: "Categories", brands: "Brands",
    orders: "Orders", customers: "Customers", settings: "Settings",
    "delivery-fees": "Delivery Fees",
  };
  return titles[path.split("/")[2]] || "Admin";
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(true);

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name ? user.last_name[0] + "." : ""}`.trim()
    : user?.username;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-white">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-charcoal-900 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            className="text-white/70 lg:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            MotoParts Kenya <span className="text-white/40">—</span> {titleFor(location.pathname)}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ember-500 text-sm font-bold text-on-ember">
              {(displayName || "A")[0].toUpperCase()}
            </span>
            <span className="hidden text-sm sm:block">{displayName}</span>
          </div>
          <Link to="/admin/settings" className="text-white/60 hover:text-white" aria-label="Settings">
            <Settings size={19} />
          </Link>
        </div>
      </header>

      <div className="flex">
        {menuOpen && (
          <div className="fixed inset-0 top-16 z-10 bg-black/60 lg:hidden" onClick={() => setMenuOpen(false)} />
        )}

        <aside
          className={`fixed left-0 top-16 z-20 flex h-[calc(100vh-4rem)] w-60 shrink-0 flex-col border-r border-white/10 bg-charcoal-900 p-3 transition-transform lg:sticky ${
            menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
          onClick={(e) => e.target.closest("a") && setMenuOpen(false)}
        >
          <nav className="flex-1 space-y-1 overflow-y-auto">
            <NavLink to="/admin" end className={linkClass}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>

            <div>
              <button
                type="button"
                onClick={() => setCatalogOpen((o) => !o)}
                className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white"
              >
                <LayoutGrid size={18} /> Catalog
                {catalogOpen ? <ChevronUp size={16} className="ml-auto" /> : <ChevronDown size={16} className="ml-auto" />}
              </button>
              {catalogOpen && (
                <div className="mt-0.5">
                  <NavLink to="/admin/products" className={subLinkClass}>Products</NavLink>
                  <NavLink to="/admin/categories" className={subLinkClass}>Categories</NavLink>
                  <NavLink to="/admin/brands" className={subLinkClass}>Brands</NavLink>
                </div>
              )}
            </div>

            <NavLink to="/admin/orders" className={linkClass}>
              <ClipboardList size={18} /> Orders
            </NavLink>
            <NavLink to="/admin/customers" className={linkClass}>
              <Users size={18} /> Customers
            </NavLink>
            <NavLink to="/admin/delivery-fees" className={linkClass}>
              <MapPin size={18} /> Delivery Fees
            </NavLink>
            <NavLink to="/admin/settings" className={linkClass}>
              <Settings size={18} /> Settings
            </NavLink>
          </nav>

          <div className="flex items-center justify-between border-t border-white/10 pt-3">
            <Link to="/" className="flex items-center gap-3 rounded-sm px-2 py-1.5 text-sm text-white/70 hover:text-white">
              <Car size={18} />
              <span>
                View Shop
                <span className="block text-xs text-white/35">Kenya</span>
              </span>
            </Link>
            <button onClick={handleLogout} className="p-2 text-white/50 hover:text-red-400" title="Log out" aria-label="Log out">
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
