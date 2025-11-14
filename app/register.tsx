import React, { useState, useEffect } from 'react';
import { Image, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import api, { API_URL } from '../config/api';
import { Platform } from 'react-native';
import GoogleIcon from '../assets/google-icon.png';
import CustomModal from './components/CustomModal';
import { useAuth } from './context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

type FormData = {
  username: string;
  email: string;
  full_name: string;
  password: string;
  password2: string;
};

const schema = yup.object({
  username: yup.string()
    .required('Nombre requerido')
    .min(3, 'Mínimo 3 caracteres'),
  email: yup.string()
    .required('Email requerido')
    .email('Email inválido')
    .matches(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'El email debe contener @ y un dominio válido'
    ),
  full_name: yup.string()
    .required('Nombre completo requerido')
    .min(3, 'Mínimo 3 caracteres'),
  password: yup.string()
    .required('Contraseña requerida')
    .min(6, 'Mínimo 6 caracteres'),
  password2: yup.string()
    .required('Confirmación requerida')
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden')
});

export default function Register() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login: authLogin } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'delete'>('info');
  const [modalTitle, setModalTitle] = useState('Aviso');
  const [modalMessage, setModalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingAuth, setProcessingAuth] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  const isMobile = screenWidth < 768;

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: 'onTouched'
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleAuth(id_token);
    }
  }, [response]);

  const handleGoogleAuth = async (idToken: string) => {
    if (processingAuth) return;

    try {
      setProcessingAuth(true);
      setLoading(true);

      if (Platform.OS === 'web') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      console.log('🔐 Enviando token a backend...');

      const res = await api.post('/auth/google/register', { id_token: idToken });
      const { token, user } = res.data;

      console.log('👤 Usuario recibido del backend:', user);
      console.log('📸 URL de foto de perfil:', user.profile_image_url);

      try {
        const rolesRes = await api.get(`/roles/user/${user.id}/roles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        user.roles = rolesRes.data.roles || [];
      } catch (rolesError) {
        console.warn('⚠️ No se pudieron obtener los roles:', rolesError);
        user.roles = [];
      }

      console.log('💾 Guardando en AuthContext:', user);

      await authLogin(token, user);
      router.replace('/');

    } catch (err: any) {
      console.error('❌ Error en handleGoogleAuth:', err);
      console.error('📄 Respuesta del servidor:', err?.response?.data);

      let message = 'Error al registrar con Google';
      if (err?.response?.data?.error) {
        message = err.response.data.error;
        if (message.includes('ya está registrado')) {
          message += '. Por favor inicia sesión en lugar de registrarte.';
        }
      }
      setModalType('delete');
      setModalTitle('Error');
      setModalMessage(message);
      setModalVisible(true);

    } finally {
      setLoading(false);
      setProcessingAuth(false);
    }
  };

  const showModal = (type: 'info' | 'delete', title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      const payload = {
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        password: data.password
      };
      const res = await api.post('/auth/register', payload);
      const { token, user } = res.data;

      const rolesRes = await api.get(`/roles/user/${user.id}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      user.roles = rolesRes.data.roles || [];

      await authLogin(token, user);
      router.replace('/');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Error al registrar';
      showModal('delete', 'Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginWeb = () => {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const redirectUri = window.location.origin;
    const scope = 'openid profile email';
    const responseType = 'id_token';
    const nonce = Math.random().toString(36).substring(7);

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=${responseType}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `nonce=${nonce}&` +
      `prompt=select_account`;

    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(authUrl, 'Google Register', `width=${width},height=${height},left=${left},top=${top}`);
    if (!popup) {
      setModalType('delete');
      setModalTitle('Error');
      setModalMessage('Por favor permite los popups para esta página');
      setModalVisible(true);
      return;
    }

    const checkPopup = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(checkPopup);
          setLoading(false);
          return;
        }

        if (popup.location.href.startsWith(redirectUri)) {
          const hash = popup.location.hash;
          if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const idToken = params.get('id_token');
            if (idToken) {
              popup.close();
              clearInterval(checkPopup);
              handleGoogleAuth(idToken);
            }
          }
        }
      } catch (error) { }
    }, 500);

    setTimeout(() => {
      if (popup && !popup.closed) {
        popup.close();
        clearInterval(checkPopup);
        setModalType('delete');
        setModalTitle('Error');
        setModalMessage('El tiempo de autenticación ha expirado');
        setModalVisible(true);
        setLoading(false);
      }
    }, 120000);
  };

  const handleGoogleLoginMobile = () => {
    promptAsync();
  };

  const handleGoogleRegister = () => {
    if (Platform.OS === 'web') {
      setLoading(true);
      handleGoogleLoginWeb();
    } else {
      handleGoogleLoginMobile();
    }
  };

  if (processingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFBC0D" />
        <Text style={styles.loadingText}>Registrando con Google...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.scaledContainer}>
          <View style={styles.card}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>M</Text>
            </View>

            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Unite y empezá a disfrutar</Text>

            <View style={isMobile ? styles.columnLayout : styles.rowLayout}>
              <View style={isMobile ? styles.fullWidth : styles.halfWidth}>
                <Controller
                  control={control}
                  name="username"
                  defaultValue=""
                  render={({ field: { onChange, value, onBlur } }) => (
                    <>
                      <TextInput
                        style={[styles.input, errors.username && styles.inputError]}
                        placeholder="Usuario"
                        onChangeText={onChange}
                        value={value}
                        onBlur={onBlur}
                        autoCapitalize="words"
                        placeholderTextColor="#999"
                      />
                      {errors.username && <Text style={styles.error}>{errors.username.message}</Text>}
                    </>
                  )}
                />
              </View>

              <View style={isMobile ? styles.fullWidth : styles.halfWidth}>
                <Controller
                  control={control}
                  name="full_name"
                  defaultValue=""
                  render={({ field: { onChange, value, onBlur } }) => (
                    <>
                      <TextInput
                        style={[styles.input, errors.full_name && styles.inputError]}
                        placeholder="Nombre y apellido"
                        onChangeText={onChange}
                        value={value}
                        onBlur={onBlur}
                        autoCapitalize="words"
                        placeholderTextColor="#999"
                      />
                      {errors.full_name && <Text style={styles.error}>{errors.full_name.message}</Text>}
                    </>
                  )}
                />
              </View>
            </View>

            <Controller
              control={control}
              name="email"
              defaultValue=""
              render={({ field: { onChange, value, onBlur } }) => (
                <>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Email"
                    keyboardType="email-address"
                    onChangeText={onChange}
                    value={value}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    placeholderTextColor="#999"
                  />
                  {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
                </>
              )}
            />

            <View style={isMobile ? styles.columnLayout : styles.rowLayout}>
              <View style={isMobile ? styles.fullWidth : styles.halfWidth}>
                <Controller
                  control={control}
                  name="password"
                  defaultValue=""
                  render={({ field: { onChange, value, onBlur } }) => (
                    <>
                      <TextInput
                        style={[styles.input, errors.password && styles.inputError]}
                        placeholder="Contraseña"
                        secureTextEntry
                        onChangeText={onChange}
                        value={value}
                        onBlur={onBlur}
                        placeholderTextColor="#999"
                      />
                      {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
                    </>
                  )}
                />
              </View>

              <View style={isMobile ? styles.fullWidth : styles.halfWidth}>
                <Controller
                  control={control}
                  name="password2"
                  defaultValue=""
                  render={({ field: { onChange, value, onBlur } }) => (
                    <>
                      <TextInput
                        style={[styles.input, errors.password2 && styles.inputError]}
                        placeholder="Repetir contraseña"
                        secureTextEntry
                        onChangeText={onChange}
                        value={value}
                        onBlur={onBlur}
                        onSubmitEditing={handleSubmit(onSubmit)}
                        placeholderTextColor="#999"
                      />
                      {errors.password2 && <Text style={styles.error}>{errors.password2.message}</Text>}
                    </>
                  )}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#292929" />
              ) : (
                <Text style={styles.buttonText}>Crear cuenta</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.socialButton, loading && styles.buttonDisabled]}
              onPress={handleGoogleRegister}
              disabled={loading}
            >
              <Image source={GoogleIcon} style={styles.googleIcon} />
              <Text style={styles.socialButtonText}>Registrarse con Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/signin')}>
              <Text style={styles.link}>¿Ya tenés cuenta? <Text style={styles.linkBold}>Ingresá acá</Text></Text>
            </TouchableOpacity>
          </View>
          {/* Botón para ser repartidor */}
          <TouchableOpacity
            style={styles.deliveryButton}
            onPress={() => router.push('/delivery-register')}
          >
            <Text style={styles.deliveryButtonText}>¿Querés ser repartidor?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.backButtonText}>← Volver al inicio</Text>
          </TouchableOpacity>
        </View>

        <CustomModal
          visible={modalVisible}
          type={modalType}
          title={modalTitle}
          message={modalMessage}
          confirmText="Aceptar"
          onConfirm={() => setModalVisible(false)}
          onCancel={() => setModalVisible(false)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    minHeight: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: '100%',
  },
  scaledContainer: {
    transform: [{ scale: 0.80 }],
    width: '100%',
    alignItems: 'center',
    marginTop: -50,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFBC0D',
    textShadowColor: '#DA291C',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
    color: '#292929',
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24
  },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 14,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    fontSize: 15,
    color: '#292929',
  },
  inputError: {
    borderColor: '#DA291C',
  },
  error: {
    color: '#DA291C',
    alignSelf: 'flex-start',
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#FFBC0D',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#FFBC0D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: '#292929',
    fontSize: 16,
    fontWeight: 'bold'
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0'
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#999',
    fontSize: 13,
    fontWeight: '500',
  },
  socialButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 13,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  socialButtonText: {
    fontSize: 15,
    color: '#292929',
    fontWeight: '600'
  },
  link: {
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
  linkBold: {
    color: '#DA291C',
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    padding: 12,
  },
  backButtonText: {
    color: '#DA291C',
    fontSize: 15,
    fontWeight: '600',
  },
  rowLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 0,
  },
  columnLayout: {
    flexDirection: 'column',
    gap: 0,
    marginBottom: 0,
  },
  halfWidth: {
    flex: 1,
  },
  fullWidth: {
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  deliveryButton: {
    backgroundColor: '#292929',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFBC0D',
  },
  deliveryButtonText: {
    color: '#FFBC0D',
    fontSize: 16,
    fontWeight: 'bold'
  },
});