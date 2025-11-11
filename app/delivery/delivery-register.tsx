import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router'; // Navegación entre pantallas
import { useForm, Controller } from 'react-hook-form'; // Manejo de formularios
import { yupResolver } from '@hookform/resolvers/yup'; // Resolución de esquemas de validación
import * as yup from 'yup'; // Validación de esquemas
import { Picker } from '@react-native-picker/picker'; // Selector desplegable
import Checkbox from 'expo-checkbox'; // Componente checkbox
import api from '../../config/api'; // Configuración API para backend
import CustomModal from '../components/CustomModal'; // Modal personalizado
import { useAuth } from '../context/AuthContext'; // Contexto de autenticación


// Definición de tipos de datos para el formulario de repartidor
interface DeliveryFormData {
  username: string;
  email: string;
  full_name: string;
  password: string;
  password2: string;
  birth_date: Date;
  vehicle_type: string;
  address: string;
  availability_days: string[];
  start_time: string;
  end_time: string;
}

// Tipo para opciones de días disponibles
interface DayOption {
  label: string;
  value: string;
}

// Tipo para opciones de tipo de vehículo
interface VehicleOption {
  label: string;
  value: 'bicycle' | 'motorcycle' | 'car' | 'foot';
}

// Schema yup para validar los datos del formulario con mensajes de error personalizados
const schema = yup.object({
  username: yup.string().required('Usuario requerido').min(3, 'Mínimo 3 caracteres'),
  email: yup.string().required('Email requerido').email('Email inválido'),
  full_name: yup.string().required('Nombre completo requerido').min(3, 'Mínimo 3 caracteres'),
  password: yup.string().required('Contraseña requerida').min(6, 'Mínimo 6 caracteres'),
  password2: yup.string().required('Confirmación requerida').oneOf([yup.ref('password')], 'Las contraseñas no coinciden'),
  birth_date: yup.date().required('Fecha de nacimiento requerida'),
  vehicle_type: yup.string().required('Selecciona tu medio de transporte').oneOf(['bicycle', 'motorcycle', 'car', 'foot'], 'Tipo de vehículo inválido'),
  address: yup.string().required('Dirección requerida'),
  availability_days: yup.array().min(1, 'Selecciona al menos un día de disponibilidad').required('Días de disponibilidad requeridos'),
  start_time: yup.string().required('Hora de inicio requerida'),
  end_time: yup.string().required('Hora de fin requerida')
});

// Lista de días de la semana para seleccionar disponibilidad
const daysOfWeek: DayOption[] = [
  { label: 'Lunes', value: 'monday' },
  { label: 'Martes', value: 'tuesday' },
  { label: 'Miércoles', value: 'wednesday' },
  { label: 'Jueves', value: 'thursday' },
  { label: 'Viernes', value: 'friday' },
  { label: 'Sábado', value: 'saturday' },
  { label: 'Domingo', value: 'sunday' }
];

// Opciones para el tipo de vehículo con emojis para UI
const vehicleTypes: VehicleOption[] = [
  { label: '🚲 Bicicleta', value: 'bicycle' },
  { label: '🏍️ Moto', value: 'motorcycle' },
  { label: '🚗 Auto', value: 'car' },
  { label: '🚶 A pie', value: 'foot' }
];

export default function DeliveryRegister() {
  const router = useRouter(); // Hook de navegación
  const { user: existingUser, login } = useAuth(); // Usuario autenticado y función para login
  const [loading, setLoading] = useState<boolean>(false); // Estado para mostrar loader
  const [modalVisible, setModalVisible] = useState<boolean>(false); // Estado para mostrar modal
  const [modalType, setModalType] = useState<'info' | 'delete'>('info'); // Tipo de modal
  const [modalTitle, setModalTitle] = useState<string>(''); // Título modal
  const [modalMessage, setModalMessage] = useState<string>(''); // Mensaje modal


  // Configuración de react-hook-form con yup para validación y valores por defecto
  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<DeliveryFormData>({
    resolver: yupResolver(schema) as any,
    mode: 'onTouched',
    defaultValues: {
      username: '',
      email: '',
      full_name: '',
      password: '',
      password2: '',
      birth_date: new Date(Date.now() - 568025136000), // Fecha default (aprox 18 años atrás)
      vehicle_type: '',
      address: '',
      start_time: '09:00',
      end_time: '18:00',
      availability_days: []
    }
  });

  // Observar el valor del campo vehicle_type para UI reactiva
  const selectedVehicle = watch('vehicle_type');

  // Función para mostrar modal con datos dinámicos
  const showModal = (type: 'info' | 'delete', title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  // Función para ejecutar al enviar el formulario
  const onSubmit = async (data: DeliveryFormData) => {
    try {
      setLoading(true); // Mostrar loader

      let userId: number;
      let userToken: string;
      let userData: any;

      // Si no hay usuario autenticado, registrar uno nuevo
      if (!existingUser) {
        const userPayload = {
          username: data.username,
          email: data.email,
          full_name: data.full_name,
          password: data.password
        };

        // Registro via API
        const userRes = await api.post('/auth/register', userPayload);
        userId = userRes.data.user.id;
        userToken = userRes.data.token;
        userData = userRes.data.user;

        // Login automático con el nuevo token y datos
        await login(userToken, userData);
      } else {
        // Si ya hay usuario logueado usar sus datos
        userId = existingUser.id;
        userToken = useAuth().token!;
        userData = existingUser;
      }

      // Payload con datos adicionales para crear perfil de repartidor
      const driverPayload = {
        user_id: userId,
        birth_date: data.birth_date.toISOString().split('T')[0], // Formatear fecha ISO sin hora
        vehicle_type: data.vehicle_type,
        address: data.address,
        availability_days: data.availability_days,
        start_time: data.start_time,
        end_time: data.end_time
      };

      // Registro de repartidor en backend con autenticación
      await api.post('/delivery/register', driverPayload, {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });

      // Mostrar modal de éxito
      showModal('info', '¡Éxito!', '¡Ya sos repartidor! Ahora podés recibir pedidos en la app.');

      // Redireccionar a pantalla principal después de 2 segundos
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2000);

    } catch (error: any) {
      // En caso de error mostrar mensaje
      console.error('Error en registro:', error);
      const errorMsg = error.response?.data?.error || 'Error al registrar como repartidor';
      showModal('delete', 'Error', errorMsg);
    } finally {
      setLoading(false); // Ocultar loader
    }
  };

  // Función para alternar la selección de días disponibles en el formulario
  const toggleDay = (day: string) => {
    const currentDays = watch('availability_days') || [];
    let newDays: string[];

    // Si ya está seleccionado se quita, si no se agrega
    if (currentDays.includes(day)) {
      newDays = currentDays.filter(d => d !== day);
    } else {
      newDays = [...currentDays, day];
    }

    // Actualizar el formulario con los días nuevos y validar
    setValue('availability_days', newDays, { shouldValidate: true });
  };

  // Genera opciones de horario en formato HH:mm para seleccionar
  const generateTimeOptions = () => {
    const times: string[] = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      times.push(`${hour}:00`, `${hour}:30`);
    }
    return times;
  };

  const timeOptions = generateTimeOptions(); // Guardar opciones a usar en Picker

  // Renderizado del formulario dentro de ScrollView para scroll en móviles
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.scaledContainer}>
        <View style={styles.card}>
          {/* Logo y título */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>M</Text>
          </View>

          <Text style={styles.title}>Ser Repartidor</Text>
          <Text style={styles.subtitle}>Completa tus datos para empezar a repartir</Text>

          {/* Sección Información Personal */}
          <Text style={styles.sectionTitle}>Información Personal</Text>

          {/* Solo mostrar campos usuario y contraseña si no hay usuario logueado */}
          {!existingUser && (
            <>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Controller
                    control={control}
                    name="username"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <TextInput
                          style={[styles.input, errors.username && styles.inputError]}
                          placeholder="Usuario"
                          onChangeText={onChange}
                          value={value || ''}
                          onBlur={onBlur}
                          placeholderTextColor="#999"
                        />
                        {errors.username && <Text style={styles.error}>{errors.username.message}</Text>}
                      </>
                    )}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Controller
                    control={control}
                    name="full_name"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <TextInput
                          style={[styles.input, errors.full_name && styles.inputError]}
                          placeholder="Nombre completo"
                          onChangeText={onChange}
                          value={value || ''}
                          onBlur={onBlur}
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
                render={({ field: { onChange, value, onBlur } }) => (
                  <>
                    <TextInput
                      style={[styles.input, errors.email && styles.inputError]}
                      placeholder="Email"
                      keyboardType="email-address"
                      onChangeText={onChange}
                      value={value || ''}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      placeholderTextColor="#999"
                    />
                    {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
                  </>
                )}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <TextInput
                          style={[styles.input, errors.password && styles.inputError]}
                          placeholder="Contraseña"
                          secureTextEntry
                          onChangeText={onChange}
                          value={value || ''}
                          onBlur={onBlur}
                          placeholderTextColor="#999"
                        />
                        {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
                      </>
                    )}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Controller
                    control={control}
                    name="password2"
                    render={({ field: { onChange, value, onBlur } }) => (
                      <>
                        <TextInput
                          style={[styles.input, errors.password2 && styles.inputError]}
                          placeholder="Repetir contraseña"
                          secureTextEntry
                          onChangeText={onChange}
                          value={value || ''}
                          onBlur={onBlur}
                          placeholderTextColor="#999"
                        />
                        {errors.password2 && <Text style={styles.error}>{errors.password2.message}</Text>}
                      </>
                    )}
                  />
                </View>
              </View>
            </>
          )}

          {/* Fecha de nacimiento con input tipo date para web */}
          <Controller
            control={control}
            name="birth_date"
            render={({ field: { onChange, value } }) => (
              <>
                <Text style={styles.label}>📅 Fecha de nacimiento:</Text>
                <input
                  type="date"
                  style={{
                    ...styles.webDateInput,
                    ...(errors.birth_date ? styles.inputError : {}),
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  value={value ? value.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    onChange(newDate);
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
                {errors.birth_date && <Text style={styles.error}>{errors.birth_date.message}</Text>}
              </>
            )}
          />

          {/* Sección información adicional para repartidor */}
          <Text style={styles.sectionTitle}>Información de Repartidor</Text>

          {/* Selector para tipo de vehículo */}
          <Controller
            control={control}
            name="vehicle_type"
            render={({ field: { onChange, value } }) => (
              <>
                <View style={[styles.pickerContainer, errors.vehicle_type && styles.inputError]}>
                  <Picker
                    selectedValue={value || ''}
                    onValueChange={onChange}
                    style={styles.picker}
                    dropdownIconColor="#666"
                  >
                    <Picker.Item
                      label="🚗 Selecciona tu vehículo"
                      value=""
                      style={styles.pickerPlaceholder}
                    />
                    {vehicleTypes.map(vehicle => (
                      <Picker.Item
                        key={vehicle.value}
                        label={vehicle.label}
                        value={vehicle.value}
                        style={styles.pickerItem}
                      />
                    ))}
                  </Picker>
                </View>
                {errors.vehicle_type && <Text style={styles.error}>{errors.vehicle_type.message}</Text>}
              </>
            )}
          />

          {/* Input para dirección completa */}
          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, value, onBlur } }) => (
              <>
                <TextInput
                  style={[styles.input, styles.addressInput, errors.address && styles.inputError]}
                  placeholder="🏠 Dirección completa"
                  onChangeText={onChange}
                  value={value || ''}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={2}
                  placeholderTextColor="#999"
                />
                {errors.address && <Text style={styles.error}>{errors.address.message}</Text>}
              </>
            )}
          />

          {/* Disponibilidad días y horarios */}
          <Text style={styles.sectionTitle}>Disponibilidad</Text>

          {/* Selector de días de la semana con checkboxes */}
          <Text style={styles.label}>📅 Días disponibles:</Text>
          <View style={styles.daysContainer}>
            {daysOfWeek.map(day => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayButton,
                  watch('availability_days')?.includes(day.value) && styles.dayButtonSelected
                ]}
                onPress={() => toggleDay(day.value)}
              >
                <Checkbox
                  value={watch('availability_days')?.includes(day.value) || false}
                  onValueChange={() => toggleDay(day.value)}
                  color={watch('availability_days')?.includes(day.value) ? '#FFBC0D' : '#E0E0E0'}
                />
                <Text style={[
                  styles.dayLabel,
                  watch('availability_days')?.includes(day.value) && styles.dayLabelSelected
                ]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.availability_days && <Text style={styles.error}>{errors.availability_days.message}</Text>}

          {/* Selector de horario inicio y fin */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Controller
                control={control}
                name="start_time"
                render={({ field: { onChange, value } }) => (
                  <>
                    <Text style={styles.label}>🕒 Hora de inicio:</Text>
                    <View style={[styles.pickerContainer, styles.timePicker]}>
                      <Picker
                        selectedValue={value || '09:00'}
                        onValueChange={onChange}
                        style={styles.picker}
                        dropdownIconColor="#666"
                      >
                        {timeOptions.map(time => (
                          <Picker.Item
                            key={time}
                            label={time}
                            value={time}
                            style={styles.pickerItem}
                          />
                        ))}
                      </Picker>
                    </View>
                    {errors.start_time && <Text style={styles.error}>{errors.start_time.message}</Text>}
                  </>
                )}
              />
            </View>

            <View style={styles.halfInput}>
              <Controller
                control={control}
                name="end_time"
                render={({ field: { onChange, value } }) => (
                  <>
                    <Text style={styles.label}>🕖 Hora de fin:</Text>
                    <View style={[styles.pickerContainer, styles.timePicker]}>
                      <Picker
                        selectedValue={value || '18:00'}
                        onValueChange={onChange}
                        style={styles.picker}
                        dropdownIconColor="#666"
                      >
                        {timeOptions.map(time => (
                          <Picker.Item
                            key={time}
                            label={time}
                            value={time}
                            style={styles.pickerItem}
                          />
                        ))}
                      </Picker>
                    </View>
                    {errors.end_time && <Text style={styles.error}>{errors.end_time.message}</Text>}
                  </>
                )}
              />
            </View>
          </View>

          {/* Botón para enviar formulario, con indicador de carga cuando está procesando */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#292929" />
            ) : (
              <Text style={styles.buttonText}>🚀 Aplicar a este puesto</Text>
            )}
          </TouchableOpacity>

          {/* Botón para volver atrás */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
        </View>

        {/* Modal personalizado para mostrar información o errores */}
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

// Estilos de los componentes para la UI usando StyleSheet de React Native
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
    transform: [{ scale: 0.85 }],
    width: '100%',
    alignItems: 'center',
    marginTop: -30,
    marginBottom: -30,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#fff',
    padding: 28,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#FFBC0D',
    textShadowColor: '#DA291C',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  title: {
    fontSize: 24,
    marginBottom: 6,
    textAlign: 'center',
    color: '#292929',
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#292929',
    marginTop: 14,
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#FFBC0D',
    paddingBottom: 4
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 12,
    marginBottom: 6,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    fontSize: 14,
    color: '#292929',
  },
  addressInput: {
    minHeight: 50,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#DA291C',
    borderStyle: 'solid',
    borderWidth: 2,
  },
  error: {
    color: '#DA291C',
    alignSelf: 'flex-start',
    marginBottom: 4,
    fontSize: 11,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
  },
  timePicker: {
    minHeight: 45,
  },
  picker: {
    height: 45,
    color: '#292929',
  },
  pickerPlaceholder: {
    fontSize: 13,
    color: '#999',
  },
  pickerItem: {
    fontSize: 13,
    color: '#292929',
  },
  webDateInput: {
    width: '100%',
    padding: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    fontSize: 14,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#292929',
    marginBottom: 6,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  dayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 6,
    padding: 6,
    borderRadius: 6,
  },
  dayButtonSelected: {
    backgroundColor: 'rgba(255, 188, 13, 0.1)',
  },
  dayLabel: {
    marginLeft: 6,
    fontSize: 13,
    color: '#666',
  },
  dayLabelSelected: {
    color: '#292929',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#FFBC0D',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 14,
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
    fontSize: 15,
    fontWeight: 'bold'
  },
  backButton: {
    padding: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#DA291C',
    fontSize: 14,
    fontWeight: '600',
  },
});
