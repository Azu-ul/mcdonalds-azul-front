import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type AddressBarProps = {
  address: string;
  onPress: () => void;
  isRestaurant?: boolean; // Prop opcional para forzar el comportamiento
};

export default function AddressBar({ address, onPress, isRestaurant = false }: AddressBarProps) {
  // Función para detectar automáticamente si es un restaurante
  const detectIfRestaurant = (addr: string): boolean => {
    if (isRestaurant) return true; // Si la prop está explícitamente en true
    
    // Palabras clave que indican que es un restaurante
    const restaurantKeywords = [
      "mcdonald's",
      "mcdonalds", 
      "restaurant",
      "restaurante",
      "mc donald",
      "local",
      "sucursal"
    ];
    
    const lowerAddress = addr.toLowerCase();
    return restaurantKeywords.some(keyword => lowerAddress.includes(keyword));
  };

  const isRestaurantAddress = detectIfRestaurant(address);
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.label}>
          {isRestaurantAddress ? 'Retirar en' : 'Enviar a'}
        </Text>
        <View style={styles.addressRow}>
          <Text style={styles.address} numberOfLines={1}>{address}</Text>
          <Text style={styles.arrow}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    flexDirection: 'column',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    flex: 1,
    fontSize: 15,
    color: '#292929',
    fontWeight: '600',
  },
  arrow: {
    fontSize: 24,
    color: '#666',
    marginLeft: 8,
  },
});