import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

type SideOption = {
    id: number;
    name: string;
    extra_price: number;
    image_url?: string;
};

type Props = {
    options: SideOption[];
    selected: SideOption | null;
    onSelect: (option: SideOption) => void;
    onClose: () => void;
};

export default function SideSelector({ options, selected, onSelect, onClose }: Props) {
    const getSideEmoji = (name: string) => {
        if (name.toLowerCase().includes('papa')) return '🍟';
        if (name.toLowerCase().includes('ensalada')) return '🥗';
        return '🍽️';
    };

    return (
        <View style={styles.modalContent}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Acompañamiento</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {options.map((option) => {
                    const isSelected = selected?.id === option.id;
                    
                    return (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.option,
                                isSelected && styles.optionSelected
                            ]}
                            onPress={() => onSelect(option)}
                        >
                            <View style={styles.optionLeft}>
                                <View style={styles.iconContainer}>
                                    <Text style={styles.emoji}>{getSideEmoji(option.name)}</Text>
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={[
                                        styles.optionText,
                                        isSelected && styles.optionTextSelected
                                    ]}>
                                        {option.name}
                                    </Text>
                                    {option.extra_price > 0 && (
                                        <Text style={styles.priceText}>
                                            +$ {option.extra_price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            {isSelected && (
                                <View style={styles.checkMark}>
                                    <Text style={styles.checkMarkText}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    modalContent: {
        width: '100%',
        maxHeight: '80%',
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    closeButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 24,
        color: '#666',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#292929',
    },
    placeholder: {
        width: 32,
    },
    list: {
        paddingHorizontal: 20,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    optionSelected: {
        backgroundColor: '#FFF8E1',
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 50,
        height: 50,
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 32,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionText: {
        fontSize: 16,
        color: '#292929',
        marginBottom: 4,
    },
    optionTextSelected: {
        fontWeight: 'bold',
    },
    priceText: {
        fontSize: 14,
        color: '#27AE60',
        fontWeight: '600',
    },
    checkMark: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFBC0D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkMarkText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#292929',
    },
});