import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  const isCustomer = user?.user_type === 'customer';
  const isMerchant = user?.user_type === 'merchant';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      {/* Tab Principal (Home) - Para ambos os tipos */}
      <Tabs.Screen
        name="index"
        options={{
          title: isCustomer ? 'Meus Cartões' : 'Dashboard',
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={28}
              name="house.fill"
              color={color}
            />
          ),
        }}
      />

      {/* Tab Perfil/Configurações - Para Clientes */}
      {isCustomer && (
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color }) => (
              <IconSymbol
                size={28}
                name="chevron.right"
                color={color}
              />
            ),
          }}
        />
      )}

      {/* Tab Loja - Para Lojistas */}
      {isMerchant && (
        <Tabs.Screen
          name="store"
          options={{
            title: 'Minha Loja',
            tabBarIcon: ({ color }) => (
              <IconSymbol
                size={28}
                name="chevron.left.forwardslash.chevron.right"
                color={color}
              />
            ),
          }}
        />
      )}

      {/* Tab Notificações - Para Lojistas */}
      {isMerchant && (
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Notificar',
            tabBarIcon: ({ color }) => (
              <IconSymbol
                size={28}
                name="paperplane.fill"
                color={color}
              />
            ),
          }}
        />
      )}

      {/* Esconder tabs que não devem aparecer */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Remove da navegação
        }}
      />
    </Tabs>
  );
}