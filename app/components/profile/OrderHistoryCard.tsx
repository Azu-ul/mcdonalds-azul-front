import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';

type Order = {
    id: number;
    created_at: string;
    total: number;
    status: string;
    order_type: string;
    items_count: number;
};

type Props = {
    orders: Order[];
    loading: boolean;
    onViewOrder: (orderId: number) => void;
};

const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
        pending: 'Pendiente',
        confirmed: 'Confirmado',
        preparing: 'Preparando',
        ready: 'Listo',
        delivering: 'En camino',
        completed: 'Completado',
        cancelled: 'Cancelado'
    };
    return statusMap[status] || status;
};

const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
        pending: '#FFA500',
        confirmed: '#4CAF50',
        preparing: '#2196F3',
        ready: '#8BC34A',
        delivering: '#FF9800',
        completed: '#4CAF50',
        cancelled: '#DA291C'
    };
    return colorMap[status] || '#666';
};

export default function OrderHistoryCard({ orders, loading, onViewOrder }: Props) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <View style={styles.card}>
                <ActivityIndicator size="large" color="#FFBC0D" />
            </View>
        );
    }

    if (orders.length === 0) {
        return (
            <View style={styles.card}>
                <Text style={styles.emptyText}>📦 No tenés pedidos todavía</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.icon}>📋</Text>
                <Text style={styles.title}>Mis pedidos</Text>
            </View>

            {orders.map((order) => (
                <TouchableOpacity
                    key={order.id}
                    style={styles.orderItem}
                    onPress={() => onViewOrder(order.id)}
                >
                    <View style={styles.orderLeft}>
                        <Text style={styles.orderNumber}>Pedido #{order.id}</Text>
                        <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                        <Text style={styles.orderType}>
                            {order.order_type === 'delivery' ? '🛵 Delivery' : '🏪 Retiro'}
                        </Text>
                    </View>

                    <View style={styles.orderRight}>
                        <Text style={styles.orderTotal}>
                            $ {Number(order.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 12,
        marginVertical: 8,
        borderRadius: 8,
        padding: 16,
        width: '90%',
        maxWidth: 420,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    icon: {
        fontSize: 24,
        marginRight: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#292929',
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    orderLeft: {
        flex: 1,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: '600',
        color: '#292929',
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },
    orderType: {
        fontSize: 13,
        color: '#666',
    },
    orderRight: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: '700',
        color: '#292929',
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        paddingVertical: 20,
    },
});