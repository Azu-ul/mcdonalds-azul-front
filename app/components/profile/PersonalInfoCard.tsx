import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Controller } from 'react-hook-form';

type PersonalInfoCardProps = {
  control: any;
  errors: any;
  authProvider: string;
  onSave: () => void;
  loading: boolean;
  saved: boolean;
};

export default function PersonalInfoCard({
  control,
  errors,
  authProvider,
  onSave,
  loading,
  saved
}: PersonalInfoCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📋 Información Personal</Text>

      {authProvider === 'local' && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="tu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                )}
              </>
            )}
          />
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre y apellido</Text>
        <Controller
          control={control}
          name="full_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                style={[styles.input, errors.full_name && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="Juan Pérez"
                placeholderTextColor="#999"
              />
              {errors.full_name && (
                <Text style={styles.errorText}>{errors.full_name.message}</Text>
              )}
            </>
          )}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Teléfono</Text>
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder="+54 9 11 1234-5678"
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone.message}</Text>
              )}
            </>
          )}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saved && styles.saveButtonSuccess]}
        onPress={onSave}
        disabled={loading || saved}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.saveButtonText}>
            {saved ? '✓ ¡Guardado!' : '💾 Guardar cambios'}
          </Text>
        )}
      </TouchableOpacity>
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#292929',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 14,
    borderRadius: 8,
    fontSize: 15,
    backgroundColor: '#F8F8F8',
    color: '#292929',
  },
  inputError: {
    borderColor: '#DA291C',
  },
  errorText: {
    color: '#DA291C',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#FFBC0D',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonSuccess: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    color: '#292929',
    fontSize: 16,
    fontWeight: '600',
  },
});