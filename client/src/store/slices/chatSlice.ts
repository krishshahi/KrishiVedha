// Chat Redux Slice - State Management for Agricultural Chatbot
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { chatbotApi, ChatMessage, ChatbotResponse } from '../../services/chatbotApi';

// Async thunks for API calls
export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ message, sessionId, userId }: { message: string; sessionId: string; userId?: string }, { rejectWithValue }) => {
    try {
      const response = await chatbotApi.sendMessage(message, sessionId, userId);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to send message');
    }
  }
);

export const getCropAdvice = createAsyncThunk(
  'chat/getCropAdvice',
  async ({ cropName, issue }: { cropName: string; issue?: string }, { rejectWithValue }) => {
    try {
      const response = await chatbotApi.getCropAdvice(cropName, issue);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to get crop advice');
    }
  }
);

export const getWeatherAdvice = createAsyncThunk(
  'chat/getWeatherAdvice',
  async ({ weatherCondition, season }: { weatherCondition: string; season: string }, { rejectWithValue }) => {
    try {
      const response = await chatbotApi.getWeatherAdvice(weatherCondition, season);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to get weather advice');
    }
  }
);

export const getMarketInfo = createAsyncThunk(
  'chat/getMarketInfo',
  async ({ cropName, location }: { cropName: string; location?: string }, { rejectWithValue }) => {
    try {
      const response = await chatbotApi.getMarketInfo(cropName, location);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to get market info');
    }
  }
);

export const getAgriculturalSuggestions = createAsyncThunk(
  'chat/getSuggestions',
  async (category?: string, { rejectWithValue }) => {
    try {
      const suggestions = await chatbotApi.getAgriculturalSuggestions(category);
      return suggestions;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to get suggestions');
    }
  }
);

export const loadChatHistory = createAsyncThunk(
  'chat/loadHistory',
  async (token: string, { rejectWithValue }) => {
    try {
      const messages = await chatbotApi.getChatHistory(token);
      return messages;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load chat history');
    }
  }
);

// Chat state interface
export interface ChatState {
  // Messages
  messages: ChatMessage[];
  sessionId: string;
  
  // UI state
  isOpen: boolean;
  isTyping: boolean;
  inputText: string;
  
  // Agricultural context
  currentTopic?: 'crops' | 'weather' | 'pest' | 'soil' | 'market' | 'equipment' | 'general';
  currentCrop?: string;
  
  // Suggestions
  suggestions: string[];
  quickActions: string[];
  
  // Loading states
  loading: {
    sending: boolean;
    suggestions: boolean;
    history: boolean;
  };
  
  // Error state
  error: string | null;
  
  // Settings
  language: 'hi' | 'en' | 'hi-en';
  autoSuggestions: boolean;
  
  // Usage analytics (for improving responses)
  analytics: {
    totalMessages: number;
    topicsDiscussed: string[];
    mostUsedSuggestions: string[];
    userSatisfactionRatings: number[];
  };
}

const initialState: ChatState = {
  // Initialize with welcome message
  messages: [
    {
      id: '1',
      text: "Namaste! मैं KrishiVedha Assistant हूँ। I'm here to help you with farming, crop management, weather insights, and agricultural best practices. How can I assist you today? 🌾",
      isBot: true,
      timestamp: new Date().toISOString(),
      suggestions: [
        'Crop recommendations',
        'Weather advice',
        'Pest control',
        'Market prices',
        'Soil health',
        'Government schemes'
      ],
    },
  ],
  sessionId: Date.now().toString(),
  
  // UI state
  isOpen: false,
  isTyping: false,
  inputText: '',
  
  // Agricultural context
  currentTopic: 'general',
  
  // Suggestions
  suggestions: [
    'How to increase crop yield?',
    'Best crops for this season?',
    'Organic farming tips',
    'Government farming schemes',
    'Weather forecast',
    'Pest control methods'
  ],
  quickActions: [
    'Weather update',
    'Market prices',
    'Crop calendar',
    'Disease alerts',
    'Irrigation tips',
    'Fertilizer guide'
  ],
  
  // Loading states
  loading: {
    sending: false,
    suggestions: false,
    history: false,
  },
  
  // Error state
  error: null,
  
  // Settings
  language: 'hi-en', // Hindi-English mixed
  autoSuggestions: true,
  
  // Analytics
  analytics: {
    totalMessages: 0,
    topicsDiscussed: [],
    mostUsedSuggestions: [],
    userSatisfactionRatings: [],
  },
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // UI actions
    toggleChatOpen: (state) => {
      state.isOpen = !state.isOpen;
    },
    
    setChatOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
    
    setInputText: (state, action: PayloadAction<string>) => {
      state.inputText = action.payload;
    },
    
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    
    // Message actions
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
      state.analytics.totalMessages++;
      
      // Update topic tracking
      if (!action.payload.isBot) {
        const message = action.payload.text.toLowerCase();
        const topics = ['crops', 'weather', 'pest', 'soil', 'market', 'equipment'];
        topics.forEach(topic => {
          if (message.includes(topic) || 
              (topic === 'crops' && (message.includes('fasal') || message.includes('crop'))) ||
              (topic === 'weather' && (message.includes('mausam') || message.includes('weather'))) ||
              (topic === 'pest' && (message.includes('keeda') || message.includes('disease'))) ||
              (topic === 'soil' && (message.includes('mitti') || message.includes('soil'))) ||
              (topic === 'market' && (message.includes('mandi') || message.includes('price')))) {
            if (!state.analytics.topicsDiscussed.includes(topic)) {
              state.analytics.topicsDiscussed.push(topic);
            }
          }
        });
      }
    },
    
    updateLastMessage: (state, action: PayloadAction<Partial<ChatMessage>>) => {
      if (state.messages.length > 0) {
        const lastMessage = state.messages[state.messages.length - 1];
        Object.assign(lastMessage, action.payload);
      }
    },
    
    clearMessages: (state) => {
      state.messages = [initialState.messages[0]]; // Keep welcome message
      state.sessionId = Date.now().toString();
    },
    
    // Context actions
    setCurrentTopic: (state, action: PayloadAction<ChatState['currentTopic']>) => {
      state.currentTopic = action.payload;
    },
    
    setCurrentCrop: (state, action: PayloadAction<string>) => {
      state.currentCrop = action.payload;
    },
    
    // Suggestions
    setSuggestions: (state, action: PayloadAction<string[]>) => {
      state.suggestions = action.payload;
    },
    
    addUsedSuggestion: (state, action: PayloadAction<string>) => {
      const suggestion = action.payload;
      const existing = state.analytics.mostUsedSuggestions.find(s => s === suggestion);
      if (!existing) {
        state.analytics.mostUsedSuggestions.push(suggestion);
      }
    },
    
    // Settings
    setLanguage: (state, action: PayloadAction<ChatState['language']>) => {
      state.language = action.payload;
    },
    
    toggleAutoSuggestions: (state) => {
      state.autoSuggestions = !state.autoSuggestions;
    },
    
    // Analytics
    addSatisfactionRating: (state, action: PayloadAction<number>) => {
      state.analytics.userSatisfactionRatings.push(action.payload);
    },
    
    // Error handling
    clearError: (state) => {
      state.error = null;
    },
    
    // Reset state
    resetChatState: () => initialState,
    
    // Quick actions
    sendQuickMessage: (state, action: PayloadAction<string>) => {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: action.payload,
        isBot: false,
        timestamp: new Date().toISOString(),
      };
      state.messages.push(userMessage);
      state.analytics.totalMessages++;
      
      // Track used suggestion
      if (state.suggestions.includes(action.payload) || state.quickActions.includes(action.payload)) {
        const existing = state.analytics.mostUsedSuggestions.find(s => s === action.payload);
        if (!existing) {
          state.analytics.mostUsedSuggestions.push(action.payload);
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Send message
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.loading.sending = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loading.sending = false;
        
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: action.payload.data.response,
          isBot: true,
          timestamp: new Date().toISOString(),
          suggestions: action.payload.data.suggestions,
        };
        
        state.messages.push(botMessage);
        
        if (action.payload.data.suggestions) {
          state.suggestions = action.payload.data.suggestions;
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.loading.sending = false;
        state.error = action.payload as string;
      });
    
    // Get crop advice
    builder
      .addCase(getCropAdvice.fulfilled, (state, action) => {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: action.payload.data.response,
          isBot: true,
          timestamp: new Date().toISOString(),
          suggestions: action.payload.data.suggestions,
        };
        
        state.messages.push(botMessage);
        state.currentTopic = 'crops';
        
        if (action.payload.data.suggestions) {
          state.suggestions = action.payload.data.suggestions;
        }
      });
    
    // Get weather advice
    builder
      .addCase(getWeatherAdvice.fulfilled, (state, action) => {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: action.payload.data.response,
          isBot: true,
          timestamp: new Date().toISOString(),
          suggestions: action.payload.data.suggestions,
        };
        
        state.messages.push(botMessage);
        state.currentTopic = 'weather';
        
        if (action.payload.data.suggestions) {
          state.suggestions = action.payload.data.suggestions;
        }
      });
    
    // Get market info
    builder
      .addCase(getMarketInfo.fulfilled, (state, action) => {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: action.payload.data.response,
          isBot: true,
          timestamp: new Date().toISOString(),
          suggestions: action.payload.data.suggestions,
        };
        
        state.messages.push(botMessage);
        state.currentTopic = 'market';
        
        if (action.payload.data.suggestions) {
          state.suggestions = action.payload.data.suggestions;
        }
      });
    
    // Get suggestions
    builder
      .addCase(getAgriculturalSuggestions.pending, (state) => {
        state.loading.suggestions = true;
      })
      .addCase(getAgriculturalSuggestions.fulfilled, (state, action) => {
        state.loading.suggestions = false;
        state.suggestions = action.payload;
      })
      .addCase(getAgriculturalSuggestions.rejected, (state) => {
        state.loading.suggestions = false;
      });
    
    // Load chat history
    builder
      .addCase(loadChatHistory.pending, (state) => {
        state.loading.history = true;
      })
      .addCase(loadChatHistory.fulfilled, (state, action) => {
        state.loading.history = false;
        // Prepend history messages before welcome message
        state.messages = [...action.payload, ...initialState.messages];
      })
      .addCase(loadChatHistory.rejected, (state) => {
        state.loading.history = false;
      });
  },
});

export const {
  toggleChatOpen,
  setChatOpen,
  setInputText,
  setTyping,
  addMessage,
  updateLastMessage,
  clearMessages,
  setCurrentTopic,
  setCurrentCrop,
  setSuggestions,
  addUsedSuggestion,
  setLanguage,
  toggleAutoSuggestions,
  addSatisfactionRating,
  clearError,
  resetChatState,
  sendQuickMessage,
} = chatSlice.actions;

// Selectors
export const selectChatMessages = (state: { chat: ChatState }) => state.chat.messages;
export const selectChatIsOpen = (state: { chat: ChatState }) => state.chat.isOpen;
export const selectChatLoading = (state: { chat: ChatState }) => state.chat.loading;
export const selectChatSuggestions = (state: { chat: ChatState }) => state.chat.suggestions;
export const selectChatAnalytics = (state: { chat: ChatState }) => state.chat.analytics;
export const selectCurrentTopic = (state: { chat: ChatState }) => state.chat.currentTopic;

export default chatSlice.reducer;
