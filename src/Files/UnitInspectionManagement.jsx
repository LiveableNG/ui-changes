import React, { useState, useEffect } from 'react';
import { ChevronLeft, MoreVertical, User, MapPin, Phone, MessageSquare, Clock, Check, X, AlertCircle, Calendar, Users, MessageCircle } from 'lucide-react';
import { mockApiService } from './mockApiService';

const GeofenceError = ({ onBack, distance, radius }) => {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg p-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Location Out of Range
            </h2>
            
            <div className="flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5 text-gray-500 mr-2" />
              <p className="text-gray-600">
                You are {distance}m away from the unit
              </p>
            </div>
            
            <p className="text-gray-500 mb-6">
              Please move within {radius}m of the unit to perform the inspection
            </p>
            
            <button
              onClick={onBack}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  };

// Geofencing utility functions
const checkGeofence = (unitLat, unitLong, userLat, userLong, radiusInMeters = 100) => {
    // Earth's radius in meters
    const earthRadius = 6371000;

    // Helper function to convert degrees to radians
    const toRadians = (degrees) => degrees * (Math.PI / 180);

    // Convert latitude and longitude from degrees to radians
    const lat1 = toRadians(unitLat);
    const lon1 = toRadians(unitLong);
    const lat2 = toRadians(userLat);
    const lon2 = toRadians(userLong);

    // Calculate differences
    const latDelta = lat2 - lat1;
    const lonDelta = lon2 - lon1;

    // Haversine formula
    const a = 
        Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
        Math.cos(lat1) * Math.cos(lat2) * 
        Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Calculate distance in meters
    const distance = earthRadius * c;

    return {
        isInRange: distance <= radiusInMeters,
        distance: Math.round(distance), // Returns distance in meters
        radius: radiusInMeters
    };
};

// Helper function to get current position with error handling
const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        reject(new Error('Please allow location access to use this feature'));
                        break;
                    case error.POSITION_UNAVAILABLE:
                        reject(new Error('Location information is unavailable'));
                        break;
                    case error.TIMEOUT:
                        reject(new Error('Location request timed out'));
                        break;
                    default:
                        reject(new Error('An unknown error occurred'));
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    });
};
  

const UnitInspectionManagement = () => {
    // State Management
    const [currentView, setCurrentView] = useState('units');
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProspect, setSelectedProspect] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [modalMode, setModalMode] = useState('create');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState(null);
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [loadingMessage, setLoadingMessage] = useState('');
    const [units, setUnits] = useState([]);
    const [prospects, setProspects] = useState([]);
    const [isLoadingUnits, setIsLoadingUnits] = useState(true);
    const [isLoadingProspects, setIsLoadingProspects] = useState(false);
    const [showMoveInOnly, setShowMoveInOnly] = useState(false);
    const [geofenceError, setGeofenceError] = useState(null);

    useEffect(() => {
        return () => {
            handleCloseModal();
            setShowConfirmation(false);
            setShowRescheduleModal(false);
        };
    }, []);

    useEffect(() => {
        const fetchInitialUnits = async () => {
            try {
                setIsLoadingUnits(true);
                const fetchedUnits = await mockApiService.fetchUnits();
                setUnits(fetchedUnits);
            } catch (error) {
                console.error('Failed to fetch units:', error);
                setError('Failed to load units. Please try again.');
            } finally {
                setIsLoadingUnits(false);
            }
        };

        fetchInitialUnits();

        return () => {
            handleCloseModal();
            setShowConfirmation(false);
            setShowRescheduleModal(false);
        };
    }, []);

    // Handlers
    const handleUnitSelect = async (unit) => {
        try {
            setIsLoadingProspects(true);
            setError(null);
    
            if (!unit.latitude || !unit.longitude) {
                setError('Unit location data is missing');
                return;
            }
    
            const position = await getCurrentPosition();
            const geofenceResult = checkGeofence(
                unit.latitude,
                unit.longitude,
                position.latitude,
                position.longitude
            );
    
            if (!geofenceResult.isInRange) {
                setGeofenceError({
                    distance: geofenceResult.distance,
                    radius: geofenceResult.radius
                });
                return;
            }
    
            setCurrentView('prospects');
            setSelectedUnit(unit);
    
            const fetchedProspects = await mockApiService.fetchProspects(unit.id);
            setProspects(prevProspects => [
                ...prevProspects.filter(p => p.unitId !== unit.id),
                ...fetchedProspects
            ]);
        } catch (error) {
            setError(error.message || 'Failed to check location or load prospects');
        } finally {
            setIsLoadingProspects(false);
        }
    };

    const handleBackToUnits = () => {
        setSelectedUnit(null);
        setCurrentView('units');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFeedback('');
        setSelectedProspect(null);
        setModalMode('create');
        setError(null);
        setRescheduleDate(null);
    };

    const handleProspectClick = (prospect) => {
        setSelectedProspect(prospect);
        setModalMode(prospect.status === 'completed' ? 'view' : 'create');
        setIsModalOpen(true);
    };

    const handleSaveFeedback = async (feedbackText) => {
        setIsLoading(true);
        setLoadingMessage('Saving feedback...');
        try {
            const result = await mockApiService.updateProspectStatus(
                selectedProspect.id,
                'completed',
                feedbackText
            );

            if (result.success) {
                // Update prospects
                const updatedProspects = prospects.map(p => {
                    if (p.id === selectedProspect.id) {
                        return {
                            ...p,
                            status: 'completed',
                            feedback: feedbackText,
                            departureTime: result.timestamp
                        };
                    }
                    return p;
                });

                setProspects(updatedProspects);

                // Calculate total handled inspections
                const handledCount = updatedProspects.filter(p =>
                    p.unitId === selectedUnit.id && (
                        p.status === 'completed' ||
                        p.status === 'no_show' ||
                        p.status === 'cancelled'
                    )
                ).length;

                // Update unit with correct count
                setUnits(units.map(unit => {
                    if (unit.id === selectedUnit.id) {
                        return {
                            ...unit,
                            completedInspections: handledCount
                        };
                    }
                    return unit;
                }));

                handleCloseModal();
            }
        } catch (error) {
            console.error('Failed to save feedback:', error);
            setError('Failed to save feedback. Please try again.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleReschedule = (prospectId, newDate) => {
        setProspects(prospects.map(p => {
            if (p.id === prospectId) {
                return {
                    ...p,
                    status: 'scheduled',
                    time: newDate,
                    rescheduleDate: new Date().toISOString()
                };
            }
            return p;
        }));
        setShowRescheduleModal(false);
        setRescheduleDate(null);
    };

    // Units List View Component (Unchanged)
    const UnitsListView = () => {
        const filteredUnits = showMoveInOnly
            ? units.filter(unit => unit.isMoveIn)
            : units;

        return (
            <div className="space-y-4">
                {/* Toggle Switch */}
                <div className="bg-white p-4 rounded-lg shadow mb-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                            Show Viewing Inspections Only
                        </span>
                        <button
                            onClick={() => setShowMoveInOnly(!showMoveInOnly)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${showMoveInOnly ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showMoveInOnly ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {isLoadingUnits ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading units...</p>
                    </div>
                ) : filteredUnits.length > 0 ? (
                    filteredUnits.map(unit => (
                        <div
                            key={unit.id}
                            className="bg-white rounded-lg shadow p-4 space-y-4"
                        >
                            { !unit.isMoveIn &&
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-blue-600">
                                        <Clock className="w-5 h-5 mr-2" />
                                        <span>Upcoming</span>
                                    </div>
                                    <span className="text-gray-600">{unit.date}</span>
                                </div>
                            }

                            <div className="space-y-2">

                                <div className="flex items-center">
                                    {
                                        unit.isMoveIn ?
                                            <>
                                                <Users className="w-5 h-5 text-gray-400 mr-2" />
                                                <span className="text-gray-600">
                                                    {prospects.filter(p =>
                                                        p.unitId === unit.id &&
                                                        (p.status === 'completed' || p.status === 'no_show' || p.status === 'cancelled')
                                                    ).length} of {unit.totalProspects} inspections handled
                                                </span>
                                            </>
                                            :
                                            <>
                                                <Users className="w-5 h-5 text-gray-400 mr-2" />
                                                <span className="text-gray-600">Tenant Yuc1 - K.</span>
                                            </>
                                    }

                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                                        <span className="text-gray-900">{unit.name}</span>
                                    </div>
                                    {unit.isMoveIn && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Viewing
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => handleUnitSelect(unit)}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Start Inspection
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-600">No {showMoveInOnly ? 'move-in ' : ''}units available.</p>
                    </div>
                )}
            </div>
        );
    };

    // Prospects List View Component (Updated)
    const ProspectsListView = () => {
        const [openActionMenu, setOpenActionMenu] = useState(null);
        // Add this new useEffect
        useEffect(() => {
            const handleClickOutside = (event) => {
                if (!event.target.closest('.action-menu')) {
                    setOpenActionMenu(null);
                }
            };

            document.addEventListener('click', handleClickOutside);
            return () => {
                document.removeEventListener('click', handleClickOutside);
            };
        }, []);

        if (isLoadingProspects) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[200px] py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading prospects...</p>
                </div>
            );
        }

        const handleCall = (e, phone) => {
            e.stopPropagation();
            window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
        };

        const handleSMS = (e, phone) => {
            e.stopPropagation();
            window.location.href = `sms:${phone.replace(/\s+/g, '')}`;
        };

        const handleWhatsApp = (e, phone) => {
            e.stopPropagation();
            const formattedPhone = phone.replace(/\s+/g, '');
            window.location.href = `https://wa.me/${formattedPhone}`;
        };

        const handleMarkNoShow = (prospectId) => {
            setPendingAction(() => () => {
                setProspects(prospects.map(p => {
                    if (p.id === prospectId) {
                        return { ...p, status: 'no_show' };
                    }
                    return p;
                }));
            });
            setConfirmationMessage('Are you sure you want to mark this prospect as no-show?');
            setShowConfirmation(true);
        };

        const handleCancel = (prospectId) => {
            setPendingAction(() => () => {
                setProspects(prospects.map(p => {
                    if (p.id === prospectId) {
                        return { ...p, status: 'cancelled' };
                    }
                    return p;
                }));
            });
            setConfirmationMessage('Are you sure you want to cancel this appointment?');
            setShowConfirmation(true);
        };

        const getAvailableActions = (prospect) => {
            switch (prospect.status) {
                case 'scheduled':
                    return [
                        { label: 'Start Inspection', action: () => handleProspectClick(prospect), icon: Check },
                        { label: 'Mark as No-Show', action: () => handleMarkNoShow(prospect.id), icon: X },
                        { label: 'Cancel Appointment', action: () => handleCancel(prospect.id), icon: AlertCircle }
                    ];
                case 'completed':
                    return [
                        { label: 'View Feedback', action: () => handleProspectClick(prospect), icon: Clock }
                    ];
                case 'no_show':
                case 'cancelled':
                    return [
                        {
                            label: 'Reschedule',
                            action: () => {
                                setSelectedProspect(prospect);
                                setShowRescheduleModal(true);
                            },
                            icon: Calendar
                        }
                    ];
                default:
                    return [];
            }
        };

        const getStatusColor = (status) => {
            switch (status) {
                case 'completed':
                    return 'bg-green-50 border-green-100';
                case 'no_show':
                    return 'bg-red-50 border-red-100';
                case 'cancelled':
                    return 'bg-gray-50 border-gray-100';
                default:
                    return 'bg-white border-gray-100';
            }
        };

        const getStatusIcon = (status) => {
            switch (status) {
                case 'completed':
                    return <Check className="w-4 h-4 text-green-600" />;
                case 'no_show':
                    return <AlertCircle className="w-4 h-4 text-red-600" />;
                case 'cancelled':
                    return <X className="w-4 h-4 text-gray-600" />;
                default:
                    return <Clock className="w-4 h-4 text-blue-600" />;
            }
        };

        const getStatusText = (status) => {
            switch (status) {
                case 'completed':
                    return 'Completed';
                case 'no_show':
                    return 'No Show';
                case 'cancelled':
                    return 'Cancelled';
                case 'scheduled':
                    return 'Scheduled';
                default:
                    return 'Pending';
            }
        };

        const sortedProspects = [...prospects]
            .filter(prospect => prospect.unitId === selectedUnit.id)
            .sort((a, b) => {
                const statusOrder = { scheduled: 0, pending: 1, completed: 2, no_show: 3, cancelled: 4 };
                if (statusOrder[a.status] !== statusOrder[b.status]) {
                    return statusOrder[a.status] - statusOrder[b.status];
                }
                return a.time.localeCompare(b.time);
            });

        return (
            <div className="space-y-4">
                {sortedProspects.map(prospect => (
                    <div
                        key={prospect.id}
                        className={`rounded-lg shadow-sm border p-4 ${getStatusColor(prospect.status)}`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-base font-medium text-gray-900">{prospect.name}</h3>
                                    <span className="text-sm text-blue-600">
                                    {'1 week from now'} | {prospect.time}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">{prospect.phone}</p>
                                <div className="flex items-center text-sm">
                                    {getStatusIcon(prospect.status)}
                                    <span className="ml-1 text-gray-600">{getStatusText(prospect.status)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <div className="flex space-x-3">
                                <button
                                    onClick={(e) => handleCall(e, prospect.phone)}
                                    className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                    <Phone className="w-4 h-4 mr-1" />
                                </button>
                                <button
                                    onClick={(e) => handleSMS(e, prospect.phone)}
                                    className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                    <MessageSquare className="w-4 h-4 mr-1" />
                                </button>
                                <button
                                    onClick={(e) => handleWhatsApp(e, prospect.phone)}
                                    className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                    </svg>
                                </button>
                            </div>

                            <div className="relative action-menu">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenActionMenu(openActionMenu === prospect.id ? null : prospect.id);
                                    }}
                                    className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center"
                                >
                                    Actions
                                    <MoreVertical className="w-4 h-4 ml-1" />
                                </button>

                                {openActionMenu === prospect.id && (
                                    <div className="absolute right-0 z-10 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200">
                                        {getAvailableActions(prospect).map((action, index) => (
                                            <button
                                                key={index}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    action.action();
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                                            >
                                                <action.icon className="w-4 h-4 mr-2" />
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const FeedbackModal = () => {
        const [localFeedback, setLocalFeedback] = useState('');
        const [sendKyc, setSendKyc] = useState(true); // Add this line
    
        useEffect(() => {
            if (selectedProspect) {
                setLocalFeedback(selectedProspect.feedback || '');
                setSendKyc(true); // Add this line to reset KYC checkbox state
            }
        }, [selectedProspect, isModalOpen]);
    
        const handleSave = () => {
            if (!localFeedback.trim()) {
                setError('Feedback is required for completed inspections');
                return;
            }
            handleSaveFeedback(localFeedback, sendKyc); // Update this line to include sendKyc
        };
    
        return (
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${isModalOpen ? 'flex items-center justify-center' : 'hidden'}`}>
                <div className="w-full max-w-lg mx-4 bg-white rounded-lg shadow-xl">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">
                                {modalMode === 'view' ? 'Inspection Feedback' : 'Record Feedback'} - {selectedProspect?.name}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500">{selectedProspect?.time}</p>
                    </div>
    
                    <div className="p-4">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                                {error}
                            </div>
                        )}
                        <textarea
                            className="w-full min-h-[150px] p-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                            placeholder={modalMode === 'view' ? 'No feedback available' : 'Enter inspection feedback...'}
                            value={localFeedback}
                            onChange={(e) => setLocalFeedback(e.target.value)}
                            readOnly={modalMode === 'view'}
                        />
    
                        {/* Add this checkbox section */}
                        {modalMode === 'create' && (
                            <div className="flex items-center mb-4">
                                <input
                                    type="checkbox"
                                    id="sendKyc"
                                    checked={sendKyc}
                                    onChange={(e) => setSendKyc(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                />
                                <label htmlFor="sendKyc" className="ml-2 text-gray-700">
                                    Send KYC form to prospect
                                </label>
                            </div>
                        )}
    
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                {modalMode === 'view' ? 'Close' : 'Cancel'}
                            </button>
                            {modalMode === 'create' && (
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Saving...' : 'Mark as Complete'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Confirmation Dialog Component
    const ConfirmationDialog = () => (
        <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${showConfirmation ? 'flex items-center justify-center' : 'hidden'}`}>
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                <h3 className="text-lg font-medium mb-4">Confirm Action</h3>
                <p className="text-gray-600 mb-6">{confirmationMessage}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={() => setShowConfirmation(false)}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            pendingAction?.();
                            setShowConfirmation(false);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );

    // Reschedule Modal Component
    const RescheduleModal = () => {
        const handleRescheduleChange = (e) => {
            const selectedDate = new Date(e.target.value);
            const now = new Date();

            if (selectedDate < now) {
                setError('Please select a future date and time');
                return;
            }

            setRescheduleDate(e.target.value);
            setError(null);
        };

        return (
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${showRescheduleModal ? 'flex items-center justify-center' : 'hidden'}`}>
                <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                    <h3 className="text-lg font-medium mb-4">Reschedule Appointment</h3>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                            {error}
                        </div>
                    )}
                    <input
                        type="datetime-local"
                        className="w-full p-2 border rounded mb-4"
                        value={rescheduleDate || ''}
                        onChange={handleRescheduleChange}
                    />
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setShowRescheduleModal(false)}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleReschedule(selectedProspect.id, rescheduleDate)}
                            disabled={!rescheduleDate}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
                <div className="px-4 py-3">
                    <div className="flex items-center">
                        {currentView === 'prospects' && (
                            <button
                                onClick={handleBackToUnits}
                                className="mr-3 p-2 -ml-2 touch-manipulation"
                            >
                                <ChevronLeft className="w-6 h-6 text-gray-600" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">
                                {currentView === 'units' ? 'Available Units' : selectedUnit?.name}
                            </h1>
                            {currentView === 'prospects' && (
                                <p className="text-sm text-gray-500">{selectedUnit?.address}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="pt-20 pb-6 px-4">
                {currentView === 'units' ? <UnitsListView /> : <ProspectsListView />}
            </div>

        {/* Geofence Error Overlay */}
        {geofenceError && (
            <div className="fixed inset-0 z-50">
                <GeofenceError
                    distance={geofenceError.distance}
                    radius={geofenceError.radius}
                    onBack={() => {
                        setGeofenceError(null);
                        setIsLoadingProspects(false);
                    }}
                />
            </div>
        )}

            {/* Modals */}
            <FeedbackModal />
            <ConfirmationDialog />
            <RescheduleModal />
        </div>
    );
};

export default UnitInspectionManagement;