import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type ProfileHeaderProps = {
  onBack: () => void;
};

export default function ProfileHeader({ onBack }: ProfileHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Mi Cuenta</Text>
      <View style={styles.placeholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFBC0D', // Amarillo McDonald's
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0, // Sin borde
    width: '100%',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#292929',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#292929',
  },
  placeholder: {
    width: 40,
  },
});