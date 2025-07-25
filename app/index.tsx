import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function IndexScreen() {
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            if (user) {
                // Usuário logado, redireciona para a tab apropriada
                router.replace('/(tabs)');
            } else {
                // Usuário não logado, vai para login
                router.replace('/login');
            }
        }
    }, [user, isLoading]);

    // Tela de loading enquanto verifica autenticação
    return (
        <ThemedView style={styles.container}>
            <View style={styles.content}>
                <ThemedText type="title" style={styles.title}>
                    Cartãozinho
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                    Seu cartão fidelidade digital
                </ThemedText>
                <ActivityIndicator
                    size="large"
                    color="#0a7ea4"
                    style={styles.loading}
                />
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#0a7ea4',
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.7,
        marginBottom: 40,
    },
    loading: {
        marginTop: 20,
    },
});