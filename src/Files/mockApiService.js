// mockApiService.js
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApiService = {
    async fetchUnits() {
        await delay(1500); // Simulate network delay
        
        // Simulated API response
        return [
            {
                id: 1,
                name: '57 Jola Close',
                address: '294 Borno Way, Yaba, Lagos',
                date: '2024-12-08',
                totalProspects: 10,
                completedInspections: 0,
                isMoveIn: true,
                latitude: 1.234567,
                longitude: 103.123456,
            },
            {
                id: 2,
                name: '4 Morris Street',
                address: '04 Alagomeji, Yaba, Lagos',
                date: '2024-11-15',
                totalProspects: 8,
                completedInspections: 0,
                isMoveIn: false,
                latitude: 1.234567,
                longitude: 103.123456,
            },
            {
                id: 3,
                name: '12 Broad Street',
                address: '12 Broad Street, Lagos Island',
                date: '2024-12-10',
                totalProspects: 5,
                completedInspections: 0,
                isMoveIn: true,
                latitude: 1.234567,
                longitude: 103.123456,
            }
        ];
    },

    async fetchProspects(unitId) {
        await delay(1000); // Simulate network delay

        // Simulated API response
        const allProspects = [
            // Prospects for Unit 1 (57 Jola Close)
            {
                id: 1,
                unitId: 1,
                name: 'John Smith',
                phone: '+234 801 234 5678',
                time: '09:00 AM',
                status: 'scheduled',
                feedback: ''
            },
            {
                id: 2,
                unitId: 1,
                name: 'Sarah Johnson',
                phone: '+234 802 345 6789',
                time: '09:30 AM',
                status: 'scheduled',
                feedback: ''
            },
            {
                id: 3,
                unitId: 1,
                name: 'Michael Brown',
                phone: '+234 803 456 7890',
                time: '10:00 AM',
                status: 'scheduled',
                feedback: ''
            },
            {
                id: 4,
                unitId: 1,
                name: 'Emma Wilson',
                phone: '+234 804 567 8901',
                time: '10:30 AM',
                status: 'scheduled',
                feedback: ''
            },
            {
                id: 5,
                unitId: 1,
                name: 'James Taylor',
                phone: '+234 805 678 9012',
                time: '11:00 AM',
                status: 'scheduled',
                feedback: ''
            },
            // ... other prospects for unit 1
            
            // Prospects for Unit 2 (4 Morris Street)
            {
                id: 6,
                unitId: 2,
                name: 'Lisa Anderson',
                phone: '+234 806 789 0123',
                time: '09:00 AM',
                status: 'scheduled',
                feedback: ''
            },
            {
                id: 7,
                unitId: 2,
                name: 'Robert Martin',
                phone: '+234 807 890 1234',
                time: '09:30 AM',
                status: 'scheduled',
                feedback: ''
            },
            {
                id: 8,
                unitId: 2,
                name: 'Patricia Lee',
                phone: '+234 808 901 2345',
                time: '10:00 AM',
                status: 'scheduled',
                feedback: ''
            },
            {
                id: 9,
                unitId: 2,
                name: 'David Clark',
                phone: '+234 809 012 3456',
                time: '10:30 AM',
                status: 'scheduled',
                feedback: ''
            },
            {
                id: 10,
                unitId: 2,
                name: 'Maria Garcia',
                phone: '+234 810 123 4567',
                time: '11:00 AM',
                status: 'scheduled',
                feedback: ''
            }
            // ... other prospects for unit 2
        ];

        return allProspects.filter(prospect => prospect.unitId === unitId);
    },

    async updateProspectStatus(prospectId, status, feedback = '') {
        await delay(800); // Simulate network delay
        
        return {
            success: true,
            prospectId,
            status,
            feedback,
            timestamp: new Date().toISOString()
        };
    }
};