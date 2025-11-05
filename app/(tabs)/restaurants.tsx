import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_URL } from '../../config/api';
import { useAuth } from '../context/AuthContext';

type Restaurant = {
  id: number;
  name: string;
  address: string;
  distance: number;
  isOpen: boolean;
};

type SavedAddress = {
  id: string;
  label: string;
  address: string;
  latitude: number;  // Ya no es opcional
  longitude: number; // Ya no es opcional
  distance: number;
};

type Tab = 'pickup' | 'delivery';

export default function Restaurants() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('delivery');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deliverySearchQuery, setDeliverySearchQuery] = useState('');

  // Pedí y Retirá
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);

  // McDelivery
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [filteredAddresses, setFilteredAddresses] = useState<SavedAddress[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Modales
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [editAddressText, setEditAddressText] = useState('');
  const [editAddressLabel, setEditAddressLabel] = useState('');

  // Modal para menú de opciones
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // Estados nuevos para el modal de confirmación
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadRestaurants();
    loadSavedAddresses();
  }, [isAuthenticated]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRestaurants(restaurants);
    } else {
      const filtered = restaurants.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRestaurants(filtered);
    }
  }, [searchQuery, restaurants]);

  useEffect(() => {
    if (deliverySearchQuery.trim() === '') {
      setFilteredAddresses(savedAddresses);
    } else {
      const filtered = savedAddresses.filter(addr =>
        addr.label.toLowerCase().includes(deliverySearchQuery.toLowerCase()) ||
        addr.address.toLowerCase().includes(deliverySearchQuery.toLowerCase())
      );
      setFilteredAddresses(filtered);
    }
  }, [deliverySearchQuery, savedAddresses]);

  // Agrega este useEffect para debug
  useEffect(() => {
    console.log('Estado actual de direcciones:', {
      isAuthenticated,
      savedAddressesCount: savedAddresses.length,
      savedAddresses
    });
  }, [savedAddresses, isAuthenticated]);

  // Función para calcular distancia entre dos coordenadas (fórmula de Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Actualizar loadRestaurants para calcular distancias
  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/restaurants');

      if (response.data.success && response.data.restaurants) {
        // Obtener ubicación del usuario si está disponible
        let userLat: number | null = null;
        let userLng: number | null = null;

        if (user?.latitude && user?.longitude) {
          userLat = user.latitude;
          userLng = user.longitude;
        } else if (currentLocation) {
          userLat = currentLocation.lat;
          userLng = currentLocation.lng;
        }

        const restaurantsData: Restaurant[] = response.data.restaurants.map((r: any) => {
          let distance = 0;

          // Calcular distancia si tenemos coordenadas del usuario y del restaurante
          if (userLat && userLng && r.latitude && r.longitude) {
            distance = calculateDistance(userLat, userLng, r.latitude, r.longitude);
          }

          return {
            id: r.id,
            name: r.name,
            address: r.address,
            distance: distance,
            isOpen: r.is_open === 1,
          };
        });

        // Ordenar por distancia (más cercanos primero)
        restaurantsData.sort((a, b) => a.distance - b.distance);

        setRestaurants(restaurantsData);
        setFilteredRestaurants(restaurantsData);
      } else {
        setRestaurants([]);
        setFilteredRestaurants([]);
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
      Alert.alert('Error', 'No se pudieron cargar los restaurantes');
      setRestaurants([]);
      setFilteredRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedAddresses = async () => {
    try {
      console.log('=== CARGANDO DIRECCIONES DESDE BD ===');

      if (isAuthenticated) {
        console.log('Cargando desde API/BD...');
        const response = await api.get('/user/addresses');
        console.log('Respuesta API COMPLETA:', JSON.stringify(response.data, null, 2));

        if (response.data.success && response.data.addresses) {
          // Obtener ubicación del usuario si está disponible
          let userLat: number | null = null;
          let userLng: number | null = null;

          if (user?.latitude && user?.longitude) {
            userLat = user.latitude;
            userLng = user.longitude;
          } else if (currentLocation) {
            userLat = currentLocation.lat;
            userLng = currentLocation.lng;
          }

          const addresses = response.data.addresses
            .filter((addr: any) => addr.latitude != null && addr.longitude != null)
            .map((addr: any) => {
              let distance = 0;

              // Calcular distancia si tenemos coordenadas del usuario
              if (userLat && userLng && addr.latitude && addr.longitude) {
                distance = calculateDistance(userLat, userLng, addr.latitude, addr.longitude);
              }

              return {
                id: addr.id.toString(),
                label: addr.label || 'Mi dirección',
                address: addr.address,
                latitude: addr.latitude,
                longitude: addr.longitude,
                distance: distance,
              };
            });

          console.log('Direcciones procesadas con distancias:', addresses);
          setSavedAddresses(addresses);
          setFilteredAddresses(addresses);
        } else {
          console.log('No hay direcciones en BD');
          setSavedAddresses([]);
          setFilteredAddresses([]);
        }
      } else {
        console.log('Usuario no autenticado, sin direcciones');
        setSavedAddresses([]);
        setFilteredAddresses([]);
      }
    } catch (error) {
      console.error('Error loading saved addresses from DB:', error);
      // En caso de error, intentar cargar desde AsyncStorage como fallback
      try {
        const stored = await AsyncStorage.getItem('saved_addresses');
        if (stored) {
          const storedAddresses = JSON.parse(stored);
          console.log('Fallback a AsyncStorage por error:', storedAddresses);
          setSavedAddresses(storedAddresses);
          setFilteredAddresses(storedAddresses);
        } else {
          setSavedAddresses([]);
          setFilteredAddresses([]);
        }
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError);
        setSavedAddresses([]);
        setFilteredAddresses([]);
      }
    }
  };

  const saveAddressesToStorage = async (addresses: SavedAddress[]) => {
    try {
      // SOLO actualizar estado local - la base de datos es la fuente de verdad
      setSavedAddresses(addresses);
      setFilteredAddresses(addresses);
      console.log('Estado local actualizado con:', addresses.length, 'direcciones');

      // Opcional: mantener AsyncStorage como cache, pero no es crítico
      await AsyncStorage.setItem('saved_addresses', JSON.stringify(addresses));

    } catch (error) {
      console.error('Error updating local state:', error);
    }
  };

  const handleSelectRestaurant = async (restaurant: Restaurant) => {
    if (!restaurant.isOpen) {
      Alert.alert('Cerrado', 'Este restaurante está cerrado');
      return;
    }

    try {
      // Si el usuario está autenticado, actualizar el carrito con el restaurant_id
      if (isAuthenticated) {
        // Verificar si existe un carrito
        const cartResponse = await api.get('/cart');

        if (cartResponse.data.success) {
          const cartId = cartResponse.data.cart.id;

          // Actualizar el restaurant_id del carrito
          await api.put(`/cart/${cartId}/restaurant`, {
            restaurant_id: restaurant.id
          });
        }
      }

      // Actualizar la dirección del usuario con el restaurante
      await updateUser({
        address: restaurant.name,
        selectedRestaurant: {
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
          latitude: null,
          longitude: null
        },
        locationType: 'pickup'
      });

      // Guardar en AsyncStorage
      await AsyncStorage.setItem('selected_address', restaurant.name);
      await AsyncStorage.setItem('selected_restaurant', 'true');
      await AsyncStorage.setItem('restaurant_id', restaurant.id.toString());
      await AsyncStorage.setItem('restaurant_name', restaurant.name);
      await AsyncStorage.setItem('restaurant_address', restaurant.address);
      await AsyncStorage.setItem('is_restaurant_pickup', 'true');

      console.log('Restaurante seleccionado:', restaurant.name);

      router.replace('/');
    } catch (error) {
      console.error('Error selecting restaurant:', error);
      Alert.alert('Error', 'No se pudo seleccionar el restaurante');
    }
  };

  // Reemplaza la función handleUseCurrentLocation en restaurants.tsx

  const handleUseCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos tu ubicación');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setCurrentLocation({ lat: latitude, lng: longitude });

      // Obtener dirección legible
      const address = await getAddressFromBackend(latitude, longitude);

      // ✅ GUARDAR EN LA BASE DE DATOS
      if (isAuthenticated) {
        try {
          const response = await api.post('/user/addresses', {
            label: 'Mi ubicación actual',
            address: address,
            latitude: latitude,
            longitude: longitude,
            is_default: false
          });

          console.log('Dirección guardada en BD:', response.data);

          // Recargar direcciones desde la BD para sincronizar
          await loadSavedAddresses();

          Alert.alert(
            'Ubicación guardada',
            'Tu ubicación actual fue guardada. Puedes editar el nombre tocando los tres puntos.',
            [{ text: 'OK' }]
          );
        } catch (error) {
          console.error('Error guardando en BD:', error);
          Alert.alert('Error', 'No se pudo guardar la ubicación en el servidor');
        }
      } else {
        // Usuario no autenticado - guardar localmente
        const newAddress: SavedAddress = {
          id: Date.now().toString(),
          label: 'Mi ubicación actual',
          address,
          latitude,
          longitude,
          distance: 0,
        };
        const updatedAddresses = [newAddress, ...savedAddresses];
        await saveAddressesToStorage(updatedAddresses);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
    } finally {
      setLoadingLocation(false);
    }
  };

  const saveAddressToBackend = async (address: SavedAddress) => {
    try {
      const response = await api.post('/user/addresses', {
        address: address.address,
        latitude: address.latitude,
        longitude: address.longitude,
        is_default: false // o true si es la primera
      });
      return response.data;
    } catch (error) {
      console.error('Error saving address to backend:', error);
      throw error;
    }
  };

  const getAddressFromBackend = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `${API_URL.replace('/api', '')}/api/geocode?latitude=${lat}&longitude=${lng}`
      );

      if (!response.ok) {
        throw new Error('Error al obtener dirección');
      }

      const data = await response.json();

      if (data.address) {
        const addr = data.address;
        const parts = [
          addr.road,
          addr.house_number,
          addr.neighbourhood,
          addr.suburb,
          addr.city || addr.town || addr.village,
        ].filter(Boolean);

        return parts.length > 0 ? parts.join(', ') : data.display_name;
      }

      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Error getting address:', error);
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }
  };

  const handleSelectAddress = async (address: SavedAddress) => {
    try {
      if (isAuthenticated) {
        // Actualizar dirección del usuario en el backend
        await api.put('/profile/location', {
          latitude: address.latitude,
          longitude: address.longitude,
          address: address.address
        });
      }

      // Actualizar contexto local - limpiar restaurante seleccionado
      await updateUser({
        address: address.address,
        latitude: address.latitude,
        longitude: address.longitude,
        selectedRestaurant: null,
        locationType: 'delivery'
      });

      await AsyncStorage.setItem('selected_address', address.address);
      await AsyncStorage.setItem('selected_address_label', address.label);
      await AsyncStorage.setItem('selected_latitude', address.latitude.toString());
      await AsyncStorage.setItem('selected_longitude', address.longitude.toString());
      await AsyncStorage.setItem('is_restaurant_pickup', 'false');

      console.log('Dirección guardada:', address.address);

      // Volver al home
      router.replace('/');
    } catch (error) {
      console.error('Error selecting address:', error);
      Alert.alert('Error', 'No se pudo seleccionar la dirección');
    }
  };

  const handleEditAddress = (address: SavedAddress) => {
    setEditingAddress(address);
    setEditAddressText(address.address);
    setEditAddressLabel(address.label);
    setEditModalVisible(true);
  };

  const handleSaveEditedAddress = async () => {
    if (!editingAddress || !editAddressText.trim() || !editAddressLabel.trim()) {
      Alert.alert('Error', 'Ingresa una etiqueta y dirección válidas');
      return;
    }

    try {
      // Si el usuario está autenticado, actualizar SOLO en el backend
      if (isAuthenticated) {
        console.log('Actualizando dirección en BD:', {
          id: editingAddress.id,
          label: editAddressLabel.trim(),
          address: editAddressText.trim()
        });

        await api.put(`/user/addresses/${editingAddress.id}`, {
          label: editAddressLabel.trim(),
          address: editAddressText.trim(),
          latitude: editingAddress.latitude,
          longitude: editingAddress.longitude
        });

        console.log('Dirección actualizada en BD exitosamente');

        // Recargar las direcciones desde la BD para asegurar consistencia
        await loadSavedAddresses();

        setEditModalVisible(false);
        setEditingAddress(null);
        Alert.alert('Guardado', 'Dirección actualizada correctamente');

      } else {
        // Usuario no autenticado - guardar localmente
        const updatedAddress = {
          ...editingAddress,
          address: editAddressText.trim(),
          label: editAddressLabel.trim()
        };

        const updatedAddresses = savedAddresses.map(addr =>
          addr.id === editingAddress.id ? updatedAddress : addr
        );

        await saveAddressesToStorage(updatedAddresses);
        setEditModalVisible(false);
        setEditingAddress(null);
        Alert.alert('Guardado', 'Dirección actualizada (modo local)');
      }

    } catch (error) {
      console.error('Error saving edited address:', error);
      Alert.alert('Error', 'No se pudo actualizar la dirección');
    }
  };

  const handleDeleteAddress = (addressId: string) => {
    setAddressToDelete(addressId);
    setDeleteModalVisible(true);
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

  const handleMenuPress = (address: SavedAddress, event: any) => {
    // Para web, podemos usar las coordenadas del evento para posicionar el modal
    if (event?.nativeEvent?.pageX && event?.nativeEvent?.pageY) {
      setMenuPosition({
        x: event.nativeEvent.pageX - 100, // Ajustar posición
        y: event.nativeEvent.pageY + 10,
      });
    }
    setSelectedAddress(address);
    setMenuModalVisible(true);
  };

  const handleEditFromMenu = () => {
    if (selectedAddress) {
      setMenuModalVisible(false);
      handleEditAddress(selectedAddress);
    }
  };

  const handleDeleteFromMenu = () => {
    if (selectedAddress) {
      setMenuModalVisible(false);
      handleDeleteAddress(selectedAddress.id); // Esta ahora abre el modal de confirmación
    }
  };

  // ✅ TAMBIÉN ACTUALIZA handleConfirmDelete para que elimine de la BD
  const handleConfirmDelete = async () => {
    if (!addressToDelete) return;

    try {
      if (isAuthenticated) {
        // Eliminar de la base de datos
        await api.delete(`/user/addresses/${addressToDelete}`);
        console.log('Dirección eliminada de BD');

        // Recargar desde la BD
        await loadSavedAddresses();
      } else {
        // Usuario no autenticado - eliminar localmente
        const updatedAddresses = savedAddresses.filter(addr => addr.id !== addressToDelete);
        await saveAddressesToStorage(updatedAddresses);
      }

      setDeleteModalVisible(false);
      setAddressToDelete(null);
      console.log('Dirección eliminada correctamente');

    } catch (error) {
      console.error('Error al eliminar dirección:', error);
      Alert.alert('Error', 'No se pudo eliminar la dirección');
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setAddressToDelete(null);
  };
  return (
    <View style={styles.container}>
      {/* Header - Igual al del Home */}
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

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pickup' && styles.tabActive]}
          onPress={() => setActiveTab('pickup')}
        >
          <Text style={[styles.tabText, activeTab === 'pickup' && styles.tabTextActive]}>
            Pedí y Retirá
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'delivery' && styles.tabActive]}
          onPress={() => setActiveTab('delivery')}
        >
          <Text style={[styles.tabText, activeTab === 'delivery' && styles.tabTextActive]}>
            McDelivery
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'pickup' ? (
          // PEDÍ Y RETIRÁ
          <View style={styles.content}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar un restaurante"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#FFBC0D" style={{ marginTop: 40 }} />
            ) : (
              <View style={styles.restaurantsList}>
                {filteredRestaurants.map((restaurant) => (
                  <TouchableOpacity
                    key={restaurant.id}
                    style={styles.restaurantCard}
                    onPress={() => handleSelectRestaurant(restaurant)}
                  >
                    <View style={styles.restaurantInfo}>
                      <Text style={styles.restaurantName}>{restaurant.name}</Text>
                      <Text style={styles.restaurantAddress}>{restaurant.address}</Text>
                      <Text style={styles.restaurantDistance}>
                        {restaurant.distance < 1
                          ? `A ${(restaurant.distance * 1000).toFixed(0)} m de distancia`
                          : `A ${restaurant.distance.toFixed(2)} km de distancia`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {searchQuery.trim() !== '' && filteredRestaurants.length === 0 && (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>
                      No se encontraron restaurantes que coincidan con "{searchQuery}"
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : (
          // En la sección MCDELIVERY, reemplaza esta parte:
          <View style={styles.content}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Ingresa una dirección"
                placeholderTextColor="#999"
                value={deliverySearchQuery}
                onChangeText={setDeliverySearchQuery}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.currentLocationButton,
                !isAuthenticated && styles.currentLocationButtonDisabled // Agregar estilo deshabilitado
              ]}
              onPress={isAuthenticated ? handleUseCurrentLocation : undefined} // Solo funciona si está autenticado
              disabled={loadingLocation || !isAuthenticated} // Deshabilitar si loading o no autenticado
            >
              {loadingLocation ? (
                <ActivityIndicator color="#292929" />
              ) : (
                <>
                  <Text style={[
                    styles.currentLocationText,
                    !isAuthenticated && styles.currentLocationTextDisabled // Texto en gris si no autenticado
                  ]}>
                    Usar mi ubicación actual
                    {!isAuthenticated && " (Inicia sesión para usar este botón)"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* MOSTRAR SOLO EL CARTEL SI NO ESTÁ AUTENTICADO */}
            {!isAuthenticated ? (
              <TouchableOpacity
                style={styles.authPromptCard}
                onPress={() => router.push('/signin')}
              >
                <View style={styles.authPromptContent}>
                  <Text style={styles.authPromptTitle}>Inicia Sesión</Text>
                  <Text style={styles.authPromptText}>
                    Para guardar direcciones y agilizar tus pedidos
                  </Text>
                  <Text style={styles.authPromptButton}>Iniciar Sesión →</Text>
                </View>
              </TouchableOpacity>
            ) : (
              /* MOSTRAR DIRECCIONES GUARDADAS SOLO SI ESTÁ AUTENTICADO */
              filteredAddresses.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>- Direcciones guardadas -</Text>
                  <Text style={styles.sectionTitle}>Recuerde tocar para seleccionarla</Text>
                  <View style={styles.addressesList}>
                    {filteredAddresses.map((address) => (
                      <View key={address.id} style={styles.addressCard}>
                        <TouchableOpacity
                          style={styles.addressContent}
                          onPress={() => handleSelectAddress(address)}
                        >
                          <View style={styles.addressInfo}>
                            <Text style={styles.addressLabel}>{address.label}</Text>
                            <Text style={styles.addressText}>{address.address}</Text>
                            <Text style={styles.addressDistance}>
                              {address.distance < 1
                                ? `A ${(address.distance * 1000).toFixed(0)} m de distancia`
                                : `A ${address.distance.toFixed(3)} km de distancia`}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.menuButton}
                          onPress={(event) => handleMenuPress(address, event)}
                        >
                          <Text style={styles.menuIcon}>⋮</Text>
                        </TouchableOpacity>
                      </View>
                    ))}

                    {deliverySearchQuery.trim() !== '' && filteredAddresses.length === 0 && (
                      <View style={styles.noResultsContainer}>
                        <Text style={styles.noResultsText}>
                          No se encontraron direcciones que coincidan con "{deliverySearchQuery}"
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )
            )}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal de Edición de Dirección */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Editar dirección</Text>

            <Text style={styles.inputLabel}>Etiqueta</Text>
            <TextInput
              style={styles.modalInput}
              value={editAddressLabel}
              onChangeText={setEditAddressLabel}
              placeholder="casa, trabajo, etc."
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Dirección</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              value={editAddressText}
              onChangeText={setEditAddressText}
              placeholder="Calle, número, ciudad..."
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveEditedAddress}
              >
                <Text style={styles.modalSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Menú de Opciones (para web) */}
      <Modal
        visible={menuModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuModalOverlay}
          activeOpacity={1}
          onPress={() => setMenuModalVisible(false)}
        >
          <View
            style={[
              styles.menuModalContainer,
              {
                position: 'absolute',
                top: menuPosition.y,
                left: menuPosition.x * 0.92,
              }
            ]}
          >
            <Text style={styles.menuModalTitle}>
              {selectedAddress?.label}
            </Text>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={handleEditFromMenu}
            >
              <Text style={styles.menuOptionText}>✏️ Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={handleDeleteFromMenu}
            >
              <Text style={[styles.menuOptionText, styles.menuOptionDelete]}>
                🗑️ Eliminar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCancel}
              onPress={() => setMenuModalVisible(false)}
            >
              <Text style={styles.menuCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>Eliminar dirección</Text>

            <Text style={styles.deleteModalText}>
              ¿Estás seguro de que quieres eliminar esta dirección? Esta acción no se puede deshacer.
            </Text>

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteCancelButton}
                onPress={handleCancelDelete}
              >
                <Text style={styles.deleteCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteConfirmButton}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.deleteConfirmText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  // Header styles igual al Home
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
    backgroundColor: '#ffffffff',
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  tabActive: {
    borderBottomColor: '#FFBC0D',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#292929',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#b40000ff',
    // @ts-ignore
    outlineColor: "#ffffffff",
  },
  restaurantsList: {
    gap: 12,
  },
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  restaurantInfo: {
    gap: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#292929',
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
  },
  restaurantDistance: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  currentLocationButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  currentLocationText: {
    fontSize: 15,
    color: '#292929',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 16,
  },
  addressesList: {
    gap: 12,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#FFBC0D',
  },
  addressContent: {
    flex: 1,
    padding: 16,
  },
  addressInfo: {
    gap: 6,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#292929',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
  },
  addressDistance: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  menuButton: {
    padding: 16,
    cursor: 'pointer', // Para web
  },
  menuIcon: {
    fontSize: 24,
    color: '#666',
  },
  bottomSpacing: {
    height: 40,
  },
  // Modal de edición
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#292929',
    marginBottom: 16,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#FFBC0D',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#292929',
    fontSize: 15,
    fontWeight: 'bold',
  },
  // Modal de menú (nuevo para web)
  menuModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  menuModalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#292929',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 4,
  },
  menuOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginVertical: 2,
  },
  menuOptionText: {
    fontSize: 14,
    color: '#292929',
  },
  menuOptionDelete: {
    color: '#DA291C',
  },
  menuCancel: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 4,
    backgroundColor: '#F5F5F5',
  },
  menuCancelText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  deleteModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  deleteModalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  deleteCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#DA291C',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authPromptCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFBC0D',
    marginBottom: 20,
  },
  authPromptContent: {
    alignItems: 'flex-start',
  },
  authPromptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 8,
  },
  authPromptText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  authPromptButton: {
    fontSize: 15,
    color: '#DA291C',
    fontWeight: 'bold',
  },
  currentLocationButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    opacity: 0.7,
  },
  currentLocationTextDisabled: {
    color: '#999',
  },
  noResultsContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});