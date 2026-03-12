import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import { formatPrice } from '../utils/utils';
import { motion } from 'framer-motion';
import { ShoppingCart, CheckCircle2, Clock, XCircle, ExternalLink } from 'lucide-react';

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleMarkAsDelivered = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'Delivered' });
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order status.");
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Order Management</h1>
          <p className="text-slate-500">Track and manage customer orders.</p>
        </div>
        <div className="bg-indigo-600/10 text-indigo-400 px-4 py-2 rounded-xl border border-indigo-500/20 font-bold flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          {orders.length} Total Orders
        </div>
      </div>

      <div className="glass-dark rounded-[2.5rem] border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-slate-800">
                <th className="px-8 py-6">Tracking #</th>
                <th className="px-8 py-6">Customer</th>
                <th className="px-8 py-6">Gmail</th>
                <th className="px-8 py-6">Transaction ID</th>
                <th className="px-8 py-6">Items</th>
                <th className="px-8 py-6">Amount</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-white mb-1">{order.trackingNumber || 'N/A'}</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {order.createdAt?.toDate().toLocaleString()}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-white mb-1">{order.customerName}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{order.customerPhone}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm text-slate-300">{order.customerGmail || 'N/A'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-mono text-indigo-400">{order.transactionId}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <p key={idx} className="text-xs text-slate-400 truncate max-w-[150px]">
                          {item.quantity}x {item.title}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-white">{formatPrice(order.totalAmount)}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{order.paymentMethod}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {order.status === 'Pending' && (
                      <button
                        onClick={() => handleMarkAsDelivered(order.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {orders.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
              <ShoppingCart className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No orders yet</h3>
            <p className="text-slate-500">When customers place orders, they will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
