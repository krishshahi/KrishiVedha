import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import farmsReducer from './slices/farmsSlice';
import weatherReducer from './slices/weatherSlice';
import communityReducer from './slices/communitySlice';
import dashboardReducer from './slices/dashboardSlice';
import syncReducer from './slices/syncSlice';
import notificationReducer from './slices/notificationSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'user', 'sync', 'notifications'], // Persist Phase 2 state for offline support
};

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  farms: farmsReducer,
  weather: weatherReducer,
  community: communityReducer,
  dashboard: dashboardReducer,
  sync: syncReducer,
  notifications: notificationReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV === 'development',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export { useAppSelector, useAppDispatch } from './hooks';

