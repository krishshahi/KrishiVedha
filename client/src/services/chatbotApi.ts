import { getBaseURL } from '../config/apiConfig';

// Initialize with default URL, will be updated dynamically
let CHATBOT_API_URL = 'http://10.10.13.97:3000/api/chatbot';

// Update the URL dynamically
getBaseURL().then(baseUrl => {
  CHATBOT_API_URL = `${baseUrl}/chatbot`;
}).catch(console.error);

export interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string; // ISO string instead of Date object for Redux serialization
  suggestions?: string[];
}

export interface ChatbotResponse {
  success: boolean;
  data: {
    response: string;
    suggestions?: string[];
    context?: string;
  };
  error?: string;
}

export const chatbotApi = {
  // Send message to chatbot with agricultural context
  sendMessage: async (message: string, sessionId: string, userId?: string): Promise<ChatbotResponse> => {
    try {
      const response = await fetch(`${CHATBOT_API_URL}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId,
          userId,
          context: 'agriculture', // Always set agricultural context
          language: 'hi-en', // Hindi-English mixed
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Chatbot API error:', error);
      // Return fallback agricultural response
      return getFallbackAgriculturalResponse(message);
    }
  },

  // Get agricultural suggestions based on category
  getAgriculturalSuggestions: async (category?: string): Promise<string[]> => {
    try {
      const url = category 
        ? `${CHATBOT_API_URL}/suggestions?category=${category}&domain=agriculture`
        : `${CHATBOT_API_URL}/suggestions?domain=agriculture`;
        
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.suggestions || getDefaultAgriculturalSuggestions(category);
    } catch (error) {
      console.error('Get suggestions error:', error);
      return getDefaultAgriculturalSuggestions(category);
    }
  },

  // Get crop-specific advice
  getCropAdvice: async (cropName: string, issue?: string): Promise<ChatbotResponse> => {
    try {
      const response = await fetch(`${CHATBOT_API_URL}/crop-advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cropName,
          issue,
          language: 'hi-en',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get crop advice error:', error);
      return getFallbackCropAdvice(cropName, issue);
    }
  },

  // Get weather-based farming advice
  getWeatherAdvice: async (weatherCondition: string, season: string): Promise<ChatbotResponse> => {
    try {
      const response = await fetch(`${CHATBOT_API_URL}/weather-advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weatherCondition,
          season,
          language: 'hi-en',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get weather advice error:', error);
      return getFallbackWeatherAdvice(weatherCondition, season);
    }
  },

  // Get market price information
  getMarketInfo: async (cropName: string, location?: string): Promise<ChatbotResponse> => {
    try {
      const response = await fetch(`${CHATBOT_API_URL}/market-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cropName,
          location,
          language: 'hi-en',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get market info error:', error);
      return getFallbackMarketInfo(cropName, location);
    }
  },

  // Get chat history (if user is logged in)
  getChatHistory: async (token: string): Promise<ChatMessage[]> => {
    try {
      const response = await fetch(`${CHATBOT_API_URL}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Get chat history error:', error);
      return [];
    }
  },
};

// Fallback agricultural responses when API is unavailable
const getFallbackAgriculturalResponse = (message: string): ChatbotResponse => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('crop') || lowerMessage.includes('fasal')) {
    return {
      success: true,
      data: {
        response: "फसल के बारे में जानकारी के लिए मैं यहाँ हूँ। कृपया बताएं कि आप किस फसल के बारे में जानना चाहते हैं - गेहूं, चावल, मक्का, या कोई और फसल?",
        suggestions: ['Wheat farming', 'Rice cultivation', 'Corn planting', 'Seasonal crops'],
      }
    };
  }
  
  if (lowerMessage.includes('weather') || lowerMessage.includes('mausam')) {
    return {
      success: true,
      data: {
        response: "मौसम की जानकारी के लिए मैं आपकी मदद कर सकता हूँ। कृपया बताएं कि आप किस तरह की मौसम सलाह चाहते हैं - बारिश के लिए तैयारी, गर्मी से बचाव, या ठंड के मौसम की खेती?",
        suggestions: ['Monsoon preparation', 'Summer farming', 'Winter crops', 'Weather forecast'],
      }
    };
  }
  
  if (lowerMessage.includes('pest') || lowerMessage.includes('disease') || lowerMessage.includes('keeda')) {
    return {
      success: true,
      data: {
        response: "फसलों में कीट और रोग की समस्या के लिए मैं सलाह दे सकता हूँ। कृपया बताएं कि आपकी फसल में क्या समस्या है - पत्तियों पर धब्बे, कीड़े, या फसल का मुरझाना?",
        suggestions: ['Pest control', 'Disease treatment', 'Organic solutions', 'Chemical spray'],
      }
    };
  }
  
  if (lowerMessage.includes('soil') || lowerMessage.includes('mitti')) {
    return {
      success: true,
      data: {
        response: "मिट्टी की जांच और सुधार के बारे में मैं जानकारी दे सकता हूँ। मिट्टी की उर्वरता बढ़ाने के लिए जैविक खाद, कंपोस्ट, और सही उर्वरक का उपयोग जरूरी है।",
        suggestions: ['Soil testing', 'Organic fertilizer', 'Compost making', 'pH balance'],
      }
    };
  }
  
  if (lowerMessage.includes('market') || lowerMessage.includes('price') || lowerMessage.includes('mandi')) {
    return {
      success: true,
      data: {
        response: "बाजार की जानकारी के लिए मैं आपकी सहायता कर सकता हूँ। कृपया बताएं कि आप किस फसल की कीमत जानना चाहते हैं? मैं वर्तमान मंडी भाव और बेचने का सही समय बता सकता हूँ।",
        suggestions: ['Current prices', 'Market trends', 'Best selling time', 'Mandi rates'],
      }
    };
  }
  
  return {
    success: true,
    data: {
      response: "नमस्ते! मैं KrishiVedha सहायक हूँ। मैं खेती-बाड़ी, फसलों की देखभाल, मौसम की जानकारी, और कृषि तकनीक के बारे में आपकी मदद कर सकता हूँ। आप मुझसे क्या जानना चाहते हैं?",
      suggestions: ['Crop guidance', 'Weather advice', 'Pest control', 'Market prices'],
    }
  };
};

// Default agricultural suggestions
const getDefaultAgriculturalSuggestions = (category?: string): string[] => {
  const suggestions: Record<string, string[]> = {
    crops: ['Rice cultivation tips', 'Wheat farming guide', 'Corn planting season', 'Vegetable gardening'],
    weather: ['Monsoon preparation', 'Drought management', 'Winter farming', 'Summer crop care'],
    pest: ['Organic pest control', 'Disease prevention', 'Natural remedies', 'IPM techniques'],
    soil: ['Soil health check', 'Composting guide', 'Fertilizer recommendations', 'pH testing'],
    market: ['Current crop prices', 'Market analysis', 'Selling strategies', 'Price trends'],
    equipment: ['Tractor maintenance', 'Tool recommendations', 'Modern equipment', 'Cost-effective tools'],
    default: ['How to increase crop yield?', 'Best crops for this season?', 'Organic farming tips', 'Government farming schemes']
  };
  
  return suggestions[category || 'default'] || suggestions.default;
};

// Fallback crop advice
const getFallbackCropAdvice = (cropName: string, issue?: string): ChatbotResponse => {
  return {
    success: true,
    data: {
      response: `${cropName} की खेती के लिए सामान्य सलाह: उचित बीज का चयन करें, सही समय पर बुआई करें, नियमित सिंचाई करें, और कीट-रोग से बचाव के लिए नियमित निगरानी रखें। ${issue ? `आपकी समस्या "${issue}" के लिए विशेषज्ञ से सलाह लेना बेहतर होगा।` : ''}`,
      suggestions: ['Seed selection', 'Planting time', 'Irrigation schedule', 'Fertilizer application'],
    }
  };
};

// Fallback weather advice
const getFallbackWeatherAdvice = (weatherCondition: string, season: string): ChatbotResponse => {
  return {
    success: true,
    data: {
      response: `${season} के मौसम में ${weatherCondition} की स्थिति के लिए सामान्य सलाह: फसलों को मौसम के अनुकूल तैयार करें, पानी की व्यवस्था करें, और आवश्यक सुरक्षा उपाय अपनाएं।`,
      suggestions: ['Weather preparation', 'Crop protection', 'Water management', 'Emergency measures'],
    }
  };
};

// Fallback market information
const getFallbackMarketInfo = (cropName: string, location?: string): ChatbotResponse => {
  return {
    success: true,
    data: {
      response: `${cropName} की वर्तमान बाजार जानकारी के लिए स्थानीय मंडी से संपर्क करें। ${location ? `${location} में` : ''} बेहतर कीमत के लिए गुणवत्ता पर ध्यान दें और सही समय पर बेचें।`,
      suggestions: ['Local mandi rates', 'Quality standards', 'Storage tips', 'Direct selling'],
    }
  };
};

export default chatbotApi;
