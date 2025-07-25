import { DebugPanel } from '@/components/DebugPanel';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
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
}

interface Customer {
    id: number;
    name: string;
    phone: string;
    stamps_count: number;
    is_completed: boolean;
    card_id: number;
    card_created_at: string;
}

interface CustomerSearchResult {
    id: number;
    name: string;
    phone: string;
    stamps_count: number;
    is_completed: boolean;
    card_id: number;
}

const API_URL = 'https://appcartaozinho-servercartaozinho.5gttis.easypanel.host/api';

export default function MerchantHomeScreen() {
    const [store, setStore] = useState<Store | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchPhone, setSearchPhone] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const [showAddStampModal, setShowAddStampModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isAddingStamp, setIsAddingStamp] = useState(false);

    const { user, logout } = useAuth();

    const loadStore = useCallback(async () => {
        if (!user) return;

        try {
            const response = await fetch(`${API_URL}/stores/merchant/${user.id}`, {
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const data = await response.json();
                setStore(data);
                await loadCustomers(data.id);
            } else if (response.status === 404) {
                // Loja não existe, mostrar opção para criar
                setStore(null);
            }
        } catch (error) {
            console.error('Erro ao carregar loja:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    const loadCustomers = async (storeId: number) => {
        try {
            const response = await fetch(`${API_URL}/stores/${storeId}/customers`, {
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                const data = await response.json();
                setCustomers(data);
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    };

    useEffect(() => {
        loadStore();
    }, [loadStore]);

    const onRefresh = () => {
        setRefreshing(true);
        loadStore();
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

    const searchCustomer = async () => {
        if (!searchPhone.trim() || searchPhone.length < 14) {
            Alert.alert('Erro', 'Digite um telefone válido');
            return;
        }

        if (!store) {
            Alert.alert('Erro', 'Loja não encontrada');
            return;
        }

        setIsSearching(true);

        try {
            const cleanPhone = '+55' + searchPhone.replace(/\D/g, '');

            const response = await fetch(`${API_URL}/customers/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: cleanPhone,
                    store_id: store.id
                }),
            });

            if (response.ok) {
                const customer = await response.json();
                setSelectedCustomer(customer);
                setShowAddStampModal(true);
                setSearchPhone('');
            } else {
                const errorData = await response.json();
                Alert.alert('Cliente não encontrado',
                    errorData.error || 'Cliente não está cadastrado no app');
            }
        } catch (error) {
            console.error('Erro na busca:', error);
            Alert.alert('Erro', 'Não foi possível buscar o cliente');
        } finally {
            setIsSearching(false);
        }
    };

    const addStamp = async () => {
        if (!selectedCustomer || !store || !user) return;

        setIsAddingStamp(true);

        try {
            const response = await fetch(`${API_URL}/stamps/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: selectedCustomer.id,
                    store_id: store.id,
                    stamped_by: user.id,
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                Alert.alert('✅ Sucesso!', result.message);
                setShowAddStampModal(false);
                setSelectedCustomer(null);
                await loadCustomers(store.id); // Recarregar lista de clientes
            } else {
                Alert.alert('❌ Erro', result.error || 'Não foi possível adicionar o carimbo');
            }
        } catch (error) {
            console.error('Erro ao adicionar carimbo:', error);
            Alert.alert('❌ Erro', 'Não foi possível adicionar o carimbo');
        } finally {
            setIsAddingStamp(false);
        }
    };

    const createStore = () => {
        Alert.alert(
            'Criar Loja',
            'Você precisa criar sua loja antes de começar a usar o sistema.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Criar Loja', onPress: () => router.push('/ManageStore') },
            ]
        );
    };

    const manageStore = () => {
        router.push('/ManageStore');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const renderCustomer = ({ item }: { item: Customer }) => {
        const progress = store ? (item.stamps_count / store.stamps_required) * 100 : 0;

        return (
            <View style={[styles.customerCard, item.is_completed && styles.customerCardCompleted]}>
                <View style={styles.customerHeader}>
                    <View style={styles.customerInfo}>
                        <ThemedText type="defaultSemiBold" style={styles.customerName}>
                            {item.name}
                        </ThemedText>
                        <ThemedText style={styles.customerPhone}>
                            📱 {item.phone}
                        </ThemedText>
                        <ThemedText style={styles.customerDate}>
                            Cliente desde {formatDate(item.card_created_at)}
                        </ThemedText>
                    </View>

                    <View style={styles.customerStats}>
                        <View style={styles.stampsInfo}>
                            <ThemedText style={styles.stampsText}>
                                {item.stamps_count}/{store?.stamps_required} carimbos
                            </ThemedText>
                            <ThemedText style={styles.progressPercentage}>
                                {Math.round(progress)}%
                            </ThemedText>
                        </View>

                        {item.is_completed && (
                            <View style={styles.completedBadge}>
                                <ThemedText style={styles.completedText}>🎉 Completo!</ThemedText>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
                </View>
            </View>
        );
    };

    const renderEmptyCustomers = () => (
        <View style={styles.emptyState}>
            <ThemedText style={styles.emptyEmoji}>👥</ThemedText>
            <ThemedText type="title" style={styles.emptyTitle}>
                Nenhum cliente ainda
            </ThemedText>
            <ThemedText style={styles.emptyText}>
                Use a busca acima para encontrar clientes e adicionar carimbos nos cartões deles!
            </ThemedText>
        </View>
    );

    if (isLoading) {
        return (
            <ThemedView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ThemedText style={styles.loadingText}>🔄 Carregando sua loja...</ThemedText>
                </View>
            </ThemedView>
        );
    }

    if (!store) {
        return (
            <ThemedView style={styles.container}>
                <View style={styles.noStoreContainer}>
                    <ThemedText style={styles.noStoreEmoji}>🏪</ThemedText>
                    <ThemedText type="title" style={styles.noStoreTitle}>
                        Bem-vindo, {user?.name}!
                    </ThemedText>
                    <ThemedText style={styles.noStoreText}>
                        Você ainda não tem uma loja cadastrada.
                        {'\n'}Vamos criar sua primeira loja?
                    </ThemedText>

                    <TouchableOpacity style={styles.createStoreButton} onPress={createStore}>
                        <ThemedText style={styles.createStoreButtonText}>
                            🏪 Criar Minha Loja
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleLogout}
                        style={styles.logoutButtonAlt}
                    >
                        <ThemedText style={styles.logoutText}>Sair</ThemedText>
                    </TouchableOpacity>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerInfo}>
                    <ThemedText type="title" style={styles.storeTitle}>
                        🏪 {store.name}
                    </ThemedText>
                    <ThemedText style={styles.subtitle}>
                        {customers.length} clientes • {customers.filter(c => c.is_completed).length} completos
                    </ThemedText>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => setShowDebug(true)}
                        style={styles.debugButton}
                    >
                        <ThemedText style={styles.debugButtonText}>🔧</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={manageStore} style={styles.manageButton}>
                        <ThemedText style={styles.manageButtonText}>⚙️</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <ThemedText style={styles.logoutText}>Sair</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Busca de Cliente */}
            <View style={styles.searchSection}>
                <ThemedText style={styles.searchTitle}>
                    🔍 Buscar Cliente para Adicionar Carimbo
                </ThemedText>

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="(11) 99999-9999"
                        value={searchPhone}
                        onChangeText={(text) => setSearchPhone(formatPhone(text))}
                        keyboardType="phone-pad"
                        maxLength={15}
                        returnKeyType="search"
                        onSubmitEditing={searchCustomer}
                    />

                    <TouchableOpacity
                        style={[styles.searchButton, (!searchPhone.trim() || isSearching) && styles.searchButtonDisabled]}
                        onPress={searchCustomer}
                        disabled={!searchPhone.trim() || isSearching}
                    >
                        {isSearching ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <ThemedText style={styles.searchButtonText}>📱 Buscar</ThemedText>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Lista de Clientes */}
            <View style={styles.customersSection}>
                <ThemedText style={styles.customersTitle}>
                    👥 Seus Clientes
                </ThemedText>

                <FlatList
                    data={customers}
                    renderItem={renderCustomer}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={[
                        styles.customersList,
                        customers.length === 0 && styles.customersListEmpty
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
                    ListEmptyComponent={renderEmptyCustomers}
                />
            </View>

            {/* Modal de Adicionar Carimbo */}
            <Modal
                visible={showAddStampModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowAddStampModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>
                        <ThemedText type="subtitle" style={styles.modalTitle}>
                            📍 Adicionar Carimbo
                        </ThemedText>

                        {selectedCustomer && (
                            <View style={styles.customerInfoModal}>
                                <ThemedText type="defaultSemiBold" style={styles.modalCustomerName}>
                                    {selectedCustomer.name}
                                </ThemedText>
                                <ThemedText style={styles.modalCustomerPhone}>
                                    📱 {selectedCustomer.phone}
                                </ThemedText>
                                <ThemedText style={styles.modalCustomerStamps}>
                                    🎫 {selectedCustomer.stamps_count}/{store.stamps_required} carimbos
                                </ThemedText>

                                {selectedCustomer.is_completed && (
                                    <View style={styles.modalCompletedWarning}>
                                        <ThemedText style={styles.modalWarningText}>
                                            ⚠️ Este cartão já está completo!
                                        </ThemedText>
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSecondary]}
                                onPress={() => setShowAddStampModal(false)}
                                disabled={isAddingStamp}
                            >
                                <ThemedText style={styles.modalButtonSecondaryText}>
                                    Cancelar
                                </ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.modalButtonPrimary,
                                    isAddingStamp && styles.modalButtonDisabled
                                ]}
                                onPress={addStamp}
                                disabled={isAddingStamp}
                            >
                                {isAddingStamp ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <ThemedText style={styles.modalButtonText}>
                                        ⭐ Adicionar Carimbo
                                    </ThemedText>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
    storeTitle: {
        fontSize: 20,
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
    manageButton: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: '#f0f0f0',
    },
    manageButtonText: {
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
    noStoreContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    noStoreEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    noStoreTitle: {
        marginBottom: 16,
        color: '#0a7ea4',
        textAlign: 'center',
    },
    noStoreText: {
        textAlign: 'center',
        color: '#666',
        lineHeight: 22,
        marginBottom: 32,
    },
    createStoreButton: {
        backgroundColor: '#0a7ea4',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    createStoreButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButtonAlt: {
        padding: 8,
    },
    searchSection: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e1e1e1',
    },
    searchTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    searchInput: {
        flex: 1,
        borderWidth: 2,
        borderColor: '#e1e1e1',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    searchButton: {
        backgroundColor: '#0a7ea4',
        borderRadius: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 80,
    },
    searchButtonDisabled: {
        opacity: 0.5,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    customersSection: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    customersTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    customersList: {
        paddingBottom: 20,
    },
    customersListEmpty: {
        flex: 1,
        justifyContent: 'center',
    },
    customerCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    customerCardCompleted: {
        borderColor: '#4CAF50',
        borderWidth: 2,
        backgroundColor: '#f8fff8',
    },
    customerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    customerInfo: {
        flex: 1,
    },
    customerName: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
    },
    customerPhone: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    customerDate: {
        fontSize: 10,
        color: '#999',
    },
    customerStats: {
        alignItems: 'flex-end',
    },
    stampsInfo: {
        alignItems: 'flex-end',
        marginBottom: 4,
    },
    stampsText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0a7ea4',
    },
    progressPercentage: {
        fontSize: 12,
        color: '#666',
    },
    completedBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    completedText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#0a7ea4',
        borderRadius: 3,
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
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 350,
    },
    modalTitle: {
        textAlign: 'center',
        marginBottom: 20,
        color: '#0a7ea4',
    },
    customerInfoModal: {
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    modalCustomerName: {
        fontSize: 18,
        color: '#333',
        marginBottom: 4,
    },
    modalCustomerPhone: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    modalCustomerStamps: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0a7ea4',
    },
    modalCompletedWarning: {
        backgroundColor: '#fff3cd',
        padding: 8,
        borderRadius: 6,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#ffeaa7',
    },
    modalWarningText: {
        fontSize: 12,
        color: '#856404',
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    modalButtonPrimary: {
        backgroundColor: '#0a7ea4',
    },
    modalButtonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#0a7ea4',
    },
    modalButtonDisabled: {
        opacity: 0.5,
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    modalButtonSecondaryText: {
        color: '#0a7ea4',
        fontWeight: '600',
        fontSize: 14,
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