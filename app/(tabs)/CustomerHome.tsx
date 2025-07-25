import { DebugPanel } from '@/components/DebugPanel';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

interface Store {
    id: number;
    name: string;
    description: string;
    stamps_required: number;
    reward_description: string;
}

interface LoyaltyCard {
    id: number;
    store: Store;
    stamps_count: number;
    is_completed: boolean;
    created_at: string;
}

const API_URL = 'https://appcartaozinho-servercartaozinho.5gttis.easypanel.host/api';

export default function CustomerHomeScreen() {
    const [cards, setCards] = useState<LoyaltyCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const { user, logout } = useAuth();

    const loadCards = useCallback(async () => {
        if (!user) return;

        try {
            const response = await fetch(`${API_URL}/cards/customer/${user.id}`, {
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const data = await response.json();
                setCards(data);
            } else {
                console.error('Erro ao carregar cartões:', response.status);
            }
        } catch (error) {
            console.error('Erro de rede ao carregar cartões:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        loadCards();
    }, [loadCards]);

    const onRefresh = () => {
        setRefreshing(true);
        loadCards();
    };

    const handleLogout = () => {
        Alert.alert(
            'Sair',
            'Tem certeza que deseja sair da sua conta?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', onPress: logout, style: 'destructive' },
            ]
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const getProgressPercentage = (stamps: number, required: number) => {
        return Math.min((stamps / required) * 100, 100);
    };

    const renderCard = ({ item }: { item: LoyaltyCard }) => {
        const progress = getProgressPercentage(item.stamps_count, item.store.stamps_required);
        const isComplete = item.is_completed;

        return (
            <View style={[styles.card, isComplete && styles.cardCompleted]}>
                {/* Header do Cartão */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardInfo}>
                        <ThemedText type="defaultSemiBold" style={styles.storeName}>
                            {item.store.name}
                        </ThemedText>
                        <ThemedText style={styles.storeDescription}>
                            {item.store.description}
                        </ThemedText>
                        <ThemedText style={styles.cardDate}>
                            Criado em {formatDate(item.created_at)}
                        </ThemedText>
                    </View>
                    {isComplete && (
                        <View style={styles.completedBadge}>
                            <ThemedText style={styles.completedText}>🎉 Completo!</ThemedText>
                        </View>
                    )}
                </View>

                {/* Progresso */}
                <View style={styles.progressSection}>
                    <View style={styles.progressInfo}>
                        <ThemedText style={styles.progressText}>
                            {item.stamps_count}/{item.store.stamps_required} carimbos
                        </ThemedText>
                        <ThemedText style={styles.progressPercentage}>
                            {Math.round(progress)}%
                        </ThemedText>
                    </View>

                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                </View>

                {/* Grid de Carimbos */}
                <View style={styles.stampsSection}>
                    <ThemedText style={styles.stampsTitle}>Carimbos:</ThemedText>
                    <View style={styles.stampsGrid}>
                        {Array.from({ length: item.store.stamps_required }).map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.stamp,
                                    index < item.stamps_count ? styles.stampFilled : styles.stampEmpty,
                                ]}
                            >
                                <ThemedText style={[
                                    styles.stampText,
                                    index < item.stamps_count && styles.stampTextFilled
                                ]}>
                                    {index + 1}
                                </ThemedText>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Recompensa */}
                <View style={[styles.rewardSection, isComplete && styles.rewardSectionComplete]}>
                    <ThemedText style={styles.rewardLabel}>
                        {isComplete ? '🎁 Sua recompensa está pronta!' : '🎁 Recompensa:'}
                    </ThemedText>
                    <ThemedText style={styles.rewardText}>
                        {item.store.reward_description}
                    </ThemedText>
                    {isComplete && (
                        <ThemedText style={styles.rewardInstruction}>
                            Vá até a loja para resgatar!
                        </ThemedText>
                    )}
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <ThemedText style={styles.emptyEmoji}>🎫</ThemedText>
            <ThemedText type="title" style={styles.emptyTitle}>
                Nenhum cartão ainda
            </ThemedText>
            <ThemedText style={styles.emptyText}>
                Visite uma loja parceira e peça para o lojista adicionar um carimbo no seu cartão fidelidade!
            </ThemedText>
            <ThemedText style={styles.emptyHint}>
                Puxe para baixo para atualizar
            </ThemedText>
        </View>
    );

    if (isLoading) {
        return (
            <ThemedView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ThemedText style={styles.loadingText}>🔄 Carregando seus cartões...</ThemedText>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerInfo}>
                    <ThemedText type="title" style={styles.welcomeText}>
                        Olá, {user?.name}! 👋
                    </ThemedText>
                    <ThemedText style={styles.subtitle}>
                        Seus cartões fidelidade ({cards.length})
                    </ThemedText>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => setShowDebug(true)}
                        style={styles.debugButton}
                    >
                        <ThemedText style={styles.debugButtonText}>🔧</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <ThemedText style={styles.logoutText}>Sair</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Lista de Cartões */}
            <FlatList
                data={cards}
                renderItem={renderCard}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[
                    styles.listContainer,
                    cards.length === 0 && styles.listContainerEmpty
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#0a7ea4"
                        colors={['#0a7ea4']}
                    />
                }
                ListEmptyComponent={renderEmptyState}
            />

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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e1e1e1',
    },
    headerInfo: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 24,
        color: '#0a7ea4',
        marginBottom: 4,
    },
    subtitle: {
        opacity: 0.7,
        fontSize: 14,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    debugButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: '#f0f0f0',
    },
    debugButtonText: {
        fontSize: 16,
    },
    logoutButton: {
        padding: 8,
    },
    logoutText: {
        color: '#ff4444',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    listContainer: {
        padding: 20,
    },
    listContainerEmpty: {
        flex: 1,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    cardCompleted: {
        borderColor: '#4CAF50',
        borderWidth: 2,
        backgroundColor: '#f8fff8',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    cardInfo: {
        flex: 1,
    },
    storeName: {
        fontSize: 18,
        color: '#333',
        marginBottom: 4,
    },
    storeDescription: {
        color: '#666',
        marginBottom: 4,
    },
    cardDate: {
        fontSize: 12,
        color: '#999',
    },
    completedBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    completedText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    progressSection: {
        marginBottom: 16,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    progressPercentage: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0a7ea4',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#0a7ea4',
        borderRadius: 4,
    },
    stampsSection: {
        marginBottom: 16,
    },
    stampsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    stampsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    stamp: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    stampFilled: {
        backgroundColor: '#0a7ea4',
        borderColor: '#0a7ea4',
    },
    stampEmpty: {
        backgroundColor: '#f9f9f9',
        borderColor: '#ddd',
    },
    stampText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#999',
    },
    stampTextFilled: {
        color: '#fff',
    },
    rewardSection: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
    },
    rewardSectionComplete: {
        backgroundColor: '#e8f5e8',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    rewardLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    rewardText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
    rewardInstruction: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
        marginTop: 4,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        marginBottom: 16,
        color: '#666',
        textAlign: 'center',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        lineHeight: 22,
        marginBottom: 16,
    },
    emptyHint: {
        fontSize: 12,
        color: '#ccc',
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