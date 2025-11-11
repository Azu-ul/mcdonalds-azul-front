// Importaciones de librerías y componentes necesarios
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { useRouter } from "expo-router"; // Para navegación entre pantallas
import {useAuth} from "../context/AuthContext"; // Contexto para autenticación
import api from "../../config/api"; // API para conexión con backend
import { Ionicons } from "@expo/vector-icons"; // Iconos vectoriales
import CustomModal from "../components/CustomModal"; // Modal personalizado

// Definición de tipos para pedidos y estado modal
type Order = {
  id: number;
  total: number;
  deliveryaddress: string;
  restaurantname: string;
  restaurantaddress: string;
  customername: string;
  customerphone: string;
  minutesago: number;
  estimateddeliverytime?: number;
  status?: string;
  driverid?: number | null;
  pickuptime?: string;
  deliveredtime?: string;
  itemscount?: number;
  createdat?: string;
};

type ActiveOrder = Order & {
  restaurantlatitude: number;
  restaurantlongitude: number;
  deliverylatitude: number;
  deliverylongitude: number;
};

type CustomModalState = {
  visible: boolean;
  type: "success" | "error" | "info" | "delete";
  title: string;
  message: string;
  confirmText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
};

// Componente principal DeliveryHome
export default function DeliveryHome() {
  const router = useRouter(); // Para navegación
  const { user, isRepartidor } = useAuth(); // Obtener usuario y rol de repartidor

  // Estado para pestañas (disponibles, activos, historial)
  const [activeTab, setActiveTab] = useState<"available" | "active" | "history">(
    "available"
  );

  // Estados para almacenar diferentes listas de pedidos
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);

  // Estado para indicar carga (loading)
  const [loading, setLoading] = useState(true);

  // Estado para pedir confirmación de modal en pedidos
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Estado para indicación de acciones en progreso
  const [actionLoading, setActionLoading] = useState(false);

  // Estado para mostrar mensajes modales personalizados
  const [customModal, setCustomModal] = useState<CustomModalState>({
    visible: false,
    type: "info",
    title: "",
    message: "",
  });

  // Función para mostrar modal personalizado
  const showCustomModal = (config: Omit<CustomModalState, "visible">) => {
    setCustomModal({
      ...config,
      visible: true,
    });
  };

  // Función para ocultar modal personalizado
  const hideCustomModal = () => {
    setCustomModal((prev) => ({ ...prev, visible: false }));
  };

  // Efecto para cargar datos y realizar polling para actualizar pedidos automáticamente
  useEffect(() => {
    if (!isRepartidor) return; // Si no es repartidor, no cargar nada
    loadData(); // Cargar datos inicialmente

    // Cada 5 segundos hacer polling para actualizar los pedidos activos o actuales
    const interval = setInterval(() => {
      console.log("Polling automático - verificando nuevos pedidos...");
      if (activeTab === "available") loadAvailableOrders();
      else if (activeTab === "active") loadActiveOrders();
      else if (activeTab === "history") loadHistoryOrders();
    }, 5000);

    return () => clearInterval(interval); // Limpiar intervalo al desmontar o cambiar
  }, [isRepartidor, activeTab]);

  // Función para cargar datos con indicador de carga
  const loadData = async () => {
    setLoading(true);
    await loadDataSilently();
    setLoading(false);
  };

  // Cargar datos según pestaña sin mostrar indicador carga
  const loadDataSilently = async () => {
    try {
      switch (activeTab) {
        case "available":
          await loadAvailableOrders();
          break;
        case "active":
          await loadActiveOrders();
          break;
        case "history":
          await loadHistoryOrders();
          break;
      }
    } catch (error) {
      console.error("Error loading data", error);
    }
  };

  // Cargar pedidos disponibles desde API
  const loadAvailableOrders = async () => {
    try {
      const res = await api.get("delivery/orders/available");
      setAvailableOrders(res.data.orders);
      console.log("Pedidos disponibles", res.data.orders);
    } catch (error) {
      console.error("Error cargando pedidos disponibles", error);
      setAvailableOrders([]);
    }
  };

  // Cargar pedidos activos (aceptados) desde API
  const loadActiveOrders = async () => {
    try {
      const res = await api.get("delivery/orders/active");
      setActiveOrders(res.data.orders);
      console.log("Pedidos activos", res.data.orders);
    } catch (error) {
      console.error("Error cargando pedidos activos", error);
      setActiveOrders([]);
    }
  };

  // Cargar historial de pedidos entregados desde API
  const loadHistoryOrders = async () => {
    try {
      const res = await api.get("delivery/orders/history");
      setHistoryOrders(res.data.orders);
      console.log("Historial de pedidos", res.data.orders);
    } catch (error) {
      console.error("Error cargando historial", error);
      setHistoryOrders([]);
    }
  };

  // Función para aceptar un pedido (cambia estado en backend)
  const handleAcceptOrder = async (orderId: number) => {
    try {
      setActionLoading(true);
      setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId)); // Remover pedido de disponibles
      setModalVisible(false); // Cerrar modal
      await api.post("delivery/orders/accept", { orderid: orderId });
      showCustomModal({
        type: "success",
        title: "Éxito",
        message: "Pedido aceptado correctamente",
        onConfirm: hideCustomModal,
      });
      await loadActiveOrders(); // Recargar pedidos activos
    } catch (error: any) {
      showCustomModal({
        type: "error",
        title: "Error",
        message: error.response?.data?.error || "No se pudo aceptar el pedido",
        onConfirm: hideCustomModal,
      });
      await loadAvailableOrders(); // Recargar disponibles para corregir interfaz
    } finally {
      setActionLoading(false);
    }
  };

  // Función para marcar el pedido como retirado en el restaurante
  const handlePickupOrder = async (orderId: number) => {
    try {
      setActionLoading(true);
      await api.post("delivery/orders/pickup", { orderid: orderId });
      showCustomModal({
        type: "success",
        title: "Éxito",
        message: "Pedido marcado como retirado",
        onConfirm: hideCustomModal,
      });
      await loadActiveOrders();
    } catch (error: any) {
      showCustomModal({
        type: "error",
        title: "Error",
        message: error.response?.data?.error || "No se pudo actualizar el pedido",
        onConfirm: hideCustomModal,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Función para marcar el pedido como entregado al cliente final
  const handleDeliverOrder = async (orderId: number) => {
    try {
      setActionLoading(true);
      await api.post("delivery/orders/deliver", { orderid: orderId });
      showCustomModal({
        type: "success",
        title: "Entregado!",
        message: "Pedido completado correctamente",
        onConfirm: hideCustomModal,
      });
      // Recargar activos e historial
      await Promise.all([loadActiveOrders(), loadHistoryOrders()]);
    } catch (error: any) {
      showCustomModal({
        type: "error",
        title: "Error",
        message: error.response?.data?.error || "No se pudo completar el pedido",
        onConfirm: hideCustomModal,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Función para rechazar un pedido disponible
  const handleRejectOrder = async (orderId: number) => {
    try {
      setActionLoading(true);
      setAvailableOrders((prev) => prev.filter((order) => order.id !== orderId)); // Eliminar pedido rechazado
      setModalVisible(false);
      setSelectedOrder(null);
      await api.post("delivery/orders/reject", { orderid: orderId });
      showCustomModal({
        type: "info",
        title: "Rechazado",
        message: "Pedido rechazado correctamente",
        onConfirm: hideCustomModal,
      });
    } catch (error: any) {
      showCustomModal({
        type: "error",
        title: "Error",
        message: "No se pudo rechazar el pedido",
        onConfirm: hideCustomModal,
      });
      await loadAvailableOrders(); // Recargar pedidos disponibles
    } finally {
      setActionLoading(false);
    }
  };

  // Abre el modal con detalles del pedido seleccionado
  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  // Decidir si mostrar botón para marcar pedido como retirado (preparando o listo)
  const shouldShowPickupButton = (order: Order) => {
    return order.status === "ready" || order.status === "preparing" && !order.status;
  };

  // Decidir si mostrar botón para marcar pedido como entregado (en camino)
  const shouldShowDeliverButton = (order: Order) => {
    return order.status === "delivering";
  };

  // Asignar color según estado del pedido
  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing":
        return "#FFA500"; // Naranja
      case "ready":
        return "#4CAF50"; // Verde
      case "delivering":
        return "#2196F3"; // Azul
      case "completed":
        return "#666"; // Gris oscuro
      default:
        return "#FFA500";
    }
  };

  // Texto descriptivo para cada estado
  const getStatusText = (status: string) => {
    switch (status) {
      case "preparing":
        return "Preparando";
      case "ready":
        return "Listo para retirar";
      case "delivering":
        return "En camino";
      case "completed":
        return "Completado";
      default:
        return status || "Preparando";
    }
  };

  // Si no es repartidor, mostrar mensaje de error y botón para regresar
  if (!isRepartidor)
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No tenés permisos de repartidor</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );

  // Renderizado principal del componente para usuarios repartidores
  return (
    <View style={styles.container}>
      {/* Header con logo y perfil */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Mc Donald's Azul</Text>
          <Text style={styles.subtitle}>Panel de Repartidor</Text>
        </View>
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={() => router.push("profile")}
        >
          {user?.profile_image_url ? (
            <Image source={{ uri: user.profile_image_url }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImageText}>
                {user?.username?.[0].toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs para cambiar entre tipos de pedidos */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "available" && styles.activeTab]}
          onPress={() => setActiveTab("available")}
        >
          <Ionicons
            name="list"
            size={20}
            color={activeTab === "available" ? "#FFBC0D" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "available" && styles.activeTabText,
            ]}
          >
            Disponibles
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "active" && styles.activeTab]}
          onPress={() => setActiveTab("active")}
        >
          <Ionicons
            name="navigate"
            size={20}
            color={activeTab === "active" ? "#FFBC0D" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "active" && styles.activeTabText,
            ]}
          >
            Activos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => setActiveTab("history")}
        >
          <Ionicons
            name="time"
            size={20}
            color={activeTab === "history" ? "#FFBC0D" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "history" && styles.activeTabText,
            ]}
          >
            Historial
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenido principal según pestaña */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFBC0D" />
            <Text style={styles.loadingText}>Cargando pedidos...</Text>
          </View>
        )}

        {/* Pedidos disponibles */}
        {activeTab === "available" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pedidos Disponibles</Text>
            {availableOrders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="fast-food-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyText}>No hay pedidos disponibles</Text>
                <Text style={styles.emptySubtext}>
                  Los nuevos pedidos aparecerán aquí. Ten en cuenta que pueden tardar en generarse.
                </Text>
              </View>
            ) : (
              availableOrders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>Pedido {order.id}</Text>
                    <View
                      style={[styles.statusBadge, { backgroundColor: "#FFA500" }]}
                    >
                      <Text style={styles.statusText}>Preparando</Text>
                    </View>
                  </View>
                  <View style={styles.orderInfo}>
                    <Ionicons name="business" size={16} color="#666" />
                    <Text style={styles.orderText}>{order.restaurantname}</Text>
                  </View>
                  <View style={styles.orderInfo}>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.orderText}>{order.deliveryaddress}</Text>
                  </View>
                  <View style={styles.orderDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Total</Text>
                      <Text style={styles.detailValue}>{order.total}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Tiempo</Text>
                      <Text style={styles.detailValue}>
                        {order.estimateddeliverytime} min
                      </Text>
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

        {/* Pedidos activos */}
        {activeTab === "active" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pedidos Activos</Text>
            {activeOrders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="navigate-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyText}>No tenés pedidos activos</Text>
                <Text style={styles.emptySubtext}>
                  Aceptá un pedido para empezar.
                </Text>
              </View>
            ) : (
              activeOrders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>Pedido {order.id}</Text>
                    <View
                      style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status || "") }]}
                    >
                      <Text style={styles.statusText}>
                        {getStatusText(order.status || "")}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.orderInfo}>
                    <Ionicons name="business" size={16} color="#666" />
                    <Text style={styles.orderText}>{order.restaurantname}</Text>
                  </View>
                  <View style={styles.orderInfo}>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.orderText}>{order.deliveryaddress}</Text>
                  </View>
                  <View style={styles.orderDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Cliente</Text>
                      <Text style={styles.detailValue}>{order.customername}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Teléfono</Text>
                      <Text style={styles.detailValue}>{order.customerphone}</Text>
                    </View>
                  </View>

                  {/* Botones para acciones según estado */}
                  <View style={styles.actionButtons}>
                    {(order.status === "ready" || order.status === "preparing" || !order.status) && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.pickupButton]}
                        onPress={() => handlePickupOrder(order.id)}
                        disabled={actionLoading}
                      >
                        <Ionicons name="cube" size={20} color="#FFF" />
                        <Text style={styles.actionButtonText}>Marcar como Retirado</Text>
                      </TouchableOpacity>
                    )}
                    {order.status === "delivering" && (
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

        {/* Historial de pedidos */}
        {activeTab === "history" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historial de Pedidos</Text>
            {historyOrders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyText}>No hay historial de pedidos</Text>
                <Text style={styles.emptySubtext}>
                  Los pedidos completados aparecerán aquí.
                </Text>
              </View>
            ) : (
              historyOrders.map((order) => (
                <View key={order.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.orderId}>Pedido {order.id}</Text>
                    <Text style={styles.historyDate}>
                      {order.deliveredtime
                        ? new Date(order.deliveredtime).toLocaleDateString("es-ES")
                        : new Date(order.createdat || "").toLocaleDateString("es-ES")}
                    </Text>
                  </View>
                  <View style={styles.orderInfo}>
                    <Ionicons name="business" size={16} color="#666" />
                    <Text style={styles.orderText}>{order.restaurantname}</Text>
                  </View>
                  <View style={styles.orderInfo}>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.orderText}>{order.deliveryaddress}</Text>
                  </View>
                  <View style={styles.historyFooter}>
                    <Text style={styles.historyTotal}>{order.total}</Text>
                    <Text style={styles.historyItems}>{order.itemscount} productos</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal para ver detalles y acciones del pedido seleccionado */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pedido {selectedOrder?.id}</Text>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Retiro</Text>
              <Text style={styles.modalText}>{selectedOrder?.restaurantname}</Text>
              <Text style={styles.modalSubtext}>{selectedOrder?.restaurantaddress}</Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Entrega</Text>
              <Text style={styles.modalText}>{selectedOrder?.deliveryaddress}</Text>
              <Text style={styles.modalSubtext}>Cliente: {selectedOrder?.customername}</Text>
            </View>

            <View style={styles.modalDetail}>
              <Text style={styles.modalDetailLabel}>Tiempo estimado</Text>
              <Text style={styles.modalDetailValue}>
                {selectedOrder?.estimateddeliverytime} min
              </Text>
            </View>

            <View style={styles.modalDetail}>
              <Text style={styles.modalDetailLabel}>Total del pedido</Text>
              <Text style={styles.modalDetailValue}>{selectedOrder?.total}</Text>
            </View>

            {/* Botones para aceptar o rechazar pedido */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => selectedOrder && handleRejectOrder(selectedOrder.id)}
                disabled={actionLoading}
              >
                <Text style={styles.cancelButtonText}>Rechazar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.acceptButton]}
                onPress={() => selectedOrder && handleAcceptOrder(selectedOrder.id)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#292929" size="small" />
                ) : (
                  <Text style={styles.acceptButtonText}>Aceptar Pedido</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal personalizado para mensajes de éxito, error, info */}
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

      {/* Botón fijo para ir a simulación de entregas (solo repartidor) */}
      {isRepartidor && (
        <TouchableOpacity
          style={styles.simulationButton}
          onPress={() => router.push("delivery/simulation-panel")}
        >
          <Ionicons name="rocket" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// Estilos para los componentes (react-native StyleSheet)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#DA291C",
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
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
    fontWeight: "bold",
    color: "#FFBC0D",
    textShadowColor: "#292929",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  subtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    marginTop: 4,
    fontWeight: "500",
  },
  profileContainer: {
    padding: 4,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#FFBC0D",
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFBC0D",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileImageText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#292929",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: "rgba(255, 188, 13, 0.1)",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#292929",
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
    fontWeight: "bold",
    color: "#292929",
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 29,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#292929",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  orderText: {
    fontSize: 14,
    color: "#292929",
    flex: 1,
  },
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#292929",
  },
  viewOrderButton: {
    backgroundColor: "#FFBC0D",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  viewOrderButtonText: {
    color: "#292929",
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtons: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    flex: 1,
  },
  pickupButton: {
    backgroundColor: "#FFA500",
  },
  deliverButton: {
    backgroundColor: "#4CAF50",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 12,
    color: "#666",
  },
  historyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  historyTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#292929",
  },
  historyItems: {
    fontSize: 12,
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#292929",
    marginBottom: 20,
    textAlign: "center",
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#292929",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: "#292929",
    marginBottom: 4,
  },
  modalSubtext: {
    fontSize: 12,
    color: "#666",
  },
  modalDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalDetailLabel: {
    fontSize: 14,
    color: "#666",
  },
  modalDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#292929",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
  },
  acceptButton: {
    backgroundColor: "#FFBC0D",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  acceptButtonText: {
    color: "#292929",
    fontSize: 14,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#FFBC0D",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#292929",
    fontSize: 16,
    fontWeight: "600",
  },
  simulationButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#DA291C",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
