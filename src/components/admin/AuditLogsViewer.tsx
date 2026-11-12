import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient.js';
import { AuditLog } from '../../types/index.js';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Radio,
  FileCheck2,
  AlertTriangle,
} from 'lucide-react';

export const AuditLogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const res = await api.getAuditLogs();
        setLogs(res.logs || []);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filtered = logs.filter((log) => {
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesSearch =
      searchQuery === '' ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
          <span>Security & Audit Trail Ledger</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Cryptographically timestamped record of every dynamic QR creation, scan validation, manual faculty override, and anti-proxy flag.
        </p>
      </div>

      {/* Filter and search */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by actor name, roll number, session ID or detail keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Event Actions</option>
            <option value="SESSION_CREATED">SESSION_CREATED</option>
            <option value="ATTENDANCE_MARKED">ATTENDANCE_MARKED</option>
            <option value="ATTENDANCE_OVERRIDDEN">ATTENDANCE_OVERRIDDEN</option>
            <option value="SESSION_CLOSED">SESSION_CLOSED</option>
            <option value="STUDENT_CREATED">STUDENT_CREATED</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Target Type</th>
                <th className="py-3.5 px-6">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-6 font-mono text-slate-300">
                    <span className="block">{new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-white block">{log.actorName}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{log.actorRole}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {log.targetType}
                  </td>
                  <td className="py-3.5 px-6 text-slate-200 max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
