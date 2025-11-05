import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Image,
    Modal, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import api from '../../config/api';
import { Ionicons } from '@expo/vector-icons';

type Order = {
    id: number;
    total: number;
    delivery_address: string;
    restaurant_name: string;
    restaurant_address: string;
    customer_name: string;
    customer_phone: string;
    minutes_ago: number;
    estimated_delivery_time?: number;
    status?: string;
    driver_id?: number | null;
    pickup_time?: string;
    delivered_time?: string;
    items_count?: number;
    created_at?: string;
};

type ActiveOrder = Order & {
    restaurant_latitude: number;
    restaurant_longitude: number;
    delivery_latitude: number;
    delivery_longitude: number;
    delivered_time?: string;
};

export default function DeliveryHome() {
    const router = useRouter();
    const { user, isRepartidor } = useAuth();
    const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history'>('available');
    const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
    const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
    const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Polling cada 10 segundos
    useEffect(() => {
        if (isRepartidor) {
            // Cargar datos inmediatamente
            loadData();

            // Configurar polling que funcione siempre, sin importar la pestaña activa
            const interval = setInterval(() => {
                console.log('🔄 Polling automático - verificando nuevos pedidos...');

                // Siempre verificar pedidos disponibles, incluso si no estás en esa pestaña
                loadAvailableOrders();

                // Si estás en la pestaña activa o historial, cargar esos datos también
                if (activeTab === 'active') {
                    loadActiveOrders();
                } else if (activeTab === 'history') {
                    loadHistoryOrders();
                }
            }, 5000); // Reducido a 5 segundos para mejor respuesta

            return () => clearInterval(interval);
        }
    }, [isRepartidor, activeTab]);

    const loadData = async () => {
        setLoading(true);
        await loadDataSilently();
        setLoading(false);
    };

    const loadDataSilently = async () => {
        try {
            switch (activeTab) {
                case 'available':
                    await loadAvailableOrders();
                    break;
                case 'active':
                    await loadActiveOrders();
                    break;
                case 'history':
                    await loadHistoryOrders();
                    break;
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const loadAvailableOrders = async () => {
        try {
            const res = await api.get('/delivery/orders/available');
            console.log('📦 Pedidos disponibles:', res.data.orders);
            setAvailableOrders(res.data.orders || []);
        } catch (error: any) {
            console.error('Error cargando pedidos disponibles:', error);
            setAvailableOrders([]);
        }
    };

    const loadActiveOrders = async () => {
        try {
            const res = await api.get('/delivery/orders/active');
            console.log('🚗 Pedidos activos:', res.data.orders);
            setActiveOrders(res.data.orders || []);
        } catch (error: any) {
            console.error('Error cargando pedidos activos:', error);
            setActiveOrders([]);
        }
    };

    const loadHistoryOrders = async () => {
        try {
            const res = await api.get('/delivery/orders/history');
            setHistoryOrders(res.data.orders || []);
        } catch (error: any) {
            console.error('Error cargando historial:', error);
            setHistoryOrders([]);
        }
    };

    const handleAcceptOrder = async (orderId: number) => {
        try {
            setActionLoading(true);

            // Optimistic update
            setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
            setModalVisible(false);

            await api.post('/delivery/orders/accept', { order_id: orderId });

            Alert.alert('Éxito', 'Pedido aceptado correctamente');
            await loadActiveOrders();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'No se pudo aceptar el pedido');
            await loadAvailableOrders();
        } finally {
            setActionLoading(false);
        }
    };

    const handlePickupOrder = async (orderId: number) => {
        try {
            setActionLoading(true);
            await api.post('/delivery/orders/pickup', { order_id: orderId });
            Alert.alert('Éxito', 'Pedido marcado como retirado');
            await loadActiveOrders();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'No se pudo actualizar el pedido');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeliverOrder = async (orderId: number) => {
        try {
            setActionLoading(true);
            await api.post('/delivery/orders/deliver', { order_id: orderId });
            Alert.alert('¡Entregado!', 'Pedido completado correctamente 🍟');
            await Promise.all([loadActiveOrders(), loadHistoryOrders()]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'No se pudo completar el pedido');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectOrder = async (orderId: number) => {
        try {
            setActionLoading(true);

            // Optimistic update
            setAvailableOrders(prev => prev.filter(order => order.id !== orderId));
            setModalVisible(false);
            setSelectedOrder(null);

            await api.post('/delivery/orders/reject', { order_id: orderId });

            Alert.alert('Rechazado', 'Pedido rechazado correctamente');
        } catch (error: any) {
            Alert.alert('Error', 'No se pudo rechazar el pedido');
            await loadAvailableOrders();
        } finally {
            setActionLoading(false);
        }
    };

    const openOrderModal = (order: Order) => {
        setSelectedOrder(order);
        setModalVisible(true);
    };

    const shouldShowPickupButton = (order: Order) => {
        return order.status === 'ready' || order.status === 'preparing' || !order.status;
    };

    // Cambiar de ActiveOrder a Order  
    const shouldShowDeliverButton = (order: Order) => {
        return order.status === 'delivering';
    };

    // Y también actualiza el getStatusColor y getStatusText para que acepten Order
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'preparing': return '#FFA500';
            case 'ready': return '#4CAF50';
            case 'delivering': return '#2196F3';
            case 'completed': return '#666';
            default: return '#FFA500';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'preparing': return 'Preparando 🍔';
            case 'ready': return 'Listo para retirar';
            case 'delivering': return 'En camino';
            case 'completed': return 'Completado';
            default: return status || 'Preparando';
        }
    };

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

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>Mc Donald's Azul</Text>
                    <Text style={styles.subtitle}>Panel de Repartidor</Text>
                </View>

                <TouchableOpacity
                    style={styles.profileContainer}
                    onPress={() => router.push('/profile')}
                >
                    {user?.profile_image_url ? (
                        <Image
                            source={{ uri: user.profile_image_url }}
                            style={styles.profileImage}
                        />
                    ) : (
                        <View style={styles.profileImagePlaceholder}>
                            <Text style={styles.profileImageText}>
                                {user?.username?.[0]?.toUpperCase() || 'R'}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'available' && styles.activeTab]}
                    onPress={() => setActiveTab('available')}
                >
                    <Ionicons name="list" size={20} color={activeTab === 'available' ? '#FFBC0D' : '#666'} />
                    <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
                        Disponibles
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'active' && styles.activeTab]}
                    onPress={() => setActiveTab('active')}
                >
                    <Ionicons name="navigate" size={20} color={activeTab === 'active' ? '#FFBC0D' : '#666'} />
                    <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
                        Activos
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                    onPress={() => setActiveTab('history')}
                >
                    <Ionicons name="time" size={20} color={activeTab === 'history' ? '#FFBC0D' : '#666'} />
                    <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
                        Historial
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FFBC0D" />
                        <Text style={styles.loadingText}>Cargando pedidos...</Text>
                    </View>
                ) : (
                    <>
                        {/* Pedidos Disponibles */}
                        {activeTab === 'available' && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Pedidos Disponibles:</Text>
                                <Text style={styles.emptySubtext}>Tener en cuenta que los pedidos pueden tardar en llegar (generarse)</Text>
                                {availableOrders.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="fast-food-outline" size={64} color="#CCCCCC" />
                                        <Text style={styles.emptyText}>No hay pedidos disponibles</Text>
                                        <Text style={styles.emptySubtext}>Los nuevos pedidos aparecerán aquí. Tener en cuenta que los pedidos pueden tardar en llegar (generarse)</Text>
                                    </View>
                                ) : (
                                    availableOrders.map((order) => (
                                        <View key={order.id} style={styles.orderCard}>
                                            <View style={styles.orderHeader}>
                                                <Text style={styles.orderId}>Pedido #{order.id}</Text>
                                                <View style={[styles.statusBadge, { backgroundColor: '#FFA500' }]}>
                                                    <Text style={styles.statusText}>Preparando 🍔</Text>
                                                </View>
                                            </View>

                                            <View style={styles.orderInfo}>
                                                <Ionicons name="business" size={16} color="#666" />
                                                <Text style={styles.orderText}>{order.restaurant_name}</Text>
                                            </View>

                                            <View style={styles.orderInfo}>
                                                <Ionicons name="location" size={16} color="#666" />
                                                <Text style={styles.orderText}>{order.delivery_address}</Text>
                                            </View>

                                            <View style={styles.orderDetails}>
                                                <View style={styles.detailItem}>
                                                    <Text style={styles.detailLabel}>Total:</Text>
                                                    <Text style={styles.detailValue}>${order.total}</Text>
                                                </View>
                                                <View style={styles.detailItem}>
                                                    <Text style={styles.detailLabel}>Tiempo:</Text>
                                                    <Text style={styles.detailValue}>{order.estimated_delivery_time} min</Text>
                                                </View>
                                            </View>

                                            <TouchableOpacity
                                                style={styles.viewOrderButton}
                                                onPress={() => openOrderModal(order)}
                                            >
                                                <Text style={styles.viewOrderButtonText}>Ver Pedido</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                )}
                            </View>
                        )}

                        {/* 👇 ESTA ES LA SECCIÓN QUE FALTABA - PEDIDOS ACTIVOS */}
                        {activeTab === 'active' && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Pedidos Activos</Text>
                                {activeOrders.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="navigate-outline" size={64} color="#CCCCCC" />
                                        <Text style={styles.emptyText}>No tenés pedidos activos</Text>
                                        <Text style={styles.emptySubtext}>Aceptá un pedido para empezar</Text>
                                    </View>
                                ) : (
                                    activeOrders.map((order) => (
                                        <View key={order.id} style={styles.orderCard}>
                                            <View style={styles.orderHeader}>
                                                <Text style={styles.orderId}>Pedido #{order.id}</Text>
                                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status || '') }]}>
                                                    <Text style={styles.statusText}>
                                                        {getStatusText(order.status || '')}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.orderInfo}>
                                                <Ionicons name="business" size={16} color="#666" />
                                                <Text style={styles.orderText}>{order.restaurant_name}</Text>
                                            </View>

                                            <View style={styles.orderInfo}>
                                                <Ionicons name="location" size={16} color="#666" />
                                                <Text style={styles.orderText}>{order.delivery_address}</Text>
                                            </View>

                                            <View style={styles.orderDetails}>
                                                <View style={styles.detailItem}>
                                                    <Text style={styles.detailLabel}>Cliente:</Text>
                                                    <Text style={styles.detailValue}>{order.customer_name}</Text>
                                                </View>
                                                <View style={styles.detailItem}>
                                                    <Text style={styles.detailLabel}>Teléfono:</Text>
                                                    <Text style={styles.detailValue}>{order.customer_phone}</Text>
                                                </View>
                                            </View>

                                            <View style={styles.actionButtons}>
                                                {/* Mostrar botón si el estado es 'preparing' o 'ready' */}
                                                {(order.status === 'ready' || order.status === 'preparing') && (
                                                    <TouchableOpacity
                                                        style={[styles.actionButton, styles.pickupButton]}
                                                        onPress={() => handlePickupOrder(order.id)}
                                                        disabled={actionLoading}
                                                    >
                                                        <Ionicons name="cube" size={20} color="#FFF" />
                                                        <Text style={styles.actionButtonText}>Marcar como Retirado</Text>
                                                    </TouchableOpacity>
                                                )}

                                                {/* Mostrar botón si el estado es 'delivering' */}
                                                {order.status === 'delivering' && (
                                                    <TouchableOpacity
                                                        style={[styles.actionButton, styles.deliverButton]}
                                                        onPress={() => handleDeliverOrder(order.id)}
                                                        disabled={actionLoading}
                                                    >
                                                        <Ionicons name="checkmark" size={20} color="#FFF" />
                                                        <Text style={styles.actionButtonText}>Marcar como Entregado</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        )}

                        {/* Historial */}
                        {activeTab === 'history' && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Historial de Pedidos</Text>
                                {historyOrders.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="time-outline" size={64} color="#CCCCCC" />
                                        <Text style={styles.emptyText}>No hay historial de pedidos</Text>
                                        <Text style={styles.emptySubtext}>Los pedidos completados aparecerán aquí</Text>
                                    </View>
                                ) : (
                                    historyOrders.map((order) => (
                                        <View key={order.id} style={styles.historyCard}>
                                            <View style={styles.historyHeader}>
                                                <Text style={styles.orderId}>Pedido #{order.id}</Text>
                                                <Text style={styles.historyDate}>
                                                    {order.delivered_time
                                                        ? new Date(order.delivered_time).toLocaleDateString('es-ES')
                                                        : new Date(order.created_at || '').toLocaleDateString('es-ES')
                                                    }
                                                </Text>
                                            </View>

                                            <View style={styles.orderInfo}>
                                                <Ionicons name="business" size={16} color="#666" />
                                                <Text style={styles.orderText}>{order.restaurant_name}</Text>
                                            </View>

                                            <View style={styles.orderInfo}>
                                                <Ionicons name="location" size={16} color="#666" />
                                                <Text style={styles.orderText}>{order.delivery_address}</Text>
                                            </View>

                                            <View style={styles.historyFooter}>
                                                <Text style={styles.historyTotal}>${order.total}</Text>
                                                <Text style={styles.historyItems}>{order.items_count} productos</Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        )}
                    </>
                )}

                <TouchableOpacity
                    style={styles.backToProfileButton}
                    onPress={() => router.push('/profile')}
                >
                    <Ionicons name="person-outline" size={20} color="#DA291C" />
                    <Text style={styles.backToProfileButtonText}>Volver a mi perfil</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Modal para ver pedido disponible */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedOrder && (
                            <>
                                <Text style={styles.modalTitle}>Pedido #{selectedOrder.id}</Text>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>📍 Retiro</Text>
                                    <Text style={styles.modalText}>{selectedOrder.restaurant_name}</Text>
                                    <Text style={styles.modalSubtext}>{selectedOrder.restaurant_address}</Text>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={styles.modalSectionTitle}>🏠 Entrega</Text>
                                    <Text style={styles.modalText}>{selectedOrder.delivery_address}</Text>
                                    <Text style={styles.modalSubtext}>Cliente: {selectedOrder.customer_name}</Text>
                                </View>

                                <View style={styles.modalDetail}>
                                    <Text style={styles.modalDetailLabel}>Tiempo estimado:</Text>
                                    <Text style={styles.modalDetailValue}>{selectedOrder.estimated_delivery_time} min</Text>
                                </View>
                                <View style={styles.modalDetail}>
                                    <Text style={styles.modalDetailLabel}>Total del pedido:</Text>
                                    <Text style={styles.modalDetailValue}>${selectedOrder.total}</Text>
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => handleRejectOrder(selectedOrder.id)}
                                        disabled={actionLoading}
                                    >
                                        <Text style={styles.cancelButtonText}>Rechazar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.acceptButton]}
                                        onPress={() => handleAcceptOrder(selectedOrder.id)}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? (
                                            <ActivityIndicator color="#292929" size="small" />
                                        ) : (
                                            <Text style={styles.acceptButtonText}>Aceptar Pedido</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {isRepartidor && (
                <TouchableOpacity
                    style={styles.simulationButton}
                    onPress={() => router.push('/delivery/simulation-panel')}
                >
                    <Ionicons name="rocket" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            )}
        </View>
    );
}

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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 5,
    },
    logoContainer: {
        flex: 1,
    },
    logo: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFBC0D',
        textShadowColor: '#292929',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 0,
    },
    subtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        marginTop: 4,
        fontWeight: '500',
    },
    profileContainer: {
        padding: 4,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFBC0D',
    },
    profileImagePlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFBC0D',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileImageText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#292929',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 6,
    },
    activeTab: {
        backgroundColor: 'rgba(255, 188, 13, 0.1)',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeTabText: {
        color: '#292929',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#292929',
        marginBottom: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginBottom: 29,
    },
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#292929',
    },
    orderTime: {
        fontSize: 12,
        color: '#666',
    },
    orderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    orderText: {
        fontSize: 14,
        color: '#292929',
        flex: 1,
    },
    orderDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    detailItem: {
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#292929',
    },
    viewOrderButton: {
        backgroundColor: '#FFBC0D',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    viewOrderButtonText: {
        color: '#292929',
        fontSize: 14,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    actionButtons: {
        marginTop: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    pickupButton: {
        backgroundColor: '#FFA500',
    },
    deliverButton: {
        backgroundColor: '#4CAF50',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    historyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    historyDate: {
        fontSize: 12,
        color: '#666',
    },
    historyFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    historyTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#292929',
    },
    historyItems: {
        fontSize: 12,
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        margin: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#292929',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalSection: {
        marginBottom: 16,
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#292929',
        marginBottom: 8,
    },
    modalText: {
        fontSize: 14,
        color: '#292929',
        marginBottom: 4,
    },
    modalSubtext: {
        fontSize: 12,
        color: '#666',
    },
    modalDetail: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalDetailLabel: {
        fontSize: 14,
        color: '#666',
    },
    modalDetailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#292929',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#E0E0E0',
    },
    acceptButton: {
        backgroundColor: '#FFBC0D',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
    },
    acceptButtonText: {
        color: '#292929',
        fontSize: 14,
        fontWeight: '600',
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
    backToProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 10,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        gap: 8,
        borderWidth: 1.5,
        borderColor: '#DA291C',
    },
    backToProfileButtonText: {
        color: '#DA291C',
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
    simulationButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#DA291C',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});