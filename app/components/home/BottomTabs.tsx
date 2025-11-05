import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

type BottomTabsProps = {
  currentTab: 'home' | 'cupones' | 'restaurantes' | 'cuenta';
};

export default function BottomTabs({ currentTab }: BottomTabsProps) {
  const router = useRouter();

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠', route: '/' },
    { id: 'cupones', label: 'Cupones', icon: '🎟️', route: '/cupones' },
    { id: 'restaurantes', label: 'Restaurantes', icon: '🏪', route: '/restaurantes' },
    { id: 'cuenta', label: 'Mi Cuenta', icon: '👤', route: '/profile' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => router.push(tab.route)}
          >
            <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#FFBC0D',
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: 3,
    backgroundColor: '#FFBC0D',
    borderRadius: 2,
  },
});