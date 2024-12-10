const UnitVerificationModal = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [showKYCForm, setShowKYCForm] = useState(false);
    const [formData, setFormData] = useState({
      branch: '',
      unitName: '',
      unitType: '',
      rentType: '',
      rentCurrency: '',
      rentAmount: '',
      managementFee: '0',
      serviceCharge: '',
      serviceChargeFrequency: '',
      agencyFee: '',
      legalFee: '',
      cautionDeposit: '',
      rooms: '',
      bathrooms: '',
      toilets: ''
    });
  
    const [errors, setErrors] = useState({});
  
    // Options for dropdowns
    const currencyOptions = ['NGN', 'USD', 'EUR', 'GBP'];
    const rentTypeOptions = ['Monthly', 'Yearly', 'Weekly'];
    const unitTypeOptions = ['Apartment', 'House', 'Office', 'Shop'];
    const branchOptions = ['Main Branch', 'Branch 1', 'Branch 2'];
    const frequencyOptions = ['Monthly', 'Quarterly', 'Yearly'];
  
    const validateForm = () => {
      const newErrors = {};
      if (!formData.branch) newErrors.branch = 'Branch is required';
      if (!formData.unitName) newErrors.unitName = 'Unit name is required';
      if (!formData.unitType) newErrors.unitType = 'Unit type is required';
      if (!formData.rentType) newErrors.rentType = 'Rent type is required';
      if (!formData.rentCurrency) newErrors.rentCurrency = 'Currency is required';
      if (!formData.rentAmount) newErrors.rentAmount = 'Rent amount is required';
      if (!formData.managementFee) newErrors.managementFee = 'Management fee is required';
  
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  
    const handleSubmit = () => {
      if (validateForm()) {
        setShowKYCForm(true);
      }
    };
  
    if (showKYCForm) {
      return <KYCForm unitData={formData} onBack={() => setShowKYCForm(false)} />;
    }
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
        <div className="bg-white rounded-lg w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white px-6 py-4 border-b">
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          </div>
  
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-medium">Add a unit</h2>
  
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Branch */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Branch
                  <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className={`w-full p-3 border rounded-lg appearance-none pr-10 ${
                      errors.branch ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select an option</option>
                    {branchOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.branch && <p className="mt-1 text-sm text-red-500">{errors.branch}</p>}
              </div>
  
              {/* Unit Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Unit Name
                  <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    value={formData.unitName}
                    onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                    className={`w-full p-3 border rounded-lg ${
                      errors.unitName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter The Unit Name"
                  />
                </div>
                {errors.unitName && <p className="mt-1 text-sm text-red-500">{errors.unitName}</p>}
              </div>
  
              {/* Unit Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Unit Type
                  <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <select
                    value={formData.unitType}
                    onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                    className={`w-full p-3 border rounded-lg appearance-none pr-10 ${
                      errors.unitType ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select an option</option>
                    {unitTypeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.unitType && <p className="mt-1 text-sm text-red-500">{errors.unitType}</p>}
              </div>
  
              {/* Rent Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rent Type
                  <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <select
                    value={formData.rentType}
                    onChange={(e) => setFormData({ ...formData, rentType: e.target.value })}
                    className={`w-full p-3 border rounded-lg appearance-none pr-10 ${
                      errors.rentType ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select an option</option>
                    {rentTypeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.rentType && <p className="mt-1 text-sm text-red-500">{errors.rentType}</p>}
              </div>
  
              {/* Rent Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rent Currency
                  <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <select
                    value={formData.rentCurrency}
                    onChange={(e) => setFormData({ ...formData, rentCurrency: e.target.value })}
                    className={`w-full p-3 border rounded-lg appearance-none pr-10 ${
                      errors.rentCurrency ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select an option</option>
                    {currencyOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.rentCurrency && <p className="mt-1 text-sm text-red-500">{errors.rentCurrency}</p>}
              </div>
  
              {/* Rent Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Rent Amount
                  <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    value={formData.rentAmount}
                    onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                    className={`w-full p-3 border rounded-lg ${
                      errors.rentAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter The Rent Amount"
                  />
                </div>
                {errors.rentAmount && <p className="mt-1 text-sm text-red-500">{errors.rentAmount}</p>}
              </div>
  
              {/* Management Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Management Fee (%)
                  <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    value={formData.managementFee}
                    onChange={(e) => setFormData({ ...formData, managementFee: e.target.value })}
                    className={`w-full p-3 border rounded-lg ${
                      errors.managementFee ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                </div>
                {errors.managementFee && <p className="mt-1 text-sm text-red-500">{errors.managementFee}</p>}
              </div>
  
              {/* Service Charge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  Service Charge
                  <span className="text-gray-500 text-sm ml-1">(optional)</span>
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    value={formData.serviceCharge}
                    onChange={(e) => setFormData({ ...formData, serviceCharge: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Enter The Service Charge"
                  />
                </div>
              </div>
  
              {/* Service Charge Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  Service Charge Frequency
                  <span className="text-gray-500 text-sm ml-1">(optional)</span>
                </label>
                <div className="mt-1 relative">
                  <select
                    value={formData.serviceChargeFrequency}
                    onChange={(e) => setFormData({ ...formData, serviceChargeFrequency: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg appearance-none pr-10"
                  >
                    <option value="">Select an option</option>
                    {frequencyOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
  
              {/* Agency Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  Agency Fee
                  <span className="text-gray-500 text-sm ml-1">(optional)</span>
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    value={formData.agencyFee}
                    onChange={(e) => setFormData({ ...formData, agencyFee: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Enter the Agency Fee"
                  />
                </div>
              </div>
  
              {/* Legal Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  Legal Fee
                  <span className="text-gray-500 text-sm ml-1">(optional)</span>
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    value={formData.legalFee}
                    onChange={(e) => setFormData({ ...formData, legalFee: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Enter the legal fee"
                  />
                </div>
              </div>
  
              {/* Caution Deposit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  Refundable caution deposit
                  <span className="text-gray-500 text-sm ml-1">(optional)</span>
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    value={formData.cautionDeposit}
                    onChange={(e) => setFormData({ ...formData, cautionDeposit: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Enter caution deposit"
                  />
                </div>
              </div>
  
              {/* Rooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  Rooms
                  <span className="text-gray-500 text-sm ml-1">(optional)</span>
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    value={formData.rooms}
                    onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Enter number of bedrooms"
                  />
                </div>
              </div>
  
              {/* Bathrooms */}
              <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                Bathrooms
                <span className="text-gray-500 text-sm ml-1">(optional)</span>
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Enter number of bathrooms"
                />
              </div>
            </div>

            {/* Toilets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center">
                Toilets
                <span className="text-gray-500 text-sm ml-1">(optional)</span>
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  value={formData.toilets}
                  onChange={(e) => setFormData({ ...formData, toilets: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Enter number of toilets"
                />
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Verify Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Branch:</p>
                <p className="font-medium">{formData.branch || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Unit Name:</p>
                <p className="font-medium">{formData.unitName || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Unit Type:</p>
                <p className="font-medium">{formData.unitType || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rent:</p>
                <p className="font-medium">
                  {formData.rentCurrency} {formData.rentAmount || '0'} ({formData.rentType})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Management Fee:</p>
                <p className="font-medium">{formData.managementFee}%</p>
              </div>
              {formData.serviceCharge && (
                <div>
                  <p className="text-sm text-gray-600">Service Charge:</p>
                  <p className="font-medium">
                    {formData.rentCurrency} {formData.serviceCharge} ({formData.serviceChargeFrequency})
                  </p>
                </div>
              )}
              {formData.rooms && (
                <div>
                  <p className="text-sm text-gray-600">Property Details:</p>
                  <p className="font-medium">
                    {formData.rooms} Rooms, {formData.bathrooms} Baths, {formData.toilets} Toilets
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              className="w-full md:w-auto bg-[#1e3a8a] text-white px-8 py-3 rounded-lg hover:bg-[#1e3a8a]/90 transition-colors"
            >
              Proceed to Upload Documents
            </button>
          </div>
        </div>
      </div>
    </div>
    );
}
