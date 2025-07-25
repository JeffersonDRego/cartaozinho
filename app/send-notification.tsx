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
}

interface Customer {
    id: number;
    name: string;
    phone: string;
}

export default function SendNotificationScreen() {
    const [store, setStore] = useState<Store | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const { user } = useAuth();

    const API_URL = 'https://appcartaozinho-servercartaozinho.5gttis.easypanel.host/api'; // Substitua pela URL da sua VPS

    useEffect(() => {
        loadStore();
        loadCustomers();
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
            }
        } catch (error) {
            console.error('Error loading store:', error);
        }
    };

    const loadCustomers = async () => {
        try {
            if (!store?.id) return;

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
        }
    };

    const sendNotification = async () => {
        if (!title.trim()) {
            Alert.alert('Erro', 'Digite o título da notificação');
            return;
        }

        if (!message.trim()) {
            Alert.alert('Erro', 'Digite a mensagem da notificação');
            return;
        }

        setIsSending(true);

        try {
            const response = await fetch(`${API_URL}/notifications/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    store_id: store?.id,
                    title: title.trim(),
                    message: message.trim(),
                    customer_id: selectedCustomer,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    Alert.alert(
                        'Sucesso!',
                        `Notificação enviada para ${selectedCustomer ? '1 cliente' : `${data.sent_count} clientes`}`,
                        [
                            {
                                text: 'OK',
                                onPress: () => {
                                    setTitle('');
                                    setMessage('');
                                    setSelectedCustomer(null);
                                    router.back();
                                },
                            },
                        ]
                    );
                } else {
                    Alert.alert('Aviso', data.message || 'Nenhum cliente para notificar');
                }
            } else {
                Alert.alert('Erro', 'Não foi possível enviar a notificação');
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível enviar a notificação');
        } finally {
            setIsSending(false);
        }
    };

    const getPreviewText = () => {
        const recipient = selectedCustomer
            ? customers.find(c => c.id === selectedCustomer)?.name
            : 'Todos os clientes';

        return `Esta notificação será enviada para: ${recipient}`;
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
                    <ThemedText type="title">Enviar Notificação</ThemedText>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Informações da Loja */}
                    <View style={styles.storeInfo}>
                        <ThemedText type="subtitle">
                            {store?.name}
                        </ThemedText>
                        <ThemedText style={styles.storeSubtitle}>
                            Envie notificações para seus clientes
                        </ThemedText>
                    </View>

                    {/* Seleção de Destinatário */}
                    <View style={styles.section}>
                        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                            Destinatário
                        </ThemedText>
                        <View style={styles.recipientOptions}>
                            <TouchableOpacity
                                style={[
                                    styles.recipientOption,
                                    !selectedCustomer && styles.recipientOptionSelected,
                                ]}
                                onPress={() => setSelectedCustomer(null)}
                            >
                                <ThemedText style={[
                                    styles.recipientOptionText,
                                    !selectedCustomer && styles.recipientOptionTextSelected,
                                ]}>
                                    Todos os clientes ({customers.length})
                                </ThemedText>
                            </TouchableOpacity>
                        </View>

                        {customers.length > 0 && (
                            <View style={styles.customersList}>
                                <ThemedText style={styles.customersListTitle}>
                                    Ou selecione um cliente específico:
                                </ThemedText>
                                {customers.map((customer) => (
                                    <TouchableOpacity
                                        key={customer.id}
                                        style={[
                                            styles.customerOption,
                                            selectedCustomer === customer.id && styles.customerOptionSelected,
                                        ]}
                                        onPress={() => setSelectedCustomer(customer.id)}
                                    >
                                        <ThemedText style={[
                                            styles.customerOptionText,
                                            selectedCustomer === customer.id && styles.customerOptionTextSelected,
                                        ]}>
                                            {customer.name}
                                        </ThemedText>
                                        <ThemedText style={styles.customerPhone}>
                                            {customer.phone}
                                        </ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Formulário da Notificação */}
                    <View style={styles.section}>
                        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                            Conteúdo da Notificação
                        </ThemedText>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>Título</ThemedText>
                            <TextInput
                                style={styles.titleInput}
                                placeholder="Ex: Promoção especial!"
                                value={title}
                                onChangeText={setTitle}
                                maxLength={50}
                                autoCapitalize="sentences"
                            />
                            <ThemedText style={styles.charCount}>
                                {title.length}/50
                            </ThemedText>
                        </View>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.inputLabel}>Mensagem</ThemedText>
                            <TextInput
                                style={styles.messageInput}
                                placeholder="Digite sua mensagem aqui..."
                                value={message}
                                onChangeText={setMessage}
                                maxLength={200}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                autoCapitalize="sentences"
                            />
                            <ThemedText style={styles.charCount}>
                                {message.length}/200
                            </ThemedText>
                        </View>
                    </View>

                    {/* Preview */}
                    {(title || message) && (
                        <View style={styles.section}>
                            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                                Preview da Notificação
                            </ThemedText>
                            <View style={styles.preview}>
                                <View style={styles.previewNotification}>
                                    <ThemedText style={styles.previewTitle}>
                                        {title || 'Título da notificação'}
                                    </ThemedText>
                                    <ThemedText style={styles.previewMessage}>
                                        {message || 'Mensagem da notificação'}
                                    </ThemedText>
                                    <ThemedText style={styles.previewApp}>
                                        Cartãozinho
                                    </ThemedText>
                                </View>
                                <ThemedText style={styles.previewInfo}>
                                    {getPreviewText()}
                                </ThemedText>
                            </View>
                        </View>
                    )}

                    {/* Botão de Envio */}
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!title.trim() || !message.trim() || isSending) && styles.sendButtonDisabled,
                        ]}
                        onPress={sendNotification}
                        disabled={!title.trim() || !message.trim() || isSending}
                    >
                        {isSending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <IconSymbol name="paperplane.fill" size={20} color="#fff" />
                                <ThemedText style={styles.sendButtonText}>
                                    Enviar Notificação
                                </ThemedText>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Dicas */}
                    <View style={styles.tipsSection}>
                        <ThemedText type="defaultSemiBold" style={styles.tipsTitle}>
                            💡 Dicas para uma boa notificação:
                        </ThemedText>
                        <View style={styles.tip}>
                            <ThemedText style={styles.tipText}>
                                • Use títulos chamativos e curtos
                            </ThemedText>
                        </View>
                        <View style={styles.tip}>
                            <ThemedText style={styles.tipText}>
                                • Seja claro e objetivo na mensagem
                            </ThemedText>
                        </View>
                        <View style={styles.tip}>
                            <ThemedText style={styles.tipText}>
                                • Inclua informações sobre promoções ou novidades
                            </ThemedText>
                        </View>
                        <View style={styles.tip}>
                            <ThemedText style={styles.tipText}>
                                • Evite enviar muitas notificações por dia
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
    storeInfo: {
        alignItems: 'center',
        paddingVertical: 20,
        marginBottom: 20,
    },
    storeSubtitle: {
        marginTop: 8,
        opacity: 0.7,
        textAlign: 'center',
    },
    section: {
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
    sectionTitle: {
        fontSize: 18,
        marginBottom: 16,
        color: '#333',
    },
    recipientOptions: {
        marginBottom: 16,
    },
    recipientOption: {
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    recipientOptionSelected: {
        borderColor: '#0a7ea4',
        backgroundColor: '#f0f8ff',
    },
    recipientOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    recipientOptionTextSelected: {
        color: '#0a7ea4',
    },
    customersList: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 16,
    },
    customersListTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    customerOption: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    customerOptionSelected: {
        borderColor: '#0a7ea4',
        backgroundColor: '#f0f8ff',
    },
    customerOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    customerOptionTextSelected: {
        color: '#0a7ea4',
    },
    customerPhone: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
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
    titleInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    messageInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fafafa',
        minHeight: 100,
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    preview: {
        alignItems: 'center',
    },
    previewNotification: {
        backgroundColor: '#333',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        marginBottom: 12,
    },
    previewTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    previewMessage: {
        color: '#ccc',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    previewApp: {
        color: '#888',
        fontSize: 12,
    },
    previewInfo: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    sendButton: {
        backgroundColor: '#0a7ea4',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
    sendButtonText: {
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