// front/app/components/home/ProductCarousel.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { API_URL } from '../../../config/api';

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
};

type ProductCarouselProps = {
  products: Product[];
  onProductPress: (product: Product) => void;
};

export default function ProductCarousel({ products, onProductPress }: ProductCarouselProps) {
  const getImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_URL.replace('/api', '')}${imageUrl}`;
  };

  const formatPrice = (price: number) => {
    return `$ ${price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay productos en esta categoría</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {products.map((product) => (
        <View key={product.id} style={styles.productCard}>
          {/* Toda la card es clickeable */}
          <TouchableOpacity 
            style={styles.cardContent}
            onPress={() => onProductPress(product)}
            activeOpacity={0.7}
          >
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: getImageUrl(product.image_url) }}
                style={styles.productImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={styles.productDescription} numberOfLines={2}>
                {product.description}
              </Text>
              <View style={styles.priceContainer}>
                <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Botón agregar - también navega al detalle */}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => onProductPress(product)}
          >
            <Text style={styles.addButtonText}>+ Agregar</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 16,
  },
  productCard: {
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
    backgroundColor: '#F5F5F5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#292929',
    marginBottom: 6,
    lineHeight: 20,
  },
  productDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#292929',
    marginTop: 'auto',
  },
  addButton: {
    backgroundColor: '#FFBC0D',
    padding: 12,
    alignItems: 'center',
    margin: 12,
    borderRadius: 8,
    marginTop: 'auto',
  },
  addButtonText: {
    color: '#292929',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});