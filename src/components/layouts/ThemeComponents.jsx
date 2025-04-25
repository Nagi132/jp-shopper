'use client';

import { useTheme } from '@/components/layouts/ThemeProvider';
import CursorWrapper from '@/components/effects/CursorWrapper';
import FloatingThemeCustomizer from '@/components/ui/FloatingThemeCustomizer';

/**
 * ThemeComponents - Client component that wraps theme-related UI components
 * This needs to be a client component because it uses the useTheme hook
 */
export default function ThemeComponents() {
  const { setTheme } = useTheme();
  
  return (
    <>
      <CursorWrapper />
      <FloatingThemeCustomizer onThemeChange={setTheme} />
    </>
  );
} 