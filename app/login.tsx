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
    const [userType, setUserType] = useState<'customer' | 'merchant'>('customer');
    const [showNameInput, setShowNameInput] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();

    // Formatar telefone: (XX) XXXXX-XXXX
    const formatPhone = (text: string) => {
        const numbers = text.replace(/\D/g, '');
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
            Alert.alert('Erro', 'Digite um telefone válido');
            return;
        }

        setIsLoading(true);

        // Converter para formato internacional
        const cleanPhone = '+55' + phone.replace(/\D/g, '');

        try {
            const success = await login(cleanPhone);

            if (success) {
                // Login bem-sucedido, navegar para as tabs
                router.replace('/(tabs)');
            } else {
                // Usuário não encontrado, mostrar campo de nome
                setShowNameInput(true);
            }
        } catch (error) {
            console.error('Erro no login:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!name.trim()) {
            Alert.alert('Erro', 'Digite seu nome');
            return;
        }

        setIsLoading(true);

        const cleanPhone = '+55' + phone.replace(/\D/g, '');

        try {
            const success = await login(cleanPhone, name.trim(), userType);

            if (success) {
                router.replace('/(tabs)');
            }
        } catch (error) {
            console.error('Erro no cadastro:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setShowNameInput(false);
        setName('');
        setPhone('');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <ThemedView style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <ThemedText type="title" style={styles.title}>
                            🎫 Cartãozinho
                        </ThemedText>
                        <ThemedText style={styles.subtitle}>
                            Seu cartão fidelidade digital
                        </ThemedText>
                    </View>

                    {/* Form */}
                    {!showNameInput ? (
                        // Tela de Telefone
                        <View style={styles.form}>
                            <ThemedText type="subtitle" style={styles.formTitle}>
                                Entre com seu telefone
                            </ThemedText>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.inputLabel}>Telefone</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    placeholder="(11) 99999-9999"
                                    value={phone}
                                    onChangeText={(text) => setPhone(formatPhone(text))}
                                    keyboardType="phone-pad"
                                    maxLength={15}
                                    autoFocus
                                />
                            </View>

                            {/* Tipo de Usuário */}
                            <View style={styles.userTypeSection}>
                                <ThemedText style={styles.inputLabel}>Você é:</ThemedText>
                                <View style={styles.userTypeButtons}>
                                    <TouchableOpacity
                                        style={[
                                            styles.userTypeButton,
                                            userType === 'customer' && styles.userTypeButtonActive,
                                        ]}
                                        onPress={() => setUserType('customer')}
                                    >
                                        <ThemedText style={[
                                            styles.userTypeButtonText,
                                            userType === 'customer' && styles.userTypeButtonTextActive,
                                        ]}>
                                            👤 Cliente
                                        </ThemedText>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.userTypeButton,
                                            userType === 'merchant' && styles.userTypeButtonActive,
                                        ]}
                                        onPress={() => setUserType('merchant')}
                                    >
                                        <ThemedText style={[
                                            styles.userTypeButtonText,
                                            userType === 'merchant' && styles.userTypeButtonTextActive,
                                        ]}>
                                            🏪 Lojista
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.button, styles.buttonPrimary, isLoading && styles.buttonDisabled]}
                                onPress={handlePhoneSubmit}
                                disabled={isLoading || phone.length < 14}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <ThemedText style={styles.buttonText}>Continuar</ThemedText>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        // Tela de Cadastro
                        <View style={styles.form}>
                            <ThemedText type="subtitle" style={styles.formTitle}>
                                Primeiro acesso 🎉
                            </ThemedText>
                            <ThemedText style={styles.description}>
                                Parece que é seu primeiro acesso! Digite seu nome para criar sua conta.
                            </ThemedText>

                            <View style={styles.inputGroup}>
                                <ThemedText style={styles.inputLabel}>Nome completo</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Digite seu nome"
                                    value={name}
                                    onChangeText={setName}
                                    autoFocus
                                    autoCapitalize="words"
                                />
                            </View>

                            <View style={styles.selectedUserType}>
                                <ThemedText style={styles.selectedUserTypeLabel}>
                                    Conta: {userType === 'customer' ? '👤 Cliente' : '🏪 Lojista'}
                                </ThemedText>
                                <ThemedText style={styles.selectedUserTypePhone}>
                                    📱 {phone}
                                </ThemedText>
                            </View>

                            <View style={styles.buttonGroup}>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonSecondary]}
                                    onPress={resetForm}
                                    disabled={isLoading}
                                >
                                    <ThemedText style={styles.buttonSecondaryText}>← Voltar</ThemedText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, styles.buttonPrimary, isLoading && styles.buttonDisabled]}
                                    onPress={handleRegister}
                                    disabled={isLoading || !name.trim()}
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

                    {/* Footer */}
                    <View style={styles.footer}>
                        <ThemedText style={styles.footerText}>
                            Ao continuar, você concorda com nossos termos de uso e política de privacidade.
                        </ThemedText>
                    </View>
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
        justifyContent: 'center',
        minHeight: '100%',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#0a7ea4',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.7,
        textAlign: 'center',
    },
    form: {
        marginBottom: 48,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        opacity: 0.7,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    inputGroup: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 2,
        borderColor: '#e1e1e1',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        fontWeight: '500',
    },
    userTypeSection: {
        marginBottom: 32,
    },
    userTypeButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    userTypeButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e1e1e1',
        backgroundColor: '#f9f9f9',
        alignItems: 'center',
    },
    userTypeButtonActive: {
        borderColor: '#0a7ea4',
        backgroundColor: '#f0f8ff',
    },
    userTypeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    userTypeButtonTextActive: {
        color: '#0a7ea4',
    },
    selectedUserType: {
        backgroundColor: '#f0f8ff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#0a7ea4',
    },
    selectedUserTypeLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0a7ea4',
        marginBottom: 4,
    },
    selectedUserTypePhone: {
        fontSize: 14,
        color: '#666',
    },
    button: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
    },
    buttonPrimary: {
        backgroundColor: '#0a7ea4',
    },
    buttonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#0a7ea4',
    },
    buttonDisabled: {
        opacity: 0.5,
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
        maxWidth: 280,
    },
});