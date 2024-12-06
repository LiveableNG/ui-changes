import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';

type TimeSlot = {
  start: string;
  end: string;
};

type WeekDayTimeSlots = {
  [key: string]: TimeSlot[];
};

type ScheduleType = 'daily' | 'weekly' | 'custom';

interface Schedule {
  type: ScheduleType;
  selectedDates?: string[];
  selectedWeekDays?: string[];
  timeSlots: WeekDayTimeSlots;
}

interface UseCase {
  kycType: string;
  description: string;
  schedule: Schedule;
}

interface UseCases {
  [key: string]: UseCase;
}

interface KYCScheduleViewerProps {
  formData: UseCase;
}

const formatTime = (time24: string): string => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${period}`;
};

const useCases: UseCases = {
  personal: {
    kycType: "Personal",
    description: "Complete your personal identity verification through a video call session",
    schedule: {
      type: "daily",
      selectedDates: [],
      selectedWeekDays: [],
      timeSlots: {
        Monday: [
          { start: "09:00", end: "12:00" },
          { start: "13:00", end: "17:00" }
        ],
        Tuesday: [{ start: "09:00", end: "17:00" }],
        Wednesday: [{ start: "09:00", end: "17:00" }],
        Thursday: [{ start: "09:00", end: "17:00" }],
        Friday: [{ start: "09:00", end: "17:00" }]
      }
    }
  },
  corporate: {
    kycType: "Corporate",
    description: "Corporate entity verification for businesses with multiple stakeholders",
    schedule: {
      type: "weekly",
      selectedWeekDays: ["Monday", "Wednesday", "Friday"],
      timeSlots: {
        Monday: [
          { start: "10:00", end: "12:00" },
          { start: "14:00", end: "16:00" }
        ],
        Wednesday: [
          { start: "10:00", end: "12:00" },
          { start: "14:00", end: "16:00" }
        ],
        Friday: [
          { start: "10:00", end: "12:00" }
        ]
      }
    }
  },
  international: {
    kycType: "International",
    description: "International business verification with timezone-specific slots",
    schedule: {
      type: "weekly",
      selectedWeekDays: ["Tuesday", "Thursday"],
      timeSlots: {
        Tuesday: [
          { start: "07:00", end: "09:00" },
          { start: "19:00", end: "21:00" }
        ],
        Thursday: [
          { start: "07:00", end: "09:00" },
          { start: "19:00", end: "21:00" }
        ]
      }
    }
  },
  event: {
    kycType: "Event",
    description: "Special event registration and identity verification",
    schedule: {
      type: "custom",
      selectedDates: [
        "December 10, 2024",
        "December 11, 2024",
        "December 12, 2024"
      ],
      timeSlots: {
        Monday: [
          { start: "09:00", end: "11:00" },
          { start: "13:00", end: "15:00" }
        ],
        Tuesday: [
          { start: "09:00", end: "11:00" },
          { start: "13:00", end: "15:00" }
        ],
        Wednesday: [
          { start: "09:00", end: "11:00" },
          { start: "13:00", end: "15:00" }
        ]
      }
    }
  },
  crypto: {
    kycType: "Crypto",
    description: "Cryptocurrency exchange KYC verification available 24/7",
    schedule: {
      type: "daily",
      selectedDates: [],
      selectedWeekDays: [],
      timeSlots: {
        Sunday: [
          { start: "00:00", end: "08:00" },
          { start: "08:00", end: "16:00" },
          { start: "16:00", end: "23:59" }
        ],
        Monday: [
          { start: "00:00", end: "08:00" },
          { start: "08:00", end: "16:00" },
          { start: "16:00", end: "23:59" }
        ],
        Tuesday: [
          { start: "00:00", end: "08:00" },
          { start: "08:00", end: "16:00" },
          { start: "16:00", end: "23:59" }
        ],
        Wednesday: [
          { start: "00:00", end: "08:00" },
          { start: "08:00", end: "16:00" },
          { start: "16:00", end: "23:59" }
        ],
        Thursday: [
          { start: "00:00", end: "08:00" },
          { start: "08:00", end: "16:00" },
          { start: "16:00", end: "23:59" }
        ],
        Friday: [
          { start: "00:00", end: "08:00" },
          { start: "08:00", end: "16:00" },
          { start: "16:00", end: "23:59" }
        ],
        Saturday: [
          { start: "00:00", end: "08:00" },
          { start: "08:00", end: "16:00" },
          { start: "16:00", end: "23:59" }
        ]
      }
    }
  }
};

const KYCScheduleViewer: React.FC<KYCScheduleViewerProps> = ({ formData }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isDateInPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateAvailable = (date: Date): boolean => {
    if (isDateInPast(date)) return false;

    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateString = formatDate(date);
    const scheduleType = formData.schedule?.type || 'daily';

    switch (scheduleType) {
      case 'daily':
        return true;
      case 'weekly':
        return formData.schedule?.selectedWeekDays?.includes(dayOfWeek) || false;
      case 'custom':
        return formData.schedule?.selectedDates?.includes(dateString) || false;
      default:
        return false;
    }
  };

  const isPastMonth = (date: Date): boolean => {
    const today = new Date();
    return date.getFullYear() < today.getFullYear() ||
      (date.getFullYear() === today.getFullYear() && date.getMonth() < today.getMonth());
  };

  const getTimeSlots = (date: Date): TimeSlot[] => {
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    return formData.schedule?.timeSlots?.[dayOfWeek] || [];
  };

  const changeMonth = (offset: number): void => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    if (!isPastMonth(newDate)) {
      setCurrentMonth(newDate);
    }
  };

  const handleDateClick = (day: number): void => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (isDateAvailable(clickedDate)) {
      setSelectedDate(clickedDate);
      setSelectedTimeSlot(null);
    }
  };

  useEffect(() => {
    setSelectedDate(null);
    setSelectedTimeSlot(null);
  }, [formData]);

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Schedule KYC: {formData.kycType}
        </h2>
        <p className="text-gray-600 mt-2">{formData.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <button 
            onClick={() => changeMonth(-1)} 
            disabled={isPastMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className={`p-2 rounded transition-colors ${
              isPastMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
                ? 'text-gray-300 cursor-not-allowed'
                : 'hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, i) => {
            const day = i + 1;
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isAvailable = isDateAvailable(date);
            const isPast = isDateInPast(date);
            const isSelected = selectedDate && 
              selectedDate.getDate() === day && 
              selectedDate.getMonth() === currentMonth.getMonth();

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                disabled={!isAvailable || isPast}
                className={`p-2 text-center rounded-lg flex items-center justify-center transition-colors
                  ${isPast 
                    ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                    : isAvailable 
                      ? isSelected
                        ? 'bg-blue-900 text-white'
                        : 'hover:bg-gray-100'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Available Time Slots</h3>
          <div className="grid grid-cols-2 gap-4">
            {getTimeSlots(selectedDate).map((slot, index) => (
              <button
                key={index}
                onClick={() => setSelectedTimeSlot(slot)}
                className={`p-4 rounded-lg border flex items-center justify-center space-x-2
                  ${selectedTimeSlot === slot 
                    ? 'border-blue-900 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-900'
                  }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(slot.start)} - {formatTime(slot.end)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedDate && selectedTimeSlot && (
        <button
          onClick={() => {
            alert(`Appointment confirmed for ${formatDate(selectedDate)} at ${formatTime(selectedTimeSlot.start)} - ${formatTime(selectedTimeSlot.end)}`);
          }}
          className="w-full mt-6 bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 transition-colors"
        >
          Confirm Appointment
        </button>
      )}
    </div>
  );
};

const KYCScheduleViewerWithSelector: React.FC = () => {
  const [selectedUseCase, setSelectedUseCase] = useState<string>('personal');

  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto mb-6">
        <label htmlFor="use-case" className="block text-sm font-medium text-gray-700 mb-2">
          Select Use Case
        </label>
        <select
          id="use-case"
          value={selectedUseCase}
          onChange={(e) => setSelectedUseCase(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
        >
          <option value="personal">Personal KYC</option>
          <option value="corporate">Corporate KYC</option>
          <option value="international">International Business KYC</option>
          <option value="event">Special Event KYC</option>
          <option value="crypto">Cryptocurrency Exchange KYC</option>
        </select>
      </div>
      
      <KYCScheduleViewer formData={useCases[selectedUseCase]} />
    </div>
  );
};

export default KYCScheduleViewerWithSelector;