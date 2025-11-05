// src/components/product/AddToCartButton.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import CustomModal from '../components/CustomModal';
import { useAuth } from '../context/AuthContext';
import api from '../../config/api';

type Props = {
  price: number;
  onAdd: () => void;
  maxQuantity?: number;
};

const AddToCartButton = ({ price, onAdd, maxQuantity = 5 }: Props) => {
  const [quantity, setQuantity] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleAdd = async () => {
    if (!isAuthenticated) {
      setModalVisible(true);
      return;
    }

    // Aquí iría la lógica real de agregar al carrito
    // Ej: await api.post('/cart/items', { ... })
    onAdd();
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.quantityControl}>
          <TouchableOpacity
            disabled={quantity <= 1}
            onPress={() => setQuantity(q => Math.max(1, q - 1))}
            style={[styles.quantityBtn, quantity <= 1 && styles.disabled]}
          >
            <Text>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            disabled={quantity >= maxQuantity}
            onPress={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
            style={[styles.quantityBtn, quantity >= maxQuantity && styles.disabled]}
          >
            <Text>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addText}>Agregar</Text>
        </TouchableOpacity>

        <Text style={styles.price}>${(price * quantity).toLocaleString()}</Text>
      </View>

      <CustomModal
        visible={modalVisible}
        type="info"
        title="Inicia sesión"
        message="Debes iniciar sesión para agregar productos al carrito."
        confirmText="Ingresar"
        showCancel
        cancelText="Cancelar"
        onConfirm={() => {
          // Redirigir a login
          // Ej: router.push('/signin')
        }}
        onCancel={() => setModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    borderRadius: 30,
    padding: 12,
    marginTop: 20,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  quantityBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  disabled: {
    opacity: 0.4,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  addButton: {
    backgroundColor: '#DA291C',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default AddToCartButton;