// front/utils/geocoding.ts
import api from '../../config/api';

export const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
  try {
    const response = await api.get('/geocode', {
      params: { latitude: lat, longitude: lon }
    });

    const data = response.data;
    if (data.address) {
      const addr = data.address;
      const parts = [
        addr.road, addr.house_number, addr.neighbourhood, addr.suburb,
        addr.city || addr.town || addr.village, addr.state,
        addr.postcode ? `CP ${addr.postcode}` : null, addr.country
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : data.display_name;
    }
    return `Lat: ${lat.toFixed(6)}, Lng: ${lon.toFixed(6)}`;
  } catch (error) {
    console.error('Error en geocodificación inversa:', error);
    return `Lat: ${lat.toFixed(6)}, Lng: ${lon.toFixed(6)}`;
  }
};