import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

function AppShell() {
  const { theme } = useTheme();
  return (
    <>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background }, animation: 'fade' }} />
    </>
  );
}

export default function RootLayout() {
  return <ThemeProvider><AppShell /></ThemeProvider>;
}
