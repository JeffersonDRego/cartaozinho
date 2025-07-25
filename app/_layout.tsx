import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

// Configurar notificações globalmente
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Prevenir splash screen de esconder automaticamente
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    // Configurar canal de notificação para Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Cartãozinho Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0a7ea4',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
      });
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 200,
          }}
        >
          {/* Tela principal (splash/redirecionamento) */}
          <Stack.Screen
            name="index"
            options={{
              title: 'Cartãozinho',
            }}
          />

          {/* Tela de login */}
          <Stack.Screen
            name="login"
            options={{
              title: 'Login',
              animation: 'fade',
            }}
          />

          {/* Tabs principais (cliente e lojista) */}
          <Stack.Screen
            name="(tabs)"
            options={{
              title: 'App Principal',
              animation: 'fade',
            }}
          />

          {/* Tela de gerenciamento de loja */}
          <Stack.Screen
            name="manage-store"
            options={{
              title: 'Gerenciar Loja',
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />

          {/* Tela não encontrada */}
          <Stack.Screen
            name="+not-found"
            options={{
              title: 'Página não encontrada',
            }}
          />
        </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}