import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api, { API_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Componentes
import AddressBar from '../components/home/AddressBar';
import CategoryCarousel from '../components/home/CategoryCarousel';
import ProductCarousel from '../components/home/ProductCarousel';
import FlyerCarousel from '../components/home/FlyerCarousel';

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
};

type Flyer = {
  id: number;
  title: string;
  description?: string;
  image: string;
  link?: string;
};

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuth();
  const { cart, loading: cartLoading, refetchCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [isRestaurantPickup, setIsRestaurantPickup] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<{ name: string, address: string } | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string; icon: string }[]>([]);

  // ✅ Calculamos total de items y precio desde el contexto
  const totalItems = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalPrice = cart?.total || 0;

  // ✅ Refrescar carrito cuando la pantalla vuelve a estar en foco
  useFocusEffect(
    React.useCallback(() => {
      refetchCart();
    }, [])
  );

  useEffect(() => {
    loadProducts();
    loadUserAddress();
    loadFlyers();
    loadCategories();
    checkPickupType();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserAddress();
      checkPickupType();
    }
  }, [user]);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].name);
    }
  }, [categories]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/home/products');
      setProducts(res.data.products || res.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const checkPickupType = async () => {
    try {
      const isRestaurant = await AsyncStorage.getItem('is_restaurant_pickup');
      const restaurantName = await AsyncStorage.getItem('restaurant_name');
      const restaurantAddress = await AsyncStorage.getItem('restaurant_address');

      setIsRestaurantPickup(isRestaurant === 'true');

      if (isRestaurant === 'true' && restaurantName) {
        setSelectedRestaurant({
          name: restaurantName,
          address: restaurantAddress || ''
        });
      } else {
        setSelectedRestaurant(null);
      }
    } catch (error) {
      console.error('Error checking pickup type:', error);
      setIsRestaurantPickup(false);
      setSelectedRestaurant(null);
    }
  };

  const loadUserAddress = async () => {
    try {
      const isRestaurant = await AsyncStorage.getItem('is_restaurant_pickup');
      const restaurantName = await AsyncStorage.getItem('restaurant_name');
      const restaurantAddress = await AsyncStorage.getItem('restaurant_address');

      if (isRestaurant === 'true' && restaurantName) {
        const displayAddress = `${restaurantName} - ${restaurantAddress}`;
        setAddress(displayAddress);
        setIsRestaurantPickup(true);
        setSelectedRestaurant({
          name: restaurantName,
          address: restaurantAddress || ''
        });
        return;
      }

      if (user?.address) {
        setAddress(user.address);
        setIsRestaurantPickup(false);
        setSelectedRestaurant(null);
        return;
      }

      const savedAddress = await AsyncStorage.getItem('selected_address');
      if (savedAddress && savedAddress !== 'Ingresa tu dirección de entrega') {
        setAddress(savedAddress);
        setIsRestaurantPickup(false);
        setSelectedRestaurant(null);

        if (!user?.address) {
          await updateUser({ address: savedAddress });
        }
        return;
      }

      setAddress('Seleccionar dirección');
      setIsRestaurantPickup(false);
      setSelectedRestaurant(null);
    } catch (error) {
      console.error('Error loading address:', error);
      setAddress('Seleccionar dirección');
      setIsRestaurantPickup(false);
      setSelectedRestaurant(null);
    }
  };

  const loadFlyers = async () => {
    try {
      const res = await api.get('/flyers');
      const fetchedFlyers: Flyer[] = res.data.flyers || [];
      setFlyers(fetchedFlyers);
    } catch (error) {
      console.error('Error loading flyers:', error);
      setFlyers([]);
    }
  };

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  const handleCategoryPress = (categoryName: string) => {
    setSelectedCategory(categoryName);
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

  const getDisplayAddress = (): string => {
    if (isRestaurantPickup && selectedRestaurant) {
      return `${selectedRestaurant.name} - ${selectedRestaurant.address}`;
    }
    return address || 'Seleccionar dirección';
  };

  const filteredProducts = products.filter(p => p.category === selectedCategory);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFBC0D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
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

        <AddressBar
          address={getDisplayAddress()}
          onPress={() => router.push('/restaurants')}
          isRestaurant={isRestaurantPickup}
        />

        <CategoryCarousel
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryPress={handleCategoryPress}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{selectedCategory}</Text>
          <TouchableOpacity onPress={() => router.push(`/category/${selectedCategory.toLowerCase().replace(/\s+/g, '-')}`)}>
          </TouchableOpacity>
        </View>

        <ProductCarousel
          products={filteredProducts}
          onProductPress={handleProductPress}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Novedades</Text>
        </View>

        <FlyerCarousel
          flyers={flyers}
          onFlyerPress={(flyer) => {
            console.log('Flyer pressed:', flyer);
          }}
        />

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Botón de carrito - solo mostrar si hay items */}
      {totalItems > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/product/cart')}
          >
            <Text style={styles.addButtonText}>
              {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
            </Text>
            <Text style={styles.addButtonPrice}>
              ${totalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#292929',
  },
  seeAllText: {
    fontSize: 14,
    color: '#DA291C',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100,
  },
  cartButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#292929',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  cartText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  addButton: {
    backgroundColor: '#292929',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'left',
  },
  addButtonPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    minWidth: 80,
    textAlign: 'right',
  },
});