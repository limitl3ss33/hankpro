document.addEventListener('DOMContentLoaded', () => {
    const addPropertyBtn = document.getElementById('add-property-btn');
    const propertyCountDisplay = document.getElementById('property-count');
    const propertiesContainer = document.getElementById('properties-container');
    let propertyCount = 0;
    const maxProperties = 10;

    // Enable the Add Property button on page load
    addPropertyBtn.disabled = false;

    // Add event listener for adding a new property
    addPropertyBtn.addEventListener('click', () => {
        if (propertyCount < maxProperties) {
            addProperty();
        }
    });

    // Add a Reset All button
    const resetAllBtn = document.createElement('button');
    resetAllBtn.textContent = 'Reset All';
    resetAllBtn.classList.add('reset-btn');
    resetAllBtn.addEventListener('click', resetAll);
    document.querySelector('.property-controls').appendChild(resetAllBtn);

    // Load saved data from localStorage
    loadSavedData();

    function addProperty(data = {}) {
        propertyCount++;
        updatePropertyCount();

        // Create a new property section
        const propertyDiv = document.createElement('div');
        propertyDiv.classList.add('property-section');
        propertyDiv.setAttribute('data-property-id', propertyCount);

        // HTML for the property section with all fields
        propertyDiv.innerHTML = `
            <h3>Property ${propertyCount}</h3>
            <div class="input-panel">
                <div class="input-group">
                    <label for="property-name-${propertyCount}">Property Name <span class="required-asterisk">*</span></label>
                    <input type="text" id="property-name-${propertyCount}" placeholder="Property ${propertyCount}" value="${data.propertyName || ''}" required>
                </div>
                <div class="input-group">
                    <label for="gross-rents-${propertyCount}">Gross Rents (Line 3) ($) <span class="required-asterisk">*</span></label>
                    <input type="number" id="gross-rents-${propertyCount}" placeholder="0" value="${data.grossRents || ''}" required>
                </div>
                <div class="input-group">
                    <label for="expenses-${propertyCount}">Expenses (Line 20) ($) <span class="required-asterisk">*</span></label>
                    <input type="number" id="expenses-${propertyCount}" placeholder="0" value="${data.expenses || ''}" required>
                </div>
                <div class="input-group">
                    <label for="depreciation-${propertyCount}">Depreciation (Line 18) ($) <span class="required-asterisk">*</span></label>
                    <input type="number" id="depreciation-${propertyCount}" placeholder="0" value="${data.depreciation || ''}" required>
                </div>
                <div class="input-group">
                    <label for="amortization-${propertyCount}">Amortization/Casualty Loss/Nonrecurring Expenses (Line 19) ($) <span class="required-asterisk">*</span></label>
                    <input type="number" id="amortization-${propertyCount}" placeholder="0" value="${data.amortization || ''}" required>
                </div>
                <div class="input-group">
                    <label for="insurance-${propertyCount}">Insurance (Line 9) ($) <span class="required-asterisk">*</span></label>
                    <input type="number" id="insurance-${propertyCount}" placeholder="0" value="${data.insurance || ''}" required>
                </div>
                <div class="input-group">
                    <label for="mortgage-interest-${propertyCount}">Mortgage Interest (Line 12) ($) <span class="required-asterisk">*</span></label>
                    <input type="number" id="mortgage-interest-${propertyCount}" placeholder="0" value="${data.mortgageInterest || ''}" required>
                </div>
                <div class="input-group">
                    <label for="taxes-${propertyCount}">Taxes (Line 16) ($) <span class="required-asterisk">*</span></label>
                    <input type="number" id="taxes-${propertyCount}" placeholder="0" value="${data.taxes || ''}" required>
                </div>
                <div class="input-group">
                    <label for="hoa-${propertyCount}">Other/HOA (Line 16 if applicable) ($) <span class="required-asterisk">*</span></label>
                    <input type="number" id="hoa-${propertyCount}" placeholder="0" value="${data.hoa || ''}" required>
                </div>
                <div class="input-group">
                    <label for="months-${propertyCount}">Number of Months Considered (Line 2) <span class="required-asterisk">*</span></label>
                    <input type="number" id="months-${propertyCount}" placeholder="12" value="${data.months || ''}" required>
                </div>
                <div class="input-group">
                    <label for="mortgage-payment-${propertyCount}">Monthly Mortgage Payment (Verified) ($) <span class="required-asterisk">*</span></label>
                    <input type="number" id="mortgage-payment-${propertyCount}" placeholder="0" value="${data.mortgagePayment || ''}" required>
                </div>
            </div>
            <div class="button-group">
                <button class="compute-btn" data-property-id="${propertyCount}">Compute</button>
                <button class="print-btn hidden" data-property-id="${propertyCount}">Print</button>
                <button class="remove-btn" data-property-id="${propertyCount}">Remove</button>
            </div>
            <div class="result-panel hidden" id="result-${propertyCount}"></div>
        `;

        propertiesContainer.appendChild(propertyDiv);

        // Add event listeners for the buttons
        const computeBtn = propertyDiv.querySelector('.compute-btn');
        const printBtn = propertyDiv.querySelector('.print-btn');
        const removeBtn = propertyDiv.querySelector('.remove-btn');

        computeBtn.addEventListener('click', () => {
            const id = parseInt(computeBtn.getAttribute('data-property-id'));
            calculateRentalIncome(id, printBtn);
        });

        printBtn.addEventListener('click', () => {
            const id = parseInt(printBtn.getAttribute('data-property-id'));
            printProperty(id);
        });

        removeBtn.addEventListener('click', () => {
            const id = parseInt(removeBtn.getAttribute('data-property-id'));
            removeProperty(id);
        });

        // Add event listeners to inputs to save data on change
        const inputs = propertyDiv.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => savePropertyData(propertyCount));
        });

        // If there are saved results, display them
        if (data.results) {
            const resultPanel = propertyDiv.querySelector(`#result-${propertyCount}`);
            resultPanel.innerHTML = data.results;
            resultPanel.classList.remove('hidden');
            printBtn.classList.remove('hidden');
        }
    }

    function removeProperty(id) {
        const propertyDiv = document.querySelector(`.property-section[data-property-id="${id}"]`);
        if (propertyDiv) {
            propertyDiv.remove();
            propertyCount--;
            updatePropertyCount();
            // Remove the property data from localStorage
            let savedData = JSON.parse(localStorage.getItem('rentalIncomeData')) || {};
            delete savedData[id];
            localStorage.setItem('rentalIncomeData', JSON.stringify(savedData));
        }
    }

    function updatePropertyCount() {
        propertyCountDisplay.textContent = `Properties: ${propertyCount}/${maxProperties}`;
        addPropertyBtn.disabled = propertyCount >= maxProperties;
    }

    function savePropertyData(propertyId) {
        const propertyData = {
            propertyName: document.getElementById(`property-name-${propertyId}`).value,
            grossRents: document.getElementById(`gross-rents-${propertyId}`).value,
            expenses: document.getElementById(`expenses-${propertyId}`).value,
            depreciation: document.getElementById(`depreciation-${propertyId}`).value,
            amortization: document.getElementById(`amortization-${propertyId}`).value,
            insurance: document.getElementById(`insurance-${propertyId}`).value,
            mortgageInterest: document.getElementById(`mortgage-interest-${propertyId}`).value,
            taxes: document.getElementById(`taxes-${propertyId}`).value,
            hoa: document.getElementById(`hoa-${propertyId}`).value,
            months: document.getElementById(`months-${propertyId}`).value,
            mortgagePayment: document.getElementById(`mortgage-payment-${propertyId}`).value,
            results: document.getElementById(`result-${propertyId}`).innerHTML
        };

        // Load existing data from localStorage
        let savedData = JSON.parse(localStorage.getItem('rentalIncomeData')) || {};
        savedData[propertyId] = propertyData;
        localStorage.setItem('rentalIncomeData', JSON.stringify(savedData));
    }

    function loadSavedData() {
        const savedData = JSON.parse(localStorage.getItem('rentalIncomeData')) || {};
        const propertyIds = Object.keys(savedData).map(id => parseInt(id)).sort((a, b) => a - b);

        propertyIds.forEach(id => {
            addProperty(savedData[id]);
        });
    }

    function resetAll() {
        propertiesContainer.innerHTML = '';
        propertyCount = 0;
        updatePropertyCount();
        localStorage.removeItem('rentalIncomeData');
    }

    function calculateRentalIncome(propertyId, printBtn) {
        // Get input values
        const propertyName = document.getElementById(`property-name-${propertyId}`).value || `Property ${propertyId}`;
        const grossRents = parseFloat(document.getElementById(`gross-rents-${propertyId}`).value) || 0;
        const expenses = parseFloat(document.getElementById(`expenses-${propertyId}`).value) || 0;
        const depreciation = parseFloat(document.getElementById(`depreciation-${propertyId}`).value) || 0;
        const amortization = parseFloat(document.getElementById(`amortization-${propertyId}`).value) || 0;
        const insurance = parseFloat(document.getElementById(`insurance-${propertyId}`).value) || 0;
        const mortgageInterest = parseFloat(document.getElementById(`mortgage-interest-${propertyId}`).value) || 0;
        const taxes = parseFloat(document.getElementById(`taxes-${propertyId}`).value) || 0;
        const hoa = parseFloat(document.getElementById(`hoa-${propertyId}`).value) || 0;
        const months = parseFloat(document.getElementById(`months-${propertyId}`).value) || 12;
        const mortgagePayment = parseFloat(document.getElementById(`mortgage-payment-${propertyId}`).value) || 0;

        const resultPanel = document.getElementById(`result-${propertyId}`);

        // Validate inputs
        if (!propertyName || isNaN(grossRents) || isNaN(expenses) || isNaN(depreciation) || isNaN(amortization) ||
            isNaN(insurance) || isNaN(mortgageInterest) || isNaN(taxes) || isNaN(hoa) || isNaN(months) || isNaN(mortgagePayment)) {
            resultPanel.innerHTML = "<p style='color: red; background: #fee2e2; padding: 10px; border-radius: 5px; border: 1px solid red;'>Please enter valid values in all required fields.</p>";
            resultPanel.classList.remove("hidden");
            // Hide the print button if computation fails
            printBtn.classList.add('hidden');
            // Still save the inputs even if computation fails
            savePropertyData(propertyId);
            return;
        }

        // Step 1: Gross Rents
        let annualIncome = grossRents;

        // Step 2: Subtract Expenses
        annualIncome -= expenses;

        // Step 3: Add Depreciation
        annualIncome += depreciation;

        // Step 4: Add Amortization/Casualty Loss/Nonrecurring Expenses
        annualIncome += amortization;

        // Step 5: Add Insurance
        annualIncome += insurance;

        // Step 6: Add Mortgage Interest
        annualIncome += mortgageInterest;

        // Step 7: Add Taxes
        annualIncome += taxes;

        // Step 8: Add Other/HOA
        annualIncome += hoa;

        // Step 9: Annual Rental Income/Loss (already calculated as annualIncome)

        // Step 10: Divide by Number of Months Considered
        const monthlyIncome = annualIncome / months;

        // Step 11: Subtract Monthly Mortgage Payment (Verified)
        const monthlyNetIncome = monthlyIncome - mortgagePayment;

        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

        // Output results
        resultPanel.innerHTML = `
            <div class="result-card">
                <strong>Property Name</strong>
                <span>${propertyName}</span>
            </div>
            <div class="result-card">
                <strong>Annual Rental Income/Loss</strong>
                <span>${formatter.format(annualIncome)}</span>
            </div>
            <div class="result-card">
                <strong>Monthly Income/Loss</strong>
                <span>${formatter.format(monthlyIncome)}</span>
            </div>
            <div class="result-card">
                <strong>Monthly Mortgage Payment (Verified)</strong>
                <span>${formatter.format(mortgagePayment)}</span>
            </div>
            <div class="result-card">
                <strong>Monthly Net Rental Income/Loss</strong>
                <span>${formatter.format(monthlyNetIncome)}</span>
            </div>
        `;
        resultPanel.classList.remove("hidden");

        // Show the print button after successful computation
        printBtn.classList.remove('hidden');

        // Store the result data for printing
        resultPanel.dataset.inputs = JSON.stringify({
            propertyName,
            grossRents,
            expenses,
            depreciation,
            amortization,
            insurance,
            mortgageInterest,
            taxes,
            hoa,
            months,
            mortgagePayment,
            annualIncome,
            monthlyIncome,
            monthlyNetIncome
        });

        // Save the data after computation
        savePropertyData(propertyId);
    }

    function printProperty(propertyId) {
        // Collect all properties with computed results for printing
        const allProperties = [];
        for (let i = 1; i <= propertyCount; i++) {
            const propPanel = document.getElementById(`result-${i}`);
            if (propPanel && propPanel.dataset.inputs && !propPanel.classList.contains('hidden')) {
                const propData = JSON.parse(propPanel.dataset.inputs);
                // Only include properties with valid computed results
                if (propData.annualIncome !== undefined && propData.monthlyIncome !== undefined && propData.monthlyNetIncome !== undefined) {
                    allProperties.push(propData);
                }
            }
        }

        // Debug log to check collected properties
        console.log('Properties to print:', allProperties);

        // If no properties have computed results, show an alert and return
        if (allProperties.length === 0) {
            alert('No properties with computed results to print. Please compute results for at least one property.');
            return;
        }

        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

        // Open a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Print Rental Income Calculations</title>
                <style>
                    body {
                        font-family: 'Montserrat', sans-serif;
                        margin: 20px;
                        line-height: 1.6;
                    }
                    h2 {
                        font-size: 1.8em;
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .print-section {
                        border: 1px solid #ccc;
                        padding: 20px;
                        border-radius: 10px;
                        max-width: 600px;
                        margin: 0 auto;
                        page-break-after: always; /* Ensure each property is on a new page */
                    }
                    .print-section:last-child {
                        page-break-after: auto; /* No page break after the last property */
                    }
                    .print-section h3 {
                        font-size: 1.5em;
                        margin-bottom: 15px;
                    }
                    .print-section p {
                        font-size: 1em;
                        margin: 5px 0;
                    }
                    .print-section p strong {
                        display: inline-block;
                        width: 300px;
                    }
                    .print-footer {
                        text-align: center;
                        font-size: 0.9em;
                        color: #666;
                        margin-top: 20px;
                        position: relative;
                        bottom: 0;
                        width: 100%;
                    }
                    @media print {
                        .print-section {
                            page-break-after: always;
                        }
                        .print-section:last-child {
                            page-break-after: auto;
                        }
                    }
                </style>
            </head>
            <body>
                <h2>Rental Income Calculations</h2>
                ${allProperties.length > 0 ? allProperties.map((prop, index) => `
                    <div class="print-section">
                        <h3>Property: ${prop.propertyName}</h3>
                        <p><strong>Gross Rents (Line 3):</strong> ${formatter.format(prop.grossRents)}</p>
                        <p><strong>Expenses (Line 20):</strong> ${formatter.format(prop.expenses)}</p>
                        <p><strong>Depreciation (Line 18):</strong> ${formatter.format(prop.depreciation)}</p>
                        <p><strong>Amortization/Casualty Loss/Nonrecurring Expenses (Line 19):</strong> ${formatter.format(prop.amortization)}</p>
                        <p><strong>Insurance (Line 9):</strong> ${formatter.format(prop.insurance)}</p>
                        <p><strong>Mortgage Interest (Line 12):</strong> ${formatter.format(prop.mortgageInterest)}</p>
                        <p><strong>Taxes (Line 16):</strong> ${formatter.format(prop.taxes)}</p>
                        <p><strong>Other/HOA (Line 16 if applicable):</strong> ${formatter.format(prop.hoa)}</p>
                        <p><strong>Number of Months Considered (Line 2):</strong> ${prop.months}</p>
                        <p><strong>Monthly Mortgage Payment (Verified):</strong> ${formatter.format(prop.mortgagePayment)}</p>
                        <hr>
                        <p><strong>Annual Rental Income/Loss:</strong> ${formatter.format(prop.annualIncome)}</p>
                        <p><strong>Monthly Income/Loss:</strong> ${formatter.format(prop.monthlyIncome)}</p>
                        <p><strong>Monthly Net Rental Income/Loss:</strong> ${formatter.format(prop.monthlyNetIncome)}</p>
                        <div class="print-footer">Calculated by Hank's Tools</div>
                    </div>
                `).join('') : '<p style="text-align: center;">No computed properties to print.</p>'}
            </body>
            </html>
        `);

        // Close the document and wait for rendering before printing
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 500); // 500ms delay to ensure rendering
    }
});