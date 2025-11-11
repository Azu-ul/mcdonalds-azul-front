import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../../../config/api';
import CustomModal from '../../../components/CustomModal';

type User = {
  id: number;
  full_name?: string;
  email?: string;
  phone?: string;
  username?: string;
  profile_image_url?: string;
  is_verified?: boolean;
};

type Product = {
  id: number;
  name?: string;
  description?: string;
  price?: number;
  is_available?: boolean;
  category?: string;
};

type Restaurant = {
  id: number;
  name?: string;
  address?: string;
  phone?: string;
  is_open?: boolean;
  opening_time?: string;
  closing_time?: string;
  latitude?: number;
  longitude?: number;
};

type Coupon = {
  id: number;
  title?: string;
  code?: string;
  description?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  min_purchase?: number;
  max_discount?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  usage_limit?: number;
};

type Flyer = {
  id: number;
  title?: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  display_order?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
};

type FormData = User | Product | Restaurant | Coupon | Flyer;

// Función para formatear las fechas para el input
const formatDateForInput = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// Función para formatear las fechas de la base de datos
const formatInputToISO = (dateString: string) => {
  if (!dateString) return null;
  return new Date(dateString + 'T00:00:00').toISOString();
};

const EditScreen = () => {
  const router = useRouter();
  const { type, id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({} as FormData);

  const [modalState, setModalState] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info' | 'delete';
    title: string;
    message: string;
    showCancel?: boolean;
    onConfirm?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  useEffect(() => {
    fetchItem();
  }, [type, id]);

  // Función para cargar el elemento
  const fetchItem = async () => {
    try {
      let endpoint = '';
      
      switch (type) {
        case 'usuarios':
        case 'repartidores':
          endpoint = `/admin/usuarios/${id}`;
          break;
        case 'productos':
          endpoint = `/admin/productos/${id}`;
          break;
        case 'restaurantes':
          endpoint = `/admin/restaurantes/${id}`;
          break;
        case 'cupones':
          endpoint = `/admin/cupones/${id}`;
          break;
        case 'flyers':
          endpoint = `/admin/flyers/${id}`;
          break;
        default:
          throw new Error(`Tipo no soportado: ${type}`);
      }

      const res = await api.get(endpoint);
      setFormData(res.data);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setModalState({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los datos',
        onConfirm: () => {
          setModalState(prev => ({ ...prev, visible: false }));
          router.back();
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para guardar el elemento
  const handleSave = async () => {
    setSaving(true);
    try {
      let endpoint = '';
      
      switch (type) {
        case 'usuarios':
        case 'repartidores':
          endpoint = `/admin/usuarios/${id}`;
          break;
        case 'productos':
          endpoint = `/admin/productos/${id}`;
          break;
        case 'restaurantes':
          endpoint = `/admin/restaurantes/${id}`;
          break;
        case 'cupones':
          endpoint = `/admin/cupones/${id}`;
          break;
        case 'flyers':
          endpoint = `/admin/flyers/${id}`;
          break;
      }

      await api.put(endpoint, formData);
      setModalState({
        visible: true,
        type: 'success',
        title: 'Éxito',
        message: 'Cambios guardados correctamente',
        onConfirm: () => {
          setModalState(prev => ({ ...prev, visible: false }));
          router.back();
        }
      });
    } catch (err: any) {
      console.error('Error al guardar:', err);
      const errorMessage = err.response?.data?.error || 'No se pudieron guardar los cambios';
      setModalState({
        visible: true,
        type: 'error',
        title: 'Error',
        message: errorMessage,
        onConfirm: () => setModalState(prev => ({ ...prev, visible: false }))
      });
    } finally {
      setSaving(false);
    }
  };

// Función para obtener el valor de una propiedad
  const getProperty = (key: string): any => {
    return (formData as any)[key];
  };

 // Función para manejar cambios en una propiedad 
  const setProperty = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Función para manejar cambios en las fechas
  const DateInput = ({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string; 
    value: string; 
    onChange: (value: string) => void; 
  }) => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{label}</Text>
          <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: '#FFFFFF',
            }}
          />
        </View>
      );
    }

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
        />
      </View>
    );
  };

  // Funciones para renderizar los formularios
  const renderUserForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.label}>Nombre completo</Text>
      <TextInput
        style={styles.input}
        value={getProperty('full_name') as string || ''}
        onChangeText={(text) => setProperty('full_name', text)}
        placeholder="Nombre completo"
      />
      
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={getProperty('email') as string || ''}
        onChangeText={(text) => setProperty('email', text)}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <Text style={styles.label}>Teléfono</Text>
      <TextInput
        style={styles.input}
        value={getProperty('phone') as string || ''}
        onChangeText={(text) => setProperty('phone', text)}
        placeholder="Teléfono"
        keyboardType="phone-pad"
      />
    </View>
  );

  // Función para renderizar el formulario de producto
  const renderProductForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        value={getProperty('name') as string || ''}
        onChangeText={(text) => setProperty('name', text)}
        placeholder="Nombre del producto"
      />
      
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={getProperty('description') as string || ''}
        onChangeText={(text) => setProperty('description', text)}
        placeholder="Descripción"
        multiline
        numberOfLines={3}
      />
      
      <Text style={styles.label}>Precio</Text>
      <TextInput
        style={styles.input}
        value={getProperty('price') ? (getProperty('price') as number).toString() : ''}
        onChangeText={(text) => setProperty('price', parseFloat(text) || 0)}
        placeholder="Precio"
        keyboardType="numeric"
      />
      
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Disponible</Text>
        <Switch
          value={!!getProperty('is_available')}
          onValueChange={(value) => setProperty('is_available', value)}
        />
      </View>
    </View>
  );

  // Función para renderizar el formulario de restaurante
  const renderRestaurantForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.label}>Nombre del restaurante</Text>
      <TextInput
        style={styles.input}
        value={getProperty('name') as string || ''}
        onChangeText={(text) => setProperty('name', text)}
        placeholder="Nombre del restaurante"
      />
      
      <Text style={styles.label}>Dirección</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={getProperty('address') as string || ''}
        onChangeText={(text) => setProperty('address', text)}
        placeholder="Dirección completa"
        multiline
        numberOfLines={2}
      />
      
      <Text style={styles.label}>Teléfono</Text>
      <TextInput
        style={styles.input}
        value={getProperty('phone') as string || ''}
        onChangeText={(text) => setProperty('phone', text)}
        placeholder="Teléfono"
        keyboardType="phone-pad"
      />
      
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Latitud</Text>
          <TextInput
            style={styles.input}
            value={getProperty('latitude') ? (getProperty('latitude') as number).toString() : ''}
            onChangeText={(text) => setProperty('latitude', parseFloat(text) || 0)}
            placeholder="Latitud"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.halfInput}>
          <Text style={styles.label}>Longitud</Text>
          <TextInput
            style={styles.input}
            value={getProperty('longitude') ? (getProperty('longitude') as number).toString() : ''}
            onChangeText={(text) => setProperty('longitude', parseFloat(text) || 0)}
            placeholder="Longitud"
            keyboardType="numeric"
          />
        </View>
      </View>
      
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Hora de apertura</Text>
          <TextInput
            style={styles.input}
            value={getProperty('opening_time') as string || ''}
            onChangeText={(text) => setProperty('opening_time', text)}
            placeholder="08:00"
          />
        </View>
        
        <View style={styles.halfInput}>
          <Text style={styles.label}>Hora de cierre</Text>
          <TextInput
            style={styles.input}
            value={getProperty('closing_time') as string || ''}
            onChangeText={(text) => setProperty('closing_time', text)}
            placeholder="23:00"
          />
        </View>
      </View>
      
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Abierto</Text>
        <Switch
          value={!!getProperty('is_open')}
          onValueChange={(value) => setProperty('is_open', value)}
        />
      </View>
    </View>
  );

  // Función para renderizar el formulario de cupones
  const renderCouponForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.label}>Título del cupón</Text>
      <TextInput
        style={styles.input}
        value={getProperty('title') as string || ''}
        onChangeText={(text) => setProperty('title', text)}
        placeholder="Título del cupón"
      />
      
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={getProperty('description') as string || ''}
        onChangeText={(text) => setProperty('description', text)}
        placeholder="Descripción del cupón"
        multiline
        numberOfLines={3}
      />
      
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Tipo de descuento</Text>
          <View style={styles.radioContainer}>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => setProperty('discount_type', 'percentage')}
            >
              <View style={[styles.radioCircle, getProperty('discount_type') === 'percentage' && styles.radioSelected]}>
                {getProperty('discount_type') === 'percentage' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Porcentaje</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => setProperty('discount_type', 'fixed')}
            >
              <View style={[styles.radioCircle, getProperty('discount_type') === 'fixed' && styles.radioSelected]}>
                {getProperty('discount_type') === 'fixed' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Monto fijo</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.halfInput}>
          <Text style={styles.label}>Valor de descuento</Text>
          <TextInput
            style={styles.input}
            value={getProperty('discount_value') ? (getProperty('discount_value') as number).toString() : ''}
            onChangeText={(text) => setProperty('discount_value', parseFloat(text) || 0)}
            placeholder={getProperty('discount_type') === 'percentage' ? '15' : '1000'}
            keyboardType="numeric"
          />
        </View>
      </View>
      
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Compra mínima</Text>
          <TextInput
            style={styles.input}
            value={getProperty('min_purchase') ? (getProperty('min_purchase') as number).toString() : ''}
            onChangeText={(text) => setProperty('min_purchase', parseFloat(text) || 0)}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.halfInput}>
          <Text style={styles.label}>Límite de uso</Text>
          <TextInput
            style={styles.input}
            value={getProperty('usage_limit') ? (getProperty('usage_limit') as number).toString() : ''}
            onChangeText={(text) => setProperty('usage_limit', parseInt(text) || 0)}
            placeholder="100"
            keyboardType="numeric"
          />
        </View>
      </View>
      
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <DateInput
            label="Fecha de inicio"
            value={formatDateForInput(getProperty('start_date') as string)}
            onChange={(value) => setProperty('start_date', formatInputToISO(value))}
          />
        </View>
        
        <View style={styles.halfInput}>
          <DateInput
            label="Fecha de fin"
            value={formatDateForInput(getProperty('end_date') as string)}
            onChange={(value) => setProperty('end_date', formatInputToISO(value))}
          />
        </View>
      </View>
      
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Activo</Text>
        <Switch
          value={!!getProperty('is_active')}
          onValueChange={(value) => setProperty('is_active', value)}
        />
      </View>
    </View>
  );

  // Función para renderizar el formulario de flyers
  const renderFlyerForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.label}>Título del flyer</Text>
      <TextInput
        style={styles.input}
        value={getProperty('title') as string || ''}
        onChangeText={(text) => setProperty('title', text)}
        placeholder="Título del flyer"
      />
      
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={getProperty('description') as string || ''}
        onChangeText={(text) => setProperty('description', text)}
        placeholder="Descripción del flyer"
        multiline
        numberOfLines={3}
      />
      
      <Text style={styles.label}>URL de la imagen</Text>
      <TextInput
        style={styles.input}
        value={getProperty('image_url') as string || ''}
        onChangeText={(text) => setProperty('image_url', text)}
        placeholder="https://ejemplo.com/imagen.jpg"
        keyboardType="url"
        autoCapitalize="none"
      />
      
      <Text style={styles.label}>URL del enlace</Text>
      <TextInput
        style={styles.input}
        value={getProperty('link_url') as string || ''}
        onChangeText={(text) => setProperty('link_url', text)}
        placeholder="https://ejemplo.com"
        keyboardType="url"
        autoCapitalize="none"
      />
      
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Orden de visualización</Text>
          <TextInput
            style={styles.input}
            value={getProperty('display_order') ? (getProperty('display_order') as number).toString() : ''}
            onChangeText={(text) => setProperty('display_order', parseInt(text) || 0)}
            placeholder="1"
            keyboardType="numeric"
          />
        </View>
      </View>
      
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <DateInput
            label="Fecha de inicio"
            value={formatDateForInput(getProperty('start_date') as string)}
            onChange={(value) => setProperty('start_date', formatInputToISO(value))}
          />
        </View>
        
        <View style={styles.halfInput}>
          <DateInput
            label="Fecha de fin"
            value={formatDateForInput(getProperty('end_date') as string)}
            onChange={(value) => setProperty('end_date', formatInputToISO(value))}
          />
        </View>
      </View>
      
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Activo</Text>
        <Switch
          value={!!getProperty('is_active')}
          onValueChange={(value) => setProperty('is_active', value)}
        />
      </View>
    </View>
  );

  // Función para renderizar el formulario general
  const renderForm = () => {
    switch (type) {
      case 'usuarios':
      case 'repartidores':
        return renderUserForm();
      case 'productos':
        return renderProductForm();
      case 'restaurantes':
        return renderRestaurantForm();
      case 'cupones':
        return renderCouponForm();
      case 'flyers':
        return renderFlyerForm();
      default:
        return (
          <View style={styles.centered}>
            <Text style={styles.noFormText}>Formulario no disponible para {type}</Text>
          </View>
        );
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Editar {type}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
          <Text style={styles.saveButtonText}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {renderForm()}
      </ScrollView>

      <CustomModal
        visible={modalState.visible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        showCancel={modalState.showCancel}
        onConfirm={modalState.onConfirm}
        onCancel={() => setModalState(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
    margin: 10,
  },
  radioContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    backgroundColor: '#FF6B6B',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  radioLabel: {
    fontSize: 14,
    color: '#333',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  noFormText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default EditScreen;