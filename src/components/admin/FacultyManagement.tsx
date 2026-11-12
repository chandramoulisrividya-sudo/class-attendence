import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient.js';
import { User, Subject, Department } from '../../types/index.js';
import {
  Users,
  Briefcase,
  BookOpen,
  Mail,
  ShieldCheck,
  Plus,
  Building2,
} from 'lucide-react';

export const FacultyManagement: React.FC = () => {
  const [faculty, setFaculty] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [usersRes, subsRes, deptsRes] = await Promise.all([
          api.getDemoUsers(),
          api.getSubjects(),
          api.getDepartments(),
        ]);
        setFaculty(usersRes.users.filter((u) => u.role === 'faculty'));
        setSubjects(subsRes.subjects);
        setDepartments(deptsRes.departments);
      } catch (err) {
        console.error('Failed to load faculty:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Users className="w-6 h-6 text-cyan-400" />
          <span>Faculty & Instructor Roster</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Instructors authorized to generate dynamic classroom QR tokens and conduct lectures.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faculty.map((f) => {
          const assignedCourses = subjects.filter((s) => s.facultyId === f.id);
          return (
            <div
              key={f.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={f.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'}
                    alt={f.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-700"
                  />
                  <div>
                    <h3 className="text-base font-bold text-white">{f.name}</h3>
                    <span className="text-xs text-cyan-400 font-medium block">{f.designation || 'Professor'}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{f.facultyId}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{f.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{f.departmentName || 'Computer Science'}</span>
                  </div>
                </div>
              </div>

              {/* Assigned courses */}
              <div className="pt-3 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                  Assigned Courses ({assignedCourses.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {assignedCourses.map((c) => (
                    <span
                      key={c.id}
                      className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-mono font-medium"
                      title={c.name}
                    >
                      {c.code}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
