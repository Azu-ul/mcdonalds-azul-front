import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Image, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api, { API_URL } from '../../config/api';
import CustomModal from "../components/CustomModal";
import ImagePickerModal from "../components/ImagePickerModal";
import { useAuth } from '../context/AuthContext';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileImageSection from '../components/profile/ProfileImageSection';
import PersonalInfoCard from '../components/profile/PersonalInfoCard';
import AddressCard from '../components/profile/AddressCard';
import DocumentCard from '../components/profile/DocumentCard';
import OrderHistoryCard from '../components/profile/OrderHistoryCard';

type User = {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  profile_image_url?: string;
  document_image_url?: string | null;
  auth_provider: string;
};

type ProfileFormData = {
  full_name?: string;
  phone?: string;
  email?: string;
};

// Validaciones con yup
const profileSchema = yup.object({
  email: yup.string()
    .transform((value) => value?.trim() || '')
    .test('valid-email', 'Email inválido', function (value) {
      if (!value || value.length === 0) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }),
  full_name: yup.string()
    .transform((value) => value?.trim() || '')
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ'\s]*$/, 'Solo letras'),
  phone: yup.string()
    .transform((value) => value?.trim() || '')
    .test('min-if-filled', 'Mínimo 8 caracteres', function (value) {
      if (!value || value.length === 0) return true;
      return value.length >= 8;
    })
    .max(20, 'Máximo 20 caracteres')
    .matches(/^[\+\d\s\-()]*$/, 'Solo números, espacios, paréntesis y guiones'),
}).required();

// Componente principal
export default function Profile() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { updateUser, logout, isRepartidor, isAdmin } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    location: false,
    document: false,
    deletingDocument: false,
    profileImage: false,
    updatingProfile: false,
    updatingLocation: false,
  });
  const [saveStates, setSaveStates] = useState({
    profile: false,
    location: false,
  });
  const [editingUsername, setEditingUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [address, setAddress] = useState('');
  const [modals, setModals] = useState({
    logout: false,
    deleteAccount: false,
    deleteDocument: false,
    imagePicker: false,
    error: false,
    success: false,
    info: false,
  });
  const [deleteCountdown, setDeleteCountdown] = useState(10);
  const [modalContent, setModalContent] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'delete',
    onConfirm: undefined as (() => void) | undefined,
  });

  // Formulario de perfil de usuario 
  const { control, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    mode: 'onBlur',
    defaultValues: { email: '', full_name: '', phone: '' }
  });

  // Manejo de estados
  const updateLoadingState = (key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  const updateSaveState = (key: keyof typeof saveStates, value: boolean) => {
    setSaveStates(prev => ({ ...prev, [key]: value }));
    if (value) setTimeout(() => setSaveStates(prev => ({ ...prev, [key]: false })), 5000);
  };

  const updateModal = (key: keyof typeof modals, value: boolean) => {
    setModals(prev => ({ ...prev, [key]: value }));
  };

  const showModal = (
    type: 'success' | 'error' | 'info',
    title: string,
    message: string,
    onConfirm?: () => void
  ) => {
    setModalContent({ type, title, message, onConfirm });
    updateModal(type, true);
  };

  // Manejo de token
  const getToken = async () => {
    if (params.token) {
      const urlToken = Array.isArray(params.token) ? params.token[0] : params.token;
      await AsyncStorage.setItem('token', urlToken);
      return urlToken;
    }
    const token = await AsyncStorage.getItem('token');
    if (!token) router.replace('/');
    return token;
  };

  // Manejo de permisos
  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

  // Manejo de cuenta
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (modals.deleteAccount && deleteCountdown > 0) {
      interval = setInterval(() => setDeleteCountdown(prev => prev - 1), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [modals.deleteAccount, deleteCountdown]);

  // Carga de pedidos 
  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const token = await AsyncStorage.getItem('token');
      const res = await api.get('/profile/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setOrders(res.data.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
      loadOrders();
    }, [])
  );

  // Manejo de pedido
  const handleViewOrder = (orderId: number) => {
    showModal('info', 'Pedido', `Ver detalles del pedido #${orderId}`);
  };

  // Carga de perfil
  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return router.replace('/');

      const res = await api.get('/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userData = res.data.user;

      setUser(userData);
      setUsername(userData.username || '');
      setAddress(userData.address || '');
      setValue('email', userData.email || '');
      setValue('full_name', userData.full_name || '');
      setValue('phone', userData.phone || '');

      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error loading profile:', error);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  // Actualización de nombre de usuario
  const handleUpdateUsername = async () => {
    if (!username.trim() || username.length < 3) {
      showModal('error', 'Error', 'El nombre debe tener al menos 3 caracteres');
      return;
    }

    try {
      updateLoadingState('updatingProfile', true);
      const res = await api.put('/profile/username', { username: username.trim() });
      const updatedUser = { ...user, username: res.data.user.username };
      setUser(updatedUser as User);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      await updateUser({ username: res.data.user.username });
      setEditingUsername(false);
      showModal('success', 'Éxito', 'Nombre actualizado');
    } catch (error: any) {
      showModal('error', 'Error', error?.response?.data?.error || 'Error al actualizar');
      setUsername(user?.username || '');
    } finally {
      updateLoadingState('updatingProfile', false);
    }
  };

  // Actualización de perfil
  const handleUpdateProfile = async (data: ProfileFormData) => {
    try {
      updateLoadingState('updatingProfile', true);
      const payload: any = {};
      if (user?.auth_provider === 'local' && data.email?.trim()) payload.email = data.email.trim();
      if (data.full_name?.trim()) payload.full_name = data.full_name.trim();
      if (data.phone?.trim()) payload.phone = data.phone.trim();

      if (Object.keys(payload).length === 0) {
        showModal('error', 'Error', 'No hay datos para actualizar');
        return;
      }

      const res = await api.put('/profile', payload);
      const updatedUser = res.data.user;
      setUser(updatedUser);
      setValue('email', updatedUser.email || '');
      setValue('full_name', updatedUser.full_name || '');
      setValue('phone', updatedUser.phone || '');
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      await updateUser(payload);
      showModal('success', 'Éxito', 'Perfil actualizado');
      updateSaveState('profile', true);
    } catch (error: any) {
      showModal('error', 'Error', error?.response?.data?.error || 'Error al actualizar');
    } finally {
      updateLoadingState('updatingProfile', false);
    }
  };

  type PlatformFile = File | { uri: string; name: string; type: string };

  // Subida de archivos
  const uploadFile = async (
    file: PlatformFile,
    fieldName: 'image' | 'document',
    endpoint: string
  ): Promise<string> => {
    const formData = new FormData();

    if ('uri' in file) {
      const uri = Platform.OS === 'ios' && !file.uri.startsWith('file://')
        ? `file://${file.uri}`
        : file.uri;
      formData.append(fieldName, {
        uri,
        name: file.name,
        type: file.type,
      } as any);
    } else {
      console.log('📤 Subiendo archivo web:', file.name, file.type, file.size);
      formData.append(fieldName, file, file.name);
    }

    const token = await AsyncStorage.getItem('token');

    console.log('🔑 Token:', token ? 'presente' : 'ausente');
    console.log('📍 Endpoint:', `${API_URL}${endpoint}`);
    console.log('📦 Field name:', fieldName);

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error response:', errorData);
      throw new Error(errorData.error || `Error al subir ${fieldName}`);
    }

    const data = await response.json();
    console.log('✅ Success response:', data);
    return fieldName === 'image'
      ? data.profile_image_url
      : data.document_image_url;
  };

  // Subida de imagen de perfil
  const uploadProfileImageFile = async (file: PlatformFile) => {
    try {
      updateLoadingState('profileImage', true);
      const imageUrl = await uploadFile(file, 'image', '/profile/image');

      const updatedUser = { ...user, profile_image_url: imageUrl };
      setUser(updatedUser as User);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      await updateUser({ profile_image_url: imageUrl });
      showModal('success', 'Éxito', 'Foto actualizada');
    } catch (err: any) {
      console.error('Upload error:', err);
      showModal('error', 'Error', err.message || 'No se pudo subir la imagen');
    } finally {
      updateLoadingState('profileImage', false);
    }
  };

  // Subida de documento
  const uploadDocumentFile = async (file: PlatformFile) => {
    try {
      updateLoadingState('document', true);
      const docUrl = await uploadFile(file, 'document', '/profile/document');

      const updatedUser = { ...user, document_image_url: docUrl };
      setUser(updatedUser as User);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      showModal('success', 'Éxito', 'Documento subido');
    } catch (err: any) {
      console.error('Document upload error:', err);
      showModal('error', 'Error', err.message || 'No se pudo subir el documento');
    } finally {
      updateLoadingState('document', false);
    }
  };

  // Selección de documento
  const pickDocument = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      console.log('📄 Document picker result:', result);

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.uri;

        if (Platform.OS === 'web' && uri.startsWith('data:')) {
          console.log('🔄 Convirtiendo base64 a File...');

          const response = await fetch(uri);
          const blob = await response.blob();

          const filename = `document-${Date.now()}.jpg`;
          const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

          console.log('✅ File creado:', file.name, file.type, file.size);

          await uploadDocumentFile(file);
        } else {
          const filename = uri.split('/').pop() || 'doc.jpg';
          const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
          const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

          console.log('📋 Document info:', { uri, filename, type });

          await uploadDocumentFile({ uri, name: filename, type });
        }
      }
    } catch (error) {
      console.error('❌ Error picking document:', error);
      showModal('error', 'Error', 'No se pudo seleccionar el documento');
    }
  };

  // Selección de imagen
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      console.log('🖼️ Image picker result:', result);

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.uri;

        // Conversión de base64 a File
        if (Platform.OS === 'web' && uri.startsWith('data:')) {
          console.log('🔄 Convirtiendo base64 a File...');

          const response = await fetch(uri);
          const blob = await response.blob();

          const filename = `profile-${Date.now()}.jpg`;
          const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

          console.log('✅ File creado:', file.name, file.type, file.size);

          await uploadProfileImageFile(file);
        } else {
          const filename = uri.split('/').pop() || 'photo.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          console.log('📸 Image info:', { uri, filename, type });

          await uploadProfileImageFile({ uri, name: filename, type });
        }
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      showModal('error', 'Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Tomar foto
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        await uploadProfileImageFile({ uri, name: filename, type });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  // Obtener ubicación
  const handleGetLocation = async () => {
    try {
      updateLoadingState('location', true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showModal('error', 'Permiso denegado', 'Se necesita acceso a la ubicación');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;

      const addressStr = await getAddressFromCoords(latitude, longitude);
      await api.put('/profile/location', { latitude, longitude, address: addressStr });

      const updatedUser = { ...user, latitude, longitude, address: addressStr };
      setUser(updatedUser as User);
      setAddress(addressStr);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      showModal('success', 'Éxito', `Ubicación actualizada\n${addressStr}`);
    } catch (error) {
      showModal('error', 'Error', 'No se pudo obtener la ubicación');
    } finally {
      updateLoadingState('location', false);
    }
  };

  // Obtener dirección a partir de coordenadas
  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'AuthApp/1.0', 'Accept-Language': 'es' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.address) {
          const addr = data.address;
          const parts = [
            addr.road, addr.house_number, addr.neighbourhood, addr.suburb,
            addr.city || addr.town || addr.village, addr.state,
            addr.postcode ? `CP ${addr.postcode}` : null, addr.country
          ].filter(Boolean);
          return parts.length > 0 ? parts.join(', ') : data.display_name;
        }
      }
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    } catch (error) {
      return `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
    }
  };

  // Actualizar ubicación
  const handleUpdateLocation = async () => {
    if (!address.trim()) {
      showModal('error', 'Error', 'Ingresa una dirección');
      return;
    }

    try {
      updateLoadingState('updatingLocation', true);
      await api.put('/profile/location', {
        latitude: user?.latitude || 0,
        longitude: user?.longitude || 0,
        address: address.trim()
      });

      const updatedUser = { ...user, address: address.trim() };
      setUser(updatedUser as User);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      showModal('success', 'Éxito', 'Ubicación actualizada');
      updateSaveState('location', true);
    } catch (error: any) {
      showModal('error', 'Error', error?.response?.data?.error || 'Error al actualizar');
    } finally {
      updateLoadingState('updatingLocation', false);
    }
  };

  // Cerrar sesión
  const handleLogout = async () => {
    updateModal('logout', false);
    await logout();
    router.replace('/');
  };

  // Eliminar cuenta
  const handleDeleteAccount = async () => {
    try {
      await api.delete('/profile');
      updateModal('deleteAccount', false);
      await logout();
      showModal('success', 'Cuenta eliminada', 'Tu cuenta ha sido eliminada permanentemente', () => {
        router.replace('/');
      });
    } catch (error: any) {
      showModal('error', 'Error', error?.response?.data?.error || 'No se pudo eliminar');
    }
  };

  // Obtener URL de la imagen
  const getProfileImageUrl = () => {
    if (!user?.profile_image_url) return null;
    let url = user.profile_image_url;
    if (url.includes('googleusercontent.com')) {
      return url.replace(/=s\d+-c/, '=s400-c');
    }
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_URL.replace('/api', '')}${url}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFBC0D" />
      </View>
    );
  }

  // Eliminar documento
  const handleDeleteDocument = async () => {
    try {
      updateLoadingState('deletingDocument', true);
      updateModal('deleteDocument', false);

      const token = await AsyncStorage.getItem('token');
      await api.delete('/profile/document', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const updatedUser = { ...user, document_image_url: null };
      setUser(updatedUser as User);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      showModal('success', 'Éxito', 'Documento eliminado correctamente');
    } catch (error: any) {
      console.error('Error deleting document:', error);
      showModal('error', 'Error', error?.response?.data?.error || 'No se pudo eliminar el documento');
    } finally {
      updateLoadingState('deletingDocument', false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <ProfileHeader onBack={() => router.push('/')} />

      <ProfileImageSection
        imageUrl={getProfileImageUrl()}
        username={user?.username}
        email={user?.email}
        editingUsername={editingUsername}
        usernameValue={username}
        onUsernameChange={setUsername}
        onEdit={() => setEditingUsername(true)}
        onSave={handleUpdateUsername}
        onCancel={() => {
          setUsername(user?.username || '');
          setEditingUsername(false);
        }}
        onImagePress={() => updateModal('imagePicker', true)}
        loading={loadingStates.updatingProfile}
      />

      {isAdmin && (
        <Link href="/admin" asChild>
          <TouchableOpacity style={styles.adminButton}>
            <Text style={styles.adminButtonText}>Panel de Administración</Text>
          </TouchableOpacity>
        </Link>
      )}

      {isRepartidor && (
        <TouchableOpacity
          style={styles.deliveryButton}
          onPress={() => router.push('/delivery/delivery-home')}
        >
          <Ionicons name="bicycle" size={20} color="#FFFFFF" />
          <Text style={styles.deliveryButtonText}>Panel de Repartidor</Text>
        </TouchableOpacity>
      )}

      <PersonalInfoCard
        control={control}
        errors={errors}
        authProvider={user?.auth_provider || 'local'}
        onSave={handleSubmit(handleUpdateProfile)}
        loading={loadingStates.updatingProfile}
        saved={saveStates.profile}
      />

      <AddressCard
        address={address}
        onAddressChange={setAddress}
        onSave={handleUpdateLocation}
        onGetLocation={handleGetLocation}
        loadingLocation={loadingStates.location}
        loadingUpdate={loadingStates.updatingLocation}
        saved={saveStates.location}
      />

      <DocumentCard
        documentUrl={user?.document_image_url}
        onUpload={pickDocument}
        onDelete={() => updateModal('deleteDocument', true)}
        loading={loadingStates.document}
        deleting={loadingStates.deletingDocument}
      />

      <OrderHistoryCard
        orders={orders}
        loading={loadingOrders}
        onViewOrder={handleViewOrder}
      />

      <TouchableOpacity style={styles.logoutButton} onPress={() => updateModal('logout', true)}>
        <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={() => {
        setDeleteCountdown(10);
        updateModal('deleteAccount', true);
      }}>
        <Text style={styles.deleteButtonText}>🗑️ Eliminar cuenta</Text>
      </TouchableOpacity>

      <CustomModal
        visible={modals.logout}
        type="delete"
        title="Cerrar sesión"
        message="¿Seguro que querés salir?"
        confirmText="Sí, salir"
        cancelText="Cancelar"
        showCancel={true}
        onConfirm={handleLogout}
        onCancel={() => updateModal('logout', false)}
      />

      <CustomModal
        visible={modals.deleteAccount}
        type="delete"
        title="⚠️ Eliminar cuenta"
        message={`Esta acción es IRREVERSIBLE.\n\n${deleteCountdown > 0 ? `Espera ${deleteCountdown} segundos...` : 'Ahora puedes confirmar.'}`}
        confirmText={deleteCountdown > 0 ? `Espera (${deleteCountdown}s)` : "Sí, eliminar"}
        cancelText="Cancelar"
        showCancel={true}
        onConfirm={deleteCountdown === 0 ? handleDeleteAccount : undefined}
        onCancel={() => {
          updateModal('deleteAccount', false);
          setDeleteCountdown(10);
        }}
      />

      <CustomModal
        visible={modals.deleteDocument}
        type="delete"
        title="Eliminar documento"
        message="¿Estás seguro de que querés eliminar tu documento? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        showCancel={true}
        onConfirm={handleDeleteDocument}
        onCancel={() => updateModal('deleteDocument', false)}
      />

      <CustomModal
        visible={modals.error}
        type="error"
        title={modalContent.title}
        message={modalContent.message}
        confirmText="Aceptar"
        onConfirm={modalContent.onConfirm}
        onCancel={() => updateModal('error', false)}
      />

      <CustomModal
        visible={modals.success}
        type="success"
        title={modalContent.title}
        message={modalContent.message}
        confirmText="Aceptar"
        onConfirm={modalContent.onConfirm}
        onCancel={() => updateModal('success', false)}
      />

      <CustomModal
        visible={modals.info}
        type="info"
        title={modalContent.title}
        message={modalContent.message}
        confirmText="Aceptar"
        onConfirm={modalContent.onConfirm}
        onCancel={() => updateModal('info', false)}
      />

      <ImagePickerModal
        visible={modals.imagePicker}
        onClose={() => updateModal('imagePicker', false)}
        onTakePhoto={takePhoto}
        onChooseGallery={pickImage}
        onCaptureWebcam={uploadProfileImageFile}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8'
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
    alignItems: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8'
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 0,
    margin: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    width: '90%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    color: '#292929',
    fontSize: 16,
    fontWeight: '500'
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 0,
    margin: 16,
    marginTop: 0,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    width: '90%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButtonText: {
    color: '#DA291C',
    fontSize: 16,
    fontWeight: '500'
  },
  adminButton: {
    backgroundColor: '#DA291C',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#DA291C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#FFBC0D',
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deliveryButton: {
    backgroundColor: '#FFBC0D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
    marginHorizontal: 20,
    gap: 10,
    shadowColor: '#FFBC0D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#292929',
  },
  deliveryButtonText: {
    color: '#292929',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});