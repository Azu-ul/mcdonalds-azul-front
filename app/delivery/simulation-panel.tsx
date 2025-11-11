import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, StyleSheet,
    ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router'; // Hook para navegación entre pantallas
import { useAuth } from '../context/AuthContext'; // Contexto para datos de autenticación y permisos
import api from '../../config/api'; // Configuración para llamadas API al backend
import { Ionicons } from '@expo/vector-icons'; // Íconos vectoriales de Ionicons
import CustomModal from '../components/CustomModal'; // Componente modal personalizado para mostrar alertas


// Tipo para controlar el estado y configuración del modal personalizado
type CustomModalState = {
    visible: boolean; // Controla la visibilidad del modal
    type: 'success' | 'error' | 'info' | 'delete'; // Tipo para cambiar apariencia y estilo
    title: string; // Título mostrado en el modal
    message: string; // Mensaje principal del modal
    confirmText?: string; // Texto del botón de confirmación
    showCancel?: boolean; // Indica si se muestra botón cancelar
    onConfirm?: () => void; // Función para ejecutar cuando se confirma
};


// Componente principal Panel de Simulación
export default function SimulationPanel() {
    const router = useRouter(); // Hook para controlar navegación
    const { isRepartidor } = useAuth(); // Verifica si el usuario tiene rol repartidor
    const [loading, setLoading] = useState(false); // Estado para mostrar indicador de carga
    const [generatedOrders, setGeneratedOrders] = useState<any[]>([]); // Lista de pedidos simulados generados
    
    const [customModal, setCustomModal] = useState<CustomModalState>({
        visible: false, // Por defecto modal oculto
        type: 'info', // Tipo por defecto info
        title: '', // Sin título inicial
        message: '', // Sin mensaje inicial
    });

    // Función para mostrar el modal con configuración dinámica
    const showCustomModal = (config: Omit<CustomModalState, 'visible'>) => {
        setCustomModal({ ...config, visible: true });
    };

    // Función para ocultar el modal
    const hideCustomModal = () => {
        setCustomModal(prev => ({ ...prev, visible: false }));
    };

    // Función para generar un único pedido simulado
    const generateSingleOrder = async () => {
        try {
            setLoading(true); // Mostrar loader mientras se genera
            const res = await api.post('/simulation/orders/generate'); // Llamada API para generar pedido
            setGeneratedOrders(prev => [res.data.order, ...prev.slice(0, 4)]); // Agregar pedido nuevo al inicio, mantener máximo 5

            showCustomModal({
                type: 'success',
                title: '✅ Éxito',
                message: 'Pedido simulado generado',
                onConfirm: hideCustomModal,
            });
        } catch (error: any) {
            // En caso de error mostrar modal con mensaje de error recibido de backend o por defecto
            showCustomModal({
                type: 'error',
                title: '❌ Error',
                message: error.response?.data?.error || 'No se pudo generar el pedido',
                onConfirm: hideCustomModal,
            });
        } finally {
            setLoading(false); // Ocultar loader al finalizar
        }
    };

    // Función para generar múltiples pedidos simulados (3 en este caso)
    const generateMultipleOrders = async () => {
        try {
            setLoading(true); // Mostrar loader
            const res = await api.post('/simulation/orders/generate-multiple', { count: 3 }); // Llamada API con parámetro cantidad
            const newOrders = res.data.orders || []; // Obtener pedidos recibidos
            setGeneratedOrders(prev => [...newOrders, ...prev.slice(0, 2)]); // Agregar nuevos pedidos limitando total a 5

            showCustomModal({
                type: 'success',
                title: '✅ Éxito',
                message: `${newOrders.length} pedidos generados`,
                onConfirm: hideCustomModal,
            });
        } catch (error: any) {
            console.error('Error generando múltiples pedidos:', error);
            showCustomModal({
                type: 'error',
                title: '❌ Error',
                message: error.response?.data?.error || 'No se pudo generar los pedidos',
                onConfirm: hideCustomModal,
            });
        } finally {
            setLoading(false);
        }
    };

    // Función para limpiar pedidos generados antiguos
    const cleanupOrders = async () => {
        try {
            setLoading(true);
            const res = await api.delete('/simulation/orders/cleanup'); // Llamada API para limpiar

            showCustomModal({
                type: 'info',
                title: '🧹 Limpiado',
                message: res.data.message, // Mensaje desplegado sobre limpieza
                onConfirm: hideCustomModal,
            });

            setGeneratedOrders([]); // Vaciar lista local de pedidos generados
        } catch (error: any) {
            showCustomModal({
                type: 'error',
                title: '❌ Error',
                message: error.response?.data?.error || 'No se pudo limpiar los pedidos',
                onConfirm: hideCustomModal,
            });
        } finally {
            setLoading(false);
        }
    };

    // Si el usuario no es repartidor, mostrar mensaje y botón para volver atrás
    if (!isRepartidor) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>No tenés permisos de repartidor</Text>
                <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Renderizado principal para usuario repartidor
    return (
        <View style={styles.container}>

            {/* Header con botón volver y título */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>Mc Donald's Azul</Text>
                    <Text style={styles.subtitle}>Panel de Simulación</Text>
                </View>
                <View style={styles.placeholder} />
            </View>

            {/* Contenido desplazarle con ScrollView */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                {/* Sección controles */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎮 Controles de Simulación</Text>

                    {/* Botones para generar pedidos simulados */}
                    <View style={styles.controlsGrid}>
                        <TouchableOpacity
                            style={[styles.controlButton, styles.primaryButton]}
                            onPress={generateSingleOrder}
                            disabled={loading}
                        >
                            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
                            <Text style={styles.controlButtonText}>Generar 1 Pedido</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.controlButton, styles.secondaryButton]}
                            onPress={generateMultipleOrders}
                            disabled={loading}
                        >
                            <Ionicons name="layers" size={24} color="#FFFFFF" />
                            <Text style={styles.controlButtonText}>Generar 3 Pedidos</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Botón para limpiar pedidos antiguos */}
                    <TouchableOpacity
                        style={[styles.controlButton, styles.cleanupButton]}
                        onPress={cleanupOrders}
                        disabled={loading}
                    >
                        <Ionicons name="trash" size={20} color="#FFFFFF" />
                        <Text style={styles.controlButtonText}>Limpiar Pedidos Antiguos</Text>
                    </TouchableOpacity>
                </View>

                {/* Mostrar últimos pedidos generados si existen */}
                {generatedOrders.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📦 Últimos Pedidos Generados</Text>
                        {generatedOrders.map((order, index) => (
                            <View key={index} style={styles.generatedOrderCard}>
                                <View style={styles.orderHeader}>
                                    <Text style={styles.orderId}>Pedido #{order.id}</Text>
                                    <Text style={styles.orderAmount}>${order.total}</Text>
                                </View>
                                <Text style={styles.orderRestaurant}>{order.restaurant_name}</Text>
                                <Text style={styles.orderAddress}>📍 {order.delivery_address}</Text>
                                <Text style={styles.orderCustomer}>👤 {order.customer_name}</Text>
                                <Text style={styles.orderTime}>⏱️ {order.estimated_delivery_time} min estimados</Text>
                                <View style={styles.readyBadge}>
                                    <Text style={styles.readyBadgeText}>✅ Listo para retirar</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Indicador de carga durante generación */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FFBC0D" />
                        <Text style={styles.loadingText}>Generando pedidos...</Text>
                    </View>
                )}

                {/* Sección informativa con detalles */}
                <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>💡 Información</Text>
                    <Text style={styles.infoText}>
                        • Los pedidos simulados aparecerán automáticamente en "Disponibles"{'\n'}
                        • Estarán listos para retirar inmediatamente{'\n'}
                        • Puedes aceptarlos y completar el flujo de entrega{'\n'}
                        • Los pedidos se generan con datos realistas de Mar del Plata{'\n'}
                        • La lista se actualiza automáticamente cada 10 segundos
                    </Text>
                </View>
            </ScrollView>

            {/* Modal personalizado para mostrar mensajes */}
            <CustomModal
                visible={customModal.visible}
                type={customModal.type}
                title={customModal.title}
                message={customModal.message}
                confirmText={customModal.confirmText}
                showCancel={customModal.showCancel}
                onConfirm={customModal.onConfirm}
                onCancel={hideCustomModal}
            />
        </View>
    );
}


// Estilos para los componentes UI usando StyleSheet nativo
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        backgroundColor: '#DA291C',
        paddingVertical: 16,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 4,
    },
    logoContainer: {
        flex: 1,
        alignItems: 'center',
    },
    logo: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFBC0D',
    },
    subtitle: {
        fontSize: 12,
        color: '#FFFFFF',
        marginTop: 2,
    },
    placeholder: {
        width: 32,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#292929',
        marginBottom: 16,
    },
    controlsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    controlButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 10,
        gap: 8,
    },
    primaryButton: {
        backgroundColor: '#FFBC0D',
    },
    secondaryButton: {
        backgroundColor: '#DA291C',
    },
    cleanupButton: {
        backgroundColor: '#666',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        gap: 8,
    },
    controlButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    generatedOrderCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    orderId: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#292929',
    },
    orderAmount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#DA291C',
    },
    orderRestaurant: {
        fontSize: 13,
        fontWeight: '600',
        color: '#292929',
        marginBottom: 2,
    },
    orderAddress: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    orderCustomer: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    orderTime: {
        fontSize: 11,
        color: '#888',
        marginBottom: 6,
    },
    readyBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    readyBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    },
    infoSection: {
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1976D2',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 12,
        color: '#424242',
        lineHeight: 18,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#FFBC0D',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#292929',
        fontSize: 16,
        fontWeight: '600',
    },
});
