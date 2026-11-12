import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient.js';
import { Subject, Classroom, Department, User } from '../../types/index.js';
import {
  BookOpen,
  Building2,
  Plus,
  Radio,
  MapPin,
  CheckCircle2,
  X,
  Users,
} from 'lucide-react';

export const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'subjects' | 'classrooms'>('subjects');

  // New Subject Modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subName, setSubName] = useState('');
  const [subCode, setSubCode] = useState('');
  const [subDept, setSubDept] = useState('');
  const [subFac, setSubFac] = useState('');
  const [subCredits, setSubCredits] = useState('4');
  const [subSem, setSubSem] = useState('5');

  // New Classroom Modal
  const [showClassModal, setShowClassModal] = useState(false);
  const [crName, setCrName] = useState('');
  const [crBuilding, setCrBuilding] = useState('');
  const [crCapacity, setCrCapacity] = useState('80');
  const [crGeofence, setCrGeofence] = useState('50');

  const loadData = async () => {
    try {
      const [subsRes, crsRes, deptsRes, usersRes] = await Promise.all([
        api.getSubjects(),
        api.getClassrooms(),
        api.getDepartments(),
        api.getDemoUsers(),
      ]);
      setSubjects(subsRes.subjects);
      setClassrooms(crsRes.classrooms);
      setDepartments(deptsRes.departments);
      const facUsers = usersRes.users.filter((u) => u.role === 'faculty');
      setFaculty(facUsers);
      if (deptsRes.departments.length > 0) setSubDept(deptsRes.departments[0].id);
      if (facUsers.length > 0) setSubFac(facUsers[0].id);
    } catch (err) {
      console.error('Failed to load subjects & classrooms:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName || !subCode || !subDept || !subFac) return;

    try {
      await api.createSubject({
        name: subName,
        code: subCode.toUpperCase(),
        departmentId: subDept,
        facultyId: subFac,
        credits: Number(subCredits),
        semester: Number(subSem),
      });

      setShowSubjectModal(false);
      setSubName('');
      setSubCode('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create subject');
    }
  };

  const handleAddClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crName || !crBuilding) return;

    try {
      await api.createClassroom({
        name: crName,
        building: crBuilding,
        capacity: Number(crCapacity),
        geofenceRadiusMeters: Number(crGeofence),
        latitude: 12.9716,
        longitude: 77.5946,
        hasBeacon: true,
      });

      setShowClassModal(false);
      setCrName('');
      setCrBuilding('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create classroom');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>Academic Curriculum & Classroom Infrastructure</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage course modules, assigned faculty chairs, and physical lecture hall geofences.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'subjects' ? (
            <button
              onClick={() => setShowSubjectModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject</span>
            </button>
          ) : (
            <button
              onClick={() => setShowClassModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Classroom</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'subjects'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Curriculum Courses ({subjects.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('classrooms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'classrooms'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Lecture Halls & Labs ({classrooms.length})</span>
        </button>
      </div>

      {/* Tab 1: Subjects */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {s.code}
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">{s.name}</h3>
                </div>
                <span className="text-xs text-slate-400">{s.credits} Credits</span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
                <p>Instructor: <strong className="text-slate-200">{s.facultyName || 'Dr. Sarah Jenkins'}</strong></p>
                <p>Semester: <strong className="text-slate-200">{s.semester}</strong> • Total Classes: <strong className="text-indigo-400">{s.totalClassesScheduled}</strong></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Classrooms */}
      {activeTab === 'classrooms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classrooms.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{c.name}</h3>
                  <span className="text-xs text-slate-400">{c.building}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold">
                  Cap: {c.capacity}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Geofence Boundary: <strong>{c.geofenceRadiusMeters} meters</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>BLE Hardware Beacon: <strong>{c.hasBeacon ? 'Active' : 'Disabled'}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Subject */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Add Curriculum Subject</h3>
              <button onClick={() => setShowSubjectModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddSubject} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cloud Computing & DevOps"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Subject Code</label>
                  <input
                    type="text"
                    placeholder="CS305"
                    value={subCode}
                    onChange={(e) => setSubCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white uppercase font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Credits</label>
                  <input
                    type="number"
                    value={subCredits}
                    onChange={(e) => setSubCredits(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assigned Faculty</label>
                <select
                  value={subFac}
                  onChange={(e) => setSubFac(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                >
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.departmentName})</option>
                  ))}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowSubjectModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl">Save Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Classroom */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Add Lecture Hall / Venue</h3>
              <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddClassroom} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Venue Name</label>
                <input
                  type="text"
                  placeholder="e.g. LH-103 (Claude Shannon Hall)"
                  value={crName}
                  onChange={(e) => setCrName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Building</label>
                <input
                  type="text"
                  placeholder="e.g. Science Block C"
                  value={crBuilding}
                  onChange={(e) => setCrBuilding(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Capacity</label>
                  <input
                    type="number"
                    value={crCapacity}
                    onChange={(e) => setCrCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Geofence (Meters)</label>
                  <input
                    type="number"
                    value={crGeofence}
                    onChange={(e) => setCrGeofence(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowClassModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 text-white font-semibold rounded-xl">Save Venue</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
