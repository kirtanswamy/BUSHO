import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { Building2, ClipboardList, Home, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeProvider';

const items = [
  { route: '/(tabs)', path: '/', label: 'Home', Icon: Home },
  { route: '/(tabs)/stockouts', path: '/stockouts', label: 'Stockouts', Icon: ClipboardList },
  { route: '/(tabs)/updates', path: '/updates', label: 'Field updates', Icon: RefreshCw },
  { route: '/(tabs)/facility', path: '/facility', label: 'Facility', Icon: Building2 },
] as const;

function WorkerTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, typeScale } = useTheme();
  // Expo Router omits route groups such as "(tabs)" from the public pathname.
  const currentPath = pathname.replace('/(tabs)', '') || '/';

  return (
    <View style={[styles.bar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
      {items.map(({ route, path: itemPath, label, Icon }) => {
        const active = currentPath === itemPath || (itemPath !== '/' && currentPath.startsWith(itemPath + '/'));
        return (
          <Pressable
            key={route}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            onPress={() => router.replace(route as never)}
            style={({ pressed }) => [styles.item, { opacity: pressed ? 0.72 : 1 }]}
            hitSlop={4}
          >
            <Icon size={21} strokeWidth={active ? 2.5 : 1.8} color={active ? theme.colors.primary : theme.colors.textMuted} />
            <Text numberOfLines={1} style={[styles.label, { color: active ? theme.colors.primary : theme.colors.textMuted, fontSize: 10 * typeScale, fontWeight: active ? '800' : '600' }]}>{label}</Text>
            {active ? <View style={[styles.activeMark, { backgroundColor: theme.colors.primary }]} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function WorkerTabsLayout() {
  const { theme } = useTheme();
  return (
    <Tabs
      tabBar={() => <WorkerTabBar />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
        animation: 'fade',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="stockouts" options={{ title: 'Stockouts' }} />
      <Tabs.Screen name="updates" options={{ title: 'Field updates' }} />
      <Tabs.Screen name="facility" options={{ title: 'Facility' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 9, paddingBottom: 7, paddingHorizontal: 5 },
  item: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { textAlign: 'center' },
  activeMark: { position: 'absolute', top: -9, width: 26, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
});
