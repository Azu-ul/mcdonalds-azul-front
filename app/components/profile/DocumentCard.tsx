import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { API_URL } from '../../../config/api';

type DocumentCardProps = {
  documentUrl?: string | null;
  onUpload: () => void;
  onDelete: () => void;
  loading: boolean;
  deleting: boolean;
};

export default function DocumentCard({
  documentUrl,
  onUpload,
  onDelete,
  loading,
  deleting
}: DocumentCardProps) {
  const getDocumentUrl = () => {
    if (!documentUrl) return null;
    if (documentUrl.startsWith('http')) return documentUrl;
    return `${API_URL.replace('/api', '')}${documentUrl}`;
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>🪪 Documento de Identidad</Text>

      {documentUrl ? (
        <View style={styles.documentPreview}>
          <Text style={styles.documentText}>✓ Documento cargado</Text>
          <Image
            source={{ uri: getDocumentUrl()! }}
            style={styles.documentThumbnail}
            resizeMode="cover"
          />

          <View style={styles.documentButtonsRow}>
            <TouchableOpacity
              style={[styles.documentButton, styles.changeDocumentButton]}
              onPress={onUpload}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.documentButtonText}>🔄 Cambiar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.documentButton, styles.deleteDocumentButton]}
              onPress={onDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.documentButtonText}>🗑️ Eliminar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={onUpload}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>📄 Subir documento</Text>
          )}
        </TouchableOpacity>
      )}

      <Text style={styles.helperText}>
        Imágenes (JPEG, PNG) o PDF - Máx. 5MB
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 8,
    padding: 16,
    width: '90%',
    maxWidth: 420,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#292929',
    marginBottom: 16,
  },
  documentPreview: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  documentText: {
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 12,
    fontSize: 14,
  },
  documentThumbnail: {
    width: 180,
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  documentButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  documentButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  changeDocumentButton: {
    backgroundColor: '#FFBC0D',
  },
  deleteDocumentButton: {
    backgroundColor: '#DA291C',
  },
  documentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#FFBC0D',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadButtonText: {
    color: '#292929',
    fontSize: 15,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});