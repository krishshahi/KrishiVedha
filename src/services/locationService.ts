import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface NepalLocation {
  coords: LocationCoords;
  region: string; // Terai, Hill, Mountain
  district: string;
  zone: string;
  municipality?: string;
}

// Nepal administrative regions data
const NEPAL_DISTRICTS = {
  // Terai Region
  terai: [
    'Jhapa', 'Morang', 'Sunsari', 'Saptari', 'Siraha', 'Dhanusha', 'Mahottari',
    'Sarlahi', 'Rautahat', 'Bara', 'Parsa', 'Chitwan', 'Nawalpur', 'Rupandehi',
    'Kapilvastu', 'Dang', 'Banke', 'Bardiya', 'Kailali', 'Kanchanpur'
  ],
  // Hill Region
  hill: [
    'Panchthar', 'Ilam', 'Dhankuta', 'Terhathum', 'Sankhuwasabha', 'Bhojpur',
    'Solukhumbu', 'Okhaldhunga', 'Khotang', 'Udayapur', 'Sindhuli', 'Ramechhap',
    'Dolakha', 'Sindhupalchok', 'Kavrepalanchok', 'Lalitpur', 'Bhaktapur',
    'Kathmandu', 'Nuwakot', 'Rasuwa', 'Dhading', 'Makwanpur', 'Sindhuli',
    'Chitwan', 'Gorkha', 'Lamjung', 'Tanahu', 'Syangja', 'Kaski', 'Manang',
    'Mustang', 'Myagdi', 'Parbat', 'Baglung', 'Gulmi', 'Palpa', 'Arghakhanchi',
    'Pyuthan', 'Rolpa', 'Rukum', 'Salyan', 'Surkhet', 'Dailekh', 'Jajarkot',
    'Dolpa', 'Jumla', 'Kalikot', 'Mugu', 'Humla', 'Bajura', 'Bajhang',
    'Achham', 'Doti', 'Kailali', 'Dadeldhura', 'Baitadi', 'Darchula'
  ],
  // Mountain Region
  mountain: [
    'Taplejung', 'Sankhuwasabha', 'Solukhumbu', 'Rasuwa', 'Manang', 'Mustang',
    'Dolpa', 'Jumla', 'Kalikot', 'Mugu', 'Humla'
  ]
};

class LocationService {
  /**
   * Request location permissions
   */
  async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'KrishiVeda needs access to your location to provide weather updates',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Location permission error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  }

  /**
   * Get current location coordinates
   */
  async getCurrentLocation(): Promise<LocationCoords> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Location error:', error);
          reject(new Error('Unable to get location'));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000
        }
      );
    });
  }

  /**
   * Get location with Nepal-specific region information
   */
  async getNepalLocation(): Promise<NepalLocation> {
    try {
      const coords = await this.getCurrentLocation();
      const region = this.determineNepalRegion(coords.latitude, coords.longitude);
      const district = await this.getDistrictFromCoords(coords.latitude, coords.longitude);
      
      const location: NepalLocation = {
        coords,
        region: region.name,
        district: district || 'Unknown',
        zone: region.zone
      };
      
      // Save location for offline use
      await this.saveLocationToStorage(location);
      
      return location;
    } catch (error) {
      // Try to get saved location if GPS fails
      const savedLocation = await this.getSavedLocation();
      if (savedLocation) {
        return savedLocation;
      }
      throw error;
    }
  }

  /**
   * Determine Nepal region based on coordinates
   */
  private determineNepalRegion(lat: number, lon: number): { name: string; zone: string } {
    // Rough geographical boundaries for Nepal regions
    // These are approximate and would need more precise data in production
    
    if (lat < 27.0) {
      return { name: 'Terai', zone: 'Southern Plains' };
    } else if (lat < 28.5) {
      return { name: 'Hill', zone: 'Mid Hills' };
    } else {
      return { name: 'Mountain', zone: 'High Mountains' };
    }
  }

  /**
   * Get district name from coordinates (simplified version)
   */
  private async getDistrictFromCoords(lat: number, lon: number): Promise<string | null> {
    // In a real app, this would use reverse geocoding API
    // For now, return a default based on major cities
    
    // Kathmandu area
    if (lat >= 27.6 && lat <= 27.8 && lon >= 85.2 && lon <= 85.4) {
      return 'Kathmandu';
    }
    // Chitwan area
    if (lat >= 27.4 && lat <= 27.7 && lon >= 84.2 && lon <= 84.6) {
      return 'Chitwan';
    }
    // Pokhara area
    if (lat >= 28.1 && lat <= 28.3 && lon >= 83.8 && lon <= 84.1) {
      return 'Kaski';
    }
    
    return null;
  }

  /**
   * Get major Nepal cities for weather selection
   */
  getMajorCities(): Array<{ name: string; nameNp: string; coords: LocationCoords; region: string }> {
    return [
      {
        name: 'Kathmandu',
        nameNp: 'काठमाडौं',
        coords: { latitude: 27.7172, longitude: 85.3240 },
        region: 'Hill'
      },
      {
        name: 'Pokhara',
        nameNp: 'पोखरा',
        coords: { latitude: 28.2096, longitude: 83.9856 },
        region: 'Hill'
      },
      {
        name: 'Chitwan',
        nameNp: 'चितवन',
        coords: { latitude: 27.5291, longitude: 84.3542 },
        region: 'Terai'
      },
      {
        name: 'Biratnagar',
        nameNp: 'विराटनगर',
        coords: { latitude: 26.4525, longitude: 87.2718 },
        region: 'Terai'
      },
      {
        name: 'Birgunj',
        nameNp: 'वीरगञ्ज',
        coords: { latitude: 27.0098, longitude: 84.8821 },
        region: 'Terai'
      },
      {
        name: 'Dharan',
        nameNp: 'धरान',
        coords: { latitude: 26.8022, longitude: 87.2799 },
        region: 'Hill'
      },
      {
        name: 'Butwal',
        nameNp: 'बुटवल',
        coords: { latitude: 27.7025, longitude: 83.4486 },
        region: 'Terai'
      },
      {
        name: 'Dhangadhi',
        nameNp: 'धनगढी',
        coords: { latitude: 28.6960, longitude: 80.5898 },
        region: 'Terai'
      }
    ];
  }

  /**
   * Save location to local storage
   */
  private async saveLocationToStorage(location: NepalLocation): Promise<void> {
    try {
      await AsyncStorage.setItem('user_location', JSON.stringify(location));
    } catch (error) {
      console.error('Error saving location:', error);
    }
  }

  /**
   * Get saved location from storage
   */
  async getSavedLocation(): Promise<NepalLocation | null> {
    try {
      const savedLocation = await AsyncStorage.getItem('user_location');
      return savedLocation ? JSON.parse(savedLocation) : null;
    } catch (error) {
      console.error('Error getting saved location:', error);
      return null;
    }
  }

  /**
   * Set manual location (when GPS is not available)
   */
  async setManualLocation(cityName: string): Promise<NepalLocation | null> {
    const cities = this.getMajorCities();
    const city = cities.find(c => c.name === cityName || c.nameNp === cityName);
    
    if (city) {
      const location: NepalLocation = {
        coords: city.coords,
        region: city.region,
        district: cityName,
        zone: city.region === 'Terai' ? 'Southern Plains' : 
              city.region === 'Hill' ? 'Mid Hills' : 'High Mountains'
      };
      
      await this.saveLocationToStorage(location);
      return location;
    }
    
    return null;
  }

  /**
   * Calculate distance between two coordinates (in km)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

export default new LocationService();

