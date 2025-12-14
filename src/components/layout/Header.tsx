import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User, Building2, Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Header = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!profile) return '/';
    switch (profile.role) {
      case 'patient':
        return '/patient/dashboard';
      case 'hospital':
        return '/hospital/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  const getRoleIcon = () => {
    if (!profile) return null;
    switch (profile.role) {
      case 'patient':
        return <User className="w-5 h-5" />;
      case 'hospital':
        return <Building2 className="w-5 h-5" />;
      case 'admin':
        return <Shield className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to={user ? getDashboardLink() : '/'} className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl medical-gradient flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">M</span>
          </div>
          <span className="text-xl font-bold text-foreground hidden sm:block">MediVault</span>
        </Link>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-secondary"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-4">
          {user && profile ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground">
                {getRoleIcon()}
                <span className="text-sm font-medium capitalize">{profile.role}</span>
              </div>
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link to="/patient/login">Patient Login</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/hospital/login">Hospital Login</Link>
              </Button>
              <Button variant="default" asChild>
                <Link to="/patient/register">Get Started</Link>
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-card border-b border-border p-4 md:hidden animate-fade-in">
            <nav className="flex flex-col gap-3">
              {user && profile ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground">
                    {getRoleIcon()}
                    <span className="text-sm font-medium capitalize">{profile.role}</span>
                  </div>
                  <Button variant="ghost" onClick={handleSignOut} className="justify-start">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="justify-start">
                    <Link to="/patient/login">Patient Login</Link>
                  </Button>
                  <Button variant="ghost" asChild className="justify-start">
                    <Link to="/hospital/login">Hospital Login</Link>
                  </Button>
                  <Button variant="default" asChild>
                    <Link to="/patient/register">Get Started</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
