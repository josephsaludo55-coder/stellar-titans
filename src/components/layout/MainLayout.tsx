import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface NavItem {
  id: string;
  label: string;
  description: string;
}

interface MainLayoutProps {
  navItems: NavItem[];
  activeItemId: string;
  onNavigate: (id: string) => void;
  children: ReactNode;
  stage: string;
}

export function MainLayout({
  navItems,
  activeItemId,
  onNavigate,
  children,
  stage,
}: MainLayoutProps) {
  return (
    <div className="app-shell layout-shell">
      <Sidebar navItems={navItems} activeItemId={activeItemId} onNavigate={onNavigate} stage={stage} />

      <main className="workspace-shell">
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
