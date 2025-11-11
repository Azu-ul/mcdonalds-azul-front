import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

// Tipo que representa una opción de bebida
type DrinkOption = {
    id: number;
    name: string;
    extra_price: number; // Precio extra si aplica
    image_url?: string;  // URL imagen opcional (no usado aquí directo)
};

// Props para el selector de bebidas
type Props = {
    options: DrinkOption[];   // Lista de opciones disponibles
    selected: DrinkOption | null;  // Opción seleccionada
    onSelect: (option: DrinkOption) => void;  // Callback al seleccionar
    onClose: () => void;  // Callback para cerrar el selector
};


export default function DrinkSelector({ options, selected, onSelect, onClose }: Props) {
    // Función para devolver un emoji asociado a la bebida según nombre
    const getDrinkEmoji = (name: string) => {
        if (name.toLowerCase().includes('coca')) return '🥤';
        if (name.toLowerCase().includes('sprite')) return '🥤';
        if (name.toLowerCase().includes('fanta')) return '🥤';
        if (name.toLowerCase().includes('agua')) return '💧';
        if (name.toLowerCase().includes('jugo')) return '🧃';
        return '🥤'; // Emoji genérico si no reconoce
    };

    return (
        <View style={styles.modalContent}>
            {/* Header con botón para cerrar y título */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Bebida</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Lista desplazable con opciones de bebida */}
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
                                {/* Emoji representando la bebida */}
                                <View style={styles.iconContainer}>
                                    <Text style={styles.emoji}>{getDrinkEmoji(option.name)}</Text>
                                </View>
                                {/* Texto con nombre y posible precio extra */}
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
                            {/* Marca de check para opción seleccionada */}
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


// Estilos para el selector de bebidas
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
