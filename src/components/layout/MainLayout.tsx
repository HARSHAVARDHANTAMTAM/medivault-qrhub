import { ReactNode } from 'react';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export const MainLayout = ({ children, showHeader = true }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border py-6 bg-card">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2024 MediVault. Secure Digital Healthcare Records.</p>
        </div>
      </footer>
    </div>
  );
};
