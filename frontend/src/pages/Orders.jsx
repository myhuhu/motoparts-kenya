import { PackageOpen } from "lucide-react";
import { useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import OrderCard from "../components/OrderCard";
import orderService from "../services/orderService";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.list().then((data) => {
      setOrders(data.results || data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner label="Loading orders..." />;

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-semibold mb-8">My Orders</h1>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-white/50">
          <PackageOpen size={36} />
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {orders.map((o) => <OrderCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}
