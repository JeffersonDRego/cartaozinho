import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

interface TestResult {
    timestamp: string;
    test: string;
    status: 'success' | 'error' | 'info';
    message: string;
}

export function DebugPanel() {
    const [results, setResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const { user, pushToken, testPushNotification } = useAuth();

    // ⚠️ ALTERE ESTA URL PARA SEU SERVIDOR!
    const API_URL = 'https://appcartaozinho-servercartaozinho.5gttis.easypanel.host/api';

    const addResult = (test: string, status: 'success' | 'error' | 'info', message: string) => {
        const result: TestResult = {
            timestamp: new Date().toLocaleTimeString(),
            test,
            status,
            message
        };
        setResults(prev => [result, ...prev.slice(0, 19)]); // Manter apenas 20 resultados
        console.log(`${status.toUpperCase()}: ${test} - ${message}`);
    };

    const runAllTests = async () => {
        setIsRunning(true);
        setResults([]);

        addResult('Início', 'info', '🔄 Iniciando testes completos...');

        // Teste 1: Health Check
        await testHealthCheck();

        // Teste 2: Conectividade básica
        await testBasicConnectivity();

        // Teste 3: Push Token
        testPushToken();

        // Teste 4: Push Notification (se usuário logado)
        if (user && pushToken) {
            await testPushNotificationWithAPI();
        }

        // Teste 5: Endpoint de auth
        await testAuthEndpoint();

        addResult('Fim', 'info', '✅ Testes concluídos!');
        setIsRunning(false);
    };

    const testHealthCheck = async () => {
        try {
            addResult('Health Check', 'info', '🏥 Testando saúde do servidor...');

            const response = await fetch(`${API_URL}/health`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });

            if (response.ok) {
                const data = await response.json();
                addResult('Health Check', 'success',
                    `✅ Servidor OK! DB: ${data.database.connected ? 'Conectado' : 'Desconectado'}`);
                addResult('Uptime', 'info', `⏰ Uptime: ${data.uptime}s`);
            } else {
                addResult('Health Check', 'error', `❌ Status: ${response.status}`);
            }
        } catch (error) {
            addResult('Health Check', 'error', `💥 Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`);
        }
    };

    const testBasicConnectivity = async () => {
        try {
            addResult('Conectividade', 'info', '🌐 Testando conectividade básica...');

            const startTime = Date.now();
            const response = await fetch(`${API_URL}/health`, {
                method: 'HEAD',
                cache: 'no-cache'
            });
            const duration = Date.now() - startTime;

            if (response.ok) {
                addResult('Conectividade', 'success', `✅ Conectado! Latência: ${duration}ms`);
            } else {
                addResult('Conectividade', 'error', `❌ Status HTTP: ${response.status}`);
            }
        } catch (error) {
            addResult('Conectividade', 'error',
                `💥 Falha na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    };

    const testPushToken = () => {
        if (pushToken) {
            addResult('Push Token', 'success', '✅ Token disponível');
            addResult('Token Info', 'info', `📱 Token: ${pushToken.substring(0, 20)}...`);
        } else {
            addResult('Push Token', 'error', '❌ Token não disponível');
        }
    };

    const testPushNotificationWithAPI = async () => {
        if (!pushToken) {
            addResult('Push Test', 'error', '❌ Token não disponível para teste');
            return;
        }

        try {
            addResult('Push Test', 'info', '📲 Enviando push de teste...');

            const response = await fetch(`${API_URL}/test/push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expo_push_token: pushToken,
                    title: '🧪 Teste Debug Panel',
                    message: `Olá ${user?.name}! Este é um teste do Debug Panel. 🎉`
                }),
            });

            const result = await response.json();

            if (result.success) {
                addResult('Push Test', 'success', '✅ Push enviado! Verifique se recebeu.');
            } else {
                addResult('Push Test', 'error', `❌ Falha: ${result.message}`);
            }
        } catch (error) {
            addResult('Push Test', 'error', `💥 Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`);
        }
    };

    const testAuthEndpoint = async () => {
        try {
            addResult('Auth Endpoint', 'info', '🔐 Testando endpoint de autenticação...');

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: '+5511999999999' }), // Telefone fictício
            });

            if (response.status === 404) {
                addResult('Auth Endpoint', 'success', '✅ Endpoint funcionando (404 = usuário não encontrado)');
            } else if (response.status === 400) {
                addResult('Auth Endpoint', 'success', '✅ Endpoint funcionando (400 = dados inválidos)');
            } else {
                addResult('Auth Endpoint', 'info', `ℹ️ Status inesperado: ${response.status}`);
            }
        } catch (error) {
            addResult('Auth Endpoint', 'error', `💥 Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`);
        }
    };

    const clearResults = () => {
        setResults([]);
        addResult('Sistema', 'info', '🧹 Resultados limpos');
    };

    const showFullLog = () => {
        const fullLog = results.map(r =>
            `${r.timestamp} [${r.status.toUpperCase()}] ${r.test}: ${r.message}`
        ).join('\n');

        Alert.alert('Log Completo', fullLog, [{ text: 'OK' }]);
    };

    const getStatusIcon = (status: 'success' | 'error' | 'info') => {
        switch (status) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'info': return 'ℹ️';
        }
    };

    const getStatusColor = (status: 'success' | 'error' | 'info') => {
        switch (status) {
            case 'success': return '#4CAF50';
            case 'error': return '#f44336';
            case 'info': return '#2196F3';
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.title}>
                🔧 Debug Panel
            </ThemedText>

            <View style={styles.infoSection}>
                <ThemedText style={styles.infoText}>
                    🌐 API: {API_URL}
                </ThemedText>
                <ThemedText style={styles.infoText}>
                    👤 Usuário: {user ? `${user.name} (${user.user_type})` : 'Não logado'}
                </ThemedText>
                <ThemedText style={styles.infoText}>
                    📱 Push Token: {pushToken ? '✅ Disponível' : '❌ Indisponível'}
                </ThemedText>
            </View>

            <View style={styles.buttonsSection}>
                <TouchableOpacity
                    style={[styles.button, styles.primaryButton, isRunning && styles.disabledButton]}
                    onPress={runAllTests}
                    disabled={isRunning}
                >
                    <ThemedText style={styles.buttonText}>
                        {isRunning ? '🔄 Testando...' : '🚀 Executar Todos os Testes'}
                    </ThemedText>
                </TouchableOpacity>

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={testPushNotification}
                        disabled={!user || !pushToken}
                    >
                        <ThemedText style={styles.secondaryButtonText}>
                            📲 Teste Push Simples
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={clearResults}
                    >
                        <ThemedText style={styles.secondaryButtonText}>
                            🧹 Limpar
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.resultsSection} showsVerticalScrollIndicator={false}>
                <View style={styles.resultsHeader}>
                    <ThemedText style={styles.resultsTitle}>
                        📋 Resultados ({results.length})
                    </ThemedText>
                    {results.length > 0 && (
                        <TouchableOpacity onPress={showFullLog}>
                            <ThemedText style={styles.showFullButton}>Ver tudo</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>

                {results.length === 0 ? (
                    <View style={styles.emptyResults}>
                        <ThemedText style={styles.emptyText}>
                            Nenhum teste executado ainda.
                            {'\n'}Toque em &quot;Executar Todos os Testes&quot; para começar.
                        </ThemedText>
                    </View>
                ) : (
                    results.map((result, index) => (
                        <View key={index} style={[styles.resultItem, { borderLeftColor: getStatusColor(result.status) }]}>
                            <View style={styles.resultHeader}>
                                <ThemedText style={styles.resultTest}>
                                    {getStatusIcon(result.status)} {result.test}
                                </ThemedText>
                                <ThemedText style={styles.resultTime}>
                                    {result.timestamp}
                                </ThemedText>
                            </View>
                            <ThemedText style={[styles.resultMessage, { color: getStatusColor(result.status) }]}>
                                {result.message}
                            </ThemedText>
                        </View>
                    ))
                )}
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        textAlign: 'center',
        marginBottom: 16,
        color: '#0a7ea4',
    },
    infoSection: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    infoText: {
        fontSize: 12,
        fontFamily: 'monospace',
        marginBottom: 4,
        color: '#666',
    },
    buttonsSection: {
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    button: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: '#0a7ea4',
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#0a7ea4',
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    secondaryButtonText: {
        color: '#0a7ea4',
        fontSize: 12,
        fontWeight: '600',
    },
    resultsSection: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    resultsTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    showFullButton: {
        fontSize: 12,
        color: '#0a7ea4',
        textDecorationLine: 'underline',
    },
    emptyResults: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        lineHeight: 20,
    },
    resultItem: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 6,
        marginBottom: 8,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    resultTest: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    resultTime: {
        fontSize: 10,
        color: '#999',
        fontFamily: 'monospace',
    },
    resultMessage: {
        fontSize: 12,
        lineHeight: 16,
        fontFamily: 'monospace',
    },
});