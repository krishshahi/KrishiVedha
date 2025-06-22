import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiService, { ApiFarm } from '../../services/apiService';

export interface FarmsState {
  farms: ApiFarm[];
  userFarms: ApiFarm[];
  currentFarm: ApiFarm | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: FarmsState = {
  farms: [],
  userFarms: [],
  currentFarm: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchFarms = createAsyncThunk(
  'farms/fetchFarms',
  async (_, { rejectWithValue }) => {
    try {
      const farms = await apiService.getFarms();
      return farms;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch farms');
    }
  }
);

export const fetchUserFarms = createAsyncThunk(
  'farms/fetchUserFarms',
  async (userId: string, { rejectWithValue }) => {
    try {
      const farms = await apiService.getFarmsByUserId(userId);
      return farms;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user farms');
    }
  }
);

export const fetchFarmById = createAsyncThunk(
  'farms/fetchFarmById',
  async (farmId: string, { rejectWithValue }) => {
    try {
      const farm = await apiService.getFarmById(farmId);
      return farm;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch farm');
    }
  }
);

export const createFarm = createAsyncThunk(
  'farms/createFarm',
  async (farmData: Omit<ApiFarm, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const newFarm = await apiService.createFarm(farmData);
      return newFarm;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create farm');
    }
  }
);

export const updateFarm = createAsyncThunk(
  'farms/updateFarm',
  async ({ farmId, farmData }: { farmId: string; farmData: Partial<ApiFarm> }, { rejectWithValue }) => {
    try {
      const updatedFarm = await apiService.updateFarm(farmId, farmData);
      return updatedFarm;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update farm');
    }
  }
);

export const deleteFarm = createAsyncThunk(
  'farms/deleteFarm',
  async (farmId: string, { rejectWithValue }) => {
    try {
      await apiService.deleteFarm(farmId);
      return farmId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete farm');
    }
  }
);

export const searchFarms = createAsyncThunk(
  'farms/searchFarms',
  async (query: string, { rejectWithValue }) => {
    try {
      const farms = await apiService.searchFarms(query);
      return farms;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search farms');
    }
  }
);

const farmsSlice = createSlice({
  name: 'farms',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentFarm: (state, action: PayloadAction<ApiFarm>) => {
      state.currentFarm = action.payload;
    },
    clearCurrentFarm: (state) => {
      state.currentFarm = null;
    },
    clearFarms: (state) => {
      state.farms = [];
      state.userFarms = [];
      state.currentFarm = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all farms
      .addCase(fetchFarms.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFarms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.farms = action.payload;
      })
      .addCase(fetchFarms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch user farms
      .addCase(fetchUserFarms.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserFarms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userFarms = action.payload;
      })
      .addCase(fetchUserFarms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch farm by ID
      .addCase(fetchFarmById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFarmById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentFarm = action.payload;
        // Update farm in lists if exists
        const allFarmIndex = state.farms.findIndex(farm => farm.id === action.payload.id);
        if (allFarmIndex !== -1) {
          state.farms[allFarmIndex] = action.payload;
        }
        const userFarmIndex = state.userFarms.findIndex(farm => farm.id === action.payload.id);
        if (userFarmIndex !== -1) {
          state.userFarms[userFarmIndex] = action.payload;
        }
      })
      .addCase(fetchFarmById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create farm
      .addCase(createFarm.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createFarm.fulfilled, (state, action) => {
        state.isLoading = false;
        state.farms.push(action.payload);
        state.userFarms.push(action.payload);
        state.currentFarm = action.payload;
      })
      .addCase(createFarm.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update farm
      .addCase(updateFarm.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateFarm.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update farm in all lists
        const allFarmIndex = state.farms.findIndex(farm => farm.id === action.payload.id);
        if (allFarmIndex !== -1) {
          state.farms[allFarmIndex] = action.payload;
        }
        const userFarmIndex = state.userFarms.findIndex(farm => farm.id === action.payload.id);
        if (userFarmIndex !== -1) {
          state.userFarms[userFarmIndex] = action.payload;
        }
        if (state.currentFarm && state.currentFarm.id === action.payload.id) {
          state.currentFarm = action.payload;
        }
      })
      .addCase(updateFarm.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete farm
      .addCase(deleteFarm.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteFarm.fulfilled, (state, action) => {
        state.isLoading = false;
        state.farms = state.farms.filter(farm => farm.id !== action.payload);
        state.userFarms = state.userFarms.filter(farm => farm.id !== action.payload);
        if (state.currentFarm && state.currentFarm.id === action.payload) {
          state.currentFarm = null;
        }
      })
      .addCase(deleteFarm.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Search farms
      .addCase(searchFarms.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchFarms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.farms = action.payload;
      })
      .addCase(searchFarms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentFarm, clearCurrentFarm, clearFarms } = farmsSlice.actions;
export default farmsSlice.reducer;

