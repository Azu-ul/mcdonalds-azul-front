import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

type Category = {
  id: number;
  name: string;
  icon: string;
};

type CategoryCarouselProps = {
  categories: Category[];
  selectedCategory: string;
  onCategoryPress: (categoryName: string) => void;
};

export default function CategoryCarousel({ 
  categories, 
  selectedCategory, 
  onCategoryPress 
}: CategoryCarouselProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              selectedCategory === category.name && styles.categoryCardActive
            ]}
            onPress={() => onCategoryPress(category.name)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text 
              style={[
                styles.categoryName,
                selectedCategory === category.name && styles.categoryNameActive
              ]}
              numberOfLines={2}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    minWidth: 90,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardActive: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFBC0D',
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 14,
  },
  categoryNameActive: {
    color: '#292929',
    fontWeight: 'bold',
  },
});