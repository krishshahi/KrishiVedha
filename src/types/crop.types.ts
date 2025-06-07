/**
 * Crop management related type definitions for KrishiVeda app
 */

export interface Crop {
  id: string;
  name: string;
  localName?: string;
  scientificName?: string;
  category: CropCategory;
  imageUrl?: string;
  description: string;
  growingSeason: GrowingSeason;
  waterRequirements: WaterRequirement;
  soilTypes: SoilType[];
  growthDuration: number; // in days
  yieldEstimate: string;
  pests: Pest[];
  diseases: Disease[];
  farmingPractices: FarmingPractice[];
}

export type CropCategory = 
  | 'cereals' 
  | 'pulses' 
  | 'vegetables' 
  | 'fruits' 
  | 'oilseeds' 
  | 'spices' 
  | 'fiber' 
  | 'others';

export interface GrowingSeason {
  plantingMonths: number[]; // 1-12 representing Jan-Dec
  harvestMonths: number[]; // 1-12 representing Jan-Dec
  optimalTempRange: {
    min: number;
    max: number;
  };
}

export type WaterRequirement = 'low' | 'medium' | 'high' | 'very-high';

export type SoilType = 
  | 'sandy' 
  | 'clay' 
  | 'loamy' 
  | 'silty' 
  | 'peaty' 
  | 'chalky' 
  | 'black';

export interface Pest {
  id: string;
  name: string;
  description: string;
  symptoms: string;
  preventiveMeasures: string[];
  treatments: string[];
  imageUrl?: string;
}

export interface Disease {
  id: string;
  name: string;
  description: string;
  symptoms: string;
  preventiveMeasures: string[];
  treatments: string[];
  imageUrl?: string;
}

export interface FarmingPractice {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  steps: string[];
  imageUrl?: string;
}

export interface CropCalendarEvent {
  id: string;
  cropId: string;
  farmId?: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  type: 'planting' | 'irrigation' | 'fertilization' | 'pestControl' | 'harvesting' | 'other';
  status: 'planned' | 'inProgress' | 'completed' | 'delayed' | 'cancelled';
}

export interface Farm {
  id: string;
  name: string;
  location: {
    lat: number;
    lon: number;
    address?: string;
  };
  size: number; // in hectares
  crops: string[]; // crop ids
  soilType: SoilType[];
}

