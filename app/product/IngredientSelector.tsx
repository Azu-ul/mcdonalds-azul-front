import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

type Ingredient = {
    id: number;
    name: string;
    is_required: boolean;
    is_default: boolean;
    max_quantity: number;
    extra_price: number;
};

type Props = {
    ingredients: Ingredient[];
    selected: Record<number, number>;
    onChange: (selection: Record<number, number>) => void;
    onClose: () => void;
};

export default function IngredientSelector({ ingredients, selected, onChange, onClose }: Props) {
    const handleQuantityChange = (id: number, change: number, maxQuantity: number, isRequired: boolean) => {
        const current = selected[id] || 0;
        let newValue = current + change;
        
        // No permitir menos de 1 si es requerido
        if (isRequired) {
            newValue = Math.max(1, Math.min(maxQuantity, newValue));
        } else {
            newValue = Math.max(0, Math.min(maxQuantity, newValue));
        }
        
        onChange({ ...selected, [id]: newValue });
    };

    const getExtraPrice = (ingredient: Ingredient, quantity: number) => {
        if (quantity <= 1) return 0;
        return ingredient.extra_price * (quantity - 1);
    };

    return (
        <View style={styles.modalContent}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.title}>¿Cómo querés personalizar?</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {ingredients.map((ing) => {
                    const quantity = selected[ing.id] || 0;
                    const extraPrice = getExtraPrice(ing, quantity);
                    const canDecrease = ing.is_required ? quantity > 1 : quantity > 0;
                    const canIncrease = quantity < ing.max_quantity;

                    return (
                        <View key={ing.id} style={styles.row}>
                            <View style={styles.ingredientLeft}>
                                <Text style={styles.ingredientName}>
                                    {ing.name}
                                    {ing.is_required && <Text style={styles.required}> *</Text>}
                                </Text>
                                {extraPrice > 0 && (
                                    <Text style={styles.extraPrice}>
                                        +$ {extraPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </Text>
                                )}
                                {quantity > 0 && (
                                    <Text style={styles.quantityInfo}>
                                        {quantity}x {ing.name}
                                    </Text>
                                )}
                            </View>

                            <View style={styles.controls}>
                                <TouchableOpacity
                                    style={[
                                        styles.controlButton,
                                        !canDecrease && styles.controlButtonDisabled
                                    ]}
                                    onPress={() => handleQuantityChange(ing.id, -1, ing.max_quantity, ing.is_required)}
                                    disabled={!canDecrease}
                                >
                                    <Text style={[
                                        styles.controlButtonText,
                                        !canDecrease && styles.controlButtonTextDisabled
                                    ]}>−</Text>
                                </TouchableOpacity>

                                <View style={styles.quantityBadge}>
                                    <Text style={styles.quantityText}>{quantity}</Text>
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.controlButton,
                                        !canIncrease && styles.controlButtonDisabled
                                    ]}
                                    onPress={() => handleQuantityChange(ing.id, 1, ing.max_quantity, ing.is_required)}
                                    disabled={!canIncrease}
                                >
                                    <Text style={[
                                        styles.controlButtonText,
                                        !canIncrease && styles.controlButtonTextDisabled
                                    ]}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                    <Text style={styles.doneButtonText}>Listo</Text>
                </TouchableOpacity>
            </View>
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#292929',
        textAlign: 'center',
        flex: 1,
    },
    placeholder: {
        width: 32,
    },
    list: {
        paddingHorizontal: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    ingredientLeft: {
        flex: 1,
    },
    ingredientName: {
        fontSize: 16,
        color: '#292929',
        marginBottom: 4,
        fontWeight: '600',
    },
    required: {
        color: '#DA291C',
        fontSize: 14,
    },
    extraPrice: {
        fontSize: 14,
        color: '#27AE60',
        fontWeight: '600',
        marginTop: 2,
    },
    quantityInfo: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    controlButton: {
        width: 36,
        height: 36,
        backgroundColor: '#FFBC0D',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlButtonDisabled: {
        backgroundColor: '#E0E0E0',
        opacity: 0.5,
    },
    controlButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#292929',
    },
    controlButtonTextDisabled: {
        color: '#999',
    },
    quantityBadge: {
        minWidth: 32,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#FFF8E1',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#292929',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    doneButton: {
        backgroundColor: '#292929',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});