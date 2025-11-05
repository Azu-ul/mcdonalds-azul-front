import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

type CustomModalProps = {
  visible: boolean;
  type: 'success' | 'error' | 'info' | 'delete';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
  onCancel: () => void;
};

export default function CustomModal({
  visible,
  type,
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  showCancel = false,
  onConfirm,
  onCancel,
}: CustomModalProps) {
  const getColors = () => {
    switch (type) {
      case 'success':
        return { bg: '#27AE60', text: '#fff' };
      case 'error':
      case 'delete':
        return { bg: '#DA291C', text: '#fff' };
      case 'info':
        return { bg: '#FFBC0D', text: '#292929' };
      default:
        return { bg: '#FFBC0D', text: '#292929' };
    }
  };

  const colors = getColors();
  const isConfirmDisabled = !onConfirm;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={[styles.header, { backgroundColor: colors.bg }]}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={styles.footer}>
            {showCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: colors.bg },
                isConfirmDisabled && styles.disabledButton,
              ]}
              onPress={onConfirm}
              disabled={isConfirmDisabled}
            >
              <Text style={[styles.confirmButtonText, { color: colors.text }]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    // backgroundColor se establece dinámicamente
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});