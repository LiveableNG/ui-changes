import React, { useState, useEffect, createContext, useContext } from 'react';
import { Search, Star, MapPin, Clock, Menu, X, User } from 'lucide-react';

// Mock Data
const services = [
  { id: 1, name: 'Electrical Work', icon: '⚡', description: 'Professional electrical repairs and installations' },
  { id: 2, name: 'Plumbing', icon: '🔧', description: 'Expert plumbing services and repairs' },
  { id: 3, name: 'Gardening', icon: '🌱', description: 'Professional garden maintenance and landscaping' },
  { id: 4, name: 'Cleaning', icon: '🧹', description: 'Home cleaning and maintenance services' },
];

const allServiceProviders = [
  {
    id: 1,
    name: 'John Smith',
    service: 'Electrical Work',
    rating: 4.8,
    location: 'New York',
    availability: true,
    image: '/api/placeholder/64/64',
    hourlyRate: 75
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    service: 'Plumbing',
    rating: 4.9,
    location: 'Los Angeles',
    availability: true,
    image: '/api/placeholder/64/64',
    hourlyRate: 85
  },
  {
    id: 3,
    name: 'Mike Wilson',
    service: 'Gardening',
    rating: 4.7,
    location: 'New York',
    availability: true,
    image: '/api/placeholder/64/64',
    hourlyRate: 65
  },
  {
    id: 4,
    name: 'Emma Davis',
    service: 'Cleaning',
    rating: 4.9,
    location: 'Los Angeles',
    availability: true,
    image: '/api/placeholder/64/64',
    hourlyRate: 55
  },
];

// Context
const AuthContext = createContext(null);
const BookingContext = createContext(null);

// Service Card Component
const ServiceCard = ({ service, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white p-6 rounded-lg shadow-md cursor-pointer transition-all
      ${isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'}`}
  >
    <div className="text-3xl mb-4">{service.icon}</div>
    <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
    <p className="text-gray-600">{service.description}</p>
  </div>
);

// Provider Card Component
const ProviderCard = ({ provider, onBook }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center mb-4">
      <img
        src={provider.image}
        alt={provider.name}
        className="w-16 h-16 rounded-full mr-4"
      />
      <div>
        <h3 className="text-lg font-semibold">{provider.name}</h3>
        <p className="text-gray-600">{provider.service}</p>
      </div>
    </div>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <Star className="text-yellow-400 mr-1" size={20} />
        <span>{provider.rating}</span>
      </div>
      <div className="text-gray-600 flex items-center">
        <MapPin size={16} className="mr-1" />
        {provider.location}
      </div>
    </div>
    <div className="flex items-center justify-between mb-4">
      <div className="text-gray-600">
        ${provider.hourlyRate}/hour
      </div>
      <div className="flex items-center text-green-600">
        <Clock size={16} className="mr-1" />
        Available
      </div>
    </div>
    <button
      onClick={() => onBook(provider)}
      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
    >
      Book Now
    </button>
  </div>
);

// Booking Modal Component
const BookingModal = ({ provider, onClose, onSuccess }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const booking = {
      provider,
      date: selectedDate,
      time: selectedTime,
      description,
      status: 'pending'
    };
    onSuccess(booking);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Book {provider.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <select
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              >
                <option value="">Select time</option>
                {Array.from({ length: 8 }, (_, i) => i + 9).map((hour) => (
                  <option key={hour} value={`${hour}:00`}>
                    {`${hour}:00 ${hour < 12 ? 'AM' : 'PM'}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description of work needed
              </label>
              <textarea
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe what needs to be done..."
              />
            </div>
            <div className="flex justify-between items-center pt-4">
              <p className="text-gray-600">Rate: ${provider.hourlyRate}/hour</p>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main App Component
const HomeServiceApp = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [filteredProviders, setFilteredProviders] = useState(allServiceProviders);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    let filtered = allServiceProviders;

    if (searchTerm) {
      filtered = filtered.filter(
        provider =>
          provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          provider.service.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLocation) {
      filtered = filtered.filter(provider => provider.location === selectedLocation);
    }

    if (selectedService) {
      const service = services.find(s => s.id === selectedService);
      if (service) {
        filtered = filtered.filter(provider => provider.service === service.name);
      }
    }

    setFilteredProviders(filtered);
  }, [searchTerm, selectedLocation, selectedService]);

  const handleBookingSuccess = (booking) => {
    setBookings([...bookings, booking]);
    setShowBookingSuccess(true);
    setTimeout(() => setShowBookingSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-blue-600">HomeServe</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <button className="text-gray-700 hover:text-blue-600 px-3 py-2">Services</button>
              <button className="text-gray-700 hover:text-blue-600 px-3 py-2">Bookings</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Login
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-700 hover:text-blue-600"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden pb-4">
              <button className="block w-full text-left px-4 py-2 text-gray-700 hover:text-blue-600">
                Services
              </button>
              <button className="block w-full text-left px-4 py-2 text-gray-700 hover:text-blue-600">
                Bookings
              </button>
              <button className="block w-full text-left px-4 py-2 text-gray-700 hover:text-blue-600">
                Login
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Find a Service Provider</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search services or providers..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1">
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <option value="">Select location</option>
                  <option value="New York">New York</option>
                  <option value="Los Angeles">Los Angeles</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Our Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedService === service.id}
                onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
              />
            ))}
          </div>
        </div>

        {/* Service Providers */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Available Service Providers</h2>
          {filteredProviders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No service providers found matching your criteria
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onBook={() => setSelectedProvider(provider)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Booking Modal */}
        {selectedProvider && (
          <BookingModal
            provider={selectedProvider}
            onClose={() => setSelectedProvider(null)}
            onSuccess={handleBookingSuccess}
          />
        )}

        {/* Success Message */}
        {showBookingSuccess && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg">
            Booking confirmed successfully!
          </div>
        )}
      </main>
    </div>
  );
};

export default HomeServiceApp;