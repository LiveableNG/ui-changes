import React, { useState } from 'react';
import { ChevronLeft, ChevronDown, Info, Calendar, X, Upload, AlertCircle, Plus, Clock, Trash2 } from 'lucide-react';

const KYCForm = () => {
    const [images, setImages] = useState([
        { id: 1, url: '/api/placeholder/200/200', name: 'sample-1.jpg' },
        { id: 2, url: '/api/placeholder/200/200', name: 'sample-2.jpg' },
    ]);
    const [description, setDescription] = useState('');
    const [selectedKYCType, setSelectedKYCType] = useState('');
    const [selectedDates, setSelectedDates] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [error, setError] = useState('');
    const [isOpen, setIsOpen] = useState(true);
    const [timeSlots, setTimeSlots] = useState({});
    const [showTimeSelector, setShowTimeSelector] = useState(false);
    const [dateSelectionType, setDateSelectionType] = useState(''); // 'daily', 'weekly', 'custom'
    const [selectedWeekDays, setSelectedWeekDays] = useState([]);

    const DAYS_OF_WEEK = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
    ];

    // Helper to get unique days based on selection type
    const getUniqueDaysOfWeek = () => {
        switch (dateSelectionType) {
            case 'daily':
                return DAYS_OF_WEEK;
            case 'weekly':
                return selectedWeekDays;
            case 'custom':
                const days = selectedDates.map(date => new Date(date).toLocaleDateString('en-US', { weekday: 'long' }));
                return [...new Set(days)];
            default:
                return [];
        }
    };

    // Toggle week day selection
    const toggleWeekDay = (day) => {
        setSelectedWeekDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    const handleSubmit = () => {
        const formData = {
            images,
            description,
            kycType: selectedKYCType,
            schedule: {
                type: dateSelectionType,
                selectedDates,
                selectedWeekDays,
                timeSlots
            }
        };
        
        console.log('Form Submission Data:', formData);
    };

    const DateSelectionOptions = () => (
        <div className="space-y-6">
            {/* Selection Type */}
            <div className="grid grid-cols-3 gap-4">
                <button
                    onClick={() => {
                        setDateSelectionType('daily');
                        setSelectedDates([]);
                    }}
                    className={`p-3 rounded-lg border text-center transition-colors ${dateSelectionType === 'daily'
                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                        : 'border-gray-300 hover:border-[#1e3a8a]'
                        }`}
                >
                    Every Day
                </button>
                <button
                    onClick={() => {
                        setDateSelectionType('weekly');
                        setSelectedDates([]);
                    }}
                    className={`p-3 rounded-lg border text-center transition-colors ${dateSelectionType === 'weekly'
                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                        : 'border-gray-300 hover:border-[#1e3a8a]'
                        }`}
                >
                    Specific Days
                </button>
                <button
                    onClick={() => {
                        setDateSelectionType('custom');
                        setSelectedWeekDays([]);
                    }}
                    className={`p-3 rounded-lg border text-center transition-colors ${dateSelectionType === 'custom'
                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                        : 'border-gray-300 hover:border-[#1e3a8a]'
                        }`}
                >
                    Custom Dates
                </button>
            </div>

            {/* Weekly Selection */}
            {dateSelectionType === 'weekly' && (
                <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-4">Select Days of Week</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {DAYS_OF_WEEK.map(day => (
                            <button
                                key={day}
                                onClick={() => toggleWeekDay(day)}
                                className={`p-2 rounded-lg border transition-colors ${selectedWeekDays.includes(day)
                                    ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                                    : 'border-gray-300 hover:border-[#1e3a8a]'
                                    }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Custom Date Selection */}
            {dateSelectionType === 'custom' && (
                <div className="bg-gray-50 rounded-lg p-4">
                    <button
                        onClick={() => setIsCalendarOpen(true)}
                        className="w-full p-3 border border-gray-300 rounded-lg flex items-center justify-between hover:border-[#1e3a8a]"
                    >
                        <span>
                            {selectedDates.length === 0
                                ? 'Select dates'
                                : `${selectedDates.length} dates selected`}
                        </span>
                        <Calendar className="w-5 h-5" />
                    </button>

                    {selectedDates.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {selectedDates.map(date => (
                                <div key={date} className="bg-[#1e3a8a]/10 text-[#1e3a8a] px-3 py-1 rounded-full text-sm flex items-center">
                                    {date}
                                    <button
                                        onClick={() => setSelectedDates(prev =>
                                            prev.filter(d => d !== date)
                                        )}
                                        className="ml-2 hover:text-[#1e3a8a]/70"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Summary Display */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Selected Schedule</h4>
                <p className="text-gray-600">
                    {dateSelectionType === 'daily' && 'Running every day'}
                    {dateSelectionType === 'weekly' && selectedWeekDays.length > 0 &&
                        `Running every ${selectedWeekDays.join(', ')}`
                    }
                    {dateSelectionType === 'custom' && selectedDates.length > 0 &&
                        `Running on ${selectedDates.length} selected dates`
                    }
                </p>
            </div>
        </div>
    );

    // Helper function to get day of week
    const getDayOfWeek = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    };

    // Add time slot for a specific day
    const addTimeSlot = (day) => {
        setTimeSlots(prev => ({
            ...prev,
            [day]: [...(prev[day] || []), { start: '09:00', end: '17:00' }]
        }));
    };

    // Update time slot for a specific day
    const updateTimeSlot = (day, index, field, value) => {
        setTimeSlots(prev => ({
            ...prev,
            [day]: prev[day].map((slot, i) =>
                i === index ? { ...slot, [field]: value } : slot
            )
        }));
    };

    // Remove time slot for a specific day
    const removeTimeSlot = (day, index) => {
        setTimeSlots(prev => ({
            ...prev,
            [day]: prev[day].filter((_, i) => i !== index)
        }));
    };

    // Image handling
    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files);

        const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
        if (invalidFiles.length > 0) {
            setError('Please upload only image files');
            return;
        }
        setError('');

        const newImages = files.map((file, index) => ({
            id: Date.now() + index,
            url: URL.createObjectURL(file),
            name: file.name,
            file
        }));
        setImages(prev => [...prev, ...newImages]);
    };

    const handleImageRemove = (id) => {
        setImages(prev => prev.filter(image => image.id !== id));
    };

    // Calendar functions remain the same
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const changeMonth = (offset) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    // Add function to check if date is in the past
    const isDateInPast = (day) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    // Update getDayClassName to handle disabled states
    const getDayClassName = (day) => {
        const dateString = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
        const isPast = isDateInPast(day);

        return `p-2 text-center rounded w-8 h-8 flex items-center justify-center transition-colors ${isPast
            ? 'text-gray-300 cursor-not-allowed'
            : selectedDates.includes(dateString)
                ? 'bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90'
                : 'hover:bg-gray-100'
            }`;
    };

    // Update handleDateSelect to prevent selecting past dates
    const handleDateSelect = (day) => {
        if (isDateInPast(day)) return;

        const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateString = formatDate(selectedDate);

        setSelectedDates(prev =>
            prev.includes(dateString)
                ? prev.filter(d => d !== dateString)
                : [...prev, dateString]
        );
    };

    const TimeSelector = () => {
        const uniqueDays = getUniqueDaysOfWeek();

        if (uniqueDays.length === 0) return null;

        return (
            <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Set Available Times</h3>
                <div className="space-y-6">
                    {uniqueDays.map(day => (
                        <div key={day} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-medium">{day}</h4>
                                <button
                                    onClick={() => addTimeSlot(day)}
                                    className="flex items-center text-[#1e3a8a] hover:text-[#1e3a8a]/80"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Time Slot
                                </button>
                            </div>

                            <div className="space-y-3">
                                {(timeSlots[day] || []).map((slot, index) => (
                                    <div key={index} className="flex items-center space-x-4">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <input
                                            type="time"
                                            value={slot.start}
                                            onChange={(e) => updateTimeSlot(day, index, 'start', e.target.value)}
                                            className="border rounded p-2"
                                        />
                                        <span>to</span>
                                        <input
                                            type="time"
                                            value={slot.end}
                                            onChange={(e) => updateTimeSlot(day, index, 'end', e.target.value)}
                                            className="border rounded p-2"
                                        />
                                        <button
                                            onClick={() => removeTimeSlot(day, index)}
                                            className="p-1 text-red-500 hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                {(!timeSlots[day] || timeSlots[day].length === 0) && (
                                    <div className="text-gray-500 text-sm">
                                        No time slots added. Click "Add Time Slot" to set available times.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const CalendarModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
                <div className="flex flex-col h-full">
                    {/* Header with close button */}
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium">Select Dates</h3>
                        <button
                            onClick={() => setIsCalendarOpen(false)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Month Navigation */}
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={() => changeMonth(-1)}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                        >
                            ←
                        </button>
                        <span className="font-medium">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                            onClick={() => changeMonth(1)}
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                        >
                            →
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-sm font-medium text-gray-500">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: getFirstDayOfMonth(currentDate) }, (_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => handleDateSelect(i + 1)}
                                disabled={isDateInPast(i + 1)}
                                className={getDayClassName(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
            <div className="bg-white rounded-lg w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-6 space-y-6">
                    {/* Header */}
                    <h2 className="text-2xl font-medium text-gray-900">Publish Unit</h2>

                    {/* Image Manager */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Images</h3>
                            <label className="bg-[#1e3a8a] text-white px-4 py-2 rounded cursor-pointer hover:bg-[#1e3a8a]/90 transition-colors">
                                <span className="flex items-center">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Images
                                </span>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    multiple
                                    accept="image/*"
                                />
                            </label>
                        </div>

                        {error && (
                            <div className="flex items-center text-red-500 mb-4">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {images.map((image) => (
                                <div key={image.id} className="relative group bg-white border border-gray-200 rounded-lg p-2">
                                    <div className="aspect-square rounded overflow-hidden">
                                        <img
                                            src={image.url}
                                            alt={image.name}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleImageRemove(image.id)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <p className="mt-2 text-sm truncate text-gray-600">{image.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                            placeholder="Enter description..."
                        />
                    </div>

                    {/* KYC Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">KYC Type</label>
                        <select
                            value={selectedKYCType}
                            onChange={(e) => setSelectedKYCType(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
                        >
                            <option value="">Select KYC Type</option>
                            <option value="personal">Personal KYC</option>
                            <option value="business">Business KYC</option>
                            <option value="corporate">Corporate KYC</option>
                        </select>
                    </div>

                    {/* Date Selection */}
                    <div>
                        <h3 className="text-lg font-medium mb-4">Schedule</h3>
                        <DateSelectionOptions />
                    </div>

                    {/* Time Selector */}
                    {(dateSelectionType === 'daily' ||
                        (dateSelectionType === 'weekly' && selectedWeekDays.length > 0) ||
                        (dateSelectionType === 'custom' && selectedDates.length > 0)) && (
                            <TimeSelector />
                        )}
                    {dateSelectionType === 'custom' && isCalendarOpen && <CalendarModal />}

                    {/* Submit Button */}
            <button 
                onClick={handleSubmit}
                className="w-full bg-[#1e3a8a] text-white py-3 rounded-lg hover:bg-[#1e3a8a]/90 transition-colors"
            >
                Submit Form
            </button>
                </div>
            </div>
        </div>
    );
};

export default KYCForm;