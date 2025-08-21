import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatbotApi } from '../services/chatbotApi';

const { width, height } = Dimensions.get('window');

// Note: In production, this should be handled by the backend
const GOOGLE_AI_API_KEY = 'AIzaSyA4qMrYF6YroFWGuPcLLd-jNEakVhU7QzM';

const FloatingChatbot: React.FC = () => {
  const { user } = useSelector((state: any) => state.auth);
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Namaste! I'm KrishiVedha Assistant. I'm here to help you with farming, crop management, weather insights, and agricultural best practices. How can I assist you today? 🌾",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(Date.now().toString());
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Drag functionality
  const translateX = useRef(new Animated.Value(width - 76)).current; // Start at right edge
  const translateY = useRef(new Animated.Value(height - 200)).current; // Start near bottom
  const lastOffset = useRef({ x: width - 76, y: height - 200 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  const toggleChat = () => {
    // Only toggle if not dragging
    if (!isDragging) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      setIsOpen(!isOpen);
    }
  };

  // Handle drag gesture
  const onGestureEvent = Animated.event(
    [{
      nativeEvent: {
        translationX: translateX,
        translationY: translateY,
      },
    }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event: any) => {
    const { state, translationX, translationY } = event.nativeEvent;
    
    if (state === State.BEGAN) {
      setIsDragging(false);
    } else if (state === State.ACTIVE) {
      const totalDistance = Math.sqrt(translationX * translationX + translationY * translationY);
      if (totalDistance > 15) {
        setIsDragging(true);
      }
    } else if (state === State.END) {
      const wasDragging = isDragging;
      setIsDragging(false);
      
      const totalDistance = Math.sqrt(translationX * translationX + translationY * translationY);
      if (totalDistance < 15 && !wasDragging) {
        return;
      }
      
      const newX = lastOffset.current.x + translationX;
      const newY = lastOffset.current.y + translationY;
      
      const constrainedX = Math.max(
        10,
        Math.min(width - 66, newX)
      );
      const constrainedY = Math.max(
        insets.top + 50,
        Math.min(height - insets.bottom - 120, newY)
      );
      
      const snapToLeftEdge = constrainedX < width / 2;
      const finalX = snapToLeftEdge ? 20 : width - 76;
      
      lastOffset.current = { x: finalX, y: constrainedY };
      
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: finalX,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }),
        Animated.spring(translateY, {
          toValue: constrainedY,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }),
      ]).start();
      
      translateX.setOffset(finalX);
      translateY.setOffset(constrainedY);
      translateX.setValue(0);
      translateY.setValue(0);
    }
  };

  const sendMessageToGoogleAI = async (message: string) => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GOOGLE_AI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are KrishiVedha Assistant, a helpful AI chatbot specialized in Indian agriculture and farming. Help farmers and agricultural enthusiasts with:

              🌾 Crop management and selection
              🌦️ Weather and seasonal guidance  
              🐛 Pest and disease management
              🌱 Soil health and fertilization
              💰 Market prices and trends
              🚜 Farm equipment and technology
              📚 Government schemes and subsidies
              🔬 Modern farming techniques and best practices

              Provide practical, actionable advice in a friendly, supportive tone. Use Hindi terms when appropriate (with English explanations). Keep responses concise but informative.

              User message: ${message}`
            }]
          }]
        }),
      });

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble right now. Please try again.";
    } catch (error) {
      console.error('Google AI error:', error);
      throw error;
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText.trim();
    setInputText('');
    setIsTyping(true);

    try {
      // Try Google AI first
      const aiResponse = await sendMessageToGoogleAI(messageText);
      
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          text: aiResponse,
          isBot: true,
          timestamp: new Date(),
          suggestions: getSuggestionsForMessage(messageText),
        };

        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000);

    } catch (error) {
      console.error('AI Chatbot error:', error);
      // Fallback to local responses
      try {
        const data = await chatbotApi.sendMessage(messageText, sessionId, user?.id);
        
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            text: data.data?.response || "I'm having trouble right now. Please try again.",
            isBot: true,
            timestamp: new Date(),
            suggestions: data.data?.suggestions || [],
          };

          setMessages(prev => [...prev, botMessage]);
          setIsTyping(false);
        }, 1000);
      } catch (fallbackError) {
        console.error('Fallback chatbot error:', fallbackError);
        setTimeout(() => {
          const errorMessage = {
            id: Date.now() + 1,
            text: "I'm having trouble connecting. Please try again later.",
            isBot: true,
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, errorMessage]);
          setIsTyping(false);
        }, 1000);
      }
    }
  };

  const getSuggestionsForMessage = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('crop') || lowerMessage.includes('fasal')) {
      return ['Crop recommendations', 'Seasonal planting guide', 'Crop diseases help'];
    }
    if (lowerMessage.includes('weather') || lowerMessage.includes('mausam')) {
      return ['Weather forecast', 'Seasonal advice', 'Irrigation planning'];
    }
    if (lowerMessage.includes('pest') || lowerMessage.includes('disease') || lowerMessage.includes('keeda')) {
      return ['Pest identification', 'Disease treatment', 'Organic solutions'];
    }
    if (lowerMessage.includes('soil') || lowerMessage.includes('mitti')) {
      return ['Soil testing', 'Fertilizer advice', 'Soil improvement'];
    }
    if (lowerMessage.includes('market') || lowerMessage.includes('price') || lowerMessage.includes('mandi')) {
      return ['Market prices', 'Best selling time', 'Market trends'];
    }
    
    return ['Crop guidance', 'Weather info', 'Market prices', 'Government schemes'];
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
    setTimeout(() => {
      sendMessage();
    }, 100);
  };

  const renderMessage = (message: any) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isBot ? styles.botMessage : styles.userMessage,
      ]}
    >
      <Text style={[
        styles.messageText,
        message.isBot ? styles.botText : styles.userText,
      ]}>
        {message.text}
      </Text>
      {message.suggestions && message.suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {message.suggestions.map((suggestion: string, index: number) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionButton}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderTypingIndicator = () => (
    <View style={[styles.messageContainer, styles.botMessage]}>
      <View style={styles.typingContainer}>
        <View style={styles.typingDot} />
        <View style={styles.typingDot} />
        <View style={styles.typingDot} />
      </View>
    </View>
  );

  return (
    <>
      {/* Chat Window */}
      <Animated.View
        style={[
          styles.chatContainer,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [height, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <KeyboardAvoidingView
          style={styles.chatContent}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.chatHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.botAvatar}>
                <Icon name="agriculture" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.headerTitle}>KrishiVedha Assistant</Text>
                <Text style={styles.headerSubtitle}>🌾 Agricultural Expert</Text>
              </View>
            </View>
            <TouchableOpacity onPress={toggleChat} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
          >
            {messages.map(renderMessage)}
            {isTyping && renderTypingIndicator()}
          </ScrollView>

          {/* Input */}
          <View style={[
            styles.inputContainer,
            { paddingBottom: Math.max(16, insets.bottom + 8) }
          ]}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about farming, crops, weather..."
              multiline
              maxLength={500}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={[
                styles.sendButton,
                { opacity: inputText.trim() ? 1 : 0.5 }
              ]}
              disabled={!inputText.trim()}
            >
              <Icon name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Floating Button */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        minDist={5}
        shouldCancelWhenOutside={false}
        enabled={true}
      >
        <Animated.View
          style={[
            styles.floatingButton,
            {
              transform: [
                { scale: scaleAnim },
                { translateX },
                { translateY },
              ],
              opacity: isDragging ? 0.8 : 1,
            },
          ]}
        >
          <TouchableOpacity 
            onPress={toggleChat} 
            style={styles.buttonTouchable}
            activeOpacity={0.7}
            disabled={isDragging}
          >
            <Icon
              name={isOpen ? "close" : "agriculture"}
              size={24}
              color="#fff"
            />
            {isDragging && (
              <View style={styles.dragIndicator}>
                <View style={styles.dragDot} />
                <View style={styles.dragDot} />
                <View style={styles.dragDot} />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </>
  );
};

const styles = StyleSheet.create({
  chatContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    height: height * 0.7,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#4CAF50',
  },
  closeButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  messageText: {
    padding: 12,
    borderRadius: 18,
    fontSize: 14,
    lineHeight: 20,
  },
  botText: {
    backgroundColor: '#f0f0f0',
    color: '#333',
  },
  userText: {
    backgroundColor: '#4CAF50',
    color: '#fff',
  },
  suggestionsContainer: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionButton: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  suggestionText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 18,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginHorizontal: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  buttonTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  dragIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  dragDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#4CAF50',
    marginHorizontal: 0.5,
  },
});

export default FloatingChatbot;
