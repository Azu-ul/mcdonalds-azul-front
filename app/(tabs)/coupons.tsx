import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useCoupon } from '../context/CouponContext';
import { API_URL } from '../../config/api';
import api from '../../config/api';

type Coupon = {
  id: number;
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_discount?: number;
  image_url?: string;
  start_date?: string;
  end_date?: string;
  product_id?: number;
};

export default function Cupones() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const { setSelectedCoupon } = useCoupon();

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      console.log('🔍 Cargando cupones...');
      const response = await fetch(`${API_URL}/coupons/active`);
      const data = await response.json();
      console.log('🏷️ Cupones recibidos:', data);

      if (data.success && data.coupons) {
        setCoupons(data.coupons);
      }
    } catch (error) {
      console.error('❌ Error cargando cupones:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% OFF`;
    }
    return `$${coupon.discount_value} OFF`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin vencimiento';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getProfileImageUrl = () => {
    if (!user?.profile_image_url) return null;
    let url = user.profile_image_url;
    if (url.includes('googleusercontent.com')) {
      return url.replace(/=s\d+-c/, '=s400-c');
    }
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_URL.replace('/api', '')}${url}`;
  };

  const handleCouponPress = async (coupon: Coupon) => {
    try {
      // Si el cupón es para un producto específico
      if (coupon.product_id) {
        // Guardar el cupón en el contexto
        setSelectedCoupon(coupon);

        // Navegar al producto
        router.push(`/product/${coupon.product_id}`);
      } else {
        // Si es cupón general, aplicar al carrito
        const response = await api.post('/cart/apply-coupon', {
          coupon_id: coupon.id
        });

        if (response.data.success) {
          Alert.alert('¡Cupón aplicado!', response.data.message, [
            { text: 'Ver carrito', onPress: () => router.push('/cart') }
          ]);
        }
      }
    } catch (error: any) {
      console.error('Error aplicando cupón:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'No se pudo aplicar el cupón'
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header con logo y usuario/botones */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Mc Donald's Azul</Text>
        </View>

        {!isAuthenticated ? (
          <View style={styles.authButtonsContainer}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/signin')}
            >
              <Text style={styles.loginButtonText}>Ingresar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.registerButtonText}>Registrarse</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.profileContainer}
            onPress={() => router.push('/profile')}
          >
            {user?.profile_image_url ? (
              <Image
                source={{ uri: getProfileImageUrl()! }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageText}>
                  {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Contenido Principal */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Mis Cupones</Text>
          <Text style={styles.subtitle}>
            Aprovechá estas ofertas exclusivas
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Cargando cupones...</Text>
            </View>
          ) : coupons.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay cupones disponibles</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
            >
              {coupons.map((coupon) => (
                <View key={coupon.id} style={styles.couponCard}>
                  <TouchableOpacity
                    style={styles.cardContent}
                    onPress={() => handleCouponPress(coupon)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.imageContainer}>
                      {coupon.image_url ? (
                        <Image
                          source={{ uri: coupon.image_url }}
                          style={styles.couponImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.couponIcon}>
                          <Text style={styles.couponIconText}>🏷️</Text>
                        </View>
                      )}
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>{formatDiscount(coupon)}</Text>
                      </View>
                    </View>

                    <View style={styles.couponInfo}>
                      <Text style={styles.couponTitle} numberOfLines={2}>
                        {coupon.title}
                      </Text>
                      {coupon.description && (
                        <Text style={styles.couponDescription} numberOfLines={2}>
                          {coupon.description}
                        </Text>
                      )}
                      <View style={styles.validityContainer}>
                        <Text style={styles.couponValidity}>
                          Válido hasta: {formatDate(coupon.end_date)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.useButton}
                    onPress={() => handleCouponPress(coupon)}
                  >
                    <Text style={styles.useButtonText}>Usar cupón</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          {/* Espaciado inferior para tabs */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
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
   authButtonsContainer: {
    flexDirection: 'column',
  },
  loginButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 8,
  },
  loginButtonText: {
    color: '#DA291C',
    fontWeight: 'bold',
    fontSize: 14,
  },
  registerButton: {
    backgroundColor: '#FFBC0D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFBC0D',
  },
  registerButtonText: {
    color: '#292929',
    fontWeight: 'bold',
    fontSize: 14,
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
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  carouselContent: {
    paddingHorizontal: 0,
    paddingVertical: 8,
    gap: 16,
  },
  couponCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    flexDirection: 'column',
    flex: 1,
  },
  cardContent: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    padding: 16,
  },
  couponIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  couponIconText: {
    fontSize: 40,
  },
  discountBadge: {
    backgroundColor: '#DA291C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    position: 'absolute',
    top: 12,
    right: 12,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  couponInfo: {
    padding: 12,
    flex: 1,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 6,
    lineHeight: 20,
  },
  couponDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  validityContainer: {
    marginTop: 'auto',
  },
  couponValidity: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  useButton: {
    backgroundColor: '#FFBC0D',
    padding: 12,
    alignItems: 'center',
    margin: 12,
    borderRadius: 8,
    marginTop: 'auto',
  },
  useButtonText: {
    color: '#292929',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 100,
  },
  couponImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});