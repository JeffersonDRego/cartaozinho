import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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

interface LoyaltyCard {
  id: number;
  store: Store;
  stamps_count: number;
  is_completed: boolean;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  stamps_count: number;
  is_completed: boolean;
  card_id: number;
}

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchPhone, setSearchPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddStampModal, setShowAddStampModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const API_URL = 'https://appcartaozinho-servercartaozinho.5gttis.easypanel.host/api'; // Substitua pela URL da sua VPS

  const isCustomer = user?.user_type === 'customer';
  const isMerchant = user?.user_type === 'merchant';

  useEffect(() => {
    if (isCustomer) {
      loadCards();
    } else if (isMerchant) {
      loadStore();
      loadCustomers();
    }
  }, [user]);

  // Funções para Cliente
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

  // Funções para Lojista
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
      }
    } catch (error) {
      console.error('Error loading store:', error);
    }
  };

  const loadCustomers = async () => {
    if (!store?.id) return;

    try {
      const response = await fetch(`${API_URL}/stores/${store.id}/customers`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (isCustomer) {
      loadCards();
    } else if (isMerchant) {
      loadStore();
      loadCustomers();
    }
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

  const searchCustomer = async () => {
    if (!searchPhone.trim()) {
      Alert.alert('Erro', 'Digite o telefone do cliente');
      return;
    }

    try {
      const cleanPhone = '+55' + searchPhone.replace(/\D/g, '');
      const response = await fetch(`${API_URL}/customers/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: cleanPhone,
          store_id: store?.id
        }),
      });

      if (response.ok) {
        const customer = await response.json();
        setSelectedCustomer(customer);
        setShowAddStampModal(true);
        setSearchPhone('');
      } else {
        Alert.alert('Cliente não encontrado', 'Cliente não cadastrado no app');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível buscar o cliente');
    }
  };

  const addStamp = async () => {
    if (!selectedCustomer || !store) return;

    try {
      const response = await fetch(`${API_URL}/stamps/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          store_id: store.id,
          stamped_by: user?.id,
        }),
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Carimbo adicionado!');
        setShowAddStampModal(false);
        setSelectedCustomer(null);
        loadCustomers();
      } else {
        Alert.alert('Erro', 'Não foi possível adicionar o carimbo');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o carimbo');
    }
  };

  // Renderizadores para Cliente
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

  // Renderizadores para Lojista
  const renderCustomer = ({ item }: { item: Customer }) => (
    <View style={styles.customerCard}>
      <View style={styles.customerHeader}>
        <View>
          <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
          <ThemedText style={styles.customerPhone}>{item.phone}</ThemedText>
        </View>
        <View style={styles.customerStats}>
          <ThemedText style={styles.stampsText}>
            {item.stamps_count}/{store?.stamps_required} carimbos
          </ThemedText>
          {item.is_completed && (
            <View style={styles.completedBadge}>
              <ThemedText style={styles.completedText}>Completo!</ThemedText>
            </View>
          )}
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(item.stamps_count / (store?.stamps_required || 1)) * 100}%` }
          ]}
        />
      </View>
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
          <ThemedText type="title">
            {isCustomer ? `Olá, ${user?.name}!` : 'Dashboard'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {isCustomer ? 'Seus cartões fidelidade' : store?.name || 'Sua loja'}
          </ThemedText>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <ThemedText style={styles.logoutText}>Sair</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Interface do Lojista */}
      {isMerchant && (
        <>
          <View style={styles.actions}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Telefone do cliente"
                value={searchPhone}
                onChangeText={setSearchPhone}
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={styles.searchButton} onPress={searchCustomer}>
                <IconSymbol name="paperplane.fill" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <ThemedText type="defaultSemiBold" style={styles.statNumber}>
                {customers.length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Clientes</ThemedText>
            </View>

            <View style={styles.statCard}>
              <ThemedText type="defaultSemiBold" style={styles.statNumber}>
                {customers.filter(c => c.is_completed).length}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Completos</ThemedText>
            </View>
          </View>
        </>
      )}

      <FlatList
        data={isCustomer ? cards : customers}
        renderItem={isCustomer ? renderCard : renderCustomer}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <ThemedText type="title" style={styles.emptyTitle}>
              {isCustomer ? 'Nenhum cartão ainda' : 'Nenhum cliente ainda'}
            </ThemedText>
            <ThemedText style={styles.emptyText}>
              {isCustomer
                ? 'Visite uma loja parceira e peça para adicionar um carimbo no seu cartão!'
                : 'Os clientes aparecerão aqui quando ganharem carimbos na sua loja.'
              }
            </ThemedText>
          </View>
        )}
      />

      {/* Modal para adicionar carimbo */}
      <Modal
        visible={showAddStampModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddStampModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Adicionar Carimbo
            </ThemedText>

            {selectedCustomer && (
              <View style={styles.customerInfo}>
                <ThemedText type="defaultSemiBold">
                  {selectedCustomer.name}
                </ThemedText>
                <ThemedText style={styles.customerPhone}>
                  {selectedCustomer.phone}
                </ThemedText>
                <ThemedText style={styles.stampsText}>
                  {selectedCustomer.stamps_count}/{store?.stamps_required} carimbos
                </ThemedText>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowAddStampModal(false)}
              >
                <ThemedText style={styles.modalButtonSecondaryText}>
                  Cancelar
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={addStamp}
              >
                <ThemedText style={styles.modalButtonText}>
                  Adicionar Carimbo
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
  },

  // Estilos do Cliente
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
    justifyContent: 'center',
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

  // Estilos do Lojista
  actions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  searchButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    color: '#0a7ea4',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.7,
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
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerPhone: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  customerStats: {
    alignItems: 'flex-end',
  },
  stampsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0a7ea4',
  },

  // Estados vazios
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

  // Modal
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
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  customerInfo: {
    alignItems: 'center',
    marginBottom: 24,
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
  },
  modalButtonPrimary: {
    backgroundColor: '#0a7ea4',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0a7ea4',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtonSecondaryText: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
});