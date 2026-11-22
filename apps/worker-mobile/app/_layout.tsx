import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/features/auth';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

function AppShell() {
  const { theme } = useTheme();
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background }, animation: 'fade' }} />
    </AuthProvider>
  );
}

export default function RootLayout() {
  return <ThemeProvider><AppShell /></ThemeProvider>;
}
