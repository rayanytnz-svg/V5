import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { motion } from 'framer-motion';
import { Users, Shield, User as UserIcon, Mail, Calendar } from 'lucide-react';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile)));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update user role.");
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
          <h1 className="text-3xl font-black text-white mb-2">User Management</h1>
          <p className="text-slate-500">Manage registered users and their permissions.</p>
        </div>
        <div className="bg-indigo-600/10 text-indigo-400 px-4 py-2 rounded-xl border border-indigo-500/20 font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          {users.length} Registered Users
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {users.map((user) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={user.uid}
            className="glass-dark p-6 rounded-[2rem] border border-slate-800 relative overflow-hidden group"
          >
            <div className="flex items-start gap-4 mb-6 relative z-10">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-16 h-16 rounded-2xl border-2 border-slate-700 shadow-xl" />
              ) : (
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center border-2 border-slate-700">
                  <UserIcon className="w-8 h-8 text-slate-500" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-white truncate">{user.displayName}</h3>
                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mt-1">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${user.role === 'admin' ? 'text-emerald-400' : 'text-blue-400'}`} />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Role</span>
                </div>
                <span className={`text-xs font-black uppercase tracking-widest ${user.role === 'admin' ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {user.role}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Joined</span>
                </div>
                <span className="text-xs font-bold text-slate-300">
                  {user.createdAt?.toDate().toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800 relative z-10">
              <button
                onClick={() => toggleRole(user.uid, user.role)}
                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                  user.role === 'admin' 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                }`}
              >
                {user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
              </button>
            </div>

            {/* Background Decoration */}
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-10 transition-colors ${user.role === 'admin' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminUsers;
