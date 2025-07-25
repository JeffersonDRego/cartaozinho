import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
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

    const API_URL = 'https://appcartaozinho-servercartaozinho.5gttis.easypanel.host/api'; // Substitua pela URL da sua VPS

    useEffect(() => {
        loadStore();
    }, []);

    const loadStore = async () => {
        try {
            const response = await fetch(`${API_URL}/stores/merchant/${user?.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setStore(data);
                setName(data.name);
                setDescription(data.description);
                setStampsRequired(data.stamps_required.toString());
                setRewardDescription(data.reward_description);
            } else if (response.status === 404) {
                // Loja não existe, é uma nova loja
                setIsNewStore(true);
            }
        } catch (error) {
            console.error('Error loading store:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const validateForm = () => {
        if (!name.trim()) {
            Alert.alert('Erro', 'Digite o nome da sua loja');
            return false;
        }

        if (!description.trim()) {
            Alert.alert('Erro', 'Digite a descrição da sua loja');
            return false;
        }

        const stamps = parseInt(stampsRequired);
        if (isNaN(stamps) || stamps < 3 || stamps > 20) {
            Alert.alert('Erro', 'O número de carimbos deve ser entre 3 e 20');
            return false;
        }

        if (!rewardDescription.trim()) {
            Alert.alert('Erro', 'Digite a descrição da recompensa');
            return false;
        }

        return true;
    };

    const saveStore = async () => {
        if (!validateForm()) return;

        setIsSaving(true);

        try {
            const url = isNewStore
                ? `${API_URL}/stores`
                : `${API_URL}/stores/${store?.id}`;

            const method = isNewStore ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    merchant_id: user?.id,
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
                    'Sucesso!',
                    isNewStore ? 'Loja criada com sucesso!' : 'Loja atualizada com sucesso!',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.back(),
                        },
                    ]
                );
            } else {
                Alert.alert('Erro', 'Não foi possível salvar a loja');
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível salvar a loja');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStoreStatus = async () => {
        if (!store) return;

        const action = store.is_active ? 'desativar' : 'ativar';

        Alert.alert(
            `${action.charAt(0).toUpperCase() + action.slice(1)} Loja`,
            `Tem certeza que deseja ${action} sua loja?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: action.charAt(0).toUpperCase() + action.slice(1), onPress: handleToggleStatus },
            ]
        );
    };

    const handleToggleStatus = async () => {
        if (!store) return;

        try {
            const response = await fetch(`${API_URL}/stores/${store.id}/toggle`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const updatedStore = { ...store, is_active: !store.is_active };
                setStore(updatedStore);

                Alert.alert(
                    'Sucesso!',
                    `Loja ${updatedStore.is_active ? 'ativada' : 'desativada'} com sucesso!`
                );
            } else {
                Alert.alert('Erro', 'Não foi possível alterar o status da loja');
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível alterar o status da loja');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <ThemedView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color="#0a7ea4" />
                    </TouchableOpacity>
                    <ThemedText type="title">Carregando...</ThemedText>
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
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color="#0a7ea4" />
                    </TouchableOpacity>
                    <ThemedText type="title">
                        {isNewStore ? 'Criar Loja' : 'Gerenciar Loja'}
                    </ThemedText>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Status da loja */}
                    {!isNewStore && store && (
                        <View style={styles.statusSection}>
                            <View style={styles.statusHeader}>
                                <View>
                                    <ThemedText type="subtitle">Status da Loja</ThemedText>
                                    <ThemedText style={styles.statusText}>
                                        {store.is_active ? 'Ativa' : 'Desativada'}
                                    </ThemedText>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.toggleButton,
                                        store.is_active ? styles.toggleButtonActive : styles.toggleButtonInactive,
                                    ]}
                                    onPress={toggleStoreStatus}
                                >
                                    <ThemedText style={[
                                        styles.toggleButtonText,
                                        store.is_active ? styles.toggleButtonTextActive : styles.toggleButtonTextInactive,
                                    ]}>
                                        {store.is_active ? 'Desativar' : 'Ativar'}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>

                            {store.created_at && (
                                <ThemedText style={styles.createdDate}>
                                    Criada em {formatDate(store.created_at)}
                                </ThemedText>
                            )}
                        </View>
                    )}

                    {/* Formulário */}
                    <View style={styles.formSection}>
                        <ThemedText type="subtitle" style={styles.formTitle}>
                            Informações da Loja
                        </ThemedText>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>Nome da Loja *</ThemedText>
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
                            <ThemedText style={styles.inputLabel}>Descrição *</ThemedText>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Descreva sua loja, especialidades, etc."
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
                            <ThemedText style={styles.inputLabel}>Carimbos Necessários *</ThemedText>
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
                            <ThemedText style={styles.inputLabel}>Recompensa *</ThemedText>
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
                                Preview do Cartão
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
                                        0/{stampsRequired || 10} carimbos
                                    </ThemedText>
                                    <View style={styles.cardProgressBar}>
                                        <View style={styles.cardProgressFill} />
                                    </View>
                                </View>

                                <View style={styles.cardStamps}>
                                    {Array.from({ length: Math.min(parseInt(stampsRequired) || 10, 10) }).map((_, index) => (
                                        <View key={index} style={styles.cardStamp} />
                                    ))}
                                    {parseInt(stampsRequired) > 10 && (
                                        <ThemedText style={styles.cardStampsMore}>
                                            +{parseInt(stampsRequired) - 10}
                                        </ThemedText>
                                    )}
                                </View>

                                <View style={styles.cardReward}>
                                    <ThemedText style={styles.cardRewardLabel}>Recompensa:</ThemedText>
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
                                {isNewStore ? 'Criar Loja' : 'Salvar Alterações'}
                            </ThemedText>
                        )}
                    </TouchableOpacity>

                    {/* Dicas */}
                    <View style={styles.tipsSection}>
                        <ThemedText type="defaultSemiBold" style={styles.tipsTitle}>
                            💡 Dicas para sua loja:
                        </ThemedText>
                        <View style={styles.tip}>
                            <ThemedText style={styles.tipText}>
                                • Use um nome claro e fácil de lembrar
                            </ThemedText>
                        </View>
                        <View style={styles.tip}>
                            <ThemedText style={styles.tipText}>
                                • Descreva suas especialidades na descrição
                            </ThemedText>
                        </View>
                        <View style={styles.tip}>
                            <ThemedText style={styles.tipText}>
                                • 8-12 carimbos é o ideal para engajamento
                            </ThemedText>
                        </View>
                        <View style={styles.tip}>
                            <ThemedText style={styles.tipText}>
                                • Ofereça recompensas atrativas mas viáveis
                            </ThemedText>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 16,
    },
    backButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    statusSection: {
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
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4CAF50',
        marginTop: 4,
    },
    toggleButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    toggleButtonActive: {
        backgroundColor: '#ff4444',
    },
    toggleButtonInactive: {
        backgroundColor: '#4CAF50',
    },
    toggleButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    toggleButtonTextActive: {
        color: '#fff',
    },
    toggleButtonTextInactive: {
        color: '#fff',
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
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    textArea: {
        minHeight: 80,
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
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#e0e0e0',
        borderWidth: 1,
        borderColor: '#ccc',
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
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginBottom: 40,
    },
    tipsTitle: {
        fontSize: 16,
        marginBottom: 12,
        color: '#333',
    },
    tip: {
        marginBottom: 8,
    },
    tipText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
});