import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface LayoutContextType {
  navExpanded: boolean;
  setNavExpanded: (expanded: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

interface LayoutProviderProps {
  children: ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const [navExpanded, setNavExpandedState] = useState(false);

  const setNavExpanded = useCallback((expanded: boolean) => {
    setNavExpandedState(expanded);
    // Trigger re-layout in PageSpread (resize listener will fire)
    window.dispatchEvent(new Event('resize'))
  }, []);

  return (
    <LayoutContext.Provider value={{ navExpanded, setNavExpanded }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
