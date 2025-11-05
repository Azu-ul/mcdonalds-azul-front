import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../config/api';

const { width } = Dimensions.get('window');

export default function Checkout() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [cart, setCart] = useState<any>(null);
  const [delivery, setDelivery] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [tip, setTip] = useState(0);

  useEffect(() => {
    loadCheckout();
  }, []);

  const loadCheckout = async () => {
    try {
      setLoading(true);
      const res = await api.get('/checkout');
      console.log('Checkout response:', res.data);
      setCart(res.data.cart);
      setDelivery(res.data.delivery);
      console.log('Delivery set to:', res.data.delivery);
    } catch (error) {
      console.error('Error loading checkout:', error);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setProcessing(true);

      await api.post('/checkout/complete', {
        payment_method: paymentMethod,
        tip
      });

      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        router.replace('/');
      }, 5000);

    } catch (error: any) {
      console.error('Error al procesar pago:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFBC0D" />
      </View>
    );
  }

  const isPickup = delivery?.type === 'pickup';
  
  // ✅ Generar URL del mapa SOLO si hay coordenadas válidas
  const mapUrl = delivery?.latitude && delivery?.longitude
    ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${delivery.latitude},${delivery.longitude}&zoom=15`
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del pago</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Dirección/Restaurante */}
        {delivery && (
          <TouchableOpacity
            style={styles.deliverySection}
            onPress={() => router.push('/restaurants')}
          >
            <Text style={styles.deliveryIcon}>{isPickup ? '🏪' : '🛵'}</Text>
            <View style={styles.deliveryTextContainer}>
              <Text style={styles.deliveryLabel}>
                {isPickup ? 'Retirar en' : 'Enviar a'}
              </Text>
              <Text style={styles.deliveryAddress}>
                {delivery.label || (isPickup ? 'Restaurante' : 'Mi dirección')}
              </Text>
              <Text style={styles.deliverySubtext}>{delivery.address}</Text>
            </View>
            <View style={styles.changeContainer}>
              <Text style={styles.changeText}>Cambiar</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Método de pago</Text>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('card')}
          >
            <Text style={styles.paymentIcon}>💳</Text>
            <Text style={styles.paymentText}>Pago con tarjeta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('cash')}
          >
            <Text style={styles.paymentIcon}>🤝</Text>
            <Text style={styles.paymentText}>Dinero en cuenta</Text>
          </TouchableOpacity>
        </View>

        {!isPickup && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Propina para tu repartidor</Text>
            <Text style={styles.tipSubtext}>
              Esta propina es voluntaria y la recibe tu repartidor como reconocimiento por su trabajo
            </Text>

            <View style={styles.tipOptions}>
              {[700, 1000, 1200].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.tipButton, tip === amount && styles.tipButtonSelected]}
                  onPress={() => setTip(amount)}
                >
                  <Text style={[styles.tipButtonText, tip === amount && styles.tipButtonTextSelected]}>
                    $ {amount.toLocaleString('es-AR')}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.tipButton, tip !== 700 && tip !== 1000 && tip !== 1200 && tip !== 0 && styles.tipButtonSelected]}
                onPress={() => setTip(0)}
              >
                <Text style={styles.tipButtonText}>Otra cantidad ✏️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Resumen de tu pedido</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              $ {(cart?.subtotal || 0).toLocaleString('es-AR')}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Envío</Text>
            <Text style={styles.summaryValueFree}>
              {isPickup ? '🏪 Retiro en local' : '🛵 Envío Gratis'}
            </Text>
          </View>

          {tip > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Propina</Text>
              <Text style={styles.summaryValue}>$ {tip.toLocaleString('es-AR')}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              $ {((cart?.total || 0) + tip).toLocaleString('es-AR')}
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#292929" />
          ) : (
            <Text style={styles.payButtonText}>Pagar</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>¡Pedido confirmado!</Text>
            <Text style={styles.successText}>
              Tu pedido está siendo preparado
            </Text>
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#27AE60" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Agregar estos estilos nuevos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  mapContainer: {
    height: 250,
    backgroundColor: '#E0E0E0',
  },
  // ✅ NUEVOS ESTILOS para cuando no hay mapa
  noMapContainer: {
    height: 200,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  noMapIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  noMapText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  deliverySection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  deliveryIcon: { fontSize: 24, marginRight: 12 },
  deliveryTextContainer: { flex: 1 },
  deliveryLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
  deliveryAddress: { fontSize: 16, fontWeight: '600', color: '#292929', marginBottom: 4 },
  deliverySubtext: { fontSize: 13, color: '#666', lineHeight: 18 },
  // ✅ NUEVOS ESTILOS para el botón de cambiar
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 14,
    color: '#FFBC0D',
    fontWeight: '600',
  },
  chevron: { fontSize: 20, color: '#FFBC0D' },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#292929', marginBottom: 12 },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  paymentOptionSelected: {
    borderColor: '#FFBC0D',
    backgroundColor: '#FFF8E1',
  },
  paymentIcon: { fontSize: 24, marginRight: 12 },
  paymentText: { fontSize: 16, fontWeight: '600', color: '#292929' },
  tipSubtext: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 18 },
  tipOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  tipButtonSelected: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFBC0D',
  },
  tipButtonText: { fontSize: 14, fontWeight: '600', color: '#292929' },
  tipButtonTextSelected: { color: '#292929' },
  summarySection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: { fontSize: 16, color: '#666' },
  summaryValue: { fontSize: 16, color: '#292929' },
  summaryValueFree: { fontSize: 14, color: '#27AE60', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 12 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: { fontSize: 20, fontWeight: '700', color: '#292929' },
  totalValue: { fontSize: 20, fontWeight: '700', color: '#292929' },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 16,
  },
  payButton: {
    backgroundColor: '#FFBC0D',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  payButtonDisabled: { opacity: 0.5 },
  payButtonText: { fontSize: 18, fontWeight: '700', color: '#292929' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: width * 0.8,
    maxWidth: 400,
  },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#292929', marginBottom: 8 },
  successText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 },
  loaderContainer: { marginTop: 8 },
});