import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('patient' | 'hospital' | 'admin')[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, profile, loading, profileLoading } = useAuth();
  const location = useLocation();

  if (loading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // No profile means no authorized role context, deny route access.
  if (!profile) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Redirect to appropriate dashboard based on role
    switch (profile.role) {
      case 'patient':
        return <Navigate to="/patient/dashboard" replace />;
      case 'hospital':
        return <Navigate to="/hospital/dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // Check if hospital is approved
  if (profile.role === 'hospital' && !profile.is_approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-warning/10 flex items-center justify-center">
            <span className="text-4xl">⏳</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Pending Approval</h2>
          <p className="text-muted-foreground">
            Your hospital registration is pending admin approval.
            You'll be able to access the system once approved.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
