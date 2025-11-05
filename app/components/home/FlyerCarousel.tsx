import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Dimensions } from 'react-native';

type Flyer = {
  id: number;
  image: string;
  title: string;
};

type FlyerCarouselProps = {
  flyers: Flyer[];
  onFlyerPress: (flyer: Flyer) => void;
};

const { width } = Dimensions.get('window');
const FLYER_WIDTH = width * 0.3;
const FLYER_HEIGHT = FLYER_WIDTH;

export default function FlyerCarousel({ flyers, onFlyerPress }: FlyerCarouselProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      snapToInterval={FLYER_WIDTH + 16}
      decelerationRate="fast"
    >
      {flyers.map((flyer) => (
        <TouchableOpacity
          key={flyer.id}
          style={[styles.flyerCard, { width: FLYER_WIDTH, height: FLYER_HEIGHT }]}
          onPress={() => onFlyerPress(flyer)}
        >
          <Image
            source={{ uri: flyer.image }}
            style={styles.flyerImage}
            resizeMode="cover"
          />
          <View style={styles.flyerOverlay}>
            <Text style={styles.flyerTitle}>{flyer.title}</Text>
          </View>
        </TouchableOpacity>
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
  flyerImage: {
    width: '100%',
    height: '100%',
  },
  flyerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  flyerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  flyerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});