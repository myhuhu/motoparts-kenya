import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { useToast } from "../context/ToastContext";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const { showToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast("Message sent. We'll get back to you shortly.");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="container-page py-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div>
        <h1 className="font-display text-4xl font-semibold mb-6">Get in Touch</h1>
        <p className="text-white/60 mb-8">Have a question about a part or an order? Reach out to us.</p>
        <div className="space-y-4 text-sm text-white/70">
          <p className="flex items-center gap-3"><MapPin size={18} className="text-ember-500" /> Nairobi, Kenya</p>
          <p className="flex items-center gap-3"><Phone size={18} className="text-ember-500" /> +254 700 000 000</p>
          <p className="flex items-center gap-3"><Mail size={18} className="text-ember-500" /> support@motopartskenya.co.ke</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <input required placeholder="Your Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
        <input required type="email" placeholder="Your Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
        <textarea required rows={5} placeholder="Your Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-field" />
        <button type="submit" className="btn-primary w-full">Send Message</button>
      </form>
    </div>
  );
}
