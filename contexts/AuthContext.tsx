import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

export interface User {
    id: number;
    name: string;
    phone: string;
    user_type: 'customer' | 'merchant';
    expo_push_token?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (phone: string, name?: string) => Promise<boolean>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Configure notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUser();
        registerForPushNotifications();
    }, []);

    // ⚠️ SUBSTITUA ESTA URL PELA URL REAL DO SEU SERVIDOR NO EASYPANEL
    const API_URL = 'https://appcartaozinho-servercartaozinho.5gttis.easypanel.host/api'; // 🔥 MUDE AQUI!

    // 🐛 DEBUG: Mostrar URL sendo usada
    console.log('🌐 API_URL sendo usada:', API_URL);

    const registerForPushNotifications = async () => {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        try {
            const token = (await Notifications.getExpoPushTokenAsync()).data;
            console.log('🔔 Push token obtido:', token);
            return token;
        } catch (error) {
            console.log('Error getting push token:', error);
        }
    };

    const loadUser = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                setUser(JSON.parse(userData));
                console.log('👤 Usuário carregado do storage');
            }
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (phone: string, name?: string): Promise<boolean> => {
        setIsLoading(true);
        console.log('🔐 Tentando login/cadastro...');
        console.log('📱 Telefone:', phone);
        console.log('👤 Nome:', name);
        console.log('🌐 URL:', API_URL);

        try {
            // 🐛 DEBUG: Testar se a URL está acessível
            console.log('🌐 Testando conectividade...');

            // Primeiro, tenta fazer login
            console.log('🔐 Tentando login...');
            let response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ phone }),
            });

            console.log('📡 Status da resposta login:', response.status);

            // Se usuário não existe e tem nome, faz cadastro
            if (response.status === 404 && name) {
                console.log('👤 Usuário não encontrado, fazendo cadastro...');
                const pushToken = await registerForPushNotifications();

                response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        phone,
                        name,
                        expo_push_token: pushToken,
                        user_type: 'customer' // Default para customer
                    }),
                });

                console.log('📡 Status da resposta cadastro:', response.status);
            }

            if (response.ok) {
                const userData = await response.json();
                console.log('✅ Login/cadastro bem-sucedido:', userData);
                setUser(userData);
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                return true;
            } else {
                const errorText = await response.text();
                console.error('❌ Erro na resposta:', response.status, errorText);

                // Mostrar erro mais detalhado
                Alert.alert(
                    'Erro de Conexão',
                    `Status: ${response.status}\nDetalhes: ${errorText}\nURL: ${API_URL}`
                );
                return false;
            }

        } catch (error) {
            console.error('💥 Erro de rede:', error);

            // Debug detalhado do erro
            if (error instanceof TypeError && error.message.includes('Network request failed')) {
                Alert.alert(
                    'Erro de Rede',
                    `Não foi possível conectar ao servidor.\n\n` +
                    `URL: ${API_URL}\n\n` +
                    `Possíveis causas:\n` +
                    `• Servidor offline\n` +
                    `• URL incorreta\n` +
                    `• Bloqueio de firewall\n` +
                    `• Problema de CORS\n\n` +
                    `Erro: ${error.message}`
                );
            } else {
                const errorMessage = typeof error === 'object' && error !== null && 'message' in error
                    ? String((error as { message?: unknown }).message)
                    : String(error);
                Alert.alert('Erro', `Erro inesperado: ${errorMessage}`);
            }

            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('user');
            setUser(null);
            console.log('👋 Logout realizado');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                login,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}