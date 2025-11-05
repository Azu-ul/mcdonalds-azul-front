import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

type Condiment = {
    id: number;
    name: string;
};

type Props = {
    condiments: Condiment[];
    selected: Record<number, boolean>;
    onChange: (selection: Record<number, boolean>) => void;
    onClose: () => void;
};

export default function CondimentSelector({ condiments, selected, onChange, onClose }: Props) {
    const toggle = (id: number) => {
        onChange({ ...selected, [id]: !selected[id] });
    };

    return (
        <View style={styles.modalContent}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Condimentos adicionales</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {condiments.map((condiment) => {
                    const isSelected = selected[condiment.id] || false;
                    
                    return (
                        <TouchableOpacity
                            key={condiment.id}
                            style={[
                                styles.row,
                                isSelected && styles.rowSelected
                            ]}
                            onPress={() => toggle(condiment.id)}
                        >
                            <Text style={[
                                styles.condimentName,
                                isSelected && styles.condimentNameSelected
                            ]}>
                                {condiment.name}
                            </Text>
                            <View style={[
                                styles.checkbox,
                                isSelected && styles.checkboxChecked
                            ]}>
                                {isSelected && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                        </TouchableOpacity>
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
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    rowSelected: {
        backgroundColor: '#FFF8E1',
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    condimentName: {
        fontSize: 16,
        color: '#292929',
        flex: 1,
    },
    condimentNameSelected: {
        fontWeight: 'bold',
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    checkboxChecked: {
        backgroundColor: '#FFBC0D',
        borderColor: '#FFBC0D',
    },
    checkmark: {
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