// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
const singleForm = document.getElementById('singleForm');
const resultCard = document.getElementById('resultCard');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorToast = document.getElementById('errorToast');
const successToast = document.getElementById('successToast');
const csvFile = document.getElementById('csvFile');

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Show/Hide Loading Spinner
function showSpinner() {
    loadingSpinner.classList.remove('hidden');
}

function hideSpinner() {
    loadingSpinner.classList.add('hidden');
}

// Show Toast Notification
function showToast(message, type = 'success') {
    const toast = type === 'success' ? successToast : errorToast;
    toast.textContent = message;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

// Format number to 2 decimal places
function formatNumber(num) {
    return Math.round(num * 100) / 100;
}

// Display Prediction Result
function displayResult(data) {
    const headerClass = data.sustainable ? 'sustainable' : 'unsustainable';
    const headerText = data.sustainable ? '✅ SUSTAINABLE CITY' : '❌ NOT SUSTAINABLE';
    const badge = data.sustainable ? 'sustainable' : 'unsustainable';

    document.getElementById('resultHeader').innerHTML = `
        <div class="${headerClass}">${headerText}</div>
        <p style="font-size: 0.8em; margin-top: 10px; color: #666;">${data.city}, ${data.country}</p>
    `;

    document.getElementById('resultDetails').innerHTML = `
        <div class="detail-item">
            <div class="detail-label">Sustainability Score</div>
            <div class="detail-value">${formatNumber(data.sustainability_score)}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Confidence Level</div>
            <div class="detail-value">${formatNumber(data.confidence * 100)}%</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Urban Population</div>
            <div class="detail-value">${formatNumber(data.details.urban_population)}M</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Population Growth</div>
            <div class="detail-value">${formatNumber(data.details.population_growth)}%</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Green Space</div>
            <div class="detail-value">${formatNumber(data.details.green_space)}%</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Air Quality (PM2.5)</div>
            <div class="detail-value">${formatNumber(data.details.air_quality)}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">CO2 Emissions</div>
            <div class="detail-value">${formatNumber(data.details.co2_emissions)}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Clean Water</div>
            <div class="detail-value">${formatNumber(data.details.clean_water)}%</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Waste Recycling</div>
            <div class="detail-value">${formatNumber(data.details.waste_recycling)}%</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Public Transport</div>
            <div class="detail-value">${formatNumber(data.details.public_transport)}%</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">Energy Consumption</div>
            <div class="detail-value">${formatNumber(data.details.energy_consumption)}</div>
        </div>
    `;

    resultCard.classList.remove('hidden');
}

// Single Prediction Form Submission
singleForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        city_name: document.getElementById('cityName').value,
        country: document.getElementById('country').value,
        urban_population: document.getElementById('urbanPopulation').value,
        population_growth: document.getElementById('populationGrowth').value,
        green_space: document.getElementById('greenSpace').value,
        air_quality: document.getElementById('airQuality').value,
        co2_emissions: document.getElementById('co2Emissions').value,
        clean_water: document.getElementById('cleanWater').value,
        waste_recycling: document.getElementById('wasteRecycling').value,
        public_transport: document.getElementById('publicTransport').value,
        energy_consumption: document.getElementById('energyConsumption').value
    };

    showSpinner();

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Prediction failed');
        }

        const data = await response.json();
        displayResult(data);
        showToast('Prediction completed successfully!', 'success');
    } catch (error) {
        console.error('Error:', error);
        showToast(`Error: ${error.message}`, 'error');
        resultCard.classList.add('hidden');
    } finally {
        hideSpinner();
    }
});

// Process Batch CSV File
function processBatchFile() {
    const file = csvFile.files[0];

    if (!file) {
        showToast('Please select a CSV file', 'error');
        return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const csv = e.target.result;
            const records = parseCSV(csv);

            if (records.length === 0) {
                showToast('CSV file is empty', 'error');
                return;
            }

            // Validate that records have required fields
            const requiredFields = [
                'city_name', 'country', 'urban_population', 'population_growth',
                'green_space', 'air_quality', 'co2_emissions', 'clean_water',
                'waste_recycling', 'public_transport', 'energy_consumption'
            ];

            const firstRecord = records[0];
            const missingFields = requiredFields.filter(field => !(field in firstRecord));
            
            if (missingFields.length > 0) {
                showToast(`Missing fields in CSV: ${missingFields.join(', ')}`, 'error');
                console.log('Available fields:', Object.keys(firstRecord));
                return;
            }

            showSpinner();

            const response = await fetch(`${API_BASE_URL}/batch-predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ records })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Batch prediction failed');
            }

            const data = await response.json();
            displayBatchResults(data.results);
            showToast(`Processed ${records.length} records successfully!`, 'success');
        } catch (error) {
            console.error('Error:', error);
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            hideSpinner();
        }
    };

    reader.readAsText(file);
}

// Parse CSV string to objects
function parseCSV(csvString) {
    const lines = csvString.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));

    const records = [];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue; // Skip empty lines
        
        const values = lines[i].split(',').map(v => v.trim());
        const record = {};

        headers.forEach((header, index) => {
            record[header] = values[index];
        });

        records.push(record);
    }

    return records;
}

// Display Batch Results
function displayBatchResults(results) {
    let tableHTML = '<table><tr><th>City</th><th>Country</th><th>Sustainability</th><th>Score</th><th>Confidence</th></tr>';

    results.forEach(result => {
        if (result.error) {
            tableHTML += `<tr><td colspan="5" style="color: red;">Error: ${result.error}</td></tr>`;
        } else {
            const badgeClass = result.sustainable ? 'sustainable' : 'unsustainable';
            const badgeText = result.sustainable ? 'Sustainable' : 'Unsustainable';

            tableHTML += `
                <tr>
                    <td>${result.city}</td>
                    <td>${result.country}</td>
                    <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                    <td>${formatNumber(result.sustainability_score)}</td>
                    <td>${formatNumber(result.confidence * 100)}%</td>
                </tr>
            `;
        }
    });

    tableHTML += '</table>';
    document.getElementById('resultsTable').innerHTML = tableHTML;
    document.getElementById('batchResults').classList.remove('hidden');

    // Store results for download
    window.batchResultsData = results;
}

// Download Sample CSV Template
function downloadSampleCSV() {
    const csv = [
        ['city_name', 'country', 'urban_population', 'population_growth', 'green_space', 'air_quality', 'co2_emissions', 'clean_water', 'waste_recycling', 'public_transport', 'energy_consumption'],
        ['New York', 'USA', '10.5', '1.2', '25', '32.5', '8.2', '95', '35', '45', '1650'],
        ['London', 'UK', '8.9', '0.8', '30', '28', '7.5', '98', '40', '55', '1400'],
        ['Tokyo', 'Japan', '13.7', '0.5', '28', '25', '6.8', '96', '48', '60', '1200'],
        ['Mumbai', 'India', '12.4', '2.1', '15', '85', '2.5', '75', '25', '71', '1352']
    ];

    const csvContent = csv.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_predictions.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    showToast('Sample CSV downloaded! Fill it with your data.', 'success');
}

// Download Results as CSV
function downloadResults() {
    if (!window.batchResultsData) {
        showToast('No results to download', 'error');
        return;
    }

    const csv = [
        ['City', 'Country', 'Sustainable', 'Sustainability Score', 'Confidence']
    ];

    window.batchResultsData.forEach(result => {
        csv.push([
            result.city,
            result.country,
            result.sustainable ? 'Yes' : 'No',
            result.sustainability_score,
            `${formatNumber(result.confidence * 100)}%`
        ]);
    });

    const csvContent = csv.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sustainability_predictions.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    showToast('Results downloaded successfully!', 'success');
}

// Check API Health on page load
window.addEventListener('load', async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            console.log('✅ API is healthy');
        } else {
            console.warn('⚠️ API health check failed');
        }
    } catch (error) {
        console.warn('⚠️ Cannot connect to API. Make sure the backend is running on http://localhost:5000');
    }
});
