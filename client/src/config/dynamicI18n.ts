/**
 * Dynamic Internationalization and Content System for KrishiVedha
 * Supports multiple languages with dynamic content loading
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getConfig, updateConfig, subscribeToConfig } from './dynamicConfig';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English', code: 'en', rtl: false },
  ne: { name: 'Nepali', nativeName: 'नेपाली', code: 'ne', rtl: false },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', code: 'hi', rtl: false },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// Translation keys structure
export interface TranslationKeys {
  common: {
    ok: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    loading: string;
    error: string;
    success: string;
    retry: string;
    refresh: string;
    back: string;
    next: string;
    previous: string;
    done: string;
    close: string;
    settings: string;
    profile: string;
    logout: string;
    login: string;
    register: string;
    forgotPassword: string;
    changePassword: string;
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    phone: string;
    location: string;
    date: string;
    time: string;
    yes: string;
    no: string;
  };
  navigation: {
    home: string;
    dashboard: string;
    farms: string;
    crops: string;
    weather: string;
    community: string;
    profile: string;
    settings: string;
    analytics: string;
    iot: string;
    ai: string;
    knowledge: string;
    market: string;
  };
  farm: {
    title: string;
    addFarm: string;
    editFarm: string;
    farmName: string;
    farmLocation: string;
    farmArea: string;
    farmType: string;
    cropCount: string;
    totalArea: string;
    deleteFarm: string;
    deleteFarmConfirm: string;
    noFarms: string;
    createFirstFarm: string;
  };
  crop: {
    title: string;
    addCrop: string;
    editCrop: string;
    cropName: string;
    cropVariety: string;
    plantingDate: string;
    harvestDate: string;
    growthStage: string;
    cropArea: string;
    cropStatus: string;
    addActivity: string;
    addImage: string;
    activities: string;
    images: string;
    deleteCrop: string;
    deleteCropConfirm: string;
    noCrops: string;
    createFirstCrop: string;
  };
  weather: {
    title: string;
    currentWeather: string;
    forecast: string;
    temperature: string;
    humidity: string;
    windSpeed: string;
    rainfall: string;
    pressure: string;
    visibility: string;
    uvIndex: string;
    sunrise: string;
    sunset: string;
    weatherAlert: string;
    noWeatherData: string;
  };
  community: {
    title: string;
    posts: string;
    createPost: string;
    editPost: string;
    deletePost: string;
    postTitle: string;
    postContent: string;
    postCategory: string;
    tags: string;
    comments: string;
    likes: string;
    shares: string;
    replies: string;
    writeComment: string;
    expertAdvice: string;
    askExpert: string;
    noPosts: string;
    createFirstPost: string;
  };
  auth: {
    loginTitle: string;
    registerTitle: string;
    loginSubtitle: string;
    registerSubtitle: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    namePlaceholder: string;
    phonePlaceholder: string;
    locationPlaceholder: string;
    loginButton: string;
    registerButton: string;
    forgotPasswordButton: string;
    dontHaveAccount: string;
    alreadyHaveAccount: string;
    loginSuccess: string;
    registerSuccess: string;
    invalidCredentials: string;
    accountExists: string;
    passwordMismatch: string;
    weakPassword: string;
    invalidEmail: string;
  };
  errors: {
    networkError: string;
    serverError: string;
    validationError: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    timeout: string;
    unknownError: string;
    tryAgain: string;
  };
  settings: {
    title: string;
    language: string;
    theme: string;
    notifications: string;
    privacy: string;
    about: string;
    help: string;
    feedback: string;
    version: string;
    lightTheme: string;
    darkTheme: string;
    autoTheme: string;
    enableNotifications: string;
    pushNotifications: string;
    emailNotifications: string;
  };
}

// Default translations (English)
const DEFAULT_TRANSLATIONS: TranslationKeys = {
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    retry: 'Retry',
    refresh: 'Refresh',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    done: 'Done',
    close: 'Close',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    forgotPassword: 'Forgot Password',
    changePassword: 'Change Password',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    name: 'Name',
    phone: 'Phone',
    location: 'Location',
    date: 'Date',
    time: 'Time',
    yes: 'Yes',
    no: 'No',
  },
  navigation: {
    home: 'Home',
    dashboard: 'Dashboard',
    farms: 'Farms',
    crops: 'Crops',
    weather: 'Weather',
    community: 'Community',
    profile: 'Profile',
    settings: 'Settings',
    analytics: 'Analytics',
    iot: 'IoT',
    ai: 'AI Assistant',
    knowledge: 'Knowledge',
    market: 'Market',
  },
  farm: {
    title: 'Farms',
    addFarm: 'Add Farm',
    editFarm: 'Edit Farm',
    farmName: 'Farm Name',
    farmLocation: 'Farm Location',
    farmArea: 'Farm Area',
    farmType: 'Farm Type',
    cropCount: 'Crops',
    totalArea: 'Total Area',
    deleteFarm: 'Delete Farm',
    deleteFarmConfirm: 'Are you sure you want to delete this farm?',
    noFarms: 'No farms added yet',
    createFirstFarm: 'Create your first farm to get started',
  },
  crop: {
    title: 'Crops',
    addCrop: 'Add Crop',
    editCrop: 'Edit Crop',
    cropName: 'Crop Name',
    cropVariety: 'Variety',
    plantingDate: 'Planting Date',
    harvestDate: 'Expected Harvest',
    growthStage: 'Growth Stage',
    cropArea: 'Area',
    cropStatus: 'Status',
    addActivity: 'Add Activity',
    addImage: 'Add Image',
    activities: 'Activities',
    images: 'Images',
    deleteCrop: 'Delete Crop',
    deleteCropConfirm: 'Are you sure you want to delete this crop?',
    noCrops: 'No crops added yet',
    createFirstCrop: 'Add your first crop to start tracking',
  },
  weather: {
    title: 'Weather',
    currentWeather: 'Current Weather',
    forecast: 'Forecast',
    temperature: 'Temperature',
    humidity: 'Humidity',
    windSpeed: 'Wind Speed',
    rainfall: 'Rainfall',
    pressure: 'Pressure',
    visibility: 'Visibility',
    uvIndex: 'UV Index',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    weatherAlert: 'Weather Alert',
    noWeatherData: 'No weather data available',
  },
  community: {
    title: 'Community',
    posts: 'Posts',
    createPost: 'Create Post',
    editPost: 'Edit Post',
    deletePost: 'Delete Post',
    postTitle: 'Post Title',
    postContent: 'Post Content',
    postCategory: 'Category',
    tags: 'Tags',
    comments: 'Comments',
    likes: 'Likes',
    shares: 'Shares',
    replies: 'Replies',
    writeComment: 'Write a comment...',
    expertAdvice: 'Expert Advice',
    askExpert: 'Ask Expert',
    noPosts: 'No posts yet',
    createFirstPost: 'Share your farming experience',
  },
  auth: {
    loginTitle: 'Welcome Back',
    registerTitle: 'Create Account',
    loginSubtitle: 'Sign in to your account',
    registerSubtitle: 'Join the farming community',
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Enter your password',
    confirmPasswordPlaceholder: 'Confirm your password',
    namePlaceholder: 'Enter your full name',
    phonePlaceholder: 'Enter your phone number',
    locationPlaceholder: 'Enter your location',
    loginButton: 'Sign In',
    registerButton: 'Create Account',
    forgotPasswordButton: 'Forgot Password?',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    loginSuccess: 'Successfully logged in',
    registerSuccess: 'Account created successfully',
    invalidCredentials: 'Invalid email or password',
    accountExists: 'Account with this email already exists',
    passwordMismatch: 'Passwords do not match',
    weakPassword: 'Password must be at least 8 characters',
    invalidEmail: 'Please enter a valid email address',
  },
  errors: {
    networkError: 'Network connection failed',
    serverError: 'Server error occurred',
    validationError: 'Please check your input',
    notFound: 'Resource not found',
    unauthorized: 'Access denied',
    forbidden: 'Permission denied',
    timeout: 'Request timed out',
    unknownError: 'Something went wrong',
    tryAgain: 'Please try again',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    theme: 'Theme',
    notifications: 'Notifications',
    privacy: 'Privacy',
    about: 'About',
    help: 'Help',
    feedback: 'Feedback',
    version: 'Version',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    autoTheme: 'Auto',
    enableNotifications: 'Enable Notifications',
    pushNotifications: 'Push Notifications',
    emailNotifications: 'Email Notifications',
  },
};

// Nepali translations
const NEPALI_TRANSLATIONS: TranslationKeys = {
  common: {
    ok: 'ठीक छ',
    cancel: 'रद्द गर्नुहोस्',
    save: 'सुरक्षित गर्नुहोस्',
    delete: 'मेटाउनुहोस्',
    edit: 'सम्पादन गर्नुहोस्',
    add: 'थप्नुहोस्',
    search: 'खोज्नुहोस्',
    loading: 'लोड हुँदै...',
    error: 'त्रुटि',
    success: 'सफल',
    retry: 'फेरि प्रयास गर्नुहोस्',
    refresh: 'ताजा गर्नुहोस्',
    back: 'फर्किनुहोस्',
    next: 'अर्को',
    previous: 'अघिल्लो',
    done: 'सकियो',
    close: 'बन्द गर्नुहोस्',
    settings: 'सेटिंग्स',
    profile: 'प्रोफाइल',
    logout: 'लगआउट',
    login: 'लगइन',
    register: 'दर्ता गर्नुहोस्',
    forgotPassword: 'पासवर्ड बिर्सनुभयो',
    changePassword: 'पासवर्ड परिवर्तन गर्नुहोस्',
    email: 'इमेल',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड पुष्टि गर्नुहोस्',
    name: 'नाम',
    phone: 'फोन',
    location: 'स्थान',
    date: 'मिति',
    time: 'समय',
    yes: 'हो',
    no: 'होइन',
  },
  navigation: {
    home: 'गृह',
    dashboard: 'ड्यासबोर्ड',
    farms: 'खेतहरू',
    crops: 'बालीहरू',
    weather: 'मौसम',
    community: 'समुदाय',
    profile: 'प्रोफाइल',
    settings: 'सेटिंग्स',
    analytics: 'विश्लेषण',
    iot: 'आईओटी',
    ai: 'एआई सहायक',
    knowledge: 'ज्ञान',
    market: 'बजार',
  },
  farm: {
    title: 'खेतहरू',
    addFarm: 'खेत थप्नुहोस्',
    editFarm: 'खेत सम्पादन गर्नुहोस्',
    farmName: 'खेतको नाम',
    farmLocation: 'खेतको स्थान',
    farmArea: 'खेतको क्षेत्रफल',
    farmType: 'खेतको प्रकार',
    cropCount: 'बालीहरू',
    totalArea: 'कुल क्षेत्रफल',
    deleteFarm: 'खेत मेटाउनुहोस्',
    deleteFarmConfirm: 'के तपाईं यो खेत मेटाउन चाहनुहुन्छ?',
    noFarms: 'अझै कुनै खेत थपिएको छैन',
    createFirstFarm: 'सुरु गर्न आफ्नो पहिलो खेत बनाउनुहोस्',
  },
  crop: {
    title: 'बालीहरू',
    addCrop: 'बाली थप्नुहोस्',
    editCrop: 'बाली सम्पादन गर्नुहोस्',
    cropName: 'बालीको नाम',
    cropVariety: 'किस्म',
    plantingDate: 'रोप्ने मिति',
    harvestDate: 'अनुमानित फसल',
    growthStage: 'वृद्धि चरण',
    cropArea: 'क्षेत्रफल',
    cropStatus: 'स्थिति',
    addActivity: 'गतिविधि थप्नुहोस्',
    addImage: 'तस्बिर थप्नुहोस्',
    activities: 'गतिविधिहरू',
    images: 'तस्बिरहरू',
    deleteCrop: 'बाली मेटाउनुहोस्',
    deleteCropConfirm: 'के तपाईं यो बाली मेटाउन चाहनुहुन्छ?',
    noCrops: 'अझै कुनै बाली थपिएको छैन',
    createFirstCrop: 'ट्र्याकिङ सुरु गर्न आफ्नो पहिलो बाली थप्नुहोस्',
  },
  weather: {
    title: 'मौसम',
    currentWeather: 'हालको मौसम',
    forecast: 'पूर्वानुमान',
    temperature: 'तापक्रम',
    humidity: 'आर्द्रता',
    windSpeed: 'हावाको गति',
    rainfall: 'वर्षा',
    pressure: 'दबाब',
    visibility: 'दृश्यता',
    uvIndex: 'यूभी सूचकांक',
    sunrise: 'सूर्योदय',
    sunset: 'सूर्यास्त',
    weatherAlert: 'मौसम चेतावनी',
    noWeatherData: 'मौसमी डेटा उपलब्ध छैन',
  },
  community: {
    title: 'समुदाय',
    posts: 'पोस्टहरू',
    createPost: 'पोस्ट बनाउनुहोस्',
    editPost: 'पोस्ट सम्पादन गर्नुहोस्',
    deletePost: 'पोस्ट मेटाउनुहोस्',
    postTitle: 'पोस्ट शीर्षक',
    postContent: 'पोस्ट सामग्री',
    postCategory: 'श्रेणी',
    tags: 'ट्यागहरू',
    comments: 'टिप्पणीहरू',
    likes: 'मन पराइनुहोस्',
    shares: 'साझेदारी',
    replies: 'जवाफहरू',
    writeComment: 'टिप्पणी लेख्नुहोस्...',
    expertAdvice: 'विशेषज्ञ सल्लाह',
    askExpert: 'विशेषज्ञलाई सोध्नुहोस्',
    noPosts: 'अझै कुनै पोस्ट छैन',
    createFirstPost: 'आफ्नो कृषि अनुभव साझा गर्नुहोस्',
  },
  auth: {
    loginTitle: 'स्वागत छ',
    registerTitle: 'खाता बनाउनुहोस्',
    loginSubtitle: 'आफ्नो खातामा साइन इन गर्नुहोस्',
    registerSubtitle: 'कृषक समुदायमा सामेल हुनुहोस्',
    emailPlaceholder: 'आफ्नो इमेल प्रविष्ट गर्नुहोस्',
    passwordPlaceholder: 'आफ्नो पासवर्ड प्रविष्ट गर्नुहोस्',
    confirmPasswordPlaceholder: 'आफ्नो पासवर्ड पुष्टि गर्नुहोस्',
    namePlaceholder: 'आफ्नो पूरा नाम प्रविष्ट गर्नुहोस्',
    phonePlaceholder: 'आफ्नो फोन नम्बर प्रविष्ट गर्नुहोस्',
    locationPlaceholder: 'आफ्नो स्थान प्रविष्ट गर्नुहोस्',
    loginButton: 'साइन इन गर्नुहोस्',
    registerButton: 'खाता बनाउनुहोस्',
    forgotPasswordButton: 'पासवर्ड बिर्सनुभयो?',
    dontHaveAccount: 'खाता छैन?',
    alreadyHaveAccount: 'पहिले नै खाता छ?',
    loginSuccess: 'सफलतापूर्वक लगइन भयो',
    registerSuccess: 'खाता सफलतापूर्वक बनाइयो',
    invalidCredentials: 'गलत इमेल वा पासवर्ड',
    accountExists: 'यो इमेलको खाता पहिले नै अवस्थित छ',
    passwordMismatch: 'पासवर्ड मेल खाँदैन',
    weakPassword: 'पासवर्ड कम्तिमा 8 अक्षरको हुनुपर्छ',
    invalidEmail: 'कृपया मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस्',
  },
  errors: {
    networkError: 'नेटवर्क जडान असफल',
    serverError: 'सर्भर त्रुटि भयो',
    validationError: 'कृपया आफ्नो इनपुट जाँच गर्नुहोस्',
    notFound: 'स्रोत फेला परेन',
    unauthorized: 'पहुँच अस्वीकार गरियो',
    forbidden: 'अनुमति अस्वीकार गरियो',
    timeout: 'अनुरोध समय समाप्त भयो',
    unknownError: 'केहि गलत भयो',
    tryAgain: 'कृपया फेरि प्रयास गर्नुहोस्',
  },
  settings: {
    title: 'सेटिंग्स',
    language: 'भाषा',
    theme: 'थिम',
    notifications: 'सूचनाहरू',
    privacy: 'गोपनीयता',
    about: 'बारेमा',
    help: 'सहायता',
    feedback: 'प्रतिक्रिया',
    version: 'संस्करण',
    lightTheme: 'उज्यालो',
    darkTheme: 'अँध्यारो',
    autoTheme: 'स्वचालित',
    enableNotifications: 'सूचनाहरू सक्षम गर्नुहोस्',
    pushNotifications: 'पुश सूचनाहरू',
    emailNotifications: 'इमेल सूचनाहरू',
  },
};

// Hindi translations
const HINDI_TRANSLATIONS: TranslationKeys = {
  common: {
    ok: 'ठीक है',
    cancel: 'रद्द करें',
    save: 'सेव करें',
    delete: 'डिलीट करें',
    edit: 'एडिट करें',
    add: 'जोड़ें',
    search: 'खोजें',
    loading: 'लोड हो रहा है...',
    error: 'एरर',
    success: 'सफल',
    retry: 'दोबारा कोशिश करें',
    refresh: 'रिफ्रेश करें',
    back: 'वापस',
    next: 'अगला',
    previous: 'पिछला',
    done: 'पूरा',
    close: 'बंद करें',
    settings: 'सेटिंग्स',
    profile: 'प्रोफाइल',
    logout: 'लॉगआउट',
    login: 'लॉगिन',
    register: 'रजिस्टर करें',
    forgotPassword: 'पासवर्ड भूल गए',
    changePassword: 'पासवर्ड बदलें',
    email: 'ईमेल',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड कन्फर्म करें',
    name: 'नाम',
    phone: 'फोन',
    location: 'स्थान',
    date: 'तारीख',
    time: 'समय',
    yes: 'हाँ',
    no: 'नहीं',
  },
  navigation: {
    home: 'होम',
    dashboard: 'डैशबोर्ड',
    farms: 'खेत',
    crops: 'फसलें',
    weather: 'मौसम',
    community: 'कम्युनिटी',
    profile: 'प्रोफाइल',
    settings: 'सेटिंग्स',
    analytics: 'एनालिटिक्स',
    iot: 'आईओटी',
    ai: 'एआई असिस्टेंट',
    knowledge: 'ज्ञान',
    market: 'बाज़ार',
  },
  farm: {
    title: 'खेत',
    addFarm: 'खेत जोड़ें',
    editFarm: 'खेत एडिट करें',
    farmName: 'खेत का नाम',
    farmLocation: 'खेत की जगह',
    farmArea: 'खेत का क्षेत्रफल',
    farmType: 'खेत का प्रकार',
    cropCount: 'फसलें',
    totalArea: 'कुल क्षेत्रफल',
    deleteFarm: 'खेत डिलीट करें',
    deleteFarmConfirm: 'क्या आप इस खेत को डिलीट करना चाहते हैं?',
    noFarms: 'अभी तक कोई खेत नहीं जोड़ा गया',
    createFirstFarm: 'शुरुआत करने के लिए अपना पहला खेत बनाएं',
  },
  crop: {
    title: 'फसलें',
    addCrop: 'फसल जोड़ें',
    editCrop: 'फसल एडिट करें',
    cropName: 'फसल का नाम',
    cropVariety: 'किस्म',
    plantingDate: 'बुवाई की तारीख',
    harvestDate: 'अनुमानित कटाई',
    growthStage: 'विकास चरण',
    cropArea: 'क्षेत्रफल',
    cropStatus: 'स्थिति',
    addActivity: 'गतिविधि जोड़ें',
    addImage: 'तस्वीर जोड़ें',
    activities: 'गतिविधियाँ',
    images: 'तस्वीरें',
    deleteCrop: 'फसल डिलीट करें',
    deleteCropConfirm: 'क्या आप इस फसल को डिलीट करना चाहते हैं?',
    noCrops: 'अभी तक कोई फसल नहीं जोड़ी गई',
    createFirstCrop: 'ट्रैकिंग शुरू करने के लिए अपनी पहली फसल जोड़ें',
  },
  weather: {
    title: 'मौसम',
    currentWeather: 'वर्तमान मौसम',
    forecast: 'पूर्वानुमान',
    temperature: 'तापमान',
    humidity: 'नमी',
    windSpeed: 'हवा की गति',
    rainfall: 'बारिश',
    pressure: 'दबाव',
    visibility: 'दृश्यता',
    uvIndex: 'यूवी इंडेक्स',
    sunrise: 'सूर्योदय',
    sunset: 'सूर्यास्त',
    weatherAlert: 'मौसम अलर्ट',
    noWeatherData: 'मौसम डेटा उपलब्ध नहीं',
  },
  community: {
    title: 'कम्युनिटी',
    posts: 'पोस्ट्स',
    createPost: 'पोस्ट बनाएं',
    editPost: 'पोस्ट एडिट करें',
    deletePost: 'पोस्ट डिलीट करें',
    postTitle: 'पोस्ट का टाइटल',
    postContent: 'पोस्ट कंटेंट',
    postCategory: 'केटेगरी',
    tags: 'टैग्स',
    comments: 'कमेंट्स',
    likes: 'लाइक्स',
    shares: 'शेयर्स',
    replies: 'रिप्लाई',
    writeComment: 'कमेंट लिखें...',
    expertAdvice: 'एक्सपर्ट सलाह',
    askExpert: 'एक्सपर्ट से पूछें',
    noPosts: 'अभी तक कोई पोस्ट नहीं',
    createFirstPost: 'अपना खेती का अनुभव शेयर करें',
  },
  auth: {
    loginTitle: 'स्वागत है',
    registerTitle: 'अकाउंट बनाएं',
    loginSubtitle: 'अपने अकाउंट में साइन इन करें',
    registerSubtitle: 'किसान कम्युनिटी में जुड़ें',
    emailPlaceholder: 'अपना ईमेल डालें',
    passwordPlaceholder: 'अपना पासवर्ड डालें',
    confirmPasswordPlaceholder: 'अपना पासवर्ड कन्फर्म करें',
    namePlaceholder: 'अपना पूरा नाम डालें',
    phonePlaceholder: 'अपना फोन नंबर डालें',
    locationPlaceholder: 'अपनी लोकेशन डालें',
    loginButton: 'साइन इन करें',
    registerButton: 'अकाउंट बनाएं',
    forgotPasswordButton: 'पासवर्ड भूल गए?',
    dontHaveAccount: 'अकाउंट नहीं है?',
    alreadyHaveAccount: 'पहले से अकाउंट है?',
    loginSuccess: 'सफलतापूर्वक लॉगिन हुआ',
    registerSuccess: 'अकाउंट सफलतापूर्वक बना',
    invalidCredentials: 'गलत ईमेल या पासवर्ड',
    accountExists: 'इस ईमेल का अकाउंट पहले से मौजूद है',
    passwordMismatch: 'पासवर्ड मैच नहीं कर रहे',
    weakPassword: 'पासवर्ड कम से कम 8 अक्षर का होना चाहिए',
    invalidEmail: 'कृपया वैलिड ईमेल एड्रेस डालें',
  },
  errors: {
    networkError: 'नेटवर्क कनेक्शन फेल',
    serverError: 'सर्वर एरर हुआ',
    validationError: 'कृपया अपना इनपुट चेक करें',
    notFound: 'रिसोर्स नहीं मिला',
    unauthorized: 'एक्सेस डिनाइड',
    forbidden: 'परमिशन डिनाइड',
    timeout: 'रिक्वेस्ट टाइम आउट',
    unknownError: 'कुछ गलत हुआ',
    tryAgain: 'कृपया दोबारा कोशिश करें',
  },
  settings: {
    title: 'सेटिंग्स',
    language: 'भाषा',
    theme: 'थीम',
    notifications: 'नोटिफिकेशन',
    privacy: 'प्राइवेसी',
    about: 'अबाउट',
    help: 'हेल्प',
    feedback: 'फीडबैक',
    version: 'वर्जन',
    lightTheme: 'लाइट',
    darkTheme: 'डार्क',
    autoTheme: 'ऑटो',
    enableNotifications: 'नोटिफिकेशन इनेबल करें',
    pushNotifications: 'पुश नोटिफिकेशन',
    emailNotifications: 'ईमेल नोटिफिकेशन',
  },
};

class DynamicI18nManager {
  private static instance: DynamicI18nManager;
  private currentLanguage: LanguageCode = 'en';
  private translations: Record<LanguageCode, TranslationKeys>;
  private listeners: Array<(language: LanguageCode, translations: TranslationKeys) => void> = [];
  private isRTL: boolean = false;

  private constructor() {
    this.translations = {
      en: DEFAULT_TRANSLATIONS,
      ne: NEPALI_TRANSLATIONS,
      hi: HINDI_TRANSLATIONS,
    };
    this.initialize();
  }

  public static getInstance(): DynamicI18nManager {
    if (!DynamicI18nManager.instance) {
      DynamicI18nManager.instance = new DynamicI18nManager();
    }
    return DynamicI18nManager.instance;
  }

  private async initialize() {
    // Subscribe to config changes
    subscribeToConfig((config) => {
      if (config.localization.defaultLanguage !== this.currentLanguage) {
        this.changeLanguage(config.localization.defaultLanguage as LanguageCode);
      }
    });

    // Initialize language based on current config
    const config = getConfig();
    this.changeLanguage(config.localization.defaultLanguage as LanguageCode);
  }

  public changeLanguage(languageCode: LanguageCode) {
    if (this.translations[languageCode]) {
      this.currentLanguage = languageCode;
      this.isRTL = SUPPORTED_LANGUAGES[languageCode].rtl;
      this.notifyListeners();
      
      // Update config
      updateConfig({
        localization: {
          defaultLanguage: languageCode,
        },
      });
    }
  }

  public getCurrentLanguage(): LanguageCode {
    return this.currentLanguage;
  }

  public getLanguageInfo() {
    return SUPPORTED_LANGUAGES[this.currentLanguage];
  }

  public isRightToLeft(): boolean {
    return this.isRTL;
  }

  public getTranslations(): TranslationKeys {
    return this.translations[this.currentLanguage];
  }

  public translate(key: string, params?: Record<string, string>): string {
    const keys = key.split('.');
    let value: any = this.translations[this.currentLanguage];

    // Navigate through nested object
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }

    // Fallback to English if translation not found
    if (value === undefined && this.currentLanguage !== 'en') {
      let fallbackValue: any = DEFAULT_TRANSLATIONS;
      for (const k of keys) {
        fallbackValue = fallbackValue?.[k];
        if (fallbackValue === undefined) break;
      }
      value = fallbackValue;
    }

    // Final fallback to key itself
    if (value === undefined) {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }

    // Replace parameters if provided
    if (params && typeof value === 'string') {
      return Object.keys(params).reduce(
        (text, param) => text.replace(new RegExp(`{{${param}}}`, 'g'), params[param]),
        value
      );
    }

    return value;
  }

  public addTranslations(languageCode: LanguageCode, translations: Partial<TranslationKeys>) {
    if (!this.translations[languageCode]) {
      this.translations[languageCode] = { ...DEFAULT_TRANSLATIONS };
    }
    
    this.translations[languageCode] = this.mergeTranslations(
      this.translations[languageCode],
      translations
    );
    
    if (languageCode === this.currentLanguage) {
      this.notifyListeners();
    }
  }

  private mergeTranslations(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeTranslations(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  public getSupportedLanguages() {
    return SUPPORTED_LANGUAGES;
  }

  public subscribe(listener: (language: LanguageCode, translations: TranslationKeys) => void): () => void {
    this.listeners.push(listener);
    // Call listener immediately with current state
    listener(this.currentLanguage, this.getTranslations());
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentLanguage, this.getTranslations());
      } catch (error) {
        console.error('I18n listener error:', error);
      }
    });
  }

  public formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const locale = this.getLocaleString();
    
    return new Intl.DateTimeFormat(locale, options).format(dateObj);
  }

  public formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    const locale = this.getLocaleString();
    return new Intl.NumberFormat(locale, options).format(number);
  }

  public formatCurrency(amount: number, currency: string = 'NPR', options?: Intl.NumberFormatOptions): string {
    const locale = this.getLocaleString();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      ...options,
    }).format(amount);
  }

  private getLocaleString(): string {
    const languageMap: Record<LanguageCode, string> = {
      en: 'en-US',
      ne: 'ne-NP',
      hi: 'hi-IN',
    };
    
    return languageMap[this.currentLanguage] || 'en-US';
  }
}

// Singleton instance
export const i18nManager = DynamicI18nManager.getInstance();

// React Hook for components
import React from 'react';

export const useDynamicI18n = () => {
  const [language, setLanguage] = React.useState<LanguageCode>(i18nManager.getCurrentLanguage());
  const [translations, setTranslations] = React.useState<TranslationKeys>(i18nManager.getTranslations());

  React.useEffect(() => {
    return i18nManager.subscribe((lang, trans) => {
      setLanguage(lang);
      setTranslations(trans);
    });
  }, []);

  const t = React.useCallback((key: string, params?: Record<string, string>) => {
    return i18nManager.translate(key, params);
  }, []);

  return {
    language,
    translations,
    t,
    isRTL: i18nManager.isRightToLeft(),
    changeLanguage: i18nManager.changeLanguage.bind(i18nManager),
    supportedLanguages: i18nManager.getSupportedLanguages(),
    formatDate: i18nManager.formatDate.bind(i18nManager),
    formatNumber: i18nManager.formatNumber.bind(i18nManager),
    formatCurrency: i18nManager.formatCurrency.bind(i18nManager),
  };
};

// Convenience function for non-React usage
export const t = (key: string, params?: Record<string, string>) => {
  return i18nManager.translate(key, params);
};

export default i18nManager;
