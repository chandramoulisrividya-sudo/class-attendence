import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { api } from '../services/apiClient.js';

interface AuthContextType {
  currentUser: User | null;
  activeRole: UserRole;
  token: string | null;
  allDemoUsers: User[];
  allTeachers: User[];
  allStudents: User[];
  isLoading: boolean;
  login: (userId: string) => Promise<void>;
  loginAsRole: (role: UserRole) => Promise<void>;
  switchTeacher: (teacherId: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    studentId: string;
    departmentId: string;
    semester: number;
    batch?: string;
  }) => Promise<User>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'smartattend_user_id';
const LOCAL_STORAGE_ROLE = 'smartattend_role';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('student');
  const [token, setToken] = useState<string | null>(null);
  const [allDemoUsers, setAllDemoUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load demo users and active session on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { users } = await api.getDemoUsers();
        if (!isMounted) return;
        setAllDemoUsers(users);

        const savedRole = (localStorage.getItem(LOCAL_STORAGE_ROLE) as UserRole) || 'student';
        setActiveRole(savedRole);

        const savedUserId = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedUserId) {
          const match = users.find((u) => u.id === savedUserId);
          if (match) {
            setCurrentUser(match);
            setActiveRole(match.role);
            setToken(`token-${match.id}`);
            return;
          }
        }

        // If savedRole is faculty or admin, default to first teacher or admin
        if (savedRole === 'faculty') {
          const defaultTeacher = users.find((u) => u.role === 'faculty');
          if (defaultTeacher) {
            setCurrentUser(defaultTeacher);
            setToken(`token-${defaultTeacher.id}`);
            localStorage.setItem(LOCAL_STORAGE_KEY, defaultTeacher.id);
          }
        } else if (savedRole === 'admin') {
          const defaultAdmin = users.find((u) => u.role === 'admin');
          if (defaultAdmin) {
            setCurrentUser(defaultAdmin);
            setToken(`token-${defaultAdmin.id}`);
            localStorage.setItem(LOCAL_STORAGE_KEY, defaultAdmin.id);
          }
        } else {
          // Student role
          const student = users.find((u) => u.role === 'student');
          if (student) {
            setCurrentUser(student);
            setToken(`token-${student.id}`);
            localStorage.setItem(LOCAL_STORAGE_KEY, student.id);
          } else {
            // No student accounts exist yet - fresh state ready for student account creation!
            setCurrentUser(null);
            setActiveRole('student');
          }
        }
      } catch (err) {
        console.error('Failed to initialize demo users:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (userId: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ userId });
      setCurrentUser(res.user);
      setActiveRole(res.user.role);
      setToken(res.token);
      localStorage.setItem(LOCAL_STORAGE_KEY, res.user.id);
      localStorage.setItem(LOCAL_STORAGE_ROLE, res.user.role);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsRole = async (role: UserRole) => {
    setActiveRole(role);
    localStorage.setItem(LOCAL_STORAGE_ROLE, role);

    const students = allDemoUsers.filter((u) => u.role === 'student');
    const teachers = allDemoUsers.filter((u) => u.role === 'faculty');
    const admins = allDemoUsers.filter((u) => u.role === 'admin');

    if (role === 'student') {
      if (students.length > 0) {
        await login(students[0].id);
      } else {
        // No students exist yet -> clear currentUser so Student Onboarding Form displays
        setCurrentUser(null);
        setToken(null);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } else if (role === 'faculty') {
      const targetTeacher = teachers.find((t) => t.id === 'fac-1') || teachers[0];
      if (targetTeacher) {
        await login(targetTeacher.id);
      }
    } else if (role === 'admin') {
      if (admins.length > 0) {
        await login(admins[0].id);
      }
    }
  };

  const switchTeacher = async (teacherId: string) => {
    await login(teacherId);
  };

  const register = async (data: {
    name: string;
    email: string;
    studentId: string;
    departmentId: string;
    semester: number;
    batch?: string;
  }): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.registerStudent(data);
      setCurrentUser(res.user);
      setActiveRole('student');
      setToken(res.token);
      localStorage.setItem(LOCAL_STORAGE_KEY, res.user.id);
      localStorage.setItem(LOCAL_STORAGE_ROLE, 'student');

      // Refresh users list
      const updated = await api.getDemoUsers();
      setAllDemoUsers(updated.users);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const switchRole = (newRole: UserRole) => {
    loginAsRole(newRole);
  };

  const refreshUser = async () => {
    try {
      const { users } = await api.getDemoUsers();
      setAllDemoUsers(users);
      if (currentUser) {
        const match = users.find((u) => u.id === currentUser.id);
        if (match) setCurrentUser(match);
      }
    } catch (e) {
      console.warn('Could not refresh user:', e);
    }
  };

  const allTeachers = allDemoUsers.filter((u) => u.role === 'faculty');
  const allStudents = allDemoUsers.filter((u) => u.role === 'student');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole,
        token,
        allDemoUsers,
        allTeachers,
        allStudents,
        isLoading,
        login,
        loginAsRole,
        switchTeacher,
        register,
        logout,
        switchRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
