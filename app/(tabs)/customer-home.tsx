import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
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
}

export default function CustomerHomeScreen() {
    const [cards, setCards] = useState<LoyaltyCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user, logout } = useAuth();

    const API_URL = 'https://appcartaozinho-servercartaozinho.5gttis.easypanel.host/api'; // Substitua pela URL da sua VPS

    useEffect(() => {
        loadCards();
    }, []);

    const loadCards = async () => {
        try {
            const response = await fetch(`${API_URL}/cards/customer/${user?.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setCards(data);
            }
        } catch (error) {
            console.error('Error loading cards:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadCards();
    };

    const handleLogout = () => {
        Alert.alert(
            'Sair',
            'Tem certeza que deseja sair?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', onPress: logout },
            ]
        );
    };

    const renderCard = ({ item }: { item: LoyaltyCard }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/card-details/${item.id}`)}
        >
            <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.storeName}>
                        {item.store.name}
                    </ThemedText>
                    <ThemedText style={styles.storeDescription}>
                        {item.store.description}
                    </ThemedText>
                </View>
                <View style={styles.statusContainer}>
                    {item.is_completed && (
                        <View style={styles.completedBadge}>
                            <ThemedText style={styles.completedText}>Completo!</ThemedText>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${(item.stamps_count / item.store.stamps_required) * 100}%` }
                        ]}
                    />
                </View>
                <ThemedText style={styles.progressText}>
                    {item.stamps_count}/{item.store.stamps_required} carimbos
                </ThemedText>
            </View>

            <View style={styles.stampsGrid}>
                {Array.from({ length: item.store.stamps_required }).map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.stamp,
                            index < item.stamps_count ? styles.stampFilled : styles.stampEmpty,
                        ]}
                    >
                        <ThemedText style={styles.stampText}>
                            {index < item.stamps_count ? '✓' : ''}
                        </ThemedText>
                    </View>
                ))}
            </View>

            <View style={styles.rewardContainer}>
                <ThemedText style={styles.rewardLabel}>Recompensa:</ThemedText>
                <ThemedText style={styles.rewardText}>
                    {item.store.reward_description}
                </ThemedText>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <ThemedText type="title" style={styles.emptyTitle}>
                Nenhum cartão ainda
            </ThemedText>
            <ThemedText style={styles.emptyText}>
                Visite uma loja parceira e peça para adicionar um carimbo no seu cartão!
            </ThemedText>
        </View>
    );

    if (isLoading) {
        return (
            <ThemedView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ThemedText>Carregando...</ThemedText>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <ThemedText type="title">Olá, {user?.name}!</ThemedText>
                    <ThemedText style={styles.subtitle}>
                        Seus cartões fidelidade
                    </ThemedText>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <ThemedText style={styles.logoutText}>Sair</ThemedText>
                </TouchableOpacity>
            </View>

            <FlatList
                data={cards}
                renderItem={renderCard}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={renderEmptyState}
            />
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
    },
    subtitle: {
        opacity: 0.7,
        marginTop: 4,
    },
    logoutButton: {
        padding: 8,
    },
    logoutText: {
        color: '#ff4444',
        fontSize: 14,
    },
    listContainer: {
        padding: 20,
        paddingTop: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    },
    storeDescription: {
        color: '#666',
        marginTop: 4,
    },
    statusContainer: {
        alignItems: 'flex-end',
    },
    completedBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    completedText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    progressContainer: {
        marginBottom: 16,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#0a7ea4',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    stampsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    stamp: {
        width: 32,
        height: 32,
        borderRadius: 16,
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
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    rewardContainer: {
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
    },
    rewardLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    rewardText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        marginBottom: 12,
        color: '#666',
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        lineHeight: 20,
    },
});