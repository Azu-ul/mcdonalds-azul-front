import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import IngredientSelector from './IngredientSelector';
import SideSelector from './SideSelector';
import DrinkSelector from './DrinkSelector';
import CondimentSelector from './CondimentSelector';
import CustomModal from '../components/CustomModal';
import SelectionModal from '../components/SelectionModal';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api, { API_URL } from '../../config/api';
import { useCoupon } from '../context/CouponContext';

type Ingredient = {
    id: number;
    name: string;
    is_required: boolean;
    is_default: boolean;
    max_quantity: number;
    extra_price: number;
};

type SizeOption = {
    id: number;
    name: string;
    price_modifier: number;
};

type SideOption = {
    id: number;
    name: string;
    extra_price: number;
    image_url?: string;
};

type DrinkOption = {
    id: number;
    name: string;
    extra_price: number;
    image_url?: string;
};

type Product = {
    id: number;
    name: string;
    description: string;
    base_price: number;
    category: string;
    image_url?: string;
    is_combo: boolean;
    sizes: SizeOption[];
    ingredients: Ingredient[];
    sides: SideOption[];
    drinks: DrinkOption[];
};

type ModalType = 'ingredients' | 'sides' | 'drinks' | 'condiments' | null;

export default function ProductDetail() {
    const router = useRouter();
    const { id, edit, cartItemId, size, side, drink, customizations: customizationsParam, fromCart } = useLocalSearchParams<{
        id: string;
        edit?: string;
        cartItemId?: string;
        size?: string;
        side?: string;
        drink?: string;
        customizations?: string;
        fromCart?: string;
    }>();
    const { isAuthenticated } = useAuth();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    // Estados de selección
    const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null);
    const [selectedSide, setSelectedSide] = useState<SideOption | null>(null);
    const [selectedDrink, setSelectedDrink] = useState<DrinkOption | null>(null);
    const [ingredients, setIngredients] = useState<Record<number, number>>({});
    const [condiments, setCondiments] = useState<Record<number, boolean>>({});
    const [quantity, setQuantity] = useState(1);


    // Modales
    const [modalType, setModalType] = useState<ModalType>(null);
    const { refetchCart } = useCart();
    const { selectedCoupon, setSelectedCoupon, calculateDiscount } = useCoupon();

    const getIngredientsPreview = () => {
        if (!product?.ingredients) return 'Personalizar';

        const selectedCount = Object.values(ingredients).filter(qty => qty > 0).length;

        if (selectedCount === 0) return 'Personalizar';

        return `${selectedCount} ingredientes seleccionados`;
    };

    useEffect(() => {
        if (!id) {
            setError('Producto no especificado');
            setLoading(false);
            return;
        }

        const fetchProduct = async () => {
            try {
                const res = await api.get(`/home/products/${id}`);
                const productData = res.data.product;
                console.log('Producto cargado:', productData);
                setProduct(productData);

                // Seleccionar tamaño por defecto (Mediano)
                if (productData.sizes && productData.sizes.length > 0) {
                    setSelectedSize(productData.sizes[0]);
                }

                // Inicializar ingredientes por defecto
                if (productData.ingredients) {
                    const defaultIngredients: Record<number, number> = {};
                    productData.ingredients.forEach((ing: Ingredient) => {
                        if (ing.is_default) {
                            defaultIngredients[ing.id] = 1;
                        }
                    });
                    setIngredients(defaultIngredients);
                }

                if (edit === 'true' && productData) {
                    // Aplicar tamaño
                    if (size && productData.sizes) {
                        const preselectedSize = productData.sizes.find((s: SizeOption) => s.name === size);
                        if (preselectedSize) setSelectedSize(preselectedSize);
                    }

                    // Aplicar acompañamiento
                    if (side && productData.sides) {
                        const preselectedSide = productData.sides.find((s: SideOption) => s.name === side);
                        if (preselectedSide) setSelectedSide(preselectedSide);
                    }

                    // Aplicar bebida
                    if (drink && productData.drinks) {
                        const preselectedDrink = productData.drinks.find((d: DrinkOption) => d.name === drink);
                        if (preselectedDrink) setSelectedDrink(preselectedDrink);
                    }

                    // Aplicar customizaciones
                    if (customizationsParam) {
                        try {
                            const parsed = JSON.parse(customizationsParam);
                            if (parsed.ingredients) setIngredients(parsed.ingredients);
                            if (parsed.condiments) setCondiments(parsed.condiments);
                        } catch (e) {
                            console.error('Error parsing customizations:', e);
                        }
                    }
                }
            } catch (err: any) {
                setError('No se pudo cargar el producto');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const calculateTotalPrice = () => {
        if (!product) return { subtotal: 0, total: 0, discount: 0 };

        let subtotal = product.base_price;

        if (selectedSize) {
            subtotal += selectedSize.price_modifier;
        }

        if (selectedSide) {
            subtotal += selectedSide.extra_price;
        }

        if (selectedDrink) {
            subtotal += selectedDrink.extra_price;
        }

        if (product.ingredients) {
            product.ingredients.forEach((ing: Ingredient) => {
                const qty = ingredients[ing.id] || 0;
                if (qty > 1) {
                    subtotal += ing.extra_price * (qty - 1);
                }
            });
        }

        subtotal = subtotal * quantity;

        // Aplicar descuento de cupón si existe
        const discount = calculateDiscount(subtotal);
        const total = subtotal - discount;

        return { subtotal, total, discount };
    };

    const isFormValid = () => {
        if (!selectedSize) return false;

        // Ingredientes requeridos
        if (product?.ingredients) {
            for (const ing of product.ingredients) {
                if (ing.is_required && (!ingredients[ing.id] || ingredients[ing.id] === 0)) {
                    return false;
                }
            }
        }

        // Acompañamiento y bebida solo si es combo
        if (product?.is_combo) {
            if (!selectedSide || !selectedDrink) return false;
        }

        return true;
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) {
            alert('Debes iniciar sesión para agregar productos al carrito');
            return;
        }

        if (!product || !selectedSize) {
            alert('Selecciona un tamaño');
            return;
        }

        if (product.is_combo && (!selectedSide || !selectedDrink)) {
            alert('Completa todas las selecciones obligatorias del combo');
            return;
        }

        try {
            const customizations = {
                ingredients,
                condiments,
            };

            const payload = {
                product_id: product.id,
                size_id: selectedSize.id,
                side_id: product.is_combo ? selectedSide?.id : null,
                drink_id: product.is_combo ? selectedDrink?.id : null,
                quantity,
                customizations: JSON.stringify(customizations),
            };

            await api.post('/cart/items', payload);

            // Si hay cupón seleccionado, aplicarlo
            if (selectedCoupon) {
                try {
                    await api.post('/cart/apply-coupon', { coupon_id: selectedCoupon.id });
                } catch (couponError) {
                    console.error('Error aplicando cupón:', couponError);
                    // No bloqueamos el flujo si falla el cupón
                }
            }

            await refetchCart();

            // Si viene del carrito, volver al carrito
            if (fromCart === 'true') {
                router.replace('/product/cart');
            } else {
                router.replace('/');
            }
        } catch (error: any) {
            console.error('Error al agregar al carrito:', error);
            const message = error.response?.data?.message || 'No se pudo agregar al carrito';
            alert(message);
        }
    };

    const getImageUrl = (imageUrl?: string | null) => {
        if (!imageUrl) return '';
        if (imageUrl.startsWith('http')) return imageUrl;
        return `${API_URL.replace('/api', '')}${imageUrl}`;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFBC0D" />
            </View>
        );
    }

    if (error || !product) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error || 'Producto no encontrado'}</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backLink}>← Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { subtotal, total, discount } = calculateTotalPrice();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{product.category}</Text>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Imagen del producto */}
                <Image
                    source={{ uri: getImageUrl(product.image_url) }}
                    style={styles.productImage}
                    resizeMode="contain"
                />

                {/* Nombre y precio */}
                <View style={styles.infoContainer}>
                    {selectedCoupon && (
                        <View style={styles.couponBanner}>
                            <Text style={styles.couponBannerIcon}>🏷️</Text>
                            <View style={styles.couponBannerContent}>
                                <Text style={styles.couponBannerTitle}>{selectedCoupon.title}</Text>
                                <Text style={styles.couponBannerText}>
                                    Descuento de ${discount.toLocaleString('es-AR', { minimumFractionDigits: 2 })} aplicado
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedCoupon(null)}>
                                <Text style={styles.couponBannerClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>
                        $ {product.base_price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.productDescription}>{product.description}</Text>
                </View>

                {/* Selector de tamaño — SOLO si es combo */}
                {product.is_combo && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Selecciona un tamaño</Text>
                        <View style={styles.sizeContainer}>
                            {product.sizes?.map((size: SizeOption) => (
                                <TouchableOpacity
                                    key={size.id}
                                    style={styles.sizeButton}
                                    onPress={() => setSelectedSize(size)}
                                >
                                    <View style={[
                                        styles.sizeCircle,
                                        selectedSize?.id === size.id && styles.sizeCircleActive
                                    ]}>
                                        <Text style={[
                                            styles.sizeLetter,
                                            selectedSize?.id === size.id && styles.sizeLetterActive
                                        ]}>
                                            {size.name === 'Mediano' ? 'M' : 'G'}
                                        </Text>
                                        {selectedSize?.id === size.id && (
                                            <View style={styles.checkBadge}>
                                                <Text style={styles.checkMark}>✓</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.sizeName,
                                        selectedSize?.id === size.id && styles.sizeNameActive
                                    ]}>
                                        {size.name}
                                    </Text>
                                    {size.price_modifier > 0 && (
                                        <Text style={styles.sizeExtra}>
                                            Solo por +$ {size.price_modifier.toLocaleString('es-AR')}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* === PERSONALIZAR INGREDIENTES (siempre que haya ingredientes) === */}
                {product.ingredients && product.ingredients.length > 0 && (
                    <View style={styles.section}>
                        {/* Si es combo, usamos el título "Completá tu producto" */}
                        {product.is_combo ? (
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Completá tu producto</Text>
                                <View style={styles.obligatoryBadge}>
                                    <Text style={styles.obligatoryText}>Obligatorio</Text>
                                </View>
                            </View>
                        ) : (
                            /* Si no es combo, título simple */
                            <Text style={styles.sectionTitle}>Personalizar {product.name}</Text>
                        )}

                        <TouchableOpacity
                            style={styles.customizeCard}
                            onPress={() => setModalType('ingredients')}
                        >
                            <Image
                                source={{ uri: getImageUrl(product.image_url) }}
                                style={styles.cardIcon}
                                resizeMode="contain"
                            />
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>{product.name}</Text>
                                <Text style={styles.cardSubtitle}>{getIngredientsPreview()}</Text>
                            </View>
                            <Text style={styles.arrow}>›</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* === COMPLETÁ TU COMBO (acompañamiento y bebida) === */}
                {product.is_combo && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Completá tu combo</Text>
                            <View style={styles.obligatoryBadge}>
                                <Text style={styles.obligatoryText}>Obligatorio</Text>
                            </View>
                        </View>

                        {/* Acompañamiento */}
                        <TouchableOpacity
                            style={[
                                styles.selectionCard,
                                selectedSide && styles.selectionCardSelected
                            ]}
                            onPress={() => setModalType('sides')}
                        >
                            <View style={styles.cardLeft}>
                                <Text style={styles.cardTitle}>Acompañamiento</Text>
                                <Text style={[
                                    styles.cardDescription,
                                    selectedSide && styles.cardDescriptionSelected
                                ]}>
                                    {selectedSide
                                        ? selectedSide.name
                                        : 'Elegí una opción (obligatorio)'}
                                </Text>
                            </View>
                            <Text style={styles.arrow}>›</Text>
                        </TouchableOpacity>

                        {/* Bebida */}
                        <TouchableOpacity
                            style={[
                                styles.selectionCard,
                                selectedDrink && styles.selectionCardSelected
                            ]}
                            onPress={() => setModalType('drinks')}
                        >
                            <View style={styles.cardLeft}>
                                <Text style={styles.cardTitle}>Bebida</Text>
                                <Text style={[
                                    styles.cardDescription,
                                    selectedDrink && styles.cardDescriptionSelected
                                ]}>
                                    {selectedDrink
                                        ? selectedDrink.name
                                        : 'Elegí una opción (obligatorio)'}
                                </Text>
                            </View>
                            <Text style={styles.arrow}>›</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Condimentos adicionales — solo si es combo */}
                {product.is_combo && (
                    <TouchableOpacity style={styles.section} onPress={() => setModalType('condiments')}>
                        <View style={styles.condimentsHeader}>
                            <Text style={styles.sectionTitle}>Condimentos adicionales</Text>
                            <TouchableOpacity>
                                <Text style={styles.personalizeLink}>
                                    {Object.values(condiments).filter(Boolean).length > 0
                                        ? `${Object.values(condiments).filter(Boolean).length} seleccionados`
                                        : 'Personalizar'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                )}

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Botón flotante inferior - SIEMPRE visible, con contador y estilo original */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[
                        styles.addButton,
                        !isFormValid() && styles.addButtonDisabled
                    ]}
                    onPress={isFormValid() ? handleAddToCart : undefined}
                    disabled={!isFormValid()}
                >
                    <View style={styles.quantityControlBottom}>
                        <TouchableOpacity
                            disabled={quantity <= 1}
                            onPress={() => setQuantity(q => Math.max(1, q - 1))}
                            style={[styles.quantityButtonBottom, quantity <= 1 && styles.quantityButtonDisabled]}
                        >
                            <Text style={styles.quantityButtonTextBottom}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.quantityTextBottom}>{quantity}</Text>
                        <TouchableOpacity
                            disabled={quantity >= 5}
                            onPress={() => setQuantity(q => Math.min(5, q + 1))}
                            style={[styles.quantityButtonBottom, quantity >= 5 && styles.quantityButtonDisabled]}
                        >
                            <Text style={styles.quantityButtonTextBottom}>+</Text>
                        </TouchableOpacity>
                    </View>
                    {!isFormValid() ? (
                        <Text style={styles.addButtonText}>
                            {(() => {
                                let missing = 0;
                                if (!selectedSize) missing++;
                                if (product?.is_combo) {
                                    if (!selectedSide) missing++;
                                    if (!selectedDrink) missing++;
                                }
                                return missing;
                            })()} selecciones obligatorias
                        </Text>
                    ) : (
                        <Text style={styles.addButtonText}>Agregar</Text>
                    )}

                    {discount > 0 ? (
                        <View style={styles.priceContainer}>
                            <Text style={styles.originalPrice}>
                                $ {subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </Text>
                            <Text style={styles.discountedPrice}>
                                $ {total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.addButtonPrice}>
                            $ {total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Modales */}
            <SelectionModal visible={!!modalType}>
                {modalType === 'condiments' && (
                    <CondimentSelector
                        condiments={[
                            { id: 1, name: 'Ketchup' },
                            { id: 2, name: 'Mostaza' },
                            { id: 3, name: 'Mayonesa' },
                            { id: 4, name: 'Salsa BBQ' },
                        ]}
                        selected={condiments}
                        onChange={setCondiments}
                        onClose={() => setModalType(null)}
                    />
                )}
                {modalType === 'ingredients' && product.ingredients && (
                    <IngredientSelector
                        ingredients={product.ingredients}
                        selected={ingredients}
                        onChange={setIngredients}
                        onClose={() => setModalType(null)}
                    />
                )}
                {modalType === 'sides' && product.sides && (
                    <SideSelector
                        options={product.sides}
                        selected={selectedSide}
                        onSelect={(side) => {
                            setSelectedSide(side);
                            setModalType(null);
                        }}
                        onClose={() => setModalType(null)}
                    />
                )}
                {modalType === 'drinks' && product.drinks && (
                    <DrinkSelector
                        options={product.drinks}
                        selected={selectedDrink}
                        onSelect={(drink) => {
                            setSelectedDrink(drink);
                            setModalType(null);
                        }}
                        onClose={() => setModalType(null)}
                    />
                )}
            </SelectionModal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#DA291C',
        textAlign: 'center',
        marginBottom: 20,
    },
    backLink: {
        fontSize: 16,
        color: '#FFBC0D',
        fontWeight: '600',
    },
    header: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        marginRight: 16,
    },
    backArrow: {
        fontSize: 24,
        color: '#292929',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#292929',
    },
    scrollView: {
        flex: 1,
    },
    productImage: {
        width: '100%',
        height: 300,
        backgroundColor: '#fff',
    },
    infoContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 8,
        borderBottomColor: '#F5F5F5',
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#292929',
        marginBottom: 8,
    },
    productPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#292929',
        marginBottom: 12,
    },
    productDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    section: {
        backgroundColor: '#fff',
        padding: 20,
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#292929',
        marginBottom: 16,
    },
    obligatoryBadge: {
        backgroundColor: '#E0E0E0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    obligatoryText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
    },
    sizeContainer: {
        flexDirection: 'row',
        gap: 20,
    },
    sizeButton: {
        alignItems: 'center',
    },
    sizeCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        position: 'relative',
    },
    sizeCircleActive: {
        borderColor: '#FFBC0D',
        backgroundColor: '#FFF8E1',
    },
    sizeLetter: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#666',
    },
    sizeLetterActive: {
        color: '#292929',
    },
    checkBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FFBC0D',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkMark: {
        color: '#292929',
        fontSize: 14,
        fontWeight: 'bold',
    },
    sizeName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 4,
    },
    sizeNameActive: {
        color: '#292929',
    },
    sizeExtra: {
        fontSize: 12,
        color: '#27AE60',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    customizeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    cardIcon: {
        width: 60,
        height: 60,
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#292929',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    arrow: {
        fontSize: 24,
        color: '#666',
        fontWeight: 'bold',
        paddingLeft: 8,
    },
    selectionCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    selectionCardSelected: {
        backgroundColor: '#FFF8E1',
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    cardLeft: {
        flex: 1,
    },
    cardDescription: {
        fontSize: 14,
        color: '#999',
    },
    cardDescriptionSelected: {
        color: '#292929',
        fontWeight: '600',
    },
    bottomSpacing: {
        height: 150,
    },
    // --- Estilos del botón inferior ---
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    addButton: {
        backgroundColor: '#292929',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 30,
    },
    addButtonDisabled: {
        backgroundColor: '#666',
    },
    quantityControlBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        overflow: 'hidden',
        marginRight: 16,
    },
    quantityButtonBottom: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityButtonDisabled: {
        opacity: 0.4,
    },
    quantityButtonTextBottom: {
        fontSize: 20,
        color: '#292929',
        fontWeight: 'bold',
    },
    quantityTextBottom: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#292929',
        paddingHorizontal: 12,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'left',
    },
    addButtonPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        minWidth: 80,
        textAlign: 'right',
    },
    condimentsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    personalizeLink: {
        fontSize: 14,
        color: '#DA291C',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    couponBanner: {
        backgroundColor: '#E8F5E9',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#27AE60',
    },
    couponBannerIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    couponBannerContent: {
        flex: 1,
    },
    couponBannerTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#27AE60',
        marginBottom: 2,
    },
    couponBannerText: {
        fontSize: 12,
        color: '#666',
    },
    couponBannerClose: {
        fontSize: 20,
        color: '#666',
        padding: 4,
    },
    priceContainer: {
        alignItems: 'flex-end',
        minWidth: 80,
    },
    originalPrice: {
        fontSize: 14,
        color: '#999',
        textDecorationLine: 'line-through',
        fontWeight: '600',
    },
    discountedPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#27AE60',
    },
});