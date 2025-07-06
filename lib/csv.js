class CsvService {
    static generateCsvFromUsers(users, fixtureInfo = {}) {
        // Define CSV headers
        const headers = [
            'user_id',
            'subscription_id', 
            'channel_id',
            'sport_type',
            'subscribed_at',
            'is_active',
            'fixture_id',
            'fixture_type',
            'match_id',
            'fixture_data',
            'date_time_of_match',
            'created_at',
            'updated_at'
        ];

        // Convert users array to CSV rows
        const rows = users.map(user => [
            user.user_id,
            user.id,
            user.channel_id,
            user.sport_type,
            user.subscribed_at,
            user.is_active,
            fixtureInfo.fixture_id || '',
            fixtureInfo.fixture_type || '',
            fixtureInfo.match_id || '',
            fixtureInfo.fixture_data || '',
            fixtureInfo.date_time || '',
            user.created_at,
            user.updated_at
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(field => this.escapeCsvField(field)).join(','))
        ].join('\n');

        return csvContent;
    }

    static escapeCsvField(field) {
        if (field === null || field === undefined) {
            return '';
        }
        
        const stringField = String(field);
        
        // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        
        return stringField;
    }

    static generateFileName(fixtureType, timestamp = new Date()) {
        const date = timestamp.toISOString().split('T')[0];
        const time = timestamp.toISOString().replace(/[:.]/g, '-').split('T')[1].split('Z')[0];
        return `fixtures-daily-${fixtureType}-${date}-${time}.csv`;
    }
}

export default CsvService; 