import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function IndexScreen() {
    const { user, isLoading } = useAuth();

    useEffect(() => {
        // Aguardar o contexto de auth terminar de carregar
        if (!isLoading) {
            if (user) {
                // Usuário logado, redirecionar para as tabs
                router.replace('/(tabs)');
            } else {
                // Usuário não logado, ir para login
                router.replace('/Login');
            }
        }
    }, [user, isLoading]);

    // Tela de loading/splash enquanto verifica autenticação
    return (
        <ThemedView style={styles.container}>
            <View style={styles.content}>
                {/* Logo/Ícone do App */}
                <View style={styles.logoContainer}>
                    <ThemedText style={styles.logoEmoji}>🎫</ThemedText>
                    <ThemedText type="title" style={styles.title}>
                        Cartãozinho
                    </ThemedText>
                    <ThemedText style={styles.subtitle}>
                        Seu cartão fidelidade digital
                    </ThemedText>
                </View>

                {/* Loading */}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator
                        size="large"
                        color="#0a7ea4"
                        style={styles.loader}
                    />
                    <ThemedText style={styles.loadingText}>
                        {isLoading ? 'Carregando...' : 'Redirecionando...'}
                    </ThemedText>
                </View>

                {/* Versão */}
                <View style={styles.versionContainer}>
                    <ThemedText style={styles.versionText}>
                        Versão 1.0.0
                    </ThemedText>
                </View>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    logoEmoji: {
        fontSize: 80,
        marginBottom: 16,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#0a7ea4',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    loadingContainer: {
        alignItems: 'center',
        marginBottom: 60,
    },
    loader: {
        marginBottom: 16,
    },
    loadingText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    versionContainer: {
        position: 'absolute',
        bottom: 40,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
});