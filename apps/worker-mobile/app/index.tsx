import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BushoLogo } from '@/components/ui/BushoLogo';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/theme/ThemeProvider';

export default function FoundationPreview() {
  const { theme, typeScale } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <BushoLogo size={56} />
        <Text style={[styles.eyebrow, { color: theme.colors.textMuted, fontSize: 12 * typeScale }]}>SHC HEALTH WORKER</Text>
        <Text style={[styles.title, { color: theme.colors.text, fontSize: 26 * typeScale }]}>BUSHO Mobile</Text>
        <Text style={[styles.body, { color: theme.colors.textMuted, fontSize: 15 * typeScale }]}>The mobile foundation is ready. Worker workflows will be added in the next milestone.</Text>
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.colors.text, fontSize: 16 * typeScale }]}>Foundation preview</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 14 * typeScale, lineHeight: 21 * typeScale }}>Light-first design · Accessible type scale · Secure session storage</Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  eyebrow: { fontWeight: '700', letterSpacing: 1.2, marginTop: 12 },
  title: { fontWeight: '800', letterSpacing: -0.6 },
  body: { lineHeight: 23, maxWidth: 320 },
  card: { marginTop: 16 },
  cardTitle: { fontWeight: '700', marginBottom: 8 },
});
