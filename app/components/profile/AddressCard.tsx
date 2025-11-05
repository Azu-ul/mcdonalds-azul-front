import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

type AddressCardProps = {
  address: string;
  onAddressChange: (text: string) => void;
  onSave: () => void;
  onGetLocation: () => void;
  loadingLocation: boolean;
  loadingUpdate: boolean;
  saved: boolean;
};

export default function AddressCard({
  address,
  onAddressChange,
  onSave,
  onGetLocation,
  loadingLocation,
  loadingUpdate,
  saved
}: AddressCardProps) {
  const controlledAddress = address || '';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.title}>Dirección</Text>
      </View>

      <TextInput
        style={styles.input}
        value={controlledAddress}
        onChangeText={onAddressChange}
        placeholder="Calle, número, ciudad..."
        multiline
        placeholderTextColor="#999"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, saved && styles.buttonSuccess]}
          onPress={onSave}
          disabled={loadingUpdate || saved}
        >
          {loadingUpdate ? (
            <ActivityIndicator color="#292929" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {saved ? '✓ Guardado' : 'Guardar'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={onGetLocation}
          disabled={loadingLocation}
        >
          {loadingLocation ? (
            <ActivityIndicator color="#666" size="small" />
          ) : (
            <>
              <Text style={styles.buttonIcon}>📍</Text>
              <Text style={styles.buttonTextSecondary}>Ubicación actual</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#292929',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#F8F8F8',
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#292929',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonPrimary: {
    backgroundColor: '#FFBC0D',
  },
  buttonSuccess: {
    backgroundColor: '#4CAF50',
  },
  buttonSecondary: {
    backgroundColor: '#F8F8F8',
    borderWidth: 0,
  },
  buttonText: {
    color: '#292929',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  buttonTextSecondary: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
});