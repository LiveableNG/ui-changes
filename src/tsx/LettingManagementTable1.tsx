import React, { useEffect, useState } from 'react';
import { Search, MoreVertical, ChevronLeft, ChevronRight, Clock, Users, ClipboardCheck, CheckCircle, ClipboardList, FileCheck, ChevronDown, Mail, Phone, Calendar, FileText, UserCheck, MessagesSquare } from 'lucide-react';

const LettingManagementTable = () => {
  const [expandedView, setExpandedView] = useState({
    type: null,
    index: null
  });
  const [openActionMenu, setOpenActionMenu] = useState(null);

  // Mock API data and functions
  const mockApi = {
    prospects: {
      1: [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+234 123 456 7890',
          currentStage: 'Inspection Scheduled',
          status: {
            inspection: 'inspection-scheduled',
            kyc: null,
            verification: null,
            documentation: null
          }
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+234 123 456 7891',
          currentStage: 'KYC Form Submitted',
          status: {
            inspection: 'inspection-completed',
            kyc: 'kyc-form-submitted',
            verification: null,
            documentation: null
          }
        },
        {
          id: 3,
          name: 'Mike Johnson',
          email: 'mike@example.com',
          phone: '+234 123 456 7892',
          currentStage: 'Verification In Progress',
          status: {
            inspection: 'inspection-completed',
            kyc: 'kyc-form-submitted',
            verification: 'verification-ongoing',
            documentation: null
          }
        },
        {
          id: 4,
          name: 'Sarah Williams',
          email: 'sarah@example.com',
          phone: '+234 123 456 7893',
          currentStage: 'Documentation Pending',
          status: {
            inspection: 'inspection-completed',
            kyc: 'kyc-form-submitted',
            verification: 'verification-completed',
            documentation: 'document-pending'
          }
        },
        {
          id: 5,
          name: 'David Brown',
          email: 'david@example.com',
          phone: '+234 123 456 7894',
          currentStage: 'Inspection No Show',
          status: {
            inspection: 'inspection-no-show',
            kyc: null,
            verification: null,
            documentation: null
          }
        }
      ]
    },
    async getProspects(propertyId) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return this.prospects[propertyId] || [];
    }
  };

  const properties = [
    {
      id: 1,
      unit: {
        name: '57 Jola Close',
        address: '294 Borno Way, Yaba, Lagos',
        type: '3 Bedroom Apartment',
        price: '₦1,500,000/year'
      },
      lastUpdated: '2024-12-08',
      summary: {
        total: 5,
        inspection: {
          completed: 3,
          total: 5,
          breakdown: {
            'inspection-scheduled': 1,
            'inspection-ongoing': 0,
            'inspection-completed': 3,
            'inspection-cancelled': 0,
            'inspection-no-show': 1,
            'inspection-rescheduled': 0
          }
        },
        kyc: {
          completed: 3,
          total: 5,
          breakdown: {
            'kyc-form-sent': 2,
            'kyc-form-submitted': 3
          }
        },
        verification: {
          completed: 1,
          total: 3,
          breakdown: {
            'verification-ongoing': 1,
            'verification-completed': 1
          }
        },
        documentation: {
          completed: 0,
          total: 1,
          breakdown: {
            'document-pending': 1,
            'document-rejected': 0,
            'document-cancelled': 0
          }
        }
      }
    },
    {
      id: 2,
      unit: {
        name: '12B Admiralty Way',
        address: 'Lekki Phase 1, Lagos',
        type: '4 Bedroom Penthouse',
        price: '₦4,000,000/year'
      },
      lastUpdated: '2024-12-09',
      summary: {
        total: 3,
        inspection: {
          completed: 2,
          total: 3,
          breakdown: {
            'inspection-scheduled': 1,
            'inspection-ongoing': 0,
            'inspection-completed': 2,
            'inspection-cancelled': 0,
            'inspection-no-show': 0,
            'inspection-rescheduled': 0
          }
        },
        kyc: {
          completed: 2,
          total: 2,
          breakdown: {
            'kyc-form-sent': 0,
            'kyc-form-submitted': 2
          }
        },
        verification: {
          completed: 1,
          total: 2,
          breakdown: {
            'verification-ongoing': 1,
            'verification-completed': 1
          }
        },
        documentation: {
          completed: 1,
          total: 1,
          breakdown: {
            'document-pending': 0,
            'document-rejected': 0,
            'document-cancelled': 0
          }
        }
      }
    },
    {
      id: 3,
      unit: {
        name: '5 Palm Avenue',
        address: 'Magodo GRA Phase 2, Lagos',
        type: '5 Bedroom Detached House',
        price: '₦5,500,000/year'
      },
      lastUpdated: '2024-12-07',
      summary: {
        total: 4,
        inspection: {
          completed: 3,
          total: 4,
          breakdown: {
            'inspection-scheduled': 1,
            'inspection-ongoing': 0,
            'inspection-completed': 3,
            'inspection-cancelled': 0,
            'inspection-no-show': 0,
            'inspection-rescheduled': 0
          }
        },
        kyc: {
          completed: 3,
          total: 3,
          breakdown: {
            'kyc-form-sent': 0,
            'kyc-form-submitted': 3
          }
        },
        verification: {
          completed: 2,
          total: 3,
          breakdown: {
            'verification-ongoing': 1,
            'verification-completed': 2
          }
        },
        documentation: {
          completed: 1,
          total: 2,
          breakdown: {
            'document-pending': 1,
            'document-rejected': 0,
            'document-cancelled': 0
          }
        }
      }
    }
  ];

  // Add loading state
  const [loading, setLoading] = useState(false);
  const [propertyProspects, setPropertyProspects] = useState({});

  // Function to fetch prospects
  const fetchProspects = async (propertyId) => {
    setLoading(true);
    try {
      const prospects = await mockApi.getProspects(propertyId);
      setPropertyProspects(prev => ({
        ...prev,
        [propertyId]: prospects
      }));
    } catch (error) {
      console.error('Error fetching prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle dropdown toggle
  const toggleActionMenu = (prospectId) => {
    setOpenActionMenu(openActionMenu === prospectId ? null : prospectId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-menu')) {
        setOpenActionMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Update your prospects view with this new version
  const renderProspects = (property, index) => {
    if (expandedView.type !== 'prospects' || expandedView.index !== index) return null;

    return (
      <tr>
        <td colSpan="3" className="px-6 py-4 bg-gray-50">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Prospects Details ({property.summary.total} total)</h4>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50">
                  Filter
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border divide-y">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading prospects...</div>
              ) : (
                propertyProspects[property.id]?.map((prospect) => (
                  <div key={prospect.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                    {/* Left section - Basic Info */}
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {prospect.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{prospect.name}</div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {prospect.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {prospect.phone}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle section - Status Indicators */}
                    <div className="flex items-center gap-6">
                      {['inspection', 'kyc', 'verification', 'documentation'].map(stage => (
                        <div key={stage} className="flex items-center gap-1.5">
                          <div className={`h-1.5 w-1.5 rounded-full ${prospect.status[stage]
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                            }`} />
                          <span className="text-xs text-gray-500 capitalize">{stage}</span>
                        </div>
                      ))}
                    </div>

                    {/* Right section - Actions */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                        {prospect.currentStage}
                      </span>
                      <div className="flex items-center relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActionMenu(prospect.id);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </button>

                        {/* Action Dropdown - Updated positioning and z-index */}
                        {openActionMenu === prospect.id && (
                          <div className="fixed transform -translate-x-48 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50 action-menu">
                            <button className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              Schedule Inspection
                            </button>
                            <button className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50">
                              <FileText className="h-4 w-4 text-gray-500" />
                              Send KYC Form
                            </button>
                            <button className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50">
                              <UserCheck className="h-4 w-4 text-gray-500" />
                              Start Verification
                            </button>
                            <button className="w-full px-4 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-50">
                              <MessagesSquare className="h-4 w-4 text-gray-500" />
                              Send Message
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  const toggleProspects = (index) => {
    setExpandedView(prev => {
      if (prev.type === 'prospects' && prev.index === index) {
        return { type: null, index: null };
      } else {
        // Fetch prospects when expanding
        fetchProspects(properties[index].id);
        return { type: 'prospects', index: index };
      }
    });
  };


  const toggleStatus = (index) => {
    setExpandedView(prev => {
      if (prev.type === 'status' && prev.index === index) {
        return { type: null, index: null };
      } else {
        return { type: 'status', index: index };
      }
    });
  };

  const statusLabels = {
    'inspection-scheduled': 'Scheduled',
    'inspection-ongoing': 'Ongoing',
    'inspection-completed': 'Completed',
    'inspection-cancelled': 'Cancelled',
    'inspection-no-show': 'No Show',
    'inspection-rescheduled': 'Rescheduled',
    'kyc-form-sent': 'Form Sent',
    'kyc-form-submitted': 'Form Submitted',
    'verification-ongoing': 'Ongoing',
    'verification-completed': 'Completed',
    'document-pending': 'Pending',
    'document-rejected': 'Rejected',
    'document-cancelled': 'Cancelled'
  };

  const renderStatusBreakdown = (breakdown) => {
    return (
      <div className="ml-8 mt-2 space-y-1">
        {Object.entries(breakdown).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{statusLabels[status]}</span>
            <span className="text-gray-500">{count}</span>
          </div>
        ))}
      </div>
    );
  };

  const StatusGroup = ({ icon: Icon, bgColor, iconColor, title, completed, total, onClick, isExpanded }) => (
    <div
      className="flex items-center gap-2 cursor-pointer"
      onClick={onClick}
    >
      <div className={`p-2 ${bgColor} rounded-full`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div>
        <div className="text-sm font-medium flex items-center gap-1">
          {title}
          {/* <ChevronDown
            className={`h-4 w-4 transition-transform ${isExpanded ? 'transform rotate-180' : ''
              }`}
          /> */}
        </div>
        <div className="text-xs text-gray-500">
          {completed} of {total} complete
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-white">
      {/* Header and search remain the same */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Letting Management</h1>
      </div>

      <div className="mb-6 flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search properties"
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">UNIT INFORMATION</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">INSPECTION SUMMARY</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">LAST UPDATED</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {properties.map((property, index) => (
              <React.Fragment key={index}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">{property.unit.name}</div>
                      <div className="text-sm text-gray-500">{property.unit.address}</div>
                      <div className="text-sm text-gray-500">{property.unit.type} • {property.unit.price}</div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-3">
                      
                      {/* Total Prospects with separate toggle */}
                      {/* <div
                        className="flex items-center gap-2 border-b pb-2 cursor-pointer"
                        onClick={() => toggleProspects(index)}
                      >
                        <div className="p-2 bg-gray-50 rounded-full">
                          <Users className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium flex items-center gap-1">
                            Total Prospects
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${expandedView.type === 'prospects' && expandedView.index === index
                                ? 'transform rotate-180'
                                : ''
                                }`}
                            />
                          </div>
                          <div className="text-xs text-gray-500">{property.summary.total} applicants</div>
                        </div>
                      </div> */}

                      {/* Status Groups with separate toggle */}
                      <div className="flex items-center gap-6">
                        <StatusGroup
                          icon={Users}
                          bgColor="bg-blue-50"
                          iconColor="text-gray-600"
                          title="Total Prospects"
                          completed={property.summary.total}
                          total={property.summary.inspection.total}
                          onClick={() => toggleProspects(index)}
                          isExpanded={expandedView.type === 'status' && expandedView.index === index}
                        />
                        <StatusGroup
                          icon={ClipboardList}
                          bgColor="bg-blue-50"
                          iconColor="text-blue-600"
                          title="Inspection"
                          completed={property.summary.inspection.completed}
                          total={property.summary.inspection.total}
                          onClick={() => toggleProspects(index)}
                          isExpanded={expandedView.type === 'status' && expandedView.index === index}
                        />

                        <StatusGroup
                          icon={ClipboardCheck}
                          bgColor="bg-green-50"
                          iconColor="text-green-600"
                          title="KYC"
                          completed={property.summary.kyc.completed}
                          total={property.summary.kyc.total}
                          onClick={() => toggleProspects(index)}
                          isExpanded={expandedView.type === 'status' && expandedView.index === index}
                        />

                        <StatusGroup
                          icon={CheckCircle}
                          bgColor="bg-purple-50"
                          iconColor="text-purple-600"
                          title="Verification"
                          completed={property.summary.verification.completed}
                          total={property.summary.verification.total}
                          onClick={() => toggleProspects(index)}
                          isExpanded={expandedView.type === 'status' && expandedView.index === index}
                        />

                        <StatusGroup
                          icon={FileCheck}
                          bgColor="bg-indigo-50"
                          iconColor="text-indigo-600"
                          title="Documentation"
                          completed={property.summary.documentation.completed}
                          total={property.summary.documentation.total}
                          onClick={() => toggleProspects(index)}
                          isExpanded={expandedView.type === 'status' && expandedView.index === index}
                        />
                      </div>

                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(property.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </td>
                </tr>

                {/* Prospects Expanded View */}
                {renderProspects(property, index)}

                {/* Status Expanded View */}
                {expandedView.type === 'status' && expandedView.index === index && (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 bg-gray-50">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Inspection Status</h4>
                          {renderStatusBreakdown(property.summary.inspection.breakdown)}
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">KYC Status</h4>
                          {renderStatusBreakdown(property.summary.kyc.breakdown)}
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Verification Status</h4>
                          {renderStatusBreakdown(property.summary.verification.breakdown)}
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Documentation Status</h4>
                          {renderStatusBreakdown(property.summary.documentation.breakdown)}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LettingManagementTable;