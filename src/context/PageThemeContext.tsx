import { createContext, useContext, useMemo, type ReactNode } from 'react';

interface PageTheme {
  accentColor: string;
  glowPattern: string;
  patternOverlay?: string;
  pageClass: string;
}

const PAGE_THEMES: Record<string, PageTheme> = {
  cover: {
    accentColor: 'var(--ochre)',
    glowPattern: 'radial-gradient(ellipse at center, rgba(196, 150, 58, 0.06) 0%, transparent 60%)',
    pageClass: 'page--cover',
  },
  wings: {
    accentColor: 'var(--verdigris)',
    glowPattern: 'radial-gradient(ellipse at 70% 30%, rgba(74, 140, 126, 0.05) 0%, transparent 55%)',
    pageClass: 'page--wings',
  },
  vision: {
    accentColor: 'var(--ochre)',
    glowPattern: 'radial-gradient(ellipse at 50% 50%, rgba(196, 150, 58, 0.04) 0%, transparent 50%)',
    patternOverlay: 'repeating-conic-gradient(rgba(196, 150, 58, 0.02) 0% 25%, transparent 0% 50%)',
    pageClass: 'page--vision',
  },
  metamorphosis: {
    accentColor: 'var(--carmine)',
    glowPattern: 'linear-gradient(to bottom, rgba(155, 35, 53, 0.04), transparent 50%)',
    pageClass: 'page--metamorphosis',
  },
  antennae: {
    accentColor: 'var(--verdigris)',
    glowPattern: 'radial-gradient(ellipse at 30% 70%, rgba(74, 140, 126, 0.04) 0%, transparent 50%)',
    patternOverlay: 'repeating-linear-gradient(90deg, rgba(74, 140, 126, 0.03) 0px, transparent 2px, transparent 20px)',
    pageClass: 'page--antennae',
  },
  numbers: {
    accentColor: 'var(--ochre)',
    glowPattern: 'radial-gradient(ellipse at 50% 30%, rgba(196, 150, 58, 0.05) 0%, transparent 50%)',
    pageClass: 'page--numbers',
  },
  records: {
    accentColor: 'var(--carmine)',
    glowPattern: 'radial-gradient(ellipse at 20% 80%, rgba(155, 35, 53, 0.05), transparent 50%)',
    pageClass: 'page--records',
  },
  behavior: {
    accentColor: 'var(--verdigris)',
    glowPattern: 'radial-gradient(ellipse at 60% 40%, rgba(74, 140, 126, 0.04) 0%, transparent 55%)',
    pageClass: 'page--behavior',
  },
  mimicry: {
    accentColor: 'var(--ochre)',
    glowPattern: 'radial-gradient(ellipse at 50% 50%, rgba(196, 150, 58, 0.05), transparent 60%)',
    pageClass: 'page--mimicry',
  },
  humans: {
    accentColor: 'var(--carmine)',
    glowPattern: 'radial-gradient(ellipse at 40% 60%, rgba(155, 35, 53, 0.04) 0%, transparent 50%)',
    pageClass: 'page--humans',
  },
  colophon: {
    accentColor: 'var(--ochre)',
    glowPattern: 'radial-gradient(ellipse at center, rgba(196, 150, 58, 0.04) 0%, transparent 60%)',
    pageClass: 'page--colophon',
  },
};

interface PageThemeContextType {
  theme: PageTheme;
  pageIndex: number;
}

const PageThemeContext = createContext<PageThemeContextType | undefined>(undefined);

interface PageThemeProviderProps {
  pageIndex: number;
  pageId: string;
  children: ReactNode;
}

export function PageThemeProvider({ pageIndex, pageId, children }: PageThemeProviderProps) {
  const theme = useMemo(() => {
    return PAGE_THEMES[pageId] || PAGE_THEMES.cover;
  }, [pageId]);

  const value = useMemo(() => ({
    theme,
    pageIndex,
  }), [theme, pageIndex]);

  return (
    <PageThemeContext.Provider value={value}>
      {children}
    </PageThemeContext.Provider>
  );
}

export function usePageTheme() {
  const context = useContext(PageThemeContext);
  if (!context) {
    throw new Error('usePageTheme must be used within a PageThemeProvider');
  }
  return context;
}

export { PAGE_THEMES };
export type { PageTheme };
