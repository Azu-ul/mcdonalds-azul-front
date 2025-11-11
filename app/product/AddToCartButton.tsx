import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import CustomModal from '../components/CustomModal';
import { useAuth } from '../context/AuthContext';

type Props = {
  price: number;
  onAdd: () => void;
  maxQuantity?: number;
  disabled?: boolean;
};

const AddToCartButton = ({ price, onAdd, maxQuantity = 5, disabled = false }: Props) => {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [customModal, setCustomModal] = useState({
    visible: false,
    type: 'info' as const,
    title: '',
    message: '',
  });
  const { isAuthenticated } = useAuth();

  const showModal = (title: string, message: string) => {
    setCustomModal({
      visible: true,
      type: 'info',
      title,
      message,
    });
  };

  const hideModal = () => {
    setCustomModal(prev => ({ ...prev, visible: false }));
  };

  const handleAdd = async () => {
    if (!isAuthenticated) {
      showModal(
        'Inicia sesión',
        'Debes iniciar sesión para agregar productos al carrito.'
      );
      return;
    }

    onAdd();
  };

  const handleGoToLogin = () => {
    hideModal();
    router.push('/signin');
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
            <Text style={styles.quantityBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            disabled={quantity >= maxQuantity}
            onPress={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
            style={[styles.quantityBtn, quantity >= maxQuantity && styles.disabled]}
          >
            <Text style={styles.quantityBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.addButton, disabled && styles.addButtonDisabled]} 
          onPress={handleAdd}
          disabled={disabled}
        >
          <Text style={styles.addText}>Agregar</Text>
        </TouchableOpacity>

        <Text style={styles.price}>
          ${(price * quantity).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </Text>
      </View>

      <CustomModal
        visible={customModal.visible}
        type={customModal.type}
        title={customModal.title}
        message={customModal.message}
        confirmText="Ingresar"
        showCancel
        cancelText="Cancelar"
        onConfirm={handleGoToLogin}
        onCancel={hideModal}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#292929',
    borderRadius: 30,
    padding: 12,
    gap: 12,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    overflow: 'hidden',
  },
  quantityBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  quantityBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#292929',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#292929',
    paddingHorizontal: 12,
  },
  addButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    minWidth: 80,
    textAlign: 'right',
  },
});

export default AddToCartButton;