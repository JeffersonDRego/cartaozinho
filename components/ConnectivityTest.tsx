import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';

export function ConnectivityTest() {
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<string[]>([]);

    // ⚠️ SUBSTITUA PELA URL REAL DO SEU SERVIDOR
    const API_URL = 'https://appcartaozinho-servercartaozinho.5gttis.easypanel.host'; // 🔥 MUDE AQUI!

    const addResult = (message: string) => {
        console.log(message);
        setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const testConnectivity = async () => {
        setIsLoading(true);
        setResults([]);

        addResult('🔄 Iniciando testes de conectividade...');
        addResult(`🌐 URL testada: ${API_URL}`);

        try {
            // Teste 1: Health check
            addResult('🏥 Testando health check...');
            const healthResponse = await fetch(`${API_URL}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (healthResponse.ok) {
                const healthData = await healthResponse.json();
                addResult(`✅ Health check OK: ${healthData.status}`);
                addResult(`🗄️ Banco: ${healthData.database}`);
            } else {
                addResult(`❌ Health check falhou: ${healthResponse.status}`);
            }

            // Teste 2: CORS preflight
            addResult('🌐 Testando CORS...');
            const corsResponse = await fetch(`${API_URL}/health`, {
                method: 'OPTIONS',
            });
            addResult(`📡 CORS Status: ${corsResponse.status}`);

            // Teste 3: Endpoint de auth
            addResult('🔐 Testando endpoint de auth...');
            const authResponse = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ phone: '+5511999999999' }),
            });

            addResult(`🔐 Auth Status: ${authResponse.status}`);

            if (authResponse.status === 404) {
                addResult('✅ Auth endpoint funcionando (404 = usuário não encontrado)');
            } else if (authResponse.status === 400) {
                addResult('✅ Auth endpoint funcionando (400 = dados inválidos)');
            } else {
                const authText = await authResponse.text();
                addResult(`📄 Auth Response: ${authText}`);
            }

        } catch (error) {
            if (typeof error === 'object' && error !== null && 'message' in error) {
                addResult(`💥 ERRO DE REDE: ${(error as { message: string }).message}`);

                if (error instanceof TypeError && (error as { message: string }).message.includes('Network request failed')) {
                    addResult('🚨 Problema de conectividade detectado!');
                    addResult('Possíveis causas:');
                    addResult('• URL incorreta');
                    addResult('• Servidor offline');
                    addResult('• Bloqueio de firewall');
                    addResult('• HTTPS vs HTTP mismatch');
                }
            } else {
                addResult('💥 ERRO DE REDE: erro desconhecido');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const showResults = () => {
        Alert.alert(
            'Resultados dos Testes',
            results.join('\n'),
            [{ text: 'OK' }]
        );
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.title}>
                🔧 Teste de Conectividade
            </ThemedText>

            <ThemedText style={styles.description}>
                Use este botão para testar a conexão com a API
            </ThemedText>

            <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={testConnectivity}
                disabled={isLoading}
            >
                <ThemedText style={styles.buttonText}>
                    {isLoading ? '🔄 Testando...' : '🚀 Testar Conectividade'}
                </ThemedText>
            </TouchableOpacity>

            {results.length > 0 && (
                <TouchableOpacity style={styles.resultsButton} onPress={showResults}>
                    <ThemedText style={styles.resultsButtonText}>
                        📋 Ver Resultados ({results.length})
                    </ThemedText>
                </TouchableOpacity>
            )}

            <ThemedText style={styles.urlText}>
                URL: {API_URL}
            </ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        margin: 20,
        borderRadius: 12,
        backgroundColor: '#f8f9fa',
    },
    title: {
        textAlign: 'center',
        marginBottom: 10,
    },
    description: {
        textAlign: 'center',
        marginBottom: 20,
        opacity: 0.7,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resultsButton: {
        backgroundColor: '#34C759',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    resultsButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    urlText: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.5,
        fontFamily: 'monospace',
    },
});