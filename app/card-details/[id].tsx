import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
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
    completed_at?: string;
    created_at: string;
}

interface StampHistory {
    id: number;
    stamped_at: string;
    stamped_by: number;
}

export default function CardDetailsScreen() {
    const { id } = useLocalSearchParams();
    const [card, setCard] = useState<LoyaltyCard | null>(null);
    const [stampHistory, setStampHistory] = useState<StampHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    const API_URL = 'https://appcartaozinho-servercartaozinho.5gttis.easypanel.host/api'; // Substitua pela URL da sua VPS

    useEffect(() => {
        loadCardDetails();
        loadStampHistory();
    }, [id]);

    const loadCardDetails = async () => {
        try {
            const response = await fetch(`${API_URL}/cards/${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCard(data);
            } else {
                Alert.alert('Erro', 'Cartão não encontrado');
                router.back();
            }
        } catch (error) {
            console.error('Error loading card details:', error);
            Alert.alert('Erro', 'Não foi possível carregar os detalhes do cartão');
        }
    };

    const loadStampHistory = async () => {
        try {
            const response = await fetch(`${API_URL}/cards/${id}/history`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setStampHistory(data);
            }
        } catch (error) {
            console.error('Error loading stamp history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const resetCard = () => {
        Alert.alert(
            'Resgatar Recompensa',
            'Tem certeza que deseja resgatar sua recompensa? Isso irá zerar seu cartão.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Resgatar', onPress: handleResetCard },
            ]
        );
    };

    const handleResetCard = async () => {
        try {
            const response = await fetch(`${API_URL}/cards/${id}/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                Alert.alert('Sucesso', 'Recompensa resgatada! Seu cartão foi zerado.');
                loadCardDetails();
                loadStampHistory();
            } else {
                Alert.alert('Erro', 'Não foi possível resgatar a recompensa');
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível resgatar a recompensa');
        }
    };

    if (isLoading || !card) {
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
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color="#0a7ea4" />
                </TouchableOpacity>
                <ThemedText type="title">Detalhes do Cartão</ThemedText>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Card Principal */}
                <View style={styles.mainCard}>
                    <View style={styles.cardHeader}>
                        <View>
                            <ThemedText type="title" style={styles.storeName}>
                                {card.store.name}
                            </ThemedText>
                            <ThemedText style={styles.storeDescription}>
                                {card.store.description}
                            </ThemedText>
                        </View>
                        {card.is_completed && (
                            <View style={styles.completedBadge}>
                                <ThemedText style={styles.completedText}>Completo!</ThemedText>
                            </View>
                        )}
                    </View>

                    {/* Progresso */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressInfo}>
                            <ThemedText type="subtitle">
                                {card.stamps_count}/{card.store.stamps_required} carimbos
                            </ThemedText>
                            <ThemedText style={styles.progressPercentage}>
                                {Math.round((card.stamps_count / card.store.stamps_required) * 100)}%
                            </ThemedText>
                        </View>

                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    { width: `${(card.stamps_count / card.store.stamps_required) * 100}%` }
                                ]}
                            />
                        </View>
                    </View>

                    {/* Grid de Carimbos */}
                    <View style={styles.stampsSection}>
                        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                            Seus Carimbos
                        </ThemedText>
                        <View style={styles.stampsGrid}>
                            {Array.from({ length: card.store.stamps_required }).map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.stamp,
                                        index < card.stamps_count ? styles.stampFilled : styles.stampEmpty,
                                    ]}
                                >
                                    <ThemedText style={[
                                        styles.stampNumber,
                                        index < card.stamps_count && styles.stampNumberFilled
                                    ]}>
                                        {index + 1}
                                    </ThemedText>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Recompensa */}
                    <View style={styles.rewardSection}>
                        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                            Sua Recompensa
                        </ThemedText>
                        <View style={styles.rewardCard}>
                            <ThemedText style={styles.rewardText}>
                                {card.store.reward_description}
                            </ThemedText>
                            {card.is_completed && (
                                <TouchableOpacity style={styles.redeemButton} onPress={resetCard}>
                                    <ThemedText style={styles.redeemButtonText}>
                                        Resgatar Recompensa
                                    </ThemedText>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>

                {/* Histórico */}
                <View style={styles.historySection}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                        Histórico de Carimbos
                    </ThemedText>

                    {stampHistory.length === 0 ? (
                        <View style={styles.emptyHistory}>
                            <ThemedText style={styles.emptyText}>
                                Nenhum carimbo ainda
                            </ThemedText>
                        </View>
                    ) : (
                        <View style={styles.historyList}>
                            {stampHistory.map((stamp, index) => (
                                <View key={stamp.id} style={styles.historyItem}>
                                    <View style={styles.historyIcon}>
                                        <ThemedText style={styles.historyNumber}>
                                            {stampHistory.length - index}
                                        </ThemedText>
                                    </View>
                                    <View style={styles.historyContent}>
                                        <ThemedText style={styles.historyTitle}>
                                            Carimbo #{stampHistory.length - index}
                                        </ThemedText>
                                        <ThemedText style={styles.historyDate}>
                                            {formatDate(stamp.stamped_at)}
                                        </ThemedText>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Informações do Cartão */}
                <View style={styles.infoSection}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                        Informações
                    </ThemedText>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <ThemedText style={styles.infoLabel}>Criado em:</ThemedText>
                            <ThemedText style={styles.infoValue}>
                                {formatDate(card.created_at)}
                            </ThemedText>
                        </View>
                        {card.completed_at && (
                            <View style={styles.infoRow}>
                                <ThemedText style={styles.infoLabel}>Completado em:</ThemedText>
                                <ThemedText style={styles.infoValue}>
                                    {formatDate(card.completed_at)}
                                </ThemedText>
                            </View>
                        )}
                        <View style={styles.infoRow}>
                            <ThemedText style={styles.infoLabel}>Status:</ThemedText>
                            <ThemedText style={[
                                styles.infoValue,
                                card.is_completed ? styles.statusComplete : styles.statusActive
                            ]}>
                                {card.is_completed ? 'Completo' : 'Ativo'}
                            </ThemedText>
                        </View>
                    </View>
                </View>
            </ScrollView>
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
    mainCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    storeName: {
        fontSize: 24,
        color: '#333',
        marginBottom: 4,
    },
    storeDescription: {
        color: '#666',
        fontSize: 16,
    },
    completedBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    completedText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    progressSection: {
        marginBottom: 32,
    },
    progressInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressPercentage: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0a7ea4',
    },
    progressBar: {
        height: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#0a7ea4',
        borderRadius: 6,
    },
    stampsSection: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 16,
        color: '#333',
    },
    stampsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    stamp: {
        width: 48,
        height: 48,
        borderRadius: 24,
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
    stampNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#999',
    },
    stampNumberFilled: {
        color: '#fff',
    },
    rewardSection: {
        marginBottom: 32,
    },
    rewardCard: {
        backgroundColor: '#f8f9fa',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    rewardText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 16,
    },
    redeemButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    redeemButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    historySection: {
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
    emptyHistory: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        color: '#999',
    },
    historyList: {
        gap: 16,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyNumber: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    historyContent: {
        flex: 1,
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    historyDate: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    infoSection: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    infoCard: {
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    statusComplete: {
        color: '#4CAF50',
    },
    statusActive: {
        color: '#0a7ea4',
    },
});