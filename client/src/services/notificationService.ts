import { Alert } from 'react-native';

export interface CropNotification {
  id: string;
  cropId: string;
  cropName: string;
  type: 'irrigation' | 'fertilization' | 'pest_control' | 'harvesting' | 'planting' | 'general';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate: Date;
  isRead: boolean;
  isCompleted: boolean;
}

export interface FarmingTask {
  id: string;
  cropId: string;
  type: 'irrigation' | 'fertilization' | 'pest_control' | 'harvesting' | 'planting';
  title: string;
  description: string;
  dueDate: Date;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reminderDays: number; // Days before due date to send reminder
}

class NotificationService {
  private notifications: CropNotification[] = [];
  private tasks: FarmingTask[] = [];

  // Add a new notification
  addNotification(notification: Omit<CropNotification, 'id' | 'isRead' | 'isCompleted'>): string {
    const id = Date.now().toString();
    const newNotification: CropNotification = {
      ...notification,
      id,
      isRead: false,
      isCompleted: false,
    };
    
    this.notifications.push(newNotification);
    return id;
  }

  // Add a farming task
  addTask(task: Omit<FarmingTask, 'id'>): string {
    const id = Date.now().toString();
    const newTask: FarmingTask = {
      ...task,
      id,
    };
    
    this.tasks.push(newTask);
    
    // Schedule notification for this task
    this.scheduleTaskReminder(newTask);
    
    return id;
  }

  // Schedule reminder notification for a task
  private scheduleTaskReminder(task: FarmingTask) {
    const reminderDate = new Date(task.dueDate);
    reminderDate.setDate(reminderDate.getDate() - task.reminderDays);
    
    if (reminderDate > new Date()) {
      this.addNotification({
        cropId: task.cropId,
        cropName: '', // Would be filled from crop data
        type: task.type,
        title: `Reminder: ${task.title}`,
        message: `${task.description} - Due in ${task.reminderDays} days`,
        priority: task.priority,
        scheduledDate: reminderDate,
      });
    }
  }

  // Get all notifications
  getNotifications(): CropNotification[] {
    return this.notifications.sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime());
  }

  // Get unread notifications
  getUnreadNotifications(): CropNotification[] {
    return this.notifications.filter(n => !n.isRead);
  }

  // Get high priority notifications
  getHighPriorityNotifications(): CropNotification[] {
    return this.notifications.filter(n => n.priority === 'high' || n.priority === 'urgent');
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  // Mark task as completed
  completeTask(taskId: string): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.isCompleted = true;
      
      // Mark related notifications as completed
      this.notifications
        .filter(n => n.cropId === task.cropId && n.type === task.type)
        .forEach(n => n.isCompleted = true);
    }
  }

  // Get pending tasks
  getPendingTasks(): FarmingTask[] {
    return this.tasks.filter(t => !t.isCompleted);
  }

  // Get overdue tasks
  getOverdueTasks(): FarmingTask[] {
    const now = new Date();
    return this.tasks.filter(t => !t.isCompleted && t.dueDate < now);
  }

  // Show immediate alert for urgent notifications
  showUrgentAlert(notification: CropNotification): void {
    Alert.alert(
      `🚨 ${notification.title}`,
      notification.message,
      [
        {
          text: 'Later',
          style: 'cancel',
        },
        {
          text: 'Mark as Read',
          onPress: () => this.markAsRead(notification.id),
        },
      ]
    );
  }

  // Generate progress-based notifications for crops
  generateCropProgressNotifications(cropId: string, cropName: string, plantingDate: Date, expectedHarvestDate: Date, currentProgress: number): void {
    const progressMilestones = [25, 50, 75, 90];
    
    progressMilestones.forEach(milestone => {
      if (Math.abs(currentProgress - milestone) < 5) { // Within 5% of milestone
        let title = '';
        let message = '';
        let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
        
        switch (milestone) {
          case 25:
            title = `${cropName} - 25% Growth Complete`;
            message = `Your ${cropName} has completed 25% of its growth cycle. Consider first fertilization.`;
            break;
          case 50:
            title = `${cropName} - Halfway Through Growth`;
            message = `Your ${cropName} is 50% mature. Monitor for pests and diseases.`;
            break;
          case 75:
            title = `${cropName} - 75% Mature`;
            message = `Your ${cropName} is 75% mature. Start preparing for harvest.`;
            priority = 'high';
            break;
          case 90:
            title = `${cropName} - Almost Ready for Harvest`;
            message = `Your ${cropName} is 90% mature. Harvest time is approaching!`;
            priority = 'high';
            break;
        }
        
        this.addNotification({
          cropId,
          cropName,
          type: 'general',
          title,
          message,
          priority,
          scheduledDate: new Date(),
        });
      }
    });
  }

  // Generate farming schedule based on crop type and planting date
  generateFarmingSchedule(cropId: string, cropName: string, plantingDate: Date, cropType: string): void {
    const tasks = this.getFarmingTasksForCrop(cropType, plantingDate);
    
    tasks.forEach(taskTemplate => {
      this.addTask({
        cropId,
        type: taskTemplate.type,
        title: `${taskTemplate.title} - ${cropName}`,
        description: taskTemplate.description,
        dueDate: taskTemplate.dueDate,
        isCompleted: false,
        priority: taskTemplate.priority,
        reminderDays: taskTemplate.reminderDays,
      });
    });
  }

  // Get farming tasks template for different crop types
  private getFarmingTasksForCrop(cropType: string, plantingDate: Date): Omit<FarmingTask, 'id' | 'cropId'>[] {
    const tasks: Omit<FarmingTask, 'id' | 'cropId'>[] = [];
    
    // Common tasks for most crops
    const commonTasks = [
      {
        type: 'irrigation' as const,
        title: 'Initial Watering',
        description: 'Water the newly planted seeds/seedlings thoroughly',
        dayOffset: 1,
        priority: 'high' as const,
        reminderDays: 1,
      },
      {
        type: 'fertilization' as const,
        title: 'First Fertilization',
        description: 'Apply organic fertilizer or compost',
        dayOffset: 14,
        priority: 'medium' as const,
        reminderDays: 2,
      },
      {
        type: 'pest_control' as const,
        title: 'Pest Inspection',
        description: 'Check for signs of pests and diseases',
        dayOffset: 21,
        priority: 'medium' as const,
        reminderDays: 3,
      },
      {
        type: 'irrigation' as const,
        title: 'Regular Watering Check',
        description: 'Maintain proper soil moisture levels',
        dayOffset: 7,
        priority: 'high' as const,
        reminderDays: 1,
      },
    ];

    // Crop-specific tasks
    switch (cropType.toLowerCase()) {
      case 'rice':
        tasks.push(
          ...commonTasks,
          {
            type: 'irrigation' as const,
            title: 'Flooding Field',
            description: 'Maintain 2-3 inches of water in paddy field',
            dayOffset: 30,
            priority: 'high' as const,
            reminderDays: 2,
          },
          {
            type: 'harvesting' as const,
            title: 'Rice Harvest',
            description: 'Harvest when grains are golden and firm',
            dayOffset: 120,
            priority: 'urgent' as const,
            reminderDays: 7,
          }
        );
        break;

      case 'wheat':
        tasks.push(
          ...commonTasks,
          {
            type: 'fertilization' as const,
            title: 'Nitrogen Application',
            description: 'Apply nitrogen fertilizer for better growth',
            dayOffset: 45,
            priority: 'medium' as const,
            reminderDays: 3,
          },
          {
            type: 'harvesting' as const,
            title: 'Wheat Harvest',
            description: 'Harvest when grains are hard and golden',
            dayOffset: 110,
            priority: 'urgent' as const,
            reminderDays: 5,
          }
        );
        break;

      case 'tomato':
        tasks.push(
          ...commonTasks,
          {
            type: 'pest_control' as const,
            title: 'Tomato Blight Prevention',
            description: 'Apply fungicide to prevent early blight',
            dayOffset: 35,
            priority: 'high' as const,
            reminderDays: 2,
          },
          {
            type: 'harvesting' as const,
            title: 'Tomato Harvest',
            description: 'Harvest ripe tomatoes regularly',
            dayOffset: 75,
            priority: 'medium' as const,
            reminderDays: 3,
          }
        );
        break;

      case 'maize':
        tasks.push(
          ...commonTasks,
          {
            type: 'fertilization' as const,
            title: 'Side Dressing',
            description: 'Apply nitrogen fertilizer when plants are knee-high',
            dayOffset: 35,
            priority: 'medium' as const,
            reminderDays: 3,
          },
          {
            type: 'harvesting' as const,
            title: 'Maize Harvest',
            description: 'Harvest when kernels are hard and dented',
            dayOffset: 90,
            priority: 'urgent' as const,
            reminderDays: 7,
          }
        );
        break;

      case 'potato':
        tasks.push(
          ...commonTasks,
          {
            type: 'general' as const,
            title: 'Hilling',
            description: 'Hill soil around plants to prevent greening',
            dayOffset: 28,
            priority: 'medium' as const,
            reminderDays: 2,
          },
          {
            type: 'harvesting' as const,
            title: 'Potato Harvest',
            description: 'Harvest when plants die back',
            dayOffset: 90,
            priority: 'urgent' as const,
            reminderDays: 5,
          }
        );
        break;

      default:
        tasks.push(...commonTasks);
        // Add generic harvest task
        tasks.push({
          type: 'harvesting' as const,
          title: 'Harvest Time',
          description: 'Check if crop is ready for harvest',
          dayOffset: 90,
          priority: 'high' as const,
          reminderDays: 5,
        });
    }

    // Convert day offsets to actual dates
    return tasks.map(task => ({
      ...task,
      dueDate: new Date(plantingDate.getTime() + task.dayOffset * 24 * 60 * 60 * 1000),
    }));
  }
}

export default new NotificationService();
