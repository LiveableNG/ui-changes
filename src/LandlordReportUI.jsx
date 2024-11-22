import React, { useState } from 'react';

const PropertyReport = () => {
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  const handleJsonInput = (event) => {
    try {
      const data = JSON.parse(event.target.value);
      setReportData(data);
      setError(null);
    } catch (e) {
      setError("Invalid JSON format");
      setReportData(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {!reportData ? (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Property Management Report Generator</h1>
            <p className="text-gray-600 mb-4">Paste your property management JSON data below</p>
            
            <div className="space-y-4">
              <textarea 
                className="w-full h-96 p-4 border rounded-lg font-mono text-sm"
                placeholder="Paste JSON here..."
                onChange={handleJsonInput}
              />
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <div className="flex justify-end">
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  onClick={() => setReportData(null)}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <PropertyReportDisplay data={reportData} onReset={() => setReportData(null)} />
      )}
    </div>
  );
};

const PropertyReportDisplay = ({ data, onReset }) => {
  const [activeProperty, setActiveProperty] = useState(0);

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{data.reportInfo.company.name}</h1>
            <p className="text-lg text-gray-600 mt-2">Property Management Report</p>
            <p className="text-gray-600">Date: {new Date(data.reportInfo.date).toLocaleDateString()}</p>
            <p className="text-gray-600">Client: {data.reportInfo.client.name}</p>
          </div>
          <button 
            onClick={onReset}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
          >
            Load New Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600">Properties</p>
            <p className="text-2xl font-bold text-blue-900">{data.reportInfo.summary.totalProperties}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg">
            <p className="text-sm text-emerald-600">Occupancy Rate</p>
            <p className="text-2xl font-bold text-emerald-900">{data.reportInfo.summary.occupancyRate}%</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600">Maintenance Issues</p>
            <p className="text-2xl font-bold text-purple-900">{data.reportInfo.summary.maintenanceIssues.totalPending}</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg">
            <p className="text-sm text-amber-600">Critical Issues</p>
            <p className="text-2xl font-bold text-amber-900">{data.reportInfo.summary.maintenanceIssues.critical}</p>
          </div>
        </div>
      </div>

      {/* Property Selection and Details */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Property List */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-xl shadow-lg p-4 sticky top-8">
            <h2 className="text-lg font-semibold mb-4">Properties</h2>
            <div className="space-y-2">
              {data.properties.map((property, index) => (
                <button
                  key={property.id}
                  onClick={() => setActiveProperty(index)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    activeProperty === index 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <p className="font-medium">{property.name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {property.address.street}, {property.address.area}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="xl:col-span-9 space-y-8">
          {/* Active Property Header */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold">{data.properties[activeProperty].name}</h2>
            <p className="text-gray-600">
              {data.properties[activeProperty].address.street}, 
              {data.properties[activeProperty].address.area}, 
              {data.properties[activeProperty].address.city}
            </p>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Total Units</p>
                <p className="font-semibold">{data.properties[activeProperty].summary.totalUnits}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Occupied</p>
                <p className="font-semibold">{data.properties[activeProperty].summary.occupiedUnits}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Vacant</p>
                <p className="font-semibold">{data.properties[activeProperty].summary.vacantUnits}</p>
              </div>
            </div>
          </div>

          {/* Units and Tenants */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Units and Tenants</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Unit</th>
                    <th className="text-left p-3">Tenant</th>
                    <th className="text-left p-3">Rent</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Next Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.properties[activeProperty].units.map((unit) => (
                    <tr key={unit.id}>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{unit.name}</p>
                          <p className="text-sm text-gray-500">{unit.type}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p>{unit.tenant?.name || 'Vacant'}</p>
                          <p className="text-sm text-gray-500">{unit.tenant?.contact?.phone || ''}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        {unit.rent.amount.currency}{unit.rent.amount.value.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          unit.rent.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {unit.rent.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {unit.rent.nextPayment.dueDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Maintenance Issues */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Maintenance Issues</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.properties[activeProperty].maintenance.inspection.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex gap-4">
                    {item.images[0] && (
                      <img 
                        src={item.images[0].url} 
                        alt={item.item} 
                        className="w-32 h-24 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium">{item.unit} - {item.item}</p>
                      <p className={`text-sm ${
                        item.condition === 'Critical' 
                          ? 'text-red-600' 
                          : 'text-orange-600'
                      }`}>
                        {item.condition}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{item.remark}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Scheduled: {new Date(item.followUp.scheduledDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Expenses</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Category</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Description</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.properties[activeProperty].expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="p-3">{expense.category}</td>
                      <td className="p-3">
                        {expense.amount.currency}{expense.amount.value.toLocaleString()}
                      </td>
                      <td className="p-3">{expense.complaint}</td>
                      <td className="p-3">{new Date(expense.date).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          expense.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {expense.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyReport;