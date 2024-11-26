import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

const CreditChekReportViewerCopy = () => {
    const [jsonData, setJsonData] = useState(null);
    const [error, setError] = useState('');
    const [jsonText, setJsonText] = useState('');

    const hasMultiple = jsonData?.score?.score?.totalNoOfLoans?.length > 0;

    const creditData = Object.keys(jsonData?.scorePremium || {}).length > 0
        ? jsonData.scorePremium
        : hasMultiple ? jsonData.score.score : jsonData?.score || {};


    const tabs = hasMultiple ? creditData?.totalNoOfLoans?.map(item => item.source) : [];
    const [activeTab, setActiveTab] = useState(tabs[0] || 'CRC');

    const handleJsonInput = (text) => {
        setJsonText(text);
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
                const mainReport = parsed.find(report => report.scorePremium && Object.keys(report.scorePremium).length > 0) || parsed[0];
                setJsonData(mainReport);
            } else {
                setJsonData(parsed);
            }
            setError('');
        } catch (err) {
            setError('Invalid JSON format');
            setJsonData(null);
        }
    };

    const handleReset = () => {
        setJsonData(null);
        setJsonText('');
        setError('');
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₦0';
        const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
        return `₦${numAmount.toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    if (!jsonData) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h1 className="text-xl font-semibold text-gray-900 mb-4">Credit Report Generator</h1>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                                <AlertCircle className="h-4 w-4" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Paste Credit Report JSON
                            </label>
                            <textarea
                                value={jsonText}
                                onChange={(e) => handleJsonInput(e.target.value)}
                                placeholder="Paste your JSON data here..."
                                className="w-full h-96 p-4 font-mono text-sm border border-gray-200 rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const userInfo = {
        name: jsonData?.name || 'N/A',
        initials: jsonData?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'NA',
        dob: jsonData?.dateOfBirth || 'N/A',
        gender: jsonData?.gender || 'N/A',
        phone: jsonData?.phone || 'N/A',
        bvn: jsonData?.bvn || 'N/A',
        address: jsonData?.address || 'N/A'
    };

    const getValueForSource = (metric, source) => {
        return creditData[metric]?.find(item => item.source === source)?.value ?? 'N/A';
    };

    const renderStats = (source) => {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm text-gray-500 mb-1">Total Loans</h3>
                    <p className="text-2xl font-bold">{getValueForSource('totalNoOfLoans', source)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm text-gray-500 mb-1">Outstanding</h3>
                    <p className="text-2xl font-bold">{getValueForSource('totalOutstanding', source)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm text-gray-500 mb-1">Active Loans</h3>
                    <p className="text-2xl font-bold">{getValueForSource('totalNoOfActiveLoans', source)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm text-gray-500 mb-1">Closed Loans</h3>
                    <p className="text-2xl font-bold">{getValueForSource('totalNoOfClosedLoans', source)}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">{userInfo.initials}</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{userInfo.name}</h1>
                                <p className="text-gray-500">Credit Report Overview</p>
                            </div>
                        </div>
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                        >
                            Reset
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <p className="text-gray-600">Date of Birth: <span className="text-gray-900">{userInfo.dob}</span></p>
                            <p className="text-gray-600">Gender: <span className="text-gray-900">{userInfo.gender}</span></p>
                            <p className="text-gray-600">Phone Number: <span className="text-gray-900">{userInfo.phone}</span></p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-gray-600">BVN: <span className="text-gray-900">{userInfo.bvn}</span></p>
                            <p className="text-gray-600">Address: <span className="text-gray-900">{userInfo.address}</span></p>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                {
                    hasMultiple ?
                        <>
                            <div className="w-full">
                                <div className="border-b mb-4">
                                    <div className="flex space-x-2">
                                        {tabs.map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                                    ? 'border-blue-500 text-blue-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                {tab.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    {renderStats(activeTab)}
                                </div>
                            </div>

                            {/* Load History */}
                            {getValueForSource('loanHistory', activeTab) && (
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Loan History</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Provider</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Type</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {Array.isArray(getValueForSource('loanHistory', activeTab)) ?
                                                    getValueForSource('loanHistory', activeTab).map((loan, index) => (
                                                        <tr key={index}>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{loan.loanProvider}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{loan.type || '-'}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(loan.loanAmount)}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(loan.outstandingBalance)}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{loan.accountStatus || loan.performanceStatus}</td>
                                                        </tr>
                                                    )) : null
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Loan Performance */}
                            {getValueForSource('loanPerformance', activeTab) && (
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Loan Performance</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Provider</th>
                                                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Type</th> */}
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {Array.isArray(getValueForSource('loanPerformance', activeTab)) ?
                                                    getValueForSource('loanPerformance', activeTab).map((loan, index) => (
                                                        <tr key={index}>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{loan.loanProvider}</td>
                                                            {/* <td className="px-6 py-4 text-sm text-gray-900">{loan.type || '-'}</td> */}
                                                            <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(loan.loanAmount)}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(loan.outstandingBalance)}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{loan.status}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{loan.performanceStatus}</td>
                                                        </tr>
                                                    )) : null
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </> :
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <h3 className="text-sm font-medium text-gray-600 mb-2">Total Credit Facilities</h3>
                                    <p className="text-2xl font-bold text-gray-900">{creditData.totalNoOfLoans || 0}</p>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <h3 className="text-sm font-medium text-gray-600 mb-2">Total Borrowed</h3>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(creditData.totalBorrowed)}</p>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <h3 className="text-sm font-medium text-gray-600 mb-2">Total Outstanding</h3>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(creditData.totalOutstanding)}</p>
                                </div>
                            </div>


                            {/* Load History */}
                            {creditData.loanHistory && (
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Loan History</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Provider</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Type</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {Array.isArray(creditData.loanHistory) ?
                                                    creditData.loanHistory.map((loan, index) => (
                                                        <tr key={index}>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{loan.loanProvider}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{loan.type || '-'}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(loan.loanAmount)}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(loan.outstandingBalance)}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{loan.accountStatus || loan.performanceStatus}</td>
                                                        </tr>
                                                    )) : null
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Loan Performance */}
                            {creditData.loanPerformance && (
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Loan Performance</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Provider</th>
                                                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Type</th> */}
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {Array.isArray(creditData.loanPerformance) ?
                                                    creditData.loanPerformance.map((loan, index) => (
                                                        <tr key={index}>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{loan.loanProvider}</td>
                                                            {/* <td className="px-6 py-4 text-sm text-gray-900">{loan.type || '-'}</td> */}
                                                            <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(loan.loanAmount)}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(loan.outstandingBalance)}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{loan.status}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-900">{loan.performanceStatus}</td>
                                                        </tr>
                                                    )) : null
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                }

            </div>
        </div>
    );
};

export default CreditChekReportViewerCopy;