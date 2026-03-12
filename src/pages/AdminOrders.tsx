import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import { formatPrice, formatDate } from '../utils/utils';
import { motion } from 'framer-motion';
import { ShoppingCart, CheckCircle2, Clock, XCircle, ExternalLink, ChevronUp, ChevronDown, Search } from 'lucide-react';

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: 'Complete' | 'Reject') => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });

      if (newStatus === 'Complete') {
        const userRef = doc(db, 'users', order.userId);
        await updateDoc(userRef, {
          totalSpent: increment(order.totalAmount)
        });
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order status.");
    }
  };

  const toggleSort = () => {
    if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortOrder('asc');
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    if (!sortOrder) return 0;
    if (sortOrder === 'asc') {
      return a.status.localeCompare(b.status);
    } else {
      return b.status.localeCompare(a.status);
    }
  });

  const filteredOrders = sortedOrders.filter(order => {
    const search = searchTerm.toLowerCase();
    return (
      order.trackingNumber?.toLowerCase().includes(search) ||
      order.transactionId?.toLowerCase().includes(search)
    );
  });

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Complete': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Reject': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Order Management</h1>
          <p className="text-slate-500">Track and manage customer orders.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Search by Tracking ID or Transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-white pl-11 pr-4 py-3 rounded-2xl w-full sm:w-80 focus:outline-none focus:border-indigo-500 transition-all text-sm"
            />
          </div>
          <div className="bg-indigo-600/10 text-indigo-400 px-4 py-2 rounded-xl border border-indigo-500/20 font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            {orders.length} Total Orders
          </div>
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
                <th className="px-8 py-6 cursor-pointer hover:text-indigo-400 transition-colors" onClick={toggleSort}>
                  <div className="flex items-center gap-2">
                    Status
                    <div className="flex flex-col">
                      <ChevronUp className={`w-3 h-3 ${sortOrder === 'asc' ? 'text-indigo-400' : 'text-slate-600'}`} />
                      <ChevronDown className={`w-3 h-3 ${sortOrder === 'desc' ? 'text-indigo-400' : 'text-slate-600'}`} />
                    </div>
                  </div>
                </th>
                <th className="px-8 py-6 text-right cursor-pointer hover:text-indigo-400 transition-colors" onClick={toggleSort}>
                  <div className="flex items-center justify-end gap-2">
                    Actions
                    <div className="flex flex-col">
                      <ChevronUp className={`w-3 h-3 ${sortOrder === 'asc' ? 'text-indigo-400' : 'text-slate-600'}`} />
                      <ChevronDown className={`w-3 h-3 ${sortOrder === 'desc' ? 'text-indigo-400' : 'text-slate-600'}`} />
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-white mb-1">{order.trackingNumber || 'N/A'}</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {formatDate(order.createdAt)}
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'Complete')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'Reject')}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-500/20"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
              {searchTerm ? <Search className="w-10 h-10" /> : <ShoppingCart className="w-10 h-10" />}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {searchTerm ? 'No orders found with this ID' : 'No orders yet'}
            </h3>
            <p className="text-slate-500">
              {searchTerm ? 'Try adjusting your search term.' : 'When customers place orders, they will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
