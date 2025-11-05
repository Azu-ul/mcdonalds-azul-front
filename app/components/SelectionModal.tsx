import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';

type SelectionModalProps = {
  visible: boolean;
  children: React.ReactNode;
};

export default function SelectionModal({ visible, children }: SelectionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
    >
      <View style={styles.overlay}>
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
});