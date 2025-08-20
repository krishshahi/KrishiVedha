import AsyncStorage from '@react-native-async-storage/async-storage';
import { CropInfo, PlantingSchedule, PestInfo, CropRecommendation } from '../types/crop.types';

// Nepal-specific crop data
const NEPAL_CROPS_DATA: CropInfo[] = [
  {
    id: '1',
    name: 'धान (Rice)',
    nameEn: 'Rice',
    variety: 'Basmati, Mansuli, Radha-4',
    plantingMonths: [5, 6, 7], // May, June, July
    harvestMonths: [10, 11], // October, November
    growthDuration: 120, // days
    waterRequirement: 'High',
    soilType: 'Clay loam, well-drained',
    fertilizer: 'NPK 20:10:10',
    spacing: '20cm x 15cm',
    description: 'Nepal\'s main staple crop, grown primarily in Terai and hill regions.',
    tips: [
      'Transplant 20-25 day old seedlings',
      'Maintain 2-5cm water level in field',
      'Apply organic manure before planting'
    ],
    commonDiseases: ['Blast', 'Brown spot', 'Sheath blight']
  },
  {
    id: '2',
    name: 'मकै (Maize)',
    nameEn: 'Maize',
    variety: 'Arun-1, Manakamana-3, Deuti',
    plantingMonths: [3, 4, 5], // March, April, May
    harvestMonths: [7, 8, 9], // July, August, September
    growthDuration: 90,
    waterRequirement: 'Medium',
    soilType: 'Well-drained, fertile',
    fertilizer: 'NPK 15:15:15',
    spacing: '75cm x 25cm',
    description: 'Second most important cereal crop in Nepal.',
    tips: [
      'Plant after last frost',
      'Hill up soil around plants when 30cm tall',
      'Harvest when kernels are hard'
    ],
    commonDiseases: ['Gray leaf spot', 'Common rust', 'Downy mildew']
  },
  {
    id: '3',
    name: 'गहुँ (Wheat)',
    nameEn: 'Wheat',
    variety: 'RR21, Bijaya, Gautam',
    plantingMonths: [11, 12], // November, December
    harvestMonths: [4, 5], // April, May
    growthDuration: 120,
    waterRequirement: 'Medium',
    soilType: 'Well-drained, clay loam',
    fertilizer: 'Urea, DAP',
    spacing: 'Broadcasting or 20cm rows',
    description: 'Important winter crop grown in Terai and mid-hills.',
    tips: [
      'Sow after rice harvest',
      'Apply irrigation at critical growth stages',
      'Harvest when grains are golden yellow'
    ],
    commonDiseases: ['Rust', 'Blight', 'Smut']
  },
  {
    id: '4',
    name: 'आलु (Potato)',
    nameEn: 'Potato',
    variety: 'Kufri Jyoti, Cardinal, Desiree',
    plantingMonths: [9, 10, 11], // September, October, November
    harvestMonths: [1, 2, 3], // January, February, March
    growthDuration: 90,
    waterRequirement: 'Medium',
    soilType: 'Sandy loam, well-drained',
    fertilizer: 'NPK 19:19:19',
    spacing: '60cm x 25cm',
    description: 'Important cash crop grown in hills and mountains.',
    tips: [
      'Plant certified seed tubers',
      'Hill up soil around plants regularly',
      'Harvest in dry weather'
    ],
    commonDiseases: ['Late blight', 'Early blight', 'Bacterial wilt']
  }
];

const PEST_DATA: PestInfo[] = [
  {
    id: '1',
    name: 'धानको फड्यांग्रो (Rice Stem Borer)',
    nameEn: 'Rice Stem Borer',
    affectedCrops: ['Rice'],
    symptoms: ['Dead heart in seedlings', 'White ears in mature plants'],
    preventiveMeasures: [
      'Use resistant varieties',
      'Proper field sanitation',
      'Biological control with Trichogramma'
    ],
    treatment: [
      'Apply Chlorpyrifos 20 EC',
      'Use pheromone traps',
      'Release egg parasitoids'
    ],
    organicSolution: [
      'Neem oil spray',
      'Light traps for moths',
      'Encourage natural predators'
    ]
  },
  {
    id: '2',
    name: 'मकैको पातमा दाग (Maize Gray Leaf Spot)',
    nameEn: 'Maize Gray Leaf Spot',
    affectedCrops: ['Maize'],
    symptoms: ['Gray to brown rectangular lesions on leaves'],
    preventiveMeasures: [
      'Crop rotation',
      'Use resistant varieties',
      'Proper spacing for air circulation'
    ],
    treatment: [
      'Apply fungicide (Mancozeb)',
      'Remove infected plant debris',
      'Improve drainage'
    ],
    organicSolution: [
      'Copper sulfate spray',
      'Compost tea application',
      'Maintain soil health'
    ]
  }
];

class CropService {
  /**
   * Get all crop information
   */
  getAllCrops(): CropInfo[] {
    return NEPAL_CROPS_DATA;
  }

  /**
   * Get crop by ID
   */
  getCropById(id: string): CropInfo | undefined {
    return NEPAL_CROPS_DATA.find(crop => crop.id === id);
  }

  /**
   * Get crops suitable for current month
   */
  getCropsForMonth(month: number): CropInfo[] {
    return NEPAL_CROPS_DATA.filter(crop => 
      crop.plantingMonths.includes(month)
    );
  }

  /**
   * Get planting schedule for the year
   */
  getPlantingSchedule(): PlantingSchedule[] {
    const schedule: PlantingSchedule[] = [];
    
    for (let month = 1; month <= 12; month++) {
      const cropsToPlant = this.getCropsForMonth(month);
      const cropsToHarvest = NEPAL_CROPS_DATA.filter(crop => 
        crop.harvestMonths.includes(month)
      );
      
      schedule.push({
        month,
        monthName: this.getMonthName(month),
        cropsToPlant: cropsToPlant.map(crop => ({
          id: crop.id,
          name: crop.name,
          nameEn: crop.nameEn
        })),
        cropsToHarvest: cropsToHarvest.map(crop => ({
          id: crop.id,
          name: crop.name,
          nameEn: crop.nameEn
        }))
      });
    }
    
    return schedule;
  }

  /**
   * Get pest information
   */
  getAllPests(): PestInfo[] {
    return PEST_DATA;
  }

  /**
   * Get pests affecting a specific crop
   */
  getPestsForCrop(cropName: string): PestInfo[] {
    return PEST_DATA.filter(pest => 
      pest.affectedCrops.some(crop => 
        crop.toLowerCase().includes(cropName.toLowerCase())
      )
    );
  }

  /**
   * Get crop recommendations based on location and season
   */
  getCropRecommendations(region: string, month: number): CropRecommendation[] {
    const suitableCrops = this.getCropsForMonth(month);
    
    return suitableCrops.map(crop => {
      let suitabilityScore = 0.8; // Base score
      
      // Adjust score based on region
      if (region.toLowerCase().includes('terai')) {
        if (crop.nameEn === 'Rice' || crop.nameEn === 'Wheat') {
          suitabilityScore += 0.2;
        }
      } else if (region.toLowerCase().includes('hill')) {
        if (crop.nameEn === 'Maize' || crop.nameEn === 'Potato') {
          suitabilityScore += 0.2;
        }
      }
      
      return {
        crop,
        suitabilityScore: Math.min(suitabilityScore, 1.0),
        reason: this.getRecommendationReason(crop, region, month)
      };
    }).sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  }

  /**
   * Save user's crop preferences
   */
  async saveUserCrops(crops: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem('user_crops', JSON.stringify(crops));
    } catch (error) {
      console.error('Error saving user crops:', error);
    }
  }

  /**
   * Get user's crop preferences
   */
  async getUserCrops(): Promise<string[]> {
    try {
      const crops = await AsyncStorage.getItem('user_crops');
      return crops ? JSON.parse(crops) : [];
    } catch (error) {
      console.error('Error getting user crops:', error);
      return [];
    }
  }

  private getMonthName(month: number): string {
    const months = [
      'जनवरी', 'फेब्रुअरी', 'मार्च', 'अप्रिल', 'मे', 'जुन',
      'जुलाई', 'अगस्त', 'सेप्टेम्बर', 'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर'
    ];
    return months[month - 1];
  }

  private getRecommendationReason(crop: CropInfo, region: string, month: number): string {
    const reasons = [];
    
    if (crop.plantingMonths.includes(month)) {
      reasons.push('रोप्ने मौसम');
    }
    
    if (region.toLowerCase().includes('terai') && 
        (crop.nameEn === 'Rice' || crop.nameEn === 'Wheat')) {
      reasons.push('तराईका लागि उपयुक्त');
    }
    
    if (region.toLowerCase().includes('hill') && 
        (crop.nameEn === 'Maize' || crop.nameEn === 'Potato')) {
      reasons.push('पहाडका लागि उपयुक्त');
    }
    
    return reasons.join(', ') || 'सामान्य सिफारिस';
  }
}

export default new CropService();

