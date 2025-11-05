import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';

type ProfileImageSectionProps = {
  imageUrl: string | null;
  username?: string;
  email?: string;
  editingUsername: boolean;
  usernameValue: string;
  onUsernameChange: (text: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onImagePress: () => void;
  loading: boolean;
};

export default function ProfileImageSection({
  imageUrl,
  username,
  email,
  editingUsername,
  usernameValue,
  onUsernameChange,
  onEdit,
  onSave,
  onCancel,
  onImagePress,
  loading
}: ProfileImageSectionProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onImagePress} style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.profileImageText}>
              {username?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.editBadge}>
          <Text style={styles.editBadgeText}>✏️</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.usernameContainer}>
        {editingUsername ? (
          <View style={styles.usernameEditContainer}>
            <TextInput
              style={styles.usernameInput}
              value={usernameValue}
              onChangeText={onUsernameChange}
              placeholder="Tu nombre..."
              autoCapitalize="words"
              autoFocus
              onSubmitEditing={onSave}
              returnKeyType="done"
              blurOnSubmit={false}
            />
            <TouchableOpacity style={styles.iconButton} onPress={onSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#27AE60" />
              ) : (
                <Text style={styles.saveIcon}>💾</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={onCancel}>
              <Text style={styles.cancelIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.usernameViewContainer}>
            <Text style={styles.username}>{username}</Text>
            <TouchableOpacity style={styles.editIconButton} onPress={onEdit}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.email}>{email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    width: '90%',
    maxWidth: 420,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFBC0D',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFBC0D',
  },
  profileImageText: {
    fontSize: 36,
    color: '#999',
    fontWeight: 'bold',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFBC0D',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editBadgeText: {
    fontSize: 14,
  },
  usernameContainer: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  usernameViewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  usernameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: '#292929',
  },
  usernameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#292929',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 150,
    textAlign: 'center',
    backgroundColor: '#F8F8F8',
  },
  editIconButton: {
    padding: 4,
  },
  editIcon: {
    fontSize: 16,
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  saveIcon: {
    fontSize: 18,
  },
  cancelIcon: {
    fontSize: 18,
    color: '#DA291C',
  },
  email: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});