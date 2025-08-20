import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService from '../../services/apiService';

export interface WeatherData {
  id?: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  condition: string;
  location: string;
  timestamp: string;
}

export interface WeatherState {
  currentWeather: WeatherData | null;
  forecast: WeatherData[];
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: WeatherState = {
  currentWeather: null,
  forecast: [],
  isLoading: false,
  error: null,
  lastFetched: null,
};

// Async thunks
export const fetchWeatherData = createAsyncThunk(
  'weather/fetchWeatherData',
  async (params: { lat?: number; lng?: number; farmId?: string } = {}, { rejectWithValue }) => {
    try {
      const weatherData = await apiService.getWeatherData(params);
      return weatherData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch weather data');
    }
  }
);

export const fetchWeatherByLocation = createAsyncThunk(
  'weather/fetchByLocation',
  async ({ lat, lng }: { lat: number; lng: number }, { rejectWithValue }) => {
    try {
      const weatherData = await apiService.getWeatherData({ lat, lng });
      return weatherData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch weather for location');
    }
  }
);

export const fetchWeatherByFarm = createAsyncThunk(
  'weather/fetchByFarm',
  async (farmId: string, { rejectWithValue }) => {
    try {
      const weatherData = await apiService.getWeatherData({ farmId });
      return weatherData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch weather for farm');
    }
  }
);

const weatherSlice = createSlice({
  name: 'weather',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentWeather: (state, action: PayloadAction<WeatherData>) => {
      state.currentWeather = action.payload;
      state.lastFetched = new Date().toISOString();
    },
    clearWeatherData: (state) => {
      state.currentWeather = null;
      state.forecast = [];
      state.lastFetched = null;
    },
    addToForecast: (state, action: PayloadAction<WeatherData>) => {
      state.forecast.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch weather data
      .addCase(fetchWeatherData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWeatherData.fulfilled, (state, action) => {
        state.isLoading = false;
        const weatherArray = action.payload;
        if (weatherArray && weatherArray.length > 0) {
          // First item is current weather
          state.currentWeather = weatherArray[0];
          // Rest are forecast
          state.forecast = weatherArray.slice(1);
          state.lastFetched = new Date().toISOString();
        }
      })
      .addCase(fetchWeatherData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch weather by location
      .addCase(fetchWeatherByLocation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWeatherByLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        const weatherArray = action.payload;
        if (weatherArray && weatherArray.length > 0) {
          state.currentWeather = weatherArray[0];
          state.forecast = weatherArray.slice(1);
          state.lastFetched = new Date().toISOString();
        }
      })
      .addCase(fetchWeatherByLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch weather by farm
      .addCase(fetchWeatherByFarm.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWeatherByFarm.fulfilled, (state, action) => {
        state.isLoading = false;
        const weatherArray = action.payload;
        if (weatherArray && weatherArray.length > 0) {
          state.currentWeather = weatherArray[0];
          state.forecast = weatherArray.slice(1);
          state.lastFetched = new Date().toISOString();
        }
      })
      .addCase(fetchWeatherByFarm.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentWeather, clearWeatherData, addToForecast } = weatherSlice.actions;
export default weatherSlice.reducer;

