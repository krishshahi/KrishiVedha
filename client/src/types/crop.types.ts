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

// Additional type for crop card display
export interface CropInfo {
  id: string;
  name: string;
  nameEn: string;
  variety: string;
  soilType: string;
  fertilizer: string;
  spacing: string;
  waterRequirement: string;
  plantingMonths: number[];
  harvestMonths: number[];
  growthDuration: number;
  tips?: string[];
  description?: string;
}

// Additional types for crop service
export interface PlantingSchedule {
  id: string;
  cropId: string;
  plantingDate: string;
  expectedHarvestDate: string;
  status: 'planned' | 'planted' | 'harvested';
}

export interface PestInfo {
  id: string;
  name: string;
  description: string;
  treatment: string;
  affectedCrops: string[];
}

export interface CropRecommendation {
  id: string;
  cropId: string;
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
  type: 'planting' | 'fertilizer' | 'pest' | 'harvest';
}

