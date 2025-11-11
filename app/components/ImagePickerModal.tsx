// app/components/ImagePickerModal.tsx
import React, { useState, useRef, useEffect } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from "react-native";
import CustomModal from './CustomModal';

type PickerMode = 'image' | 'document';

interface ImagePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onTakePhoto: () => void;
    onChooseGallery: () => void;
    onCaptureWebcam?: (file: File) => void;
    mode?: PickerMode;
}

export default function ImagePickerModal({
    visible,
    onClose,
    onTakePhoto,
    onChooseGallery,
    onCaptureWebcam,
    mode = 'image',
}: ImagePickerModalProps) {
    const [showWebcam, setShowWebcam] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [modalState, setModalState] = useState<{
        visible: boolean;
        type: 'success' | 'error' | 'info' | 'delete';
        title: string;
        message: string;
        showCancel?: boolean;
        onConfirm?: () => void;
    }>({
        visible: false,
        type: 'info',
        title: '',
        message: '',
    });

    useEffect(() => {
        if (!visible) {
            stopWebcam();
            setShowWebcam(false);
        }
    }, [visible]);

    const startWebcam = async () => {
        if (Platform.OS !== 'web' || mode !== 'image') return;

        try {
            console.log('📷 Starting webcam...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false,
            });

            streamRef.current = stream;

            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(err => {
                        console.error('Error playing video:', err);
                    });
                    console.log('✅ Webcam started and playing');
                }
            }, 100);

            setShowWebcam(true);
        } catch (error) {
            console.error('❌ Error starting webcam:', error);
            setModalState({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'No se pudo acceder a la cámara. Verifica los permisos.',
                onConfirm: () => {
                    setModalState(prev => ({ ...prev, visible: false }));
                    onClose();
                }
            });
            setShowWebcam(false);
        }
    };

    const stopWebcam = () => {
        if (streamRef.current) {
            console.log('🛑 Stopping webcam...');
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || Platform.OS !== 'web' || mode !== 'image') return;

        console.log('📸 Capturing photo...');
        if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
            console.error('❌ Video not ready');
            setModalState({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'El video no está listo. Espera un momento e intenta de nuevo.',
                onConfirm: () => setModalState(prev => ({ ...prev, visible: false }))
            });
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (blob && onCaptureWebcam) {
                    const file = new File([blob], `webcam-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    onCaptureWebcam(file);
                    stopWebcam();
                    setShowWebcam(false);
                    onClose();
                } else {
                    console.error('❌ Failed to create blob');
                    setModalState({
                        visible: true,
                        type: 'error',
                        title: 'Error',
                        message: 'Error al capturar la foto. Intenta de nuevo.',
                        onConfirm: () => setModalState(prev => ({ ...prev, visible: false }))
                    });
                }
            }, 'image/jpeg', 0.8);
        }
    };

    const handleTakePhoto = () => {
        if (Platform.OS === 'web' && mode === 'image') {
            startWebcam();
        } else {
            onTakePhoto();
            onClose();
        }
    };

    const handleChooseGallery = () => {
        if (Platform.OS === 'web' && onCaptureWebcam) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = mode === 'document' ? '.jpg,.jpeg,.png,.pdf' : 'image/*';
            
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    console.log(`📁 ${mode === 'document' ? 'Documento' : 'Imagen'} seleccionado:`, file.name, file.type, file.size);
                    onCaptureWebcam(file);
                }
                onClose();
            };
            
            input.click();
        } else {
            onChooseGallery();
            onClose();
        }
    };

    if (Platform.OS === 'web' && showWebcam && mode === 'image') {
        return (
            <>
                <Modal visible={visible} transparent animationType="fade">
                    <View style={styles.overlay}>
                        <View style={styles.webcamContainer}>
                            <Text style={styles.webcamTitle}>📷 Tomar foto</Text>
                            <View style={styles.videoWrapper}>
                                <video
                                    ref={(ref) => {
                                        videoRef.current = ref;
                                    }}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: 12,
                                        backgroundColor: '#000',
                                        transform: 'scaleX(-1)',
                                    }}
                                    autoPlay
                                    playsInline
                                    muted
                                />
                            </View>
                            <View style={[styles.buttonContainer, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => {
                                        stopWebcam();
                                        setShowWebcam(false);
                                    }}
                                >
                                    <Text style={styles.cancelText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.confirmButton}
                                    onPress={capturePhoto}
                                >
                                    <Text style={styles.confirmText}>📸 Capturar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <CustomModal
                    visible={modalState.visible}
                    type={modalState.type}
                    title={modalState.title}
                    message={modalState.message}
                    showCancel={modalState.showCancel}
                    onConfirm={modalState.onConfirm}
                    onCancel={() => setModalState(prev => ({ ...prev, visible: false }))}
                />
            </>
        );
    }

    const isDocument = mode === 'document';
    const title = isDocument ? '🪪 Subir documento' : '📷 Foto de perfil';
    const message = isDocument
        ? 'Selecciona una imagen del documento'
        : 'Selecciona una opción';

    return (
        <>
            <Modal visible={visible} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>

                        <View style={styles.buttonContainer}>
                            {!isDocument && (
                                <TouchableOpacity
                                    style={styles.optionButton}
                                    onPress={handleTakePhoto}
                                >
                                    <Text style={styles.optionText}>
                                        {Platform.OS === 'web' ? '📷 Usar cámara' : '📷 Tomar foto'}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.optionButton}
                                onPress={handleChooseGallery}
                            >
                                <Text style={styles.optionText}>
                                    {isDocument ? '📎 Elegir de galería' : '🖼️ Elegir de galería'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <CustomModal
                visible={modalState.visible}
                type={modalState.type}
                title={modalState.title}
                message={modalState.message}
                showCancel={modalState.showCancel}
                onConfirm={modalState.onConfirm}
                onCancel={() => setModalState(prev => ({ ...prev, visible: false }))}
            />
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContainer: {
        width: "40%",
        minWidth: 320,
        maxWidth: 400,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        elevation: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FA8072",
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        color: "#333",
        textAlign: "center",
        marginBottom: 20,
    },
    buttonContainer: {
        width: "100%",
        gap: 10,
    },
    optionButton: {
        width: "100%",
        backgroundColor: "#FA8072",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    optionText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    closeButton: {
        marginTop: 10,
        paddingVertical: 10,
    },
    closeText: {
        textAlign: "center",
        color: "#666",
        fontWeight: "600",
    },
    webcamContainer: {
        width: '90%',
        maxWidth: 500,
        minWidth: 300,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
        elevation: 10,
    },
    webcamTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#FA8072",
        marginBottom: 16,
    },
    videoWrapper: {
        width: '100%',
        maxWidth: 400,
        aspectRatio: 1,
        backgroundColor: "#000",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 16,
        height: 300,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: "#e0e0e0",
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 5,
    },
    confirmButton: {
        flex: 1,
        backgroundColor: "#FA8072",
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 5,
    },
    cancelText: {
        textAlign: "center",
        color: "#333",
        fontWeight: "600",
        fontSize: 14,
    },
    confirmText: {
        textAlign: "center",
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
});