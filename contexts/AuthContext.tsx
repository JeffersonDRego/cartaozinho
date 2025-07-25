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
    pushToken: string | null;
    login: (phone: string, name?: string, userType?: 'customer' | 'merchant') => Promise<boolean>;
    logout: () => Promise<void>;
    testPushNotification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// 🔔 CONFIGURAÇÃO DAS PUSH NOTIFICATIONS
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// ⚠️ ALTERE ESTA URL PARA SEU SERVIDOR!
const API_URL = 'https://appcartaozinho-servercartaozinho.5gttis.easypanel.host/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pushToken, setPushToken] = useState<string | null>(null);

    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            // Carregar usuário salvo
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                setUser(JSON.parse(userData));
            }

            // Configurar push notifications
            await setupPushNotifications();
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setupPushNotifications = async () => {
        try {
            // Configurar canal Android
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'Cartãozinho',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#0a7ea4',
                    sound: 'default',
                });
            }

            // Pedir permissão
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('❌ Permissão para notificações negada');
                return;
            }

            // Obter token
            const token = await Notifications.getExpoPushTokenAsync({
                projectId: '3b6a9ecc-ae4b-4afb-bf3d-311ef07631a8', // Seu Project ID do EAS
            });

            setPushToken(token.data);
            console.log('✅ Push token obtido:', token.data);

            // Listener para notificações recebidas
            Notifications.addNotificationReceivedListener(notification => {
                console.log('📨 Notificação recebida:', notification);
            });

            // Listener para quando usuário toca na notificação
            Notifications.addNotificationResponseReceivedListener(response => {
                console.log('👆 Notificação tocada:', response);
                // Aqui você pode navegar para telas específicas baseado na notificação
            });

        } catch (error) {
            console.error('❌ Erro na configuração de push:', error);
        }
    };

    const login = async (phone: string, name?: string, userType: 'customer' | 'merchant' = 'customer'): Promise<boolean> => {
        setIsLoading(true);
        console.log('🔐 Tentando login...', { phone, name, userType });

        try {
            // Primeiro, tentar login
            let response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone }),
            });

            // Se usuário não existe e tem nome, fazer cadastro
            if (response.status === 404 && name) {
                console.log('👤 Usuário não encontrado, fazendo cadastro...');

                response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        phone,
                        name,
                        user_type: userType,
                        expo_push_token: pushToken
                    }),
                });
            }

            if (response.ok) {
                const userData = await response.json();
                console.log('✅ Login/cadastro sucesso:', userData);

                setUser(userData);
                await AsyncStorage.setItem('user', JSON.stringify(userData));

                return true;
            } else {
                const errorData = await response.json();
                Alert.alert('Erro', errorData.error || 'Erro no login');
                return false;
            }

        } catch (error) {
            console.error('💥 Erro de rede:', error);
            Alert.alert(
                'Erro de Conexão',
                'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.'
            );
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
            console.error('❌ Erro no logout:', error);
        }
    };

    const testPushNotification = async () => {
        if (!pushToken) {
            Alert.alert('Erro', 'Token de push não disponível');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/test/push`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    expo_push_token: pushToken,
                    title: '🧪 Teste do Cartãozinho',
                    message: `Olá ${user?.name || 'usuário'}! Push notifications funcionando! 🎉`
                }),
            });

            const result = await response.json();

            if (result.success) {
                Alert.alert('✅ Sucesso!', 'Push notification enviado! Verifique se chegou.');
            } else {
                Alert.alert('❌ Erro', result.message || 'Falha ao enviar push');
            }
        } catch (error) {
            console.error('❌ Erro no teste de push:', error);
            Alert.alert('Erro', 'Erro ao testar push notification');
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            pushToken,
            login,
            logout,
            testPushNotification,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de AuthProvider');
    }
    return context;
}