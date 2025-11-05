// /app/admin/create/[type].tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../../config/api';

type FormData = {
  [key: string]: any;
};

const CreateScreen = () => {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({});
  const [showDatePicker, setShowDatePicker] = useState({ start: false, end: false });
  const [dateField, setDateField] = useState<'start_date' | 'end_date'>('start_date');

  const handleSave = async () => {
    setSaving(true);
    try {
      let endpoint = '';
      
      switch (type) {
        case 'usuarios':
        case 'repartidores':
          endpoint = `/admin/usuarios`;
          // Para repartidores, agregar el rol
          if (type === 'repartidores') {
            formData.role = 'repartidor';
          }
          break;
        case 'productos':
          endpoint = `/admin/productos`;
          break;
        case 'restaurantes':
          endpoint = `/admin/restaurantes`;
          break;
        case 'cupones':
          endpoint = `/admin/cupones`;
          break;
        case 'flyers':
          endpoint = `/admin/flyers`;
          break;
      }

      await api.post(endpoint, formData);
      Alert.alert('Éxito', 'Elemento creado correctamente');
      router.back();
    } catch (err: any) {
      console.error('Error al crear:', err);
      const errorMessage = err.response?.data?.error || 'No se pudo crear el elemento';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const setProperty = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker({ start: false, end: false });
    
    if (selectedDate) {
      const isoString = selectedDate.toISOString();
      setProperty(dateField, isoString);
    }
  };

  const showDatePickerModal = (field: 'start_date' | 'end_date') => {
    setDateField(field);
    setShowDatePicker({ start: field === 'start_date', end: field === 'end_date' });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Seleccionar fecha';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  // Renderizar formularios
  const renderUserForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.label}>Nombre completo *</Text>
      <TextInput
        style={styles.input}
        value={formData.full_name || ''}
        onChangeText={(text) => setProperty('full_name', text)}
        placeholder="Nombre completo"
      />
      
      <Text style={styles.label}>Email *</Text>
      <TextInput
        style={styles.input}
        value={formData.email || ''}
        onChangeText={(text) => setProperty('email', text)}
        placeholder="usuario@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <Text style={styles.label}>Teléfono</Text>
      <TextInput
        style={styles.input}
        value={formData.phone || ''}
        onChangeText={(text) => setProperty('phone', text)}
        placeholder="+54 123 456-7890"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Contraseña *</Text>
      <TextInput
        style={styles.input}
        value={formData.password || ''}
        onChangeText={(text) => setProperty('password', text)}
        placeholder="Contraseña segura"
        secureTextEntry
      />
    </View>
  );

  const renderProductForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.label}>Nombre del producto *</Text>
      <TextInput
        style={styles.input}
        value={formData.name || ''}
        onChangeText={(text) => setProperty('name', text)}
        placeholder="Nombre del producto"
      />
      
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formData.description || ''}
        onChangeText={(text) => setProperty('description', text)}
        placeholder="Descripción del producto"
        multiline
        numberOfLines={3}
      />
      
      <Text style={styles.label}>Precio *</Text>
      <TextInput
        style={styles.input}
        value={formData.price ? formData.price.toString() : ''}
        onChangeText={(text) => setProperty('price', parseFloat(text) || 0)}
        placeholder="0.00"
        keyboardType="numeric"
      />
      
      <Text style={styles.label}>ID de Categoría *</Text>
      <TextInput
        style={styles.input}
        value={formData.category_id ? formData.category_id.toString() : ''}
        onChangeText={(text) => setProperty('category_id', parseInt(text) || 0)}
        placeholder="1"
        keyboardType="numeric"
      />
      
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Disponible</Text>
        <Switch
          value={!!formData.is_available}
          onValueChange={(value) => setProperty('is_available', value)}
        />
      </View>
    </View>
  );

  const renderRestaurantForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.label}>Nombre del restaurante *</Text>
      <TextInput
        style={styles.input}
        value={formData.name || ''}
        onChangeText={(text) => setProperty('name', text)}
        placeholder="Nombre del restaurante"
      />
      
      <Text style={styles.label}>Dirección *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formData.address || ''}
        onChangeText={(text) => setProperty('address', text)}
        placeholder="Dirección completa"
        multiline
        numberOfLines={2}
      />
      
      <Text style={styles.label}>Teléfono</Text>
      <TextInput
        style={styles.input}
        value={formData.phone || ''}
        onChangeText={(text) => setProperty('phone', text)}
        placeholder="+54 123 456-7890"
        keyboardType="phone-pad"
      />
      
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Latitud *</Text>
          <TextInput
            style={styles.input}
            value={formData.latitude ? formData.latitude.toString() : ''}
            onChangeText={(text) => setProperty('latitude', parseFloat(text) || 0)}
            placeholder="-34.603722"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.halfInput}>
          <Text style={styles.label}>Longitud *</Text>
          <TextInput
            style={styles.input}
            value={formData.longitude ? formData.longitude.toString() : ''}
            onChangeText={(text) => setProperty('longitude', parseFloat(text) || 0)}
            placeholder="-58.381592"
            keyboardType="numeric"
          />
        </View>
      </View>
      
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Hora de apertura</Text>
          <TextInput
            style={styles.input}
            value={formData.opening_time || ''}
            onChangeText={(text) => setProperty('opening_time', text)}
            placeholder="08:00:00"
          />
        </View>
        
        <View style={styles.halfInput}>
          <Text style={styles.label}>Hora de cierre</Text>
          <TextInput
            style={styles.input}
            value={formData.closing_time || ''}
            onChangeText={(text) => setProperty('closing_time', text)}
            placeholder="23:00:00"
          />
        </View>
      </View>
      
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Abierto</Text>
        <Switch
          value={!!formData.is_open}
          onValueChange={(value) => setProperty('is_open', value)}
        />
      </View>
    </View>
  );

  const renderCouponForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.label}>Título del cupón *</Text>
      <TextInput
        style={styles.input}
        value={formData.title || ''}
        onChangeText={(text) => setProperty('title', text)}
        placeholder="Título del cupón"
      />
      
      <Text style={styles.label}>Código *</Text>
      <TextInput
        style={styles.input}
        value={formData.code || ''}
        onChangeText={(text) => setProperty('code', text)}
        placeholder="CODIGO123"
        autoCapitalize="characters"
      />
      
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formData.description || ''}
        onChangeText={(text) => setProperty('description', text)}
        placeholder="Descripción del cupón"
        multiline
        numberOfLines={3}
      />
      
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Tipo de descuento *</Text>
          <View style={styles.radioContainer}>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => setProperty('discount_type', 'percentage')}
            >
              <View style={[styles.radioCircle, formData.discount_type === 'percentage' && styles.radioSelected]}>
                {formData.discount_type === 'percentage' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Porcentaje</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => setProperty('discount_type', 'fixed')}
            >
              <View style={[styles.radioCircle, formData.discount_type === 'fixed' && styles.radioSelected]}>
                {formData.discount_type === 'fixed' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Monto fijo</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.halfInput}>
          <Text style={styles.label}>Valor de descuento *</Text>
          <TextInput
            style={styles.input}
            value={formData.discount_value ? formData.discount_value.toString() : ''}
            onChangeText={(text) => setProperty('discount_value', parseFloat(text) || 0)}
            placeholder={formData.discount_type === 'percentage' ? '15' : '1000'}
            keyboardType="numeric"
          />
        </View>
      </View>
      
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Compra mínima</Text>
          <TextInput
            style={styles.input}
            value={formData.min_purchase ? formData.min_purchase.toString() : ''}
            onChangeText={(text) => setProperty('min_purchase', parseFloat(text) || 0)}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.halfInput}>
          <Text style={styles.label}>Límite de uso</Text>
          <TextInput
            style={styles.input}
            value={formData.usage_limit ? formData.usage_limit.toString() : ''}
            onChangeText={(text) => setProperty('usage_limit', parseInt(text) || null)}
            placeholder="100"
            keyboardType="numeric"
          />
        </View>
      </View>
      
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Fecha de inicio</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => showDatePickerModal('start_date')}
          >
            <Text style={styles.dateButtonText}>
              {formatDate(formData.start_date)}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.halfInput}>
          <Text style={styles.label}>Fecha de fin</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => showDatePickerModal('end_date')}
          >
            <Text style={styles.dateButtonText}>
              {formatDate(formData.end_date)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Activo</Text>
        <Switch
          value={!!formData.is_active}
          onValueChange={(value) => setProperty('is_active', value)}
        />
      </View>
    </View>
  );

  const renderFlyerForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.label}>Título del flyer *</Text>
      <TextInput
        style={styles.input}
        value={formData.title || ''}
        onChangeText={(text) => setProperty('title', text)}
        placeholder="Título del flyer"
      />
      
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formData.description || ''}
        onChangeText={(text) => setProperty('description', text)}
        placeholder="Descripción del flyer"
        multiline
        numberOfLines={3}
      />
      
      <Text style={styles.label}>URL de la imagen *</Text>
      <TextInput
        style={styles.input}
        value={formData.image_url || ''}
        onChangeText={(text) => setProperty('image_url', text)}
        placeholder="https://ejemplo.com/imagen.jpg"
        keyboardType="url"
        autoCapitalize="none"
      />
      
      <Text style={styles.label}>URL del enlace</Text>
      <TextInput
        style={styles.input}
        value={formData.link_url || ''}
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
            value={formData.display_order ? formData.display_order.toString() : ''}
            onChangeText={(text) => setProperty('display_order', parseInt(text) || 0)}
            placeholder="1"
            keyboardType="numeric"
          />
        </View>
      </View>
      
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Fecha de inicio</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => showDatePickerModal('start_date')}
          >
            <Text style={styles.dateButtonText}>
              {formatDate(formData.start_date)}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.halfInput}>
          <Text style={styles.label}>Fecha de fin</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => showDatePickerModal('end_date')}
          >
            <Text style={styles.dateButtonText}>
              {formatDate(formData.end_date)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.switchContainer}>
        <Text style={styles.label}>Activo</Text>
        <Switch
          value={!!formData.is_active}
          onValueChange={(value) => setProperty('is_active', value)}
        />
      </View>
    </View>
  );

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
            <Text style={styles.noFormText}>Formulario de creación no disponible para {type}</Text>
          </View>
        );
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'usuarios': return 'Crear Usuario';
      case 'repartidores': return 'Crear Repartidor';
      case 'productos': return 'Crear Producto';
      case 'restaurantes': return 'Crear Restaurante';
      case 'cupones': return 'Crear Cupón';
      case 'flyers': return 'Crear Flyer';
      default: return 'Crear';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{getTitle()}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
          <Text style={styles.saveButtonText}>
            {saving ? 'Creando...' : 'Crear'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {renderForm()}
      </ScrollView>

      {/* Date Picker */}
      {(showDatePicker.start || showDatePicker.end) && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

// Estilos (los mismos que en el edit screen)
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
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
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
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
  dateButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F8F9FA',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noFormText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default CreateScreen;