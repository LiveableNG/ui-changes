import React, { useState } from 'react';

const LandlordReport1 = () => {
  const defaultData = {
    "landlordName": "Mrs Adamu Bube",
    "date": "21st, November 2024",
    "overview": {
      "totalProperties": 3,
      "totalUnits": 15,
      "totalTenants": 12
    },
    "properties": [
      {
        "name": "David's Estate",
        "address": "7 Fisher Street, Dopemu, Lagos Agege, Nigeria",
        // "units": 5,
        "tenants": 4,
        "rentValue": "₦ 15,000,000",
        "status": "4 Occupied; 1 Vacant",
        "units": [
          {
            "unit": "Suite 100",
            "amount": "₦ 1,500,000",
            "period": "15th, Aug 2024 - 14th, Aug 2025",
            "status": "paid"
          },
          {
            "unit": "Suite 200",
            "amount": "$ 2,000,000",
            "period": "7th, Nov 2024 - 6th, Nov 2025",
            "status": "part-payment"
          }
        ],
        "expenses": [
          {
            "category": "Power",
            "amount": "$ 5,600",
            "complaint": "Purchase of 50L fuel"
          },
          {
            "category": "Maintenance/Repair",
            "amount": "$ 9,000",
            "complaint": "A.C Repair"
          }
        ],
        "inspections": [
          {
            "unit": "Suite 100",
            "item": "Air Conditioner",
            "condition": "Needs Repair",
            "remark": "Gas needs to be refilled",
            "image": "/api/placeholder/400/300"
          },
          {
            "unit": "Suite 200",
            "item": "Chandelier",
            "condition": "Critical",
            "remark": "It is almost falling down",
            "image": "/api/placeholder/400/300"
          }
        ]
      }
    ]
  };

  const [jsonData, setJsonData] = useState(JSON.stringify(defaultData, null, 2));
  const [reportData, setReportData] = useState(defaultData);
  const [error, setError] = useState('');
  const [showJson, setShowJson] = useState(true);

  const handleJsonChange = (e) => {
    setJsonData(e.target.value);
    try {
      const parsed = JSON.parse(e.target.value);
      setReportData(parsed);
      setError('');
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  const renderCurrencyValues = (rentValue) => {
    if (typeof rentValue === 'string') return rentValue;
    return Object.entries(rentValue).map(([currency, amount], index) => (
      <div key={currency} className={index > 0 ? 'mt-1' : ''}>
        <span className="font-medium">{amount}</span>
        <span className="text-gray-500 text-sm ml-1">({currency})</span>
      </div>
    ));
  };
  
  const renderReportInfo = () => (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Report Information</h2>
      <div className="bg-white rounded-lg border p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Prepared By</p>
            <p className="font-semibold">{reportData.reportInfo?.preparedBy}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Report Number</p>
            <p className="font-semibold">{reportData.reportInfo?.reportNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Report Period</p>
            <p className="font-semibold">{reportData.reportInfo?.reportPeriod}</p>
          </div>
        </div>
        
        {reportData.reportInfo?.additionalNotes && (
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">Additional Notes</p>
            <p className="text-gray-700">{reportData.reportInfo.additionalNotes}</p>
          </div>
        )}
  
        {reportData.reportInfo?.supportingImages && (
          <div className="grid grid-cols-2 gap-4">
            {reportData.reportInfo.supportingImages.map((image, index) => (
              <div key={index} className="relative">
                <img 
                  src={image.image} 
                  alt={image.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="mt-2">
                  <p className="font-medium">{image.title}</p>
                  <p className="text-sm text-gray-500">{image.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
  
  const renderInspectionImages = (images) => (
    <div className="grid grid-cols-2 gap-4 mt-4">
      {images.map((img, index) => (
        <div key={index} className="relative">
          <img 
            src={img.image} 
            alt={img.title}
            className="w-full h-32 object-cover rounded-lg"
          />
          <div className="mt-2">
            <p className="font-medium text-sm">{img.title}</p>
            <p className="text-xs text-gray-500">{img.description}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toggle Button */}
      <div className="fixed top-4 right-4 z-10">
        <button 
          onClick={() => setShowJson(!showJson)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showJson ? 'Hide JSON' : 'Show JSON'}
        </button>
      </div>

      {/* JSON Input Section */}
      <div className={`fixed top-0 right-0 w-1/3 h-screen bg-white border-l transform transition-transform duration-300 overflow-auto ${showJson ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">Edit Report Data</h3>
          <div className="mb-4">
            <textarea
              className="w-full h-[calc(100vh-100px)] p-4 border rounded-lg font-mono text-sm"
              value={jsonData}
              onChange={handleJsonChange}
            />
            {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
          </div>
        </div>
      </div>

      {/* Report Preview */}
      <div className={`transition-all duration-300 ${showJson ? 'mr-1/3' : 'mr-0'}`}>
        <div className="max-w-[210mm] mx-auto p-8 bg-white my-8">
          {/* Header */}
          <div className="text-center mb-8 pb-6 border-b">
            <h1 className="text-3xl font-bold mb-2">Jimoh And Partners</h1>
            <h2 className="text-xl text-gray-600">Property Management Update</h2>
            <p className="text-gray-500 mt-2">{reportData.date}</p>
          </div>

          {/* Introduction */}
          <div className="mb-8">
            <p className="text-lg mb-4">Dear {reportData.landlordName},</p>
            <p>We are pleased to provide you with the latest information regarding the state of your properties.</p>
            
            <div className="grid grid-cols-3 gap-4 mt-6 mb-8">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{reportData.overview.totalProperties}</p>
                <p className="text-gray-600">Properties</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{reportData.overview.totalUnits}</p>
                <p className="text-gray-600">Units</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{reportData.overview.totalTenants}</p>
                <p className="text-gray-600">Tenants</p>
              </div>
            </div>
          </div>
          
          {/* Add Report Info Section */}
          {reportData.reportInfo && renderReportInfo()}

          {/* Property Overview Section */}
          <section className="mb-12 break-inside-avoid">
            <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Property Overview</h2>
            <div className="grid gap-6">
              {reportData.properties.map((property, index) => (
                <div key={index} className="mb-6 p-6 bg-white rounded-lg border">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold">{property.name}</h3>
                    <p className="text-sm text-gray-500">{property.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Rent Value</p>
                      {renderCurrencyValues(property.rentValue)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-semibold">{property.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Rent Report Section */}
          <section className="mb-12 break-inside-avoid">
            <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Rent Report</h2>
            {reportData.properties.map((property, index) => (
              <div key={index} className="mb-8 break-inside-avoid">
                <div className="bg-white rounded-lg border p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-4">{property.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{property.address}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Unit</th>
                          <th className="text-left py-2">Amount</th>
                          <th className="text-left py-2">Tenancy Period</th>
                          <th className="text-left py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {property.units.map((unit, unitIndex) => (
                          <tr key={unitIndex} className="border-b">
                            <td className="py-2">{unit.unit}</td>
                            <td className="py-2">{unit.amount}</td>
                            <td className="py-2">{unit.period}</td>
                            <td className="py-2">
                              <span className={`px-2 py-1 rounded-full text-sm ${
                                unit.status === 'paid' ? 'bg-green-100 text-green-800' : 
                                unit.status === 'vacant' ? 'bg-red-100 text-red-800' : 
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {unit.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Expense Report Section */}
          <section className="mb-12 break-inside-avoid">
            <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Expense Report</h2>
            {reportData.properties.map((property, index) => (
              <div key={index} className="mb-8 break-inside-avoid">
                <div className="bg-white rounded-lg border p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-4">{property.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{property.address}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Category</th>
                          <th className="text-left py-2">Amount</th>
                          <th className="text-left py-2">Complaint</th>
                        </tr>
                      </thead>
                      <tbody>
                        {property.expenses.map((expense, expenseIndex) => (
                          <tr key={expenseIndex} className="border-b">
                            <td className="py-2">{expense.category}</td>
                            <td className="py-2">{expense.amount}</td>
                            <td className="py-2">{expense.complaint}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Inspection Report Section */}
          <section className="mb-12 break-inside-avoid">
            <h2 className="text-2xl font-bold mb-6 pb-2 border-b">Inspection Report</h2>
            {reportData.properties.map((property, index) => (
              <div key={index} className="mb-8">
                <div className="bg-white rounded-lg border p-6 mb-6">
                  <h3 className="text-xl font-semibold mb-4">{property.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{property.address}</p>
                  {property.inspections.map((inspection, inspectionIndex) => (
                    <div key={inspectionIndex} className="mb-6 border-b pb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Inspection Details */}
                        <div>
                          <table className="w-full mb-4">
                            <tbody>
                              <tr>
                                <td className="py-2 font-semibold w-24">Unit:</td>
                                <td className="py-2">{inspection.unit}</td>
                              </tr>
                              <tr>
                                <td className="py-2 font-semibold">Item:</td>
                                <td className="py-2">{inspection.item}</td>
                              </tr>
                              <tr>
                                <td className="py-2 font-semibold">Condition:</td>
                                <td className="py-2">
                                  <span className={`px-2 py-1 rounded-full text-sm ${
                                    inspection.condition === 'Critical' 
                                      ? 'bg-red-100 text-red-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {inspection.condition}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 font-semibold">Remark:</td>
                                <td className="py-2">{inspection.remark}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Inspection Image */}
                        <div className="relative">
                          {inspection.images && renderInspectionImages(inspection.images)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
};

export default LandlordReport1;
