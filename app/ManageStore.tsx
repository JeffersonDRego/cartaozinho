import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

interface Store {
    id: number;
    name: string;
    description: string;
    stamps_required: number;
    reward_description: string;
    is_active: boolean;
    created_at: string;
}

const API_URL = 'https://appcartaozinho-servercartaozinho.5gttis.easypanel.host/api';

export default function ManageStoreScreen() {
    const [store, setStore] = useState<Store | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [stampsRequired, setStampsRequired] = useState('10');
    const [rewardDescription, setRewardDescription] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isNewStore, setIsNewStore] = useState(false);

    const { user } = useAuth();

    useEffect(() => {
        loadStore();
    }, []);

    const loadStore = async () => {
        if (!user) return;

        try {
            const response = await fetch(`${API_URL}/stores/merchant/${user.id}`, {
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const data = await response.json();
                setStore(data);
                setName(data.name);
                setDescription(data.description || '');
                setStampsRequired(data.stamps_required.toString());
                setRewardDescription(data.reward_description);
            } else if (response.status === 404) {
                // Loja não existe, é uma nova loja
                setIsNewStore(true);
            }
        } catch (error) {
            console.error('Erro ao carregar loja:', error);
            Alert.alert('Erro', 'Não foi possível carregar os dados da loja');
        } finally {
            setIsLoading(false);
        }
    };

    const validateForm = () => {
        if (!name.trim()) {
            Alert.alert('❌ Erro', 'Digite o nome da sua loja');
            return false;
        }

        if (!description.trim()) {
            Alert.alert('❌ Erro', 'Digite a descrição da sua loja');
            return false;
        }

        const stamps = parseInt(stampsRequired);
        if (isNaN(stamps) || stamps < 3 || stamps > 20) {
            Alert.alert('❌ Erro', 'O número de carimbos deve ser entre 3 e 20');
            return false;
        }

        if (!rewardDescription.trim()) {
            Alert.alert('❌ Erro', 'Digite a descrição da recompensa');
            return false;
        }

        return true;
    };

    const saveStore = async () => {
        if (!validateForm() || !user) return;

        setIsSaving(true);

        try {
            const response = await fetch(`${API_URL}/stores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    merchant_id: user.id,
                    name: name.trim(),
                    description: description.trim(),
                    stamps_required: parseInt(stampsRequired),
                    reward_description: rewardDescription.trim(),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setStore(data);
                setIsNewStore(false);

                Alert.alert(
                    '✅ Sucesso!',
                    isNewStore ? 'Loja criada com sucesso!' : 'Loja atualizada com sucesso!',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.back(),
                        },
                    ]
                );
            } else {
                const errorData = await response.json();
                Alert.alert('❌ Erro', errorData.error || 'Não foi possível salvar a loja');
            }
        } catch (error) {
            console.error('Erro ao salvar loja:', error);
            Alert.alert('❌ Erro', 'Não foi possível salvar a loja');
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <ThemedView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0a7ea4" />
                    <ThemedText style={styles.loadingText}>Carregando...</ThemedText>
                </View>
            </ThemedView>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ThemedView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ThemedText style={styles.backButtonText}>← Voltar</ThemedText>
                    </TouchableOpacity>
                    <ThemedText type="title" style={styles.headerTitle}>
                        {isNewStore ? '🏪 Criar Loja' : '⚙️ Gerenciar Loja'}
                    </ThemedText>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Status da loja existente */}
                    {!isNewStore && store && (
                        <View style={styles.statusSection}>
                            <View style={styles.statusHeader}>
                                <View>
                                    <ThemedText type="subtitle">Status da Loja</ThemedText>
                                    <ThemedText style={[
                                        styles.statusText,
                                        { color: store.is_active ? '#4CAF50' : '#f44336' }
                                    ]}>
                                        {store.is_active ? '✅ Ativa' : '❌ Inativa'}
                                    </ThemedText>
                                </View>
                            </View>

                            <ThemedText style={styles.createdDate}>
                                📅 Criada em {formatDate(store.created_at)}
                            </ThemedText>
                        </View>
                    )}

                    {/* Formulário */}
                    <View style={styles.formSection}>
                        <ThemedText type="subtitle" style={styles.formTitle}>
                            📝 Informações da Loja
                        </ThemedText>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>🏪 Nome da Loja *</ThemedText>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: Padaria do João"
                                value={name}
                                onChangeText={setName}
                                maxLength={100}
                                autoCapitalize="words"
                            />
                            <ThemedText style={styles.charCount}>
                                {name.length}/100
                            </ThemedText>
                        </View>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>📝 Descrição *</ThemedText>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Descreva sua loja, especialidades, diferenciais..."
                                value={description}
                                onChangeText={setDescription}
                                maxLength={200}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                autoCapitalize="sentences"
                            />
                            <ThemedText style={styles.charCount}>
                                {description.length}/200
                            </ThemedText>
                        </View>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>🎫 Carimbos Necessários *</ThemedText>
                            <TextInput
                                style={styles.input}
                                placeholder="10"
                                value={stampsRequired}
                                onChangeText={setStampsRequired}
                                keyboardType="numeric"
                                maxLength={2}
                            />
                            <ThemedText style={styles.inputHelp}>
                                Entre 3 e 20 carimbos (recomendado: 8-12)
                            </ThemedText>
                        </View>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>🎁 Recompensa *</ThemedText>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: Café expresso grátis"
                                value={rewardDescription}
                                onChangeText={setRewardDescription}
                                maxLength={150}
                                autoCapitalize="sentences"
                            />
                            <ThemedText style={styles.charCount}>
                                {rewardDescription.length}/150
                            </ThemedText>
                        </View>
                    </View>

                    {/* Preview do Cartão */}
                    {(name || description || rewardDescription) && (
                        <View style={styles.previewSection}>
                            <ThemedText type="subtitle" style={styles.previewTitle}>
                                👀 Preview do Cartão
                            </ThemedText>
                            <View style={styles.cardPreview}>
                                <View style={styles.cardHeader}>
                                    <View>
                                        <ThemedText type="defaultSemiBold" style={styles.cardName}>
                                            {name || 'Nome da Loja'}
                                        </ThemedText>
                                        <ThemedText style={styles.cardDescription}>
                                            {description || 'Descrição da loja'}
                                        </ThemedText>
                                    </View>
                                </View>

                                <View style={styles.cardProgress}>
                                    <ThemedText style={styles.cardProgressText}>
                                        0/{stampsRequired || 10} carimbos (0%)
                                    </ThemedText>
                                    <View style={styles.cardProgressBar}>
                                        <View style={styles.cardProgressFill} />
                                    </View>
                                </View>

                                <View style={styles.cardStamps}>
                                    {Array.from({ length: Math.min(parseInt(stampsRequired) || 10, 12) }).map((_, index) => (
                                        <View key={index} style={styles.cardStamp}>
                                            <ThemedText style={styles.cardStampText}>
                                                {index + 1}
                                            </ThemedText>
                                        </View>
                                    ))}
                                    {parseInt(stampsRequired) > 12 && (
                                        <ThemedText style={styles.cardStampsMore}>
                                            +{parseInt(stampsRequired) - 12} mais...
                                        </ThemedText>
                                    )}
                                </View>

                                <View style={styles.cardReward}>
                                    <ThemedText style={styles.cardRewardLabel}>🎁 Recompensa:</ThemedText>
                                    <ThemedText style={styles.cardRewardText}>
                                        {rewardDescription || 'Descrição da recompensa'}
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Botão Salvar */}
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            (!name.trim() || !description.trim() || !rewardDescription.trim() || isSaving) && styles.saveButtonDisabled,
                        ]}
                        onPress={saveStore}
                        disabled={!name.trim() || !description.trim() || !rewardDescription.trim() || isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <ThemedText style={styles.saveButtonText}>
                                {isNewStore ? '🚀 Criar Loja' : '💾 Salvar Alterações'}
                            </ThemedText>
                        )}
                    </TouchableOpacity>

                    {/* Dicas */}
                    <View style={styles.tipsSection}>
                        <ThemedText type="defaultSemiBold" style={styles.tipsTitle}>
                            💡 Dicas para uma loja de sucesso:
                        </ThemedText>

                        <View style={styles.tipsList}>
                            <View style={styles.tip}>
                                <ThemedText style={styles.tipIcon}>🎯</ThemedText>
                                <ThemedText style={styles.tipText}>
                                    Use um nome claro e fácil de lembrar
                                </ThemedText>
                            </View>

                            <View style={styles.tip}>
                                <ThemedText style={styles.tipIcon}>📝</ThemedText>
                                <ThemedText style={styles.tipText}>
                                    Descreva suas especialidades na descrição
                                </ThemedText>
                            </View>

                            <View style={styles.tip}>
                                <ThemedText style={styles.tipIcon}>🎫</ThemedText>
                                <ThemedText style={styles.tipText}>
                                    8-12 carimbos é o ideal para manter engajamento
                                </ThemedText>
                            </View>

                            <View style={styles.tip}>
                                <ThemedText style={styles.tipIcon}>🎁</ThemedText>
                                <ThemedText style={styles.tipText}>
                                    Ofereça recompensas atrativas mas viáveis financeiramente
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </ThemedView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e1e1e1',
    },
    backButton: {
        alignSelf: 'flex-start',
        padding: 8,
        marginBottom: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#0a7ea4',
        fontWeight: '600',
    },
    headerTitle: {
        color: '#0a7ea4',
        textAlign: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    statusSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginVertical: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    statusHeader: {
        marginBottom: 12,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 4,
    },
    createdDate: {
        fontSize: 12,
        color: '#666',
    },
    formSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    formTitle: {
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 20,
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
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    inputHelp: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    previewSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    previewTitle: {
        marginBottom: 16,
        color: '#333',
        textAlign: 'center',
    },
    cardPreview: {
        borderWidth: 2,
        borderColor: '#0a7ea4',
        borderRadius: 16,
        padding: 16,
        backgroundColor: '#f8f9fa',
    },
    cardHeader: {
        marginBottom: 16,
    },
    cardName: {
        fontSize: 18,
        color: '#333',
    },
    cardDescription: {
        color: '#666',
        marginTop: 4,
    },
    cardProgress: {
        marginBottom: 16,
    },
    cardProgressText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
    },
    cardProgressBar: {
        height: 8,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
    },
    cardProgressFill: {
        height: '100%',
        width: '0%',
        backgroundColor: '#0a7ea4',
        borderRadius: 4,
    },
    cardStamps: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
        marginBottom: 16,
    },
    cardStamp: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#e0e0e0',
        borderWidth: 1,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardStampText: {
        fontSize: 10,
        color: '#999',
        fontWeight: 'bold',
    },
    cardStampsMore: {
        fontSize: 12,
        color: '#666',
        alignSelf: 'center',
    },
    cardReward: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
    },
    cardRewardLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    cardRewardText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    saveButton: {
        backgroundColor: '#0a7ea4',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    tipsSection: {
        backgroundColor: '#f0f8ff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: '#0a7ea4',
    },
    tipsTitle: {
        fontSize: 16,
        marginBottom: 16,
        color: '#0a7ea4',
        textAlign: 'center',
    },
    tipsList: {
        gap: 12,
    },
    tip: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    tipIcon: {
        fontSize: 16,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
});