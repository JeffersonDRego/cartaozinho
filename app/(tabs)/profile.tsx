import { DebugPanel } from '@/components/DebugPanel';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ProfileScreen() {
    const [showDebug, setShowDebug] = useState(false);
    const { user, logout, testPushNotification, pushToken } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Sair da Conta',
            'Tem certeza que deseja sair da sua conta?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', onPress: logout, style: 'destructive' },
            ]
        );
    };

    const handleTestPush = async () => {
        Alert.alert(
            'Teste de Notificação',
            'Vamos enviar uma notificação de teste para verificar se está funcionando.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Enviar Teste', onPress: testPushNotification },
            ]
        );
    };

    const formatPhone = (phone: string) => {
        // Remove +55 e formata como (XX) XXXXX-XXXX
        const numbers = phone.replace('+55', '').replace(/\D/g, '');
        if (numbers.length === 11) {
            return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
        }
        return phone;
    };

    return (
        <ThemedView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <ThemedText type="title" style={styles.headerTitle}>
                    👤 Meu Perfil
                </ThemedText>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Informações do Usuário */}
                <View style={styles.section}>
                    <View style={styles.profileCard}>
                        <View style={styles.profileAvatar}>
                            <ThemedText style={styles.profileAvatarText}>
                                {user?.name.charAt(0).toUpperCase() || '?'}
                            </ThemedText>
                        </View>

                        <View style={styles.profileInfo}>
                            <ThemedText type="subtitle" style={styles.profileName}>
                                {user?.name}
                            </ThemedText>
                            <ThemedText style={styles.profilePhone}>
                                📱 {user?.phone ? formatPhone(user.phone) : 'Não informado'}
                            </ThemedText>
                            <ThemedText style={styles.profileType}>
                                🎫 Cliente do Cartãozinho
                            </ThemedText>
                        </View>
                    </View>
                </View>

                {/* Status das Notificações */}
                <View style={styles.section}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                        🔔 Notificações Push
                    </ThemedText>

                    <View style={styles.notificationCard}>
                        <View style={styles.notificationStatus}>
                            <ThemedText style={styles.notificationLabel}>Status:</ThemedText>
                            <ThemedText style={[
                                styles.notificationValue,
                                { color: pushToken ? '#4CAF50' : '#f44336' }
                            ]}>
                                {pushToken ? '✅ Ativadas' : '❌ Desativadas'}
                            </ThemedText>
                        </View>

                        {pushToken && (
                            <View style={styles.notificationInfo}>
                                <ThemedText style={styles.notificationDescription}>
                                    Você receberá notificações quando seus cartões estiverem completos
                                    e quando as lojas enviarem ofertas especiais.
                                </ThemedText>

                                <TouchableOpacity
                                    style={styles.testButton}
                                    onPress={handleTestPush}
                                >
                                    <ThemedText style={styles.testButtonText}>
                                        📲 Testar Notificação
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                        )}

                        {!pushToken && (
                            <View style={styles.notificationWarning}>
                                <ThemedText style={styles.notificationWarningText}>
                                    ⚠️ Notificações desativadas. Você pode perder ofertas especiais
                                    e não será avisado quando seus cartões estiverem completos.
                                </ThemedText>
                            </View>
                        )}
                    </View>
                </View>

                {/* Opções */}
                <View style={styles.section}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                        ⚙️ Opções
                    </ThemedText>

                    <View style={styles.optionsCard}>
                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => setShowDebug(true)}
                        >
                            <ThemedText style={styles.optionIcon}>🔧</ThemedText>
                            <View style={styles.optionContent}>
                                <ThemedText style={styles.optionTitle}>Debug & Testes</ThemedText>
                                <ThemedText style={styles.optionDescription}>
                                    Ferramentas para testar conectividade e notificações
                                </ThemedText>
                            </View>
                            <ThemedText style={styles.optionArrow}>›</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Informações do App */}
                <View style={styles.section}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                        ℹ️ Sobre o App
                    </ThemedText>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <ThemedText style={styles.infoLabel}>Versão:</ThemedText>
                            <ThemedText style={styles.infoValue}>1.0.0</ThemedText>
                        </View>
                        <View style={styles.infoRow}>
                            <ThemedText style={styles.infoLabel}>Tipo de Conta:</ThemedText>
                            <ThemedText style={styles.infoValue}>Cliente</ThemedText>
                        </View>
                        <View style={styles.infoRow}>
                            <ThemedText style={styles.infoLabel}>Push Token:</ThemedText>
                            <ThemedText style={styles.infoValue}>
                                {pushToken ? '✅ Configurado' : '❌ Não configurado'}
                            </ThemedText>
                        </View>
                    </View>
                </View>

                {/* Botão de Sair */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <ThemedText style={styles.logoutButtonText}>
                            🚪 Sair da Conta
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Rodapé */}
                <View style={styles.footer}>
                    <ThemedText style={styles.footerText}>
                        Cartãozinho - Seu cartão fidelidade digital
                    </ThemedText>
                    <ThemedText style={styles.footerSubtext}>
                        Feito com ❤️ para facilitar sua vida
                    </ThemedText>
                </View>
            </ScrollView>

            {/* Modal de Debug */}
            <Modal
                visible={showDebug}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowDebug(false)}
            >
                <View style={styles.modalHeader}>
                    <TouchableOpacity
                        onPress={() => setShowDebug(false)}
                        style={styles.modalCloseButton}
                    >
                        <ThemedText style={styles.modalCloseText}>✕ Fechar</ThemedText>
                    </TouchableOpacity>
                </View>
                <DebugPanel />
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e1e1e1',
    },
    headerTitle: {
        color: '#0a7ea4',
        textAlign: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 16,
        color: '#333',
        marginBottom: 12,
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    profileAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileAvatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        color: '#333',
        marginBottom: 4,
    },
    profilePhone: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    profileType: {
        fontSize: 12,
        color: '#0a7ea4',
        fontWeight: '600',
    },
    notificationCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    notificationStatus: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    notificationLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    notificationValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    notificationInfo: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    notificationDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 16,
    },
    testButton: {
        backgroundColor: '#0a7ea4',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    testButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    notificationWarning: {
        backgroundColor: '#fff3cd',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#ffeaa7',
    },
    notificationWarningText: {
        fontSize: 12,
        color: '#856404',
        lineHeight: 16,
    },
    optionsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    optionIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    optionDescription: {
        fontSize: 12,
        color: '#666',
    },
    optionArrow: {
        fontSize: 20,
        color: '#ccc',
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    logoutButton: {
        backgroundColor: '#ff4444',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    footerText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#e1e1e1',
    },
    modalCloseButton: {
        padding: 8,
    },
    modalCloseText: {
        color: '#0a7ea4',
        fontSize: 16,
        fontWeight: '600',
    },
});