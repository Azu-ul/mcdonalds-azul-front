import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type FloatingCartProps = {
  itemCount: number;
  totalPrice: number;
  onPress: () => void;
};

export default function FloatingCart({ itemCount, totalPrice, onPress }: FloatingCartProps) {
  const formatPrice = (price: number) => {
    return `$ ${price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{itemCount}</Text>
        </View>
        <Text style={styles.icon}>🛍️</Text>
        <Text style={styles.price}>{formatPrice(totalPrice)}</Text>
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: '#292929',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  badge: {
    backgroundColor: '#DA291C',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  price: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  arrow: {
    fontSize: 24,
    color: '#FFBC0D',
    fontWeight: 'bold',
  },
});