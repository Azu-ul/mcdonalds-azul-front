import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router'; // Hook para navegación
import { useAuth } from '../context/AuthContext'; // Contexto para estado de usuario
import { useCoupon } from '../context/CouponContext'; // Contexto para manejo de cupones
import CustomModal from '../components/CustomModal'; // Modal personalizado para mostrar mensajes
import api from '../../config/api'; // Comunicación con API backend

// Tipo que representa un ítem del carrito
type CartItem = {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  unit_price: number;
  total_price: number;
  quantity: number;
  size?: string;
  side?: string;
  drink?: string;
  customizations?: any;
};

// Estado para modal personalizado
type CustomModalState = {
  visible: boolean;
  type: 'success' | 'error' | 'info' | 'delete';
  title: string;
  message: string;
  confirmText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
};

export default function Cart() {
  const router = useRouter(); // Controla la navegación
  const [coupons, setCoupons] = useState<any[]>([]); // Lista de cupones activos
  const { user, isAuthenticated } = useAuth(); // Estado de usuario y autenticación
  const [cartItems, setCartItems] = useState<CartItem[]>([]); // Ítems en el carrito
  const [loading, setLoading] = useState(true); // Indicador de carga
  const { selectedCoupon, calculateDiscount, setSelectedCoupon } = useCoupon(); // Contexto para cupón seleccionado y cálculo de descuento
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null); // Cupón aplicado en el carrito
  const [discount, setDiscount] = useState(0); // Monto de descuento

  // Estado y funciones para mostrar modal personalizado
  const [customModal, setCustomModal] = useState<CustomModalState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showCustomModal = (config: Omit<CustomModalState, 'visible'>) => {
    setCustomModal({ ...config, visible: true });
  };

  const hideCustomModal = () => {
    setCustomModal(prev => ({ ...prev, visible: false }));
  };

  // Efecto para cargar datos del carrito y recomendaciones cuando usuario está autenticado
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      // Si no está autenticado, mostrar error y redirigir a inicio
      showCustomModal({
        type: 'error',
        title: 'Error',
        message: 'Debes iniciar sesión',
        onConfirm: () => {
          hideCustomModal();
          router.replace('/');
        },
      });
      return;
    }

    // Si está autenticado, cargar carrito, recomendaciones y datos de entrega
    if (isAuthenticated) {
      loadCart();
      loadRecommendations();
      loadDeliveryInfo();
    }
  }, [isAuthenticated, user]);

  // Función para cargar los ítems del carrito desde API
  const loadCart = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cart');
      setCartItems(res.data.cart?.items || []);

      // Si hay cupón aplicado en el carrito, actualizar estado y descuento
      if (res.data.cart?.coupon_id) {
        setAppliedCoupon({
          id: res.data.cart.coupon_id,
          title: res.data.cart.coupon_title,
          discount_type: res.data.cart.discount_type,
          discount_value: res.data.cart.discount_value
        });
        setDiscount(res.data.cart.discount_amount || 0);
      }
    } catch (error) {
      // Mostrar mensaje de error si falla la carga
      console.error('Error loading cart:', error);
      showCustomModal({
        type: 'error',
        title: 'Error',
        message: 'No se pudo cargar el carrito',
        onConfirm: hideCustomModal,
      });
    } finally {
      setLoading(false);
    }
  };

  // Estado local para información de entrega o retiro
  const [deliveryInfo, setDeliveryInfo] = useState<{
    type: string;
    label: string;
    address: string;
  } | null>(null);

  // Cargar info de entrega basada en usuario logueado
  const loadDeliveryInfo = async () => {
    try {
      if (user?.selectedRestaurant) {
        // Si usuario tiene restaurante seleccionado, es para retiro
        setDeliveryInfo({
          type: 'pickup',
          label: user.selectedRestaurant.name,
          address: user.selectedRestaurant.address
        });
      } else if (user?.address) {
        // Si no, info de entrega a domicilio
        setDeliveryInfo({
          type: 'delivery',
          label: 'Mi dirección',
          address: user.address
        });
      }
    } catch (error) {
      console.error('Error loading delivery info:', error);
    }
  };

  // Cargar cupones activos desde API
  const loadRecommendations = async () => {
    try {
      console.log('🔍 Cargando cupones...');
      const couponsRes = await api.get('/coupons/active');
      console.log('🏷️ Coupons response:', couponsRes.data);

      setCoupons(couponsRes.data.coupons || []);
      console.log('✅ Cupones seteados:', couponsRes.data.coupons || []);
    } catch (error) {
      console.error('❌ Error loading coupons:', error);
    }
  };

  // Actualiza la cantidad de un producto en el carrito, con límites
  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity > 5) {
      showCustomModal({
        type: 'info',
        title: 'Límite alcanzado',
        message: 'Máximo 5 unidades por producto',
        onConfirm: hideCustomModal,
      });
      return;
    }

    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    try {
      // Actualiza la cantidad en el backend
      await api.put(`/cart/items/${itemId}`, { quantity: newQuantity });

      // Actualiza el estado local con nuevo total
      setCartItems(prev =>
        prev.map(item => {
          if (item.id === itemId) {
            const newTotalPrice = item.unit_price * newQuantity;
            return { ...item, quantity: newQuantity, total_price: newTotalPrice };
          }
          return item;
        })
      );
    } catch (error) {
      // Mostrar error en caso de fallo
      showCustomModal({
        type: 'error',
        title: 'Error',
        message: 'No se pudo actualizar la cantidad',
        onConfirm: hideCustomModal,
      });
    }
  };

  // Maneja la edición de ítems redirigiendo con parámetros para precargar
  const handleEditItem = (item: CartItem) => {
    const params: any = {
      edit: 'true',
      cartItemId: item.id,
      quantity: item.quantity,
    };

    if (item.size) params.size = item.size;
    if (item.side) params.side = item.side;
    if (item.drink) params.drink = item.drink;
    if (item.customizations) {
      params.customizations = JSON.stringify(item.customizations);
    }

    const queryString = new URLSearchParams(params).toString();
    router.push(`/product/${item.product_id}?${queryString}`);
  };

  // Eliminar un ítem del carrito
  const removeItem = async (itemId: number) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      showCustomModal({
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el producto',
        onConfirm: hideCustomModal,
      });
    }
  };

  // Calcula subtotal sumando total de cada ítem
  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  // Calcula total restando descuento al subtotal
  const calculateTotal = () => {
    return calculateSubtotal() - discount;
  };

  // Navegar a pantalla principal para continuar comprando
  const handleContinueShopping = () => {
    router.push('/');
  };

  // Proceder a checkout, pero solo si hay ítems en carrito
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      showCustomModal({
        type: 'info',
        title: 'Carrito vacío',
        message: 'Agrega productos para continuar',
        onConfirm: hideCustomModal,
      });
      return;
    }
    router.push('/checkout');
  };

  // Aplicar un cupón seleccionado haciendo llamada a API
  const applyCoupon = async (couponId: number) => {
    try {
      const res = await api.post('/cart/apply-coupon', { coupon_id: couponId });
      if (res.data.success) {
        await loadCart(); // Recargar carrito para actualizar descuentos
        showCustomModal({
          type: 'success',
          title: '¡Cupón aplicado!',
          message: res.data.message,
          onConfirm: hideCustomModal,
        });
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'No se pudo aplicar el cupón';
      showCustomModal({
        type: 'error',
        title: 'Error',
        message,
        onConfirm: hideCustomModal,
      });
      console.error('Error aplicando cupón:', error);
    }
  };

  // Remover cupón aplicado del carrito
  const removeCoupon = async () => {
    try {
      await api.delete('/cart/coupon');
      setAppliedCoupon(null);
      setDiscount(0);
      showCustomModal({
        type: 'info',
        title: 'Cupón removido',
        message: 'El cupón ha sido removido del carrito',
        onConfirm: hideCustomModal,
      });
    } catch (error) {
      showCustomModal({
        type: 'error',
        title: 'Error',
        message: 'No se pudo remover el cupón',
        onConfirm: hideCustomModal,
      });
    }
  };

  // Mostrar indicador de carga mientras se obtiene información
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFBC0D" />
      </View>
    );
  }

  // Mostrar mensaje si carrito vacío
  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={styles.emptyText}>Agrega productos para comenzar tu pedido</Text>
        <TouchableOpacity style={styles.shopButton} onPress={handleContinueShopping}>
          <Text style={styles.shopButtonText}>Ver menú</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Renderizado principal del carrito
  return (
    <View style={styles.container}>
      {/* Header con botón para volver y título */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi pedido</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Scroll con los ítems del carrito */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Sección para seleccionar dirección o retiro */}
        <TouchableOpacity
          style={styles.locationSection}
          onPress={() => router.push('/(tabs)/restaurants')}
        >
          <Text style={styles.locationIcon}>📍</Text>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>
              {deliveryInfo?.type === 'pickup' ? 'Retirar en' : 'Entregar en'}
            </Text>
            <Text style={styles.locationText}>
              {deliveryInfo?.address || 'Seleccionar dirección'} →
            </Text>
          </View>
        </TouchableOpacity>

        {/* Listado de productos en carrito */}
        {cartItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <Image
              source={{ uri: item.product_image || 'https://via.placeholder.com/80' }}
              style={styles.itemImage}
            />
            <View style={styles.itemDetails}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemPrice}>
                  $ {item.total_price.toLocaleString('es-AR')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleEditItem(item)}>
                <Text style={styles.editLink}>Editar →</Text>
              </TouchableOpacity>
              {(item.size || item.side || item.drink) && (
                <Text style={styles.customizations}>
                  {[item.size, item.side, item.drink].filter(Boolean).join('\n')}
                </Text>
              )}
            </View>

            {/* Controles de cantidad (+/-) y eliminación */}
            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
                style={styles.quantityButton}
              >
                <Text style={item.quantity > 1 ? styles.quantityText : styles.quantityIcon}>
                  {item.quantity > 1 ? '-' : '🗑️'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.quantity}>{item.quantity}</Text>

              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                style={[
                  styles.quantityButton,
                  item.quantity >= 5 && styles.quantityButtonDisabled
                ]}
                disabled={item.quantity >= 5}
              >
                <Text style={[
                  styles.quantityText,
                  item.quantity >= 5 && styles.quantityTextDisabled
                ]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Listado horizontal de cupones activos */}
        {coupons.length > 0 && (
          <View style={styles.couponsListSection}>
            <Text style={styles.couponsListTitle}>Cupones disponibles</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.couponsScroll}>
              {coupons.map((coupon: any) => (
                <TouchableOpacity
                  key={coupon.id}
                  style={styles.couponCard}
                  onPress={() => {
                    if (coupon.product_id) {
                      setSelectedCoupon(coupon);
                      router.push(`/product/${coupon.product_id}?fromCart=true`);
                    } else {
                      applyCoupon(coupon.id);
                    }
                  }}
                >
                  <Text style={styles.couponCardIcon}>🏷️</Text>
                  <Text style={styles.couponCardTitle}>{coupon.title}</Text>
                  <Text style={styles.couponCardDescription}>{coupon.description}</Text>
                  <Text style={styles.couponCardDiscount}>
                    {coupon.discount_type === 'percentage'
                      ? `${coupon.discount_value}% OFF`
                      : `$${coupon.discount_value} OFF`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Banner para cupón aplicado */}
        {appliedCoupon && (
          <TouchableOpacity style={styles.appliedCouponBanner} onPress={removeCoupon}>
            <Text style={styles.promoIcon}>🏷️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.promoText}>Cupón aplicado: {appliedCoupon.title}</Text>
            </View>
            <Text style={styles.removeCouponText}>✕</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Footer con totales y botones para seguir comprando o seguir a checkout */}
      <View style={styles.footer}>
        <View style={styles.totalSection}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalAmount}>
            $ {calculateSubtotal().toLocaleString('es-AR')}
          </Text>
        </View>

        {appliedCoupon && discount > 0 && (
          <>
            <View style={styles.discountSection}>
              <Text style={styles.discountLabel}>Descuento ({appliedCoupon.title})</Text>
              <Text style={styles.discountAmount}>
                - $ {discount.toLocaleString('es-AR')}
              </Text>
            </View>
            <View style={styles.divider} />
          </>
        )}

        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>
            $ {calculateTotal().toLocaleString('es-AR')}
          </Text>
        </View>

        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={styles.continueShoppingButton}
            onPress={handleContinueShopping}
          >
            <Text style={styles.continueShoppingText}>Seguir pidiendo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
            <Text style={styles.checkoutText}>Siguiente</Text>
          </TouchableOpacity>
        </View>
      </View>

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

// Definición de estilos para la UI usando StyleSheet
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: '#292929', marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#666', marginBottom: 24 },
  shopButton: { backgroundColor: '#FFBC0D', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10 },
  shopButtonText: { color: '#292929', fontSize: 16, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, color: '#292929' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#292929' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  promoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  promoIcon: { fontSize: 20, marginRight: 12 },
  promoText: { fontSize: 16, color: '#292929', fontWeight: '500' },
  promoArrow: { fontSize: 18, color: '#666' },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  locationIcon: { fontSize: 20, marginRight: 12 },
  locationTextContainer: { flex: 1 },
  locationLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  locationText: { fontSize: 16, color: '#464646ff', fontWeight: '500' },
  promoSubtext: { fontSize: 13, color: '#666', marginTop: 2 },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  itemImage: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  itemDetails: { flex: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#292929', flex: 1 },
  itemPrice: { fontSize: 16, fontWeight: '700', color: '#292929' },
  editLink: { fontSize: 14, color: '#007AFF', marginBottom: 4 },
  customizations: { fontSize: 13, color: '#666', marginTop: 4 },
  quantityControls: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quantityIcon: { fontSize: 16 },
  quantityText: { fontSize: 20, fontWeight: '600', color: '#292929' },
  quantity: { fontSize: 16, fontWeight: '600', color: '#292929', marginVertical: 8 },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 16,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: { fontSize: 20, fontWeight: '700', color: '#292929' },
  totalAmount: { fontSize: 20, fontWeight: '700', color: '#292929' },
  footerButtons: { flexDirection: 'row', gap: 12 },
  continueShoppingButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  continueShoppingText: { fontSize: 16, fontWeight: '600', color: '#292929' },
  checkoutButton: {
    flex: 1,
    backgroundColor: '#FFBC0D',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutText: { fontSize: 16, fontWeight: '600', color: '#292929' },
  quantityButtonDisabled: {
    opacity: 0.3,
  },
  quantityTextDisabled: {
    color: '#999',
  },
  subtotalLabel: { fontSize: 16, color: '#666' },
  subtotalAmount: { fontSize: 16, color: '#666' },
  couponSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  couponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponLabel: { fontSize: 14, color: '#27AE60', fontWeight: '600' },
  removeCoupon: { fontSize: 16, color: '#666', padding: 4 },
  discountAmount: { fontSize: 16, color: '#27AE60', fontWeight: '600' },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  discountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  discountLabel: { fontSize: 14, color: '#27AE60', fontWeight: '600' },
  removeCouponText: { fontSize: 18, color: '#666', fontWeight: '600' },
  couponsListSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
  },
  couponsListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#292929',
    marginBottom: 12,
  },
  couponsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  couponCard: {
    width: 180,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFBC0D',
  },
  couponCardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  couponCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#292929',
    marginBottom: 4,
  },
  couponCardDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  couponCardDiscount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#27AE60',
  },
  appliedCouponBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#27AE60',
  },
});
