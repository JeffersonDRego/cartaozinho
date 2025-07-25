// import { ConnectivityTest } from '@/components/ConnectivityTest';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LoginScreen() {
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [showNameInput, setShowNameInput] = useState(false);
    const [userType, setUserType] = useState<'customer' | 'merchant'>('customer');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();

    const formatPhone = (text: string) => {
        // Remove tudo que não é número
        const numbers = text.replace(/\D/g, '');

        // Aplica máscara (XX) XXXXX-XXXX
        if (numbers.length <= 11) {
            let formatted = numbers;
            if (numbers.length >= 3) {
                formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
            }
            if (numbers.length >= 8) {
                formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
            }
            return formatted;
        }
        return text;
    };

    const handlePhoneSubmit = async () => {
        if (phone.length < 14) { // (XX) XXXXX-XXXX
            Alert.alert('Erro', 'Por favor, digite um telefone válido');
            return;
        }

        setIsLoading(true);

        // Limpa formatação do telefone para enviar ao backend
        const cleanPhone = '+55' + phone.replace(/\D/g, '');

        try {
            const success = await login(cleanPhone);

            if (!success) {
                // Usuário não encontrado, mostrar campo de nome
                setShowNameInput(true);
            } else {
                // Login realizado com sucesso
                router.replace('/(tabs)');
            }
        } catch (error) {
            Alert.alert('Erro', 'Ocorreu um erro. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!name.trim()) {
            Alert.alert('Erro', 'Por favor, digite seu nome');
            return;
        }

        setIsLoading(true);

        const cleanPhone = '+55' + phone.replace(/\D/g, '');

        try {
            const success = await login(cleanPhone, name.trim());

            if (success) {
                router.replace('/(tabs)');
            } else {
                Alert.alert('Erro', 'Não foi possível criar sua conta. Tente novamente.');
            }
        } catch (error) {
            Alert.alert('Erro', 'Ocorreu um erro. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToPhone = () => {
        setShowNameInput(false);
        setName('');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <ThemedView style={styles.content}>
                    <View style={styles.header}>
                        <ThemedText type="title" style={styles.title}>
                            Cartãozinho APP
                        </ThemedText>
                        <ThemedText style={styles.subtitle}>
                            Seu cartão fidelidade digital
                        </ThemedText>
                    </View>

                    {!showNameInput ? (
                        <View style={styles.form}>
                            <ThemedText type="subtitle" style={styles.label}>
                                Digite seu telefone
                            </ThemedText>

                            <TextInput
                                style={styles.input}
                                placeholder="(11) 99999-9999"
                                value={phone}
                                onChangeText={(text) => setPhone(formatPhone(text))}
                                keyboardType="phone-pad"
                                maxLength={15}
                                autoFocus
                            />

                            <View style={styles.userTypeContainer}>
                                <ThemedText style={styles.label}>Você é:</ThemedText>
                                <View style={styles.userTypeButtons}>
                                    <TouchableOpacity
                                        style={[
                                            styles.userTypeButton,
                                            userType === 'customer' && styles.userTypeButtonActive,
                                        ]}
                                        onPress={() => setUserType('customer')}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.userTypeButtonText,
                                                userType === 'customer' && styles.userTypeButtonTextActive,
                                            ]}
                                        >
                                            Cliente
                                        </ThemedText>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.userTypeButton,
                                            userType === 'merchant' && styles.userTypeButtonActive,
                                        ]}
                                        onPress={() => setUserType('merchant')}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.userTypeButtonText,
                                                userType === 'merchant' && styles.userTypeButtonTextActive,
                                            ]}
                                        >
                                            Lojista
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.button, isLoading && styles.buttonDisabled]}
                                onPress={handlePhoneSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <ThemedText style={styles.buttonText}>Continuar</ThemedText>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.form}>
                            <ThemedText type="subtitle" style={styles.label}>
                                Primeiro acesso
                            </ThemedText>
                            <ThemedText style={styles.description}>
                                Digite seu nome para criar sua conta
                            </ThemedText>

                            <TextInput
                                style={styles.input}
                                placeholder="Seu nome completo"
                                value={name}
                                onChangeText={setName}
                                autoFocus
                                autoCapitalize="words"
                            />

                            <View style={styles.buttonGroup}>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonSecondary]}
                                    onPress={handleBackToPhone}
                                >
                                    <ThemedText style={styles.buttonSecondaryText}>Voltar</ThemedText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, styles.buttonPrimary, isLoading && styles.buttonDisabled]}
                                    onPress={handleRegister}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <ThemedText style={styles.buttonText}>Criar Conta</ThemedText>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <View style={styles.footer}>
                        <ThemedText style={styles.footerText}>
                            Ao continuar, você concorda com nossos termos de uso e política de privacidade
                        </ThemedText>
                    </View>

                    {/* Teste de Conectividade para Debug */}
                    {/* <ConnectivityTest /> */}
                </ThemedView>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
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
    },
    form: {
        marginBottom: 40,
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#fff',
    },
    userTypeContainer: {
        marginBottom: 20,
    },
    userTypeButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    userTypeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    userTypeButtonActive: {
        backgroundColor: '#0a7ea4',
        borderColor: '#0a7ea4',
    },
    userTypeButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    userTypeButtonTextActive: {
        color: '#fff',
    },
    button: {
        backgroundColor: '#0a7ea4',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonPrimary: {
        flex: 1,
    },
    buttonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#0a7ea4',
        flex: 1,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonSecondaryText: {
        color: '#0a7ea4',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 12,
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        opacity: 0.6,
        textAlign: 'center',
        lineHeight: 16,
    },
});