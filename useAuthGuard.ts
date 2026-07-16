import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from "./store";

export function useAuthGuard(options: { requireAuth?: boolean; allowedRoles?: string[] } = {}) {
  const { requireAuth = true, allowedRoles } = options;
  const { currentUser } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (requireAuth && currentUser === null) {
      // Assuming store might initialize with undefined, if it's strictly null when not logged in
      navigate('/');
    } else if (currentUser && allowedRoles && !allowedRoles.includes(currentUser.role)) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate, requireAuth, allowedRoles]);

  return {
    currentUser,
    isAdmin: currentUser?.role === 'admin',
    isStaff: currentUser?.role === 'staff'
  };
}
