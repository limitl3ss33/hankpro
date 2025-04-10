document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const yearOptionSelect = document.getElementById('year-option');
    const filed2024Group = document.getElementById('filed-2024-group');
    const filed2024Select = document.getElementById('filed-2024');
    const proceedBtn = document.getElementById('proceed-btn');
    const yearSelection = document.getElementById('year-selection');
    const incomeControls = document.getElementById('income-controls');
    const addIncomeBtn = document.getElementById('add-income-btn');
    const incomeCountDisplay = document.getElementById('income-count');
    const incomeContainer = document.getElementById('income-container');
    const resultsContainer = document.getElementById('results-container');
    let incomeCount = 0;
    const maxIncomes = 10;
    let years = [];

    // Handle year option selection
    yearOptionSelect.addEventListener('change', () => {
        if (yearOptionSelect.value) {
            filed2024Group.classList.remove('hidden');
            filed2024Select.value = ''; // Reset the filed 2024 selection
            proceedBtn.disabled = true;
        } else {
            filed2024Group.classList.add('hidden');
            proceedBtn.disabled = true;
        }
    });

    // Handle filed 2024 selection
    filed2024Select.addEventListener('change', () => {
        if (filed2024Select.value) {
            proceedBtn.disabled = false;
        } else {
            proceedBtn.disabled = true;
        }
    });

    // Handle proceed button click
    proceedBtn.addEventListener('click', () => {
        const yearOption = yearOptionSelect.value;
        const filed2024 = filed2024Select.value === 'yes';

        if (yearOption === '1') {
            years = filed2024 ? ['2024'] : ['2023'];
        } else if (yearOption === '2') {
            years = filed2024 ? ['2024', '2023'] : ['2023', '2022'];
        }

        // Hide year selection and show income calculator
        yearSelection.classList.add('hidden');
        incomeControls.classList.remove('hidden');
        incomeContainer.classList.remove('hidden');
        addIncomeBtn.disabled = false;

        // Load saved data for the selected years
        loadSavedData();
    });

    // Add event listener for adding a new income source
    addIncomeBtn.addEventListener('click', () => {
        if (incomeCount < maxIncomes) {
            addIncome();
        }
    });

    // Add a Reset All button
    const resetAllBtn = document.createElement('button');
    resetAllBtn.textContent = 'Reset All';
    resetAllBtn.classList.add('reset-btn');
    resetAllBtn.addEventListener('click', resetAll);
    document.querySelector('.income-controls').appendChild(resetAllBtn);
    function addIncome(data = {}) {
        incomeCount++;
        updateIncomeCount();
    
        // Create a new income section
        const incomeDiv = document.createElement('div');
        incomeDiv.classList.add('income-section');
        incomeDiv.setAttribute('data-income-id', incomeCount);
    
        // HTML for the income section with collapse/expand feature using arrows
        let html = `
            <h3>
                Income Source ${incomeCount}
                <button class="collapse-btn" data-income-id="${incomeCount}" aria-expanded="true" title="Collapse">
                    <span class="collapse-icon">▼</span>
                </button>
            </h3>
            <div class="income-content" id="income-content-${incomeCount}">
                <div class="input-panel">
                    <div class="input-group">
                        <label for="income-type-${incomeCount}">Income Type <span class="required-asterisk">*</span></label>
                        <select id="income-type-${incomeCount}" required>
                            <option value="irs-form-1040" ${data.incomeType === 'irs-form-1040' ? 'selected' : ''}>IRS Form 1040</option>
                            <option value="irs-form-1065" ${data.incomeType === 'irs-form-1065' ? 'selected' : ''}>IRS Form 1065</option>
                            <option value="irs-form-1120s" ${data.incomeType === 'irs-form-1120s' ? 'selected' : ''}>IRS Form 1120S</option>
                            <option value="irs-form-1120" ${data.incomeType === 'irs-form-1120' ? 'selected' : ''}>IRS Form 1120</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label for="income-description-${incomeCount}">Description <span class="required-asterisk">*</span></label>
                        <input type="text" id="income-description-${incomeCount}" placeholder="e.g., Partnership Name" value="${data.description || ''}" required>
                    </div>
                    <div id="dynamic-fields-${incomeCount}"></div>
                </div>
                <div class="button-group">
                    <button class="compute-btn" data-income-id="${incomeCount}">Compute</button>
                    <button class="print-btn hidden" data-income-id="${incomeCount}">Print</button>
                    <button class="remove-btn" data-income-id="${incomeCount}">Remove</button>
                </div>
                <div class="result-panel hidden" id="result-${incomeCount}">${data.results || ''}</div>
            </div>
        `;
    
        incomeDiv.innerHTML = html;
        incomeContainer.appendChild(incomeDiv);
    
        // Add event listeners for the buttons
        const computeBtn = incomeDiv.querySelector('.compute-btn');
        const printBtn = incomeDiv.querySelector('.print-btn');
        const removeBtn = incomeDiv.querySelector('.remove-btn');
        const collapseBtn = incomeDiv.querySelector(`.collapse-btn[data-income-id="${incomeCount}"]`);
        const incomeTypeSelect = incomeDiv.querySelector(`#income-type-${incomeCount}`);
    
        // Function to render dynamic fields based on income type
        function renderDynamicFields() {
            console.log(`Rendering fields for Income Source ${incomeCount}, Type: ${incomeTypeSelect.value}`);
            const incomeType = incomeTypeSelect.value;
            const dynamicFieldsContainer = incomeDiv.querySelector(`#dynamic-fields-${incomeCount}`);
            if (!dynamicFieldsContainer) {
                console.error(`Dynamic fields container not found for Income Source ${incomeCount}`);
                return;
            }
            let fieldsHtml = '';
    
            if (incomeType === 'irs-form-1040') {
                years.forEach(year => {
                    fieldsHtml += `
                        <h4>${year} Income Details</h4>
                        <div class="input-group">
                            <label for="w2-${year}-${incomeCount}">W-2 Wages/Salary ($)</label>
                            <input type="number" id="w2-${year}-${incomeCount}" placeholder="0" value="${data[`w2-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-b-interest-${year}-${incomeCount}">Schedule B: Interest Income (Line 1) ($)</label>
                            <input type="number" id="schedule-b-interest-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-b-interest-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-b-dividends-${year}-${incomeCount}">Schedule B: Dividends (Line 5) ($)</label>
                            <input type="number" id="schedule-b-dividends-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-b-dividends-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-c-net-profit-${year}-${incomeCount}">Schedule C: Net Profit or Loss (Line 31) ($)</label>
                            <input type="number" id="schedule-c-net-profit-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-c-net-profit-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-c-nonrecurring-${year}-${incomeCount}">Schedule C: Nonrecurring Other (Income)/Loss/Expenses (Line 6) ($)</label>
                            <input type="number" id="schedule-c-nonrecurring-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-c-nonrecurring-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-c-depletion-${year}-${incomeCount}">Schedule C: Depletion (Line 12) ($)</label>
                            <input type="number" id="schedule-c-depletion-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-c-depletion-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-c-depreciation-${year}-${incomeCount}">Schedule C: Depreciation (Line 13) ($)</label>
                            <input type="number" id="schedule-c-depreciation-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-c-depreciation-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-c-meals-${year}-${incomeCount}">Schedule C: Non-deductible Meals and Entertainment Expenses (Line 24b) ($)</label>
                            <input type="number" id="schedule-c-meals-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-c-meals-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-c-business-use-${year}-${incomeCount}">Schedule C: Business Use of Home (Line 30) ($)</label>
                            <input type="number" id="schedule-c-business-use-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-c-business-use-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-c-amortization-${year}-${incomeCount}">Schedule C: Amortization/Casualty Loss (Only add back Amort/CL - Review Schedule C Page 2, Part V) ($)</label>
                            <input type="number" id="schedule-c-amortization-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-c-amortization-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-c-miles-${year}-${incomeCount}">Schedule C: Business Miles (Page 2, Part IV, Line 44a OR Related 4562, Line 30) (Miles)</label>
                            <input type="number" id="schedule-c-miles-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-c-miles-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-d-gains-${year}-${incomeCount}">Schedule D: Recurring Capital Gains (from Self-Employment) ($)</label>
                            <input type="number" id="schedule-d-gains-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-d-gains-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-e-royalties-${year}-${incomeCount}">Schedule E: Royalties Received (Line 4) ($)</label>
                            <input type="number" id="schedule-e-royalties-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-e-royalties-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-e-expenses-${year}-${incomeCount}">Schedule E: Total Expenses (Line 20) ($)</label>
                            <input type="number" id="schedule-e-expenses-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-e-expenses-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-e-depreciation-${year}-${incomeCount}">Schedule E: Depreciation (Line 18) ($)</label>
                            <input type="number" id="schedule-e-depreciation-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-e-depreciation-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-f-net-profit-${year}-${incomeCount}">Schedule F: Net Farm Profit or Loss (Line 34) ($)</label>
                            <input type="number" id="schedule-f-net-profit-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-f-net-profit-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-f-non-tax-${year}-${incomeCount}">Schedule F: Non-Tax Portion Ongoing Coop and CCC Payments (Line 3, 4, 6a-b) ($)</label>
                            <input type="number" id="schedule-f-non-tax-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-f-non-tax-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-f-nonrecurring-${year}-${incomeCount}">Schedule F: Nonrecurring Other (Income) or Loss (Lines 5c & 8) ($)</label>
                            <input type="number" id="schedule-f-nonrecurring-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-f-nonrecurring-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-f-depreciation-${year}-${incomeCount}">Schedule F: Depreciation (Line 14) ($)</label>
                            <input type="number" id="schedule-f-depreciation-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-f-depreciation-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-f-amortization-${year}-${incomeCount}">Schedule F: Amortization/Casualty Loss/Depletion (Line 32) ($)</label>
                            <input type="number" id="schedule-f-amortization-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-f-amortization-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-f-business-use-${year}-${incomeCount}">Schedule F: Business Use of Home (Line 32) ($)</label>
                            <input type="number" id="schedule-f-business-use-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-f-business-use-${year}`] || ''}">
                        </div>
                    `;
                });
            } else if (incomeType === 'irs-form-1065') {
                years.forEach(year => {
                    fieldsHtml += `
                        <h4>${year} Income Details</h4>
                        <div class="input-group">
                            <label for="schedule-k1-ordinary-${year}-${incomeCount}">Schedule K-1: Ordinary Income/Loss (Line 1) ($)</label>
                            <input type="number" id="schedule-k1-ordinary-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-k1-ordinary-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-k1-net-rental-${year}-${incomeCount}">Schedule K-1: Net Rental Real Estate; Other Net Income (Loss) (Lines 2, 3) ($)</label>
                            <input type="number" id="schedule-k1-net-rental-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-k1-net-rental-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-k1-guaranteed-${year}-${incomeCount}">Schedule K-1: Guaranteed Payments to Partner (Line 4c) ($)</label>
                            <input type="number" id="schedule-k1-guaranteed-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-k1-guaranteed-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1065-ordinary-${year}-${incomeCount}">Form 1065: Ordinary (Income) Loss from Other Partnerships (Line 4) ($)</label>
                            <input type="number" id="form-1065-ordinary-${year}-${incomeCount}" placeholder="0" value="${data[`form-1065-ordinary-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1065-nonrecurring-${year}-${incomeCount}">Form 1065: Nonrecurring Other (Income) or Loss (Lines 5, 6, & 7) ($)</label>
                            <input type="number" id="form-1065-nonrecurring-${year}-${incomeCount}" placeholder="0" value="${data[`form-1065-nonrecurring-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1065-depreciation-${year}-${incomeCount}">Form 1065: Depreciation (Line 16c, including 8825 Line 14) ($)</label>
                            <input type="number" id="form-1065-depreciation-${year}-${incomeCount}" placeholder="0" value="${data[`form-1065-depreciation-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1065-depletion-${year}-${incomeCount}">Form 1065: Depletion (Line 17) ($)</label>
                            <input type="number" id="form-1065-depletion-${year}-${incomeCount}" placeholder="0" value="${data[`form-1065-depletion-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1065-amortization-${year}-${incomeCount}">Form 1065: Amortization/Casualty (Line 21, Other Related to 8825) ($)</label>
                            <input type="number" id="form-1065-amortization-${year}-${incomeCount}" placeholder="0" value="${data[`form-1065-amortization-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1065-mortgages-${year}-${incomeCount}">Form 1065: Mortgages or Notes Payable in Less than 1 Year (Schedule L, Line 16d) ($)</label>
                            <input type="number" id="form-1065-mortgages-${year}-${incomeCount}" placeholder="0" value="${data[`form-1065-mortgages-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1065-travel-${year}-${incomeCount}">Form 1065: Non-deductible Travel and Entertainment Expenses (Schedule M-1, Line 4b) ($)</label>
                            <input type="number" id="form-1065-travel-${year}-${incomeCount}" placeholder="0" value="${data[`form-1065-travel-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="percent-ownership-${year}-${incomeCount}">Percent Ownership (From Schedule K-1) (%) <span class="required-asterisk">*</span></label>
                            <input type="number" id="percent-ownership-${year}-${incomeCount}" step="0.01" placeholder="0" value="${data[`percent-ownership-${year}`] || ''}" required>
                        </div>
                    `;
                });
            } else if (incomeType === 'irs-form-1120s') {
                years.forEach(year => {
                    fieldsHtml += `
                        <h4>${year} Income Details</h4>
                        <div class="input-group">
                            <label for="schedule-k1-ordinary-${year}-${incomeCount}">Schedule K-1: Ordinary Income (Loss) (Line 1) ($)</label>
                            <input type="number" id="schedule-k1-ordinary-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-k1-ordinary-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="schedule-k1-net-rental-${year}-${incomeCount}">Schedule K-1: Net Rental Real Estate; Other Net Income (Loss) (Lines 2, 3) ($)</label>
                            <input type="number" id="schedule-k1-net-rental-${year}-${incomeCount}" placeholder="0" value="${data[`schedule-k1-net-rental-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1120s-nonrecurring-${year}-${incomeCount}">Form 1120S: Nonrecurring Other (Income) Loss (Lines 4, 5) ($)</label>
                            <input type="number" id="form-1120s-nonrecurring-${year}-${incomeCount}" placeholder="0" value="${data[`form-1120s-nonrecurring-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1120s-depreciation-${year}-${incomeCount}">Form 1120S: Depreciation (Line 14, including 8825 Line 14) ($)</label>
                            <input type="number" id="form-1120s-depreciation-${year}-${incomeCount}" placeholder="0" value="${data[`form-1120s-depreciation-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1120s-depletion-${year}-${incomeCount}">Form 1120S: Depletion (Line 15) ($)</label>
                            <input type="number" id="form-1120s-depletion-${year}-${incomeCount}" placeholder="0" value="${data[`form-1120s-depletion-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1120s-amortization-${year}-${incomeCount}">Form 1120S: Amortization/Casualty Loss (Line 20, Other deductions) ($)</label>
                            <input type="number" id="form-1120s-amortization-${year}-${incomeCount}" placeholder="0" value="${data[`form-1120s-amortization-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1120s-mortgages-${year}-${incomeCount}">Form 1120S: Mortgages or Notes Payable in Less than 1 Year (Schedule L, Line 17d) ($)</label>
                            <input type="number" id="form-1120s-mortgages-${year}-${incomeCount}" placeholder="0" value="${data[`form-1120s-mortgages-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1120s-travel-${year}-${incomeCount}">Form 1120S: Non-deductible Travel and Entertainment Expenses (Schedule M-1, Line 3b) ($)</label>
                            <input type="number" id="form-1120s-travel-${year}-${incomeCount}" placeholder="0" value="${data[`form-1120s-travel-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="percent-ownership-${year}-${incomeCount}">Percent Ownership (From Schedule K-1, Line G) (%) <span class="required-asterisk">*</span></label>
                            <input type="number" id="percent-ownership-${year}-${incomeCount}" step="0.01" placeholder="0" value="${data[`percent-ownership-${year}`] || ''}" required>
                        </div>
                    `;
                });
            } else if (incomeType === 'irs-form-1120') {
                years.forEach(year => {
                    fieldsHtml += `
                        <h4>${year} Income Details</h4>
                        <div class="input-group">
                            <label for="form-1120-taxable-income-${year}-${incomeCount}">Form 1120: Taxable Income (Line 30) ($)</label>
                            <input type="number" id="form-1120-taxable-income-${year}-${incomeCount}" placeholder="0" value="${data[`form-1120-taxable-income-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1120-total-tax-${year}-${incomeCount}">Form 1120: Total Tax (Line 31) ($)</label>
                            <input type="number" id="form-1120-total-tax-${year}-${incomeCount}" placeholder="0" value="${data[`form-1120-total-tax-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1120-nonrecurring-gains-${year}-${incomeCount}">Form 1120: Nonrecurring (Gains)/Losses (Lines 8, 9) ($)</label>
                            <input type="number" id="form-1120-nonrecurring-gains-${year}-${incomeCount}" placeholder="0" value="${data[`form-1120-nonrecurring-gains-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1120-nonrecurring-income-${year}-${incomeCount}">Form 1120: Nonrecurring Other (Income) Loss (Line 10) ($)</label>
                            <input type="number" id="form-1120-nonrecurring-income-${year}-${incomeCount}" placeholder="0" value="${data[`form-1120-nonrecurring-income-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1120-depreciation-${year}-${incomeCount}">Form 1120: Depreciation (Line 20) ($)</label>
                            <input type="number" id="form-1120-depreciation-${year}-${incomeCount}" placeholder="0" value="${data[`form-1120-depreciation-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1120-amortization-${year}-${incomeCount}">Form 1120: Amortization/Casualty Loss (Line 26, Other deductions) ($)</label>
                            <input type="number" id="form-1120-amortization-${year}-${incomeCount}" placeholder="0" value="${data[`form-1120-amortization-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1120-special-deductions-${year}-${incomeCount}">Form 1120: Net Operating Loss and Special Deductions (Line 29c) ($)</label>
                            <input type="number" id="form-1120-special-deductions-${year}-${incomeCount}" placeholder="0" value="${data[`form-1120-special-deductions-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1120-mortgages-${year}-${incomeCount}">Form 1120: Mortgages or Notes Payable in Less than 1 Year (Schedule L, Line 17d) ($)</label>
                            <input type="number" id="form-1120-mortgages-${year}-${incomeCount}" placeholder="0" value="${data[`form-1120-mortgages-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="form-1120-travel-${year}-${incomeCount}">Form 1120: Non-deductible Travel and Entertainment Expenses (Schedule M-1, Line 5c) ($)</label>
                            <input type="number" id="form-1120-travel-${year}-${incomeCount}" placeholder="0" value="${data[`form-1120-travel-${year}`] || ''}">
                        </div>
                        <div class="input-group">
                            <label for="dividends-paid-${year}-${incomeCount}">Dividends Paid to Borrower (Check Form 1120, Schedule B) ($)</label>
                            <input type="number" id="dividends-paid-${year}-${incomeCount}" placeholder="0" value="${data[`dividends-paid-${year}`] || ''}">
                        </div>
                    `;
                });
            }
    
            dynamicFieldsContainer.innerHTML = fieldsHtml;
    
            // Add event listeners to new inputs
            const newInputs = dynamicFieldsContainer.querySelectorAll('input, select');
            newInputs.forEach(input => {
                input.addEventListener('input', () => saveIncomeData(incomeCount));
            });
        }
    
        // Initial render of dynamic fields
        renderDynamicFields();
    
        // Add event listener for income type change
        incomeTypeSelect.addEventListener('change', () => {
            console.log(`Income type changed for Income Source ${incomeCount} to ${incomeTypeSelect.value}`);
            renderDynamicFields();
        });
    
        // Add event listener for collapse/expand button
        collapseBtn.addEventListener('click', () => {
            const content = document.getElementById(`income-content-${incomeCount}`);
            const isExpanded = collapseBtn.getAttribute('aria-expanded') === 'true';
            const icon = collapseBtn.querySelector('.collapse-icon');
            if (isExpanded) {
                content.style.display = 'none';
                collapseBtn.setAttribute('aria-expanded', 'false');
                collapseBtn.setAttribute('title', 'Expand');
                icon.textContent = '▲'; // Up arrow for expand
            } else {
                content.style.display = 'block';
                collapseBtn.setAttribute('aria-expanded', 'true');
                collapseBtn.setAttribute('title', 'Collapse');
                icon.textContent = '▼'; // Down arrow for collapse
            }
        });
    
        computeBtn.addEventListener('click', () => {
            const id = parseInt(computeBtn.getAttribute('data-income-id'));
            calculateIncome(id, printBtn);
        });
    
        printBtn.addEventListener('click', () => {
            const id = parseInt(printBtn.getAttribute('data-income-id'));
            printIncome(id);
        });
    
        removeBtn.addEventListener('click', () => {
            const id = parseInt(removeBtn.getAttribute('data-income-id'));
            removeIncome(id);
        });
    
        // Add event listeners to inputs to save data on change
        const inputs = incomeDiv.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => saveIncomeData(incomeCount));
        });
    
        // If there are saved results, display them
        if (data.results) {
            const resultPanel = incomeDiv.querySelector(`#result-${incomeCount}`);
            resultPanel.innerHTML = data.results;
            resultPanel.classList.remove('hidden');
            printBtn.classList.remove('hidden');
        }
    }

        function removeIncome(id) {
        const incomeDiv = document.querySelector(`.income-section[data-income-id="${id}"]`);
        if (incomeDiv) {
            incomeDiv.remove();
            incomeCount--;
            updateIncomeCount();
            // Remove the income data from localStorage
            let savedData = JSON.parse(localStorage.getItem('incomeCalculatorData')) || {};
            delete savedData[id];
            localStorage.setItem('incomeCalculatorData', JSON.stringify(savedData));
            updateGrandTotal();
        }
    }

    function updateIncomeCount() {
        incomeCountDisplay.textContent = `Income Sources: ${incomeCount}/${maxIncomes}`;
        addIncomeBtn.disabled = incomeCount >= maxIncomes;
    }

    function saveIncomeData(incomeId) {
        const incomeData = {
            incomeType: document.getElementById(`income-type-${incomeId}`).value,
            description: document.getElementById(`income-description-${incomeId}`).value,
            results: document.getElementById(`result-${incomeId}`).innerHTML
        };

        // Save fields based on income type
        if (incomeData.incomeType === 'irs-form-1040') {
            years.forEach(year => {
                incomeData[`w2-${year}`] = document.getElementById(`w2-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-b-interest-${year}`] = document.getElementById(`schedule-b-interest-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-b-dividends-${year}`] = document.getElementById(`schedule-b-dividends-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-c-net-profit-${year}`] = document.getElementById(`schedule-c-net-profit-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-c-nonrecurring-${year}`] = document.getElementById(`schedule-c-nonrecurring-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-c-depletion-${year}`] = document.getElementById(`schedule-c-depletion-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-c-depreciation-${year}`] = document.getElementById(`schedule-c-depreciation-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-c-meals-${year}`] = document.getElementById(`schedule-c-meals-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-c-business-use-${year}`] = document.getElementById(`schedule-c-business-use-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-c-amortization-${year}`] = document.getElementById(`schedule-c-amortization-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-c-miles-${year}`] = document.getElementById(`schedule-c-miles-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-d-gains-${year}`] = document.getElementById(`schedule-d-gains-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-e-royalties-${year}`] = document.getElementById(`schedule-e-royalties-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-e-expenses-${year}`] = document.getElementById(`schedule-e-expenses-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-e-depreciation-${year}`] = document.getElementById(`schedule-e-depreciation-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-f-net-profit-${year}`] = document.getElementById(`schedule-f-net-profit-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-f-non-tax-${year}`] = document.getElementById(`schedule-f-non-tax-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-f-nonrecurring-${year}`] = document.getElementById(`schedule-f-nonrecurring-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-f-depreciation-${year}`] = document.getElementById(`schedule-f-depreciation-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-f-amortization-${year}`] = document.getElementById(`schedule-f-amortization-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-f-business-use-${year}`] = document.getElementById(`schedule-f-business-use-${year}-${incomeId}`)?.value || '';
            });
        } else if (incomeData.incomeType === 'irs-form-1065') {
            years.forEach(year => {
                incomeData[`schedule-k1-ordinary-${year}`] = document.getElementById(`schedule-k1-ordinary-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-k1-net-rental-${year}`] = document.getElementById(`schedule-k1-net-rental-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-k1-guaranteed-${year}`] = document.getElementById(`schedule-k1-guaranteed-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1065-ordinary-${year}`] = document.getElementById(`form-1065-ordinary-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1065-nonrecurring-${year}`] = document.getElementById(`form-1065-nonrecurring-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1065-depreciation-${year}`] = document.getElementById(`form-1065-depreciation-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1065-depletion-${year}`] = document.getElementById(`form-1065-depletion-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1065-amortization-${year}`] = document.getElementById(`form-1065-amortization-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1065-mortgages-${year}`] = document.getElementById(`form-1065-mortgages-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1065-travel-${year}`] = document.getElementById(`form-1065-travel-${year}-${incomeId}`)?.value || '';
                incomeData[`percent-ownership-${year}`] = document.getElementById(`percent-ownership-${year}-${incomeId}`)?.value || '';
            });
        } else if (incomeData.incomeType === 'irs-form-1120s') {
            years.forEach(year => {
                incomeData[`schedule-k1-ordinary-${year}`] = document.getElementById(`schedule-k1-ordinary-${year}-${incomeId}`)?.value || '';
                incomeData[`schedule-k1-net-rental-${year}`] = document.getElementById(`schedule-k1-net-rental-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1120s-nonrecurring-${year}`] = document.getElementById(`form-1120s-nonrecurring-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1120s-depreciation-${year}`] = document.getElementById(`form-1120s-depreciation-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1120s-depletion-${year}`] = document.getElementById(`form-1120s-depletion-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1120s-amortization-${year}`] = document.getElementById(`form-1120s-amortization-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1120s-mortgages-${year}`] = document.getElementById(`form-1120s-mortgages-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1120s-travel-${year}`] = document.getElementById(`form-1120s-travel-${year}-${incomeId}`)?.value || '';
                incomeData[`percent-ownership-${year}`] = document.getElementById(`percent-ownership-${year}-${incomeId}`)?.value || '';
            });
        } else if (incomeData.incomeType === 'irs-form-1120') {
            years.forEach(year => {
                incomeData[`form-1120-taxable-income-${year}`] = document.getElementById(`form-1120-taxable-income-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1120-total-tax-${year}`] = document.getElementById(`form-1120-total-tax-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1120-nonrecurring-gains-${year}`] = document.getElementById(`form-1120-nonrecurring-gains-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1120-nonrecurring-income-${year}`] = document.getElementById(`form-1120-nonrecurring-income-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1120-depreciation-${year}`] = document.getElementById(`form-1120-depreciation-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1120-amortization-${year}`] = document.getElementById(`form-1120-amortization-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1120-special-deductions-${year}`] = document.getElementById(`form-1120-special-deductions-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1120-mortgages-${year}`] = document.getElementById(`form-1120-mortgages-${year}-${incomeId}`)?.value || '';
                incomeData[`form-1120-travel-${year}`] = document.getElementById(`form-1120-travel-${year}-${incomeId}`)?.value || '';
                incomeData[`dividends-paid-${year}`] = document.getElementById(`dividends-paid-${year}-${incomeId}`)?.value || '';
            });
        }

        // Load existing data from localStorage
        let savedData = JSON.parse(localStorage.getItem('incomeCalculatorData')) || {};
        savedData[incomeId] = incomeData;
        localStorage.setItem('incomeCalculatorData', JSON.stringify(savedData));
    }

    function loadSavedData() {
        const savedData = JSON.parse(localStorage.getItem('incomeCalculatorData')) || {};
        const incomeIds = Object.keys(savedData).map(id => parseInt(id)).sort((a, b) => a - b);

        incomeIds.forEach(id => {
            addIncome(savedData[id]);
        });
    }

    function resetAll() {
        incomeContainer.innerHTML = '';
        resultsContainer.innerHTML = '';
        incomeCount = 0;
        updateIncomeCount();
        localStorage.removeItem('incomeCalculatorData');
        // Reset to year selection
        yearSelection.classList.remove('hidden');
        incomeControls.classList.add('hidden');
        incomeContainer.classList.add('hidden');
        yearOptionSelect.value = '';
        filed2024Group.classList.add('hidden');
        filed2024Select.value = '';
        proceedBtn.disabled = true;
        years = [];
    }

    function calculateIncome(incomeId, printBtn) {
        // Get input values
        const incomeType = document.getElementById(`income-type-${incomeId}`).value;
        const description = document.getElementById(`income-description-${incomeId}`).value || `Income Source ${incomeId}`;
        const resultPanel = document.getElementById(`result-${incomeId}`);

        // Validate description
        if (!description) {
            resultPanel.innerHTML = "<p style='color: red; background: #fee2e2; padding: 10px; border-radius: 5px; border: 1px solid red;'>Please enter a description.</p>";
            resultPanel.classList.remove("hidden");
            printBtn.classList.add('hidden');
            saveIncomeData(incomeId);
            return;
        }

        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
        let resultsHtml = `
            <div class="result-card">
                <strong>Income Type</strong>
                <span>${incomeType === 'irs-form-1040' ? 'IRS Form 1040' : incomeType === 'irs-form-1065' ? 'IRS Form 1065' : incomeType === 'irs-form-1120s' ? 'IRS Form 1120S' : 'IRS Form 1120'}</span>
            </div>
            <div class="result-card">
                <strong>Description</strong>
                <span>${description}</span>
            </div>
        `;

        // Calculate totals for each year
        const totals = {};
        years.forEach(year => {
            let totalYearIncome = 0;

            if (incomeType === 'irs-form-1040') {
                const w2 = parseFloat(document.getElementById(`w2-${year}-${incomeId}`).value) || 0;
                const scheduleBInterest = parseFloat(document.getElementById(`schedule-b-interest-${year}-${incomeId}`).value) || 0;
                const scheduleBDividends = parseFloat(document.getElementById(`schedule-b-dividends-${year}-${incomeId}`).value) || 0;
                const scheduleCNetProfit = parseFloat(document.getElementById(`schedule-c-net-profit-${year}-${incomeId}`).value) || 0;
                const scheduleCNonrecurring = parseFloat(document.getElementById(`schedule-c-nonrecurring-${year}-${incomeId}`).value) || 0;
                const scheduleCDepletion = parseFloat(document.getElementById(`schedule-c-depletion-${year}-${incomeId}`).value) || 0;
                const scheduleCDepreciation = parseFloat(document.getElementById(`schedule-c-depreciation-${year}-${incomeId}`).value) || 0;
                const scheduleCMeals = parseFloat(document.getElementById(`schedule-c-meals-${year}-${incomeId}`).value) || 0;
                const scheduleCBusinessUse = parseFloat(document.getElementById(`schedule-c-business-use-${year}-${incomeId}`).value) || 0;
                const scheduleCAmortization = parseFloat(document.getElementById(`schedule-c-amortization-${year}-${incomeId}`).value) || 0;
                const scheduleCMiles = parseFloat(document.getElementById(`schedule-c-miles-${year}-${incomeId}`).value) || 0;
                const scheduleDGains = parseFloat(document.getElementById(`schedule-d-gains-${year}-${incomeId}`).value) || 0;
                const scheduleERoyalties = parseFloat(document.getElementById(`schedule-e-royalties-${year}-${incomeId}`).value) || 0;
                const scheduleEExpenses = parseFloat(document.getElementById(`schedule-e-expenses-${year}-${incomeId}`).value) || 0;
                const scheduleEDepreciation = parseFloat(document.getElementById(`schedule-e-depreciation-${year}-${incomeId}`).value) || 0;
                const scheduleFNetProfit = parseFloat(document.getElementById(`schedule-f-net-profit-${year}-${incomeId}`).value) || 0;
                const scheduleFNonTax = parseFloat(document.getElementById(`schedule-f-non-tax-${year}-${incomeId}`).value) || 0;
                const scheduleFNonrecurring = parseFloat(document.getElementById(`schedule-f-nonrecurring-${year}-${incomeId}`).value) || 0;
                const scheduleFDepreciation = parseFloat(document.getElementById(`schedule-f-depreciation-${year}-${incomeId}`).value) || 0;
                const scheduleFAmortization = parseFloat(document.getElementById(`schedule-f-amortization-${year}-${incomeId}`).value) || 0;
                const scheduleFBusinessUse = parseFloat(document.getElementById(`schedule-f-business-use-${year}-${incomeId}`).value) || 0;

                // Calculate Schedule C Mileage Depreciation
                const mileageRate = year === '2024' ? 0.30 : 0.28; // As per PDF: 2024 - 30¢, 2023 - 28¢
                const mileageDepreciation = scheduleCMiles * mileageRate;

                // Calculate Schedule C Subtotal
                let scheduleCSubtotal = scheduleCNetProfit;
                scheduleCSubtotal += scheduleCNonrecurring; // Add nonrecurring other (income)/loss/expenses
                scheduleCSubtotal += scheduleCDepletion; // Add depletion
                scheduleCSubtotal += scheduleCDepreciation; // Add depreciation
                scheduleCSubtotal -= scheduleCMeals; // Subtract non-deductible meals and entertainment
                scheduleCSubtotal += scheduleCBusinessUse; // Add business use of home
                scheduleCSubtotal += scheduleCAmortization; // Add amortization/casualty loss
                scheduleCSubtotal -= mileageDepreciation; // Subtract mileage depreciation

                // Calculate Schedule E Subtotal
                let scheduleESubtotal = scheduleERoyalties;
                scheduleESubtotal -= scheduleEExpenses; // Subtract total expenses
                scheduleESubtotal += scheduleEDepreciation; // Add depreciation

                // Calculate Schedule F Subtotal
                let scheduleFSubtotal = scheduleFNetProfit;
                scheduleFSubtotal += scheduleFNonTax; // Add non-tax portion ongoing coop and CCC payments
                scheduleFSubtotal += scheduleFNonrecurring; // Add nonrecurring other (income) or loss
                scheduleFSubtotal += scheduleFDepreciation; // Add depreciation
                scheduleFSubtotal += scheduleFAmortization; // Add amortization/casualty loss/depletion
                scheduleFSubtotal += scheduleFBusinessUse; // Add business use of home

                // Calculate total income for the year
                totalYearIncome = w2;
                totalYearIncome += scheduleBInterest; // Add Schedule B interest
                totalYearIncome += scheduleBDividends; // Add Schedule B dividends
                totalYearIncome += scheduleCSubtotal; // Add Schedule C subtotal
                totalYearIncome += scheduleDGains; // Add Schedule D recurring capital gains
                totalYearIncome += scheduleESubtotal; // Add Schedule E subtotal
                totalYearIncome += scheduleFSubtotal; // Add Schedule F subtotal

                totals[year] = {
                    w2,
                    scheduleBInterest,
                    scheduleBDividends,
                    scheduleCNetProfit,
                    scheduleCNonrecurring,
                    scheduleCDepletion,
                    scheduleCDepreciation,
                    scheduleCMeals,
                    scheduleCBusinessUse,
                    scheduleCAmortization,
                    scheduleCMiles,
                    mileageDepreciation,
                    scheduleCSubtotal,
                    scheduleDGains,
                    scheduleERoyalties,
                    scheduleEExpenses,
                    scheduleEDepreciation,
                    scheduleESubtotal,
                    scheduleFNetProfit,
                    scheduleFNonTax,
                    scheduleFNonrecurring,
                    scheduleFDepreciation,
                    scheduleFAmortization,
                    scheduleFBusinessUse,
                    scheduleFSubtotal,
                    totalYearIncome
                };
            } else if (incomeType === 'irs-form-1065') {
                const scheduleK1Ordinary = parseFloat(document.getElementById(`schedule-k1-ordinary-${year}-${incomeId}`).value) || 0;
                const scheduleK1NetRental = parseFloat(document.getElementById(`schedule-k1-net-rental-${year}-${incomeId}`).value) || 0;
                const scheduleK1Guaranteed = parseFloat(document.getElementById(`schedule-k1-guaranteed-${year}-${incomeId}`).value) || 0;
                const form1065Ordinary = parseFloat(document.getElementById(`form-1065-ordinary-${year}-${incomeId}`).value) || 0;
                const form1065Nonrecurring = parseFloat(document.getElementById(`form-1065-nonrecurring-${year}-${incomeId}`).value) || 0;
                const form1065Depreciation = parseFloat(document.getElementById(`form-1065-depreciation-${year}-${incomeId}`).value) || 0;
                const form1065Depletion = parseFloat(document.getElementById(`form-1065-depletion-${year}-${incomeId}`).value) || 0;
                const form1065Amortization = parseFloat(document.getElementById(`form-1065-amortization-${year}-${incomeId}`).value) || 0;
                const form1065Mortgages = parseFloat(document.getElementById(`form-1065-mortgages-${year}-${incomeId}`).value) || 0;
                const form1065Travel = parseFloat(document.getElementById(`form-1065-travel-${year}-${incomeId}`).value) || 0;
                const percentOwnership = parseFloat(document.getElementById(`percent-ownership-${year}-${incomeId}`).value) || 0;

                // Validate percent ownership
                if (percentOwnership <= 0 || percentOwnership > 100) {
                    resultPanel.innerHTML = "<p style='color: red; background: #fee2e2; padding: 10px; border-radius: 5px; border: 1px solid red;'>Percent Ownership for ${year} must be between 0 and 100.</p>";
                    resultPanel.classList.remove("hidden");
                    printBtn.classList.add('hidden');
                    saveIncomeData(incomeId);
                    return;
                }

                // Calculate Schedule K-1 Subtotal (not adjusted by percent ownership)
                let scheduleK1Subtotal = scheduleK1Ordinary;
                scheduleK1Subtotal += scheduleK1NetRental; // Add net rental real estate; other net income (loss)
                scheduleK1Subtotal += scheduleK1Guaranteed; // Add guaranteed payments to partner

                // Calculate Form 1065 Adjustments Subtotal (before percent ownership)
let form1065Adjustments = 0;
form1065Adjustments += form1065Ordinary;
form1065Adjustments += form1065Nonrecurring;
form1065Adjustments += form1065Depreciation;
form1065Adjustments += form1065Depletion;
form1065Adjustments += form1065Amortization;
form1065Adjustments -= form1065Mortgages;
form1065Adjustments -= form1065Travel;

// Apply percent ownership to Form 1065 adjustments only
const adjustedForm1065 = (form1065Adjustments * percentOwnership) / 100;

                // Calculate total income for the year
                totalYearIncome = scheduleK1Subtotal + adjustedForm1065;

                totals[year] = {
                    scheduleK1Ordinary,
                    scheduleK1NetRental,
                    scheduleK1Guaranteed,
                    scheduleK1Subtotal,
                    form1065Ordinary,
                    form1065Nonrecurring,
                    form1065Depreciation,
                    form1065Depletion,
                    form1065Amortization,
                    form1065Mortgages,
                    form1065Travel,
                    form1065Adjustments,
                    adjustedForm1065,
                    percentOwnership,
                    totalYearIncome
                };
            } else if (incomeType === 'irs-form-1120s') {
                const scheduleK1Ordinary = parseFloat(document.getElementById(`schedule-k1-ordinary-${year}-${incomeId}`).value) || 0;
                const scheduleK1NetRental = parseFloat(document.getElementById(`schedule-k1-net-rental-${year}-${incomeId}`).value) || 0;
                const form1120sNonrecurring = parseFloat(document.getElementById(`form-1120s-nonrecurring-${year}-${incomeId}`).value) || 0;
                const form1120sDepreciation = parseFloat(document.getElementById(`form-1120s-depreciation-${year}-${incomeId}`).value) || 0;
                const form1120sDepletion = parseFloat(document.getElementById(`form-1120s-depletion-${year}-${incomeId}`).value) || 0;
                const form1120sAmortization = parseFloat(document.getElementById(`form-1120s-amortization-${year}-${incomeId}`).value) || 0;
                const form1120sMortgages = parseFloat(document.getElementById(`form-1120s-mortgages-${year}-${incomeId}`).value) || 0;
                const form1120sTravel = parseFloat(document.getElementById(`form-1120s-travel-${year}-${incomeId}`).value) || 0;
                const percentOwnership = parseFloat(document.getElementById(`percent-ownership-${year}-${incomeId}`).value) || 0;

                // Validate percent ownership
                if (percentOwnership <= 0 || percentOwnership > 100) {
                    resultPanel.innerHTML = "<p style='color: red; background: #fee2e2; padding: 10px; border-radius: 5px; border: 1px solid red;'>Percent Ownership for ${year} must be between 0 and 100.</p>";
                    resultPanel.classList.remove("hidden");
                    printBtn.classList.add('hidden');
                    saveIncomeData(incomeId);
                    return;
                }

                // Calculate Schedule K-1 Subtotal (not adjusted by percent ownership)
                let scheduleK1Subtotal = scheduleK1Ordinary;
                scheduleK1Subtotal += scheduleK1NetRental; // Add net rental real estate; other net income (loss)

                // Calculate Form 1120S Adjustments Subtotal (before percent ownership)
let form1120sAdjustments = 0;
form1120sAdjustments += form1120sNonrecurring;
form1120sAdjustments += form1120sDepreciation;
form1120sAdjustments += form1120sDepletion;
form1120sAdjustments += form1120sAmortization;
form1120sAdjustments -= form1120sMortgages;
form1120sAdjustments -= form1120sTravel;

// Apply percent ownership to Form 1120S adjustments only
const adjustedForm1120s = (form1120sAdjustments * percentOwnership) / 100;

                // Calculate total income for the year
                totalYearIncome = scheduleK1Subtotal + adjustedForm1120s;

                totals[year] = {
                    scheduleK1Ordinary,
                    scheduleK1NetRental,
                    scheduleK1Subtotal,
                    form1120sNonrecurring,
                    form1120sDepreciation,
                    form1120sDepletion,
                    form1120sAmortization,
                    form1120sMortgages,
                    form1120sTravel,
                    form1120sAdjustments,
                    adjustedForm1120s,
                    percentOwnership,
                    totalYearIncome
                };
            } else if (incomeType === 'irs-form-1120') {
                const form1120TaxableIncome = parseFloat(document.getElementById(`form-1120-taxable-income-${year}-${incomeId}`).value) || 0;
                const form1120TotalTax = parseFloat(document.getElementById(`form-1120-total-tax-${year}-${incomeId}`).value) || 0;
                const form1120NonrecurringGains = parseFloat(document.getElementById(`form-1120-nonrecurring-gains-${year}-${incomeId}`).value) || 0;
                const form1120NonrecurringIncome = parseFloat(document.getElementById(`form-1120-nonrecurring-income-${year}-${incomeId}`).value) || 0;
                const form1120Depreciation = parseFloat(document.getElementById(`form-1120-depreciation-${year}-${incomeId}`).value) || 0;
                const form1120Amortization = parseFloat(document.getElementById(`form-1120-amortization-${year}-${incomeId}`).value) || 0;
                const form1120SpecialDeductions = parseFloat(document.getElementById(`form-1120-special-deductions-${year}-${incomeId}`).value) || 0;
                const form1120Mortgages = parseFloat(document.getElementById(`form-1120-mortgages-${year}-${incomeId}`).value) || 0;
                const form1120Travel = parseFloat(document.getElementById(`form-1120-travel-${year}-${incomeId}`).value) || 0;
                const dividendsPaid = parseFloat(document.getElementById(`dividends-paid-${year}-${incomeId}`).value) || 0;

                // Calculate Form 1120 Adjustments Subtotal
                let form1120Subtotal = form1120TaxableIncome;
                form1120Subtotal += form1120TotalTax; // Add total tax
                form1120Subtotal += form1120NonrecurringGains; // Add nonrecurring (gains)/losses
                form1120Subtotal += form1120NonrecurringIncome; // Add nonrecurring other (income) loss
                form1120Subtotal += form1120Depreciation; // Add depreciation
                form1120Subtotal += form1120Amortization; // Add amortization/casualty loss
                form1120Subtotal += form1120SpecialDeductions; // Add net operating loss and special deductions
                form1120Subtotal -= form1120Mortgages; // Subtract mortgages or notes payable in less than 1 year
                form1120Subtotal -= form1120Travel; // Subtract non-deductible travel and entertainment expenses

                // Subtract dividends paid to borrower
                totalYearIncome = form1120Subtotal - dividendsPaid;

                totals[year] = {
                    form1120TaxableIncome,
                    form1120TotalTax,
                    form1120NonrecurringGains,
                    form1120NonrecurringIncome,
                    form1120Depreciation,
                    form1120Amortization,
                    form1120SpecialDeductions,
                    form1120Mortgages,
                    form1120Travel,
                    form1120Subtotal,
                    dividendsPaid,
                    totalYearIncome
                };
            }

            // Add year-specific results to the output
            resultsHtml += `<h4>${year} Income Details</h4>`;

            if (incomeType === 'irs-form-1040') {
                // W-2 Income
                if (totals[year].w2 !== 0) {
                    resultsHtml += `
                        <div class="result-card">
                            <strong>W-2 Income</strong>
                            <span>${formatter.format(totals[year].w2)}</span>
                        </div>
                    `;
                }

                // Schedule B – Interest and Ordinary Dividends
                const scheduleBTotal = totals[year].scheduleBInterest + totals[year].scheduleBDividends;
                if (scheduleBTotal !== 0) {
                    resultsHtml += `
                        <div class="result-card">
                            <strong>Schedule B – Interest and Ordinary Dividends</strong>
                            <span>${formatter.format(scheduleBTotal)}</span>
                        </div>
                    `;
                }

                // Schedule C – Profit or Loss from Business: Sole Proprietorship
                if (totals[year].scheduleCSubtotal !== 0) {
                    resultsHtml += `
                        <div class="result-card">
                            <strong>Schedule C – Profit or Loss from Business: Sole Proprietorship</strong>
                            <span>${formatter.format(totals[year].scheduleCSubtotal)}</span>
                        </div>
                    `;
                }

                // Schedule D – Capital Gains and Losses
                if (totals[year].scheduleDGains !== 0) {
                    resultsHtml += `
                        <div class="result-card">
                            <strong>Schedule D – Capital Gains and Losses</strong>
                            <span>${formatter.format(totals[year].scheduleDGains)}</span>
                        </div>
                    `;
                }

                // Schedule F – Profit or Loss from Farming
                if (totals[year].scheduleFSubtotal !== 0) {
                    resultsHtml += `
                        <div class="result-card">
                            <strong>Schedule F – Profit or Loss from Farming</strong>
                            <span>${formatter.format(totals[year].scheduleFSubtotal)}</span>
                        </div>
                    `;
                }
            } else if (incomeType === 'irs-form-1065') {
                // Schedule K-1 Subtotal
                if (totals[year].scheduleK1Subtotal !== 0) {
                    resultsHtml += `
                        <div class="result-card">
                            <strong>Schedule K-1 – Partner's Share of Income</strong>
                            <span>${formatter.format(totals[year].scheduleK1Subtotal)}</span>
                        </div>
                    `;
                }

                // Form 1065 Adjustments Subtotal (after percent ownership)
                if (totals[year].form1065Adjustments !== 0) {
                    resultsHtml += `
                        <div class="result-card">
                            <strong>Form 1065 – Adjustments to Business Cash Flow</strong>
                            <span>${formatter.format(totals[year].adjustedForm1065)}</span>
                        </div>
                    `;
                }

                // Percent Ownership
                resultsHtml += `
                    <div class="result-card">
                        <strong>Percent Ownership</strong>
                        <span>${totals[year].percentOwnership}%</span>
                    </div>
                `;
            } else if (incomeType === 'irs-form-1120s') {
                // Schedule K-1 Subtotal
                if (totals[year].scheduleK1Subtotal !== 0) {
                    resultsHtml += `
                        <div class="result-card">
                            <strong>Schedule K-1 – Shareholder's Share of Income</strong>
                            <span>${formatter.format(totals[year].scheduleK1Subtotal)}</span>
                        </div>
                    `;
                }

                // Form 1120S Adjustments Subtotal (after percent ownership)
                if (totals[year].form1120sAdjustments !== 0) {
                    resultsHtml += `
                        <div class="result-card">
                            <strong>Form 1120S – Adjustments to Business Cash Flow</strong>
                            <span>${formatter.format(totals[year].adjustedForm1120s)}</span>
                        </div>
                    `;
                }

                // Percent Ownership
                resultsHtml += `
                    <div class="result-card">
                        <strong>Percent Ownership</strong>
                        <span>${totals[year].percentOwnership}%</span>
                    </div>
                `;
            } else if (incomeType === 'irs-form-1120') {
                // Form 1120 Adjustments Subtotal (before dividends)
                if (totals[year].form1120Subtotal !== totals[year].form1120TaxableIncome) {
                    resultsHtml += `
                        <div class="result-card">
                            <strong>Form 1120 – Adjustments to Business Cash Flow</strong>
                            <span>${formatter.format(totals[year].form1120Subtotal)}</span>
                        </div>
                    `;
                }

                // Dividends Paid to Borrower
                if (totals[year].dividendsPaid !== 0) {
                    resultsHtml += `
                        <div class="result-card">
                            <strong>Dividends Paid to Borrower</strong>
                            <span>${formatter.format(totals[year].dividendsPaid)}</span>
                        </div>
                    `;
                }
            }

            // Always show Total Income for the year
            resultsHtml += `
                <div class="result-card">
                    <strong>Total Income for ${year}</strong>
                    <span>${formatter.format(totals[year].totalYearIncome)}</span>
                </div>
            `;
        });

        // Calculate average income if 2 years
        if (years.length === 2) {
            const year1 = years[0];
            const year2 = years[1];
            const averageIncome = (totals[year1].totalYearIncome + totals[year2].totalYearIncome) / 2;
            resultsHtml += `
                <div class="result-card">
                    <strong>Average Income (${year1}-${year2})</strong>
                    <span>${formatter.format(averageIncome)}</span>
                </div>
            `;
            totals.averageIncome = averageIncome;
        }

        // Output results
        resultPanel.innerHTML = resultsHtml;
        resultPanel.classList.remove("hidden");

        // Show the print button after successful computation
        printBtn.classList.remove('hidden');

        // Store the result data for printing
        resultPanel.dataset.inputs = JSON.stringify({
            incomeType,
            description,
            totals
        });

        // Save the data after computation
        saveIncomeData(incomeId);

        // Update the grand total
        updateGrandTotal();
    }
    function calculateIncome(incomeId, printBtn) {
        // Get input values
        const incomeType = document.getElementById(`income-type-${incomeId}`).value;
        const description = document.getElementById(`income-description-${incomeId}`).value || `Income Source ${incomeId}`;
        const resultPanel = document.getElementById(`result-${incomeId}`);
    
        // Validate description
        if (!description) {
            resultPanel.innerHTML = "<p style='color: red; background: #fee2e2; padding: 10px; border-radius: 5px; border: 1px solid red;'>Please enter a description.</p>";
            resultPanel.classList.remove("hidden");
            printBtn.classList.add('hidden');
            saveIncomeData(incomeId);
            return;
        }
    
        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
        let resultsHtml = `
            <div class="result-header">
                <div class="result-row">
                    <strong>Income Type:</strong>
                    <span>${incomeType === 'irs-form-1040' ? 'IRS Form 1040' : incomeType === 'irs-form-1065' ? 'IRS Form 1065' : incomeType === 'irs-form-1120s' ? 'IRS Form 1120S' : 'IRS Form 1120'}</span>
                </div>
                <div class="result-row">
                    <strong>Description:</strong>
                    <span>${description}</span>
                </div>
            </div>
        `;
    
        // Calculate totals for each year
        const totals = {};
        years.forEach(year => {
            let totalYearIncome = 0;
    
            if (incomeType === 'irs-form-1040') {
                const w2 = parseFloat(document.getElementById(`w2-${year}-${incomeId}`).value) || 0;
                const scheduleBInterest = parseFloat(document.getElementById(`schedule-b-interest-${year}-${incomeId}`).value) || 0;
                const scheduleBDividends = parseFloat(document.getElementById(`schedule-b-dividends-${year}-${incomeId}`).value) || 0;
                const scheduleCNetProfit = parseFloat(document.getElementById(`schedule-c-net-profit-${year}-${incomeId}`).value) || 0;
                const scheduleCNonrecurring = parseFloat(document.getElementById(`schedule-c-nonrecurring-${year}-${incomeId}`).value) || 0;
                const scheduleCDepletion = parseFloat(document.getElementById(`schedule-c-depletion-${year}-${incomeId}`).value) || 0;
                const scheduleCDepreciation = parseFloat(document.getElementById(`schedule-c-depreciation-${year}-${incomeId}`).value) || 0;
                const scheduleCMeals = parseFloat(document.getElementById(`schedule-c-meals-${year}-${incomeId}`).value) || 0;
                const scheduleCBusinessUse = parseFloat(document.getElementById(`schedule-c-business-use-${year}-${incomeId}`).value) || 0;
                const scheduleCAmortization = parseFloat(document.getElementById(`schedule-c-amortization-${year}-${incomeId}`).value) || 0;
                const scheduleCMiles = parseFloat(document.getElementById(`schedule-c-miles-${year}-${incomeId}`).value) || 0;
                const scheduleDGains = parseFloat(document.getElementById(`schedule-d-gains-${year}-${incomeId}`).value) || 0;
                const scheduleERoyalties = parseFloat(document.getElementById(`schedule-e-royalties-${year}-${incomeId}`).value) || 0;
                const scheduleEExpenses = parseFloat(document.getElementById(`schedule-e-expenses-${year}-${incomeId}`).value) || 0;
                const scheduleEDepreciation = parseFloat(document.getElementById(`schedule-e-depreciation-${year}-${incomeId}`).value) || 0;
                const scheduleFNetProfit = parseFloat(document.getElementById(`schedule-f-net-profit-${year}-${incomeId}`).value) || 0;
                const scheduleFNonTax = parseFloat(document.getElementById(`schedule-f-non-tax-${year}-${incomeId}`).value) || 0;
                const scheduleFNonrecurring = parseFloat(document.getElementById(`schedule-f-nonrecurring-${year}-${incomeId}`).value) || 0;
                const scheduleFDepreciation = parseFloat(document.getElementById(`schedule-f-depreciation-${year}-${incomeId}`).value) || 0;
                const scheduleFAmortization = parseFloat(document.getElementById(`schedule-f-amortization-${year}-${incomeId}`).value) || 0;
                const scheduleFBusinessUse = parseFloat(document.getElementById(`schedule-f-business-use-${year}-${incomeId}`).value) || 0;
    
                // Calculate Schedule C Mileage Depreciation
                const mileageRate = year === '2024' ? 0.30 : 0.28; // As per PDF: 2024 - 30¢, 2023 - 28¢
                const mileageDepreciation = scheduleCMiles * mileageRate;
    
                // Calculate Schedule C Subtotal
                let scheduleCSubtotal = scheduleCNetProfit;
                scheduleCSubtotal += scheduleCNonrecurring; // Add nonrecurring other (income)/loss/expenses
                scheduleCSubtotal += scheduleCDepletion; // Add depletion
                scheduleCSubtotal += scheduleCDepreciation; // Add depreciation
                scheduleCSubtotal -= scheduleCMeals; // Subtract non-deductible meals and entertainment
                scheduleCSubtotal += scheduleCBusinessUse; // Add business use of home
                scheduleCSubtotal += scheduleCAmortization; // Add amortization/casualty loss
                scheduleCSubtotal -= mileageDepreciation; // Subtract mileage depreciation
    
                // Calculate Schedule E Subtotal
                let scheduleESubtotal = scheduleERoyalties;
                scheduleESubtotal -= scheduleEExpenses; // Subtract total expenses
                scheduleESubtotal += scheduleEDepreciation; // Add depreciation
    
                // Calculate Schedule F Subtotal
                let scheduleFSubtotal = scheduleFNetProfit;
                scheduleFSubtotal += scheduleFNonTax; // Add non-tax portion ongoing coop and CCC payments
                scheduleFSubtotal += scheduleFNonrecurring; // Add nonrecurring other (income) or loss
                scheduleFSubtotal += scheduleFDepreciation; // Add depreciation
                scheduleFSubtotal += scheduleFAmortization; // Add amortization/casualty loss/depletion
                scheduleFSubtotal += scheduleFBusinessUse; // Add business use of home
    
                // Calculate total income for the year
                totalYearIncome = w2;
                totalYearIncome += scheduleBInterest; // Add Schedule B interest
                totalYearIncome += scheduleBDividends; // Add Schedule B dividends
                totalYearIncome += scheduleCSubtotal; // Add Schedule C subtotal
                totalYearIncome += scheduleDGains; // Add Schedule D recurring capital gains
                totalYearIncome += scheduleESubtotal; // Add Schedule E subtotal
                totalYearIncome += scheduleFSubtotal; // Add Schedule F subtotal
    
                totals[year] = {
                    w2,
                    scheduleBInterest,
                    scheduleBDividends,
                    scheduleCNetProfit,
                    scheduleCNonrecurring,
                    scheduleCDepletion,
                    scheduleCDepreciation,
                    scheduleCMeals,
                    scheduleCBusinessUse,
                    scheduleCAmortization,
                    scheduleCMiles,
                    mileageDepreciation,
                    scheduleCSubtotal,
                    scheduleDGains,
                    scheduleERoyalties,
                    scheduleEExpenses,
                    scheduleEDepreciation,
                    scheduleESubtotal,
                    scheduleFNetProfit,
                    scheduleFNonTax,
                    scheduleFNonrecurring,
                    scheduleFDepreciation,
                    scheduleFAmortization,
                    scheduleFBusinessUse,
                    scheduleFSubtotal,
                    totalYearIncome
                };
            } else if (incomeType === 'irs-form-1065') {
                const scheduleK1Ordinary = parseFloat(document.getElementById(`schedule-k1-ordinary-${year}-${incomeId}`)?.value) || 0;
                const scheduleK1NetRental = parseFloat(document.getElementById(`schedule-k1-net-rental-${year}-${incomeId}`)?.value) || 0;
                const scheduleK1Guaranteed = parseFloat(document.getElementById(`schedule-k1-guaranteed-${year}-${incomeId}`)?.value) || 0;
                const form1065Ordinary = parseFloat(document.getElementById(`form-1065-ordinary-${year}-${incomeId}`)?.value) || 0;
                const form1065Nonrecurring = parseFloat(document.getElementById(`form-1065-nonrecurring-${year}-${incomeId}`)?.value) || 0;
                const form1065Depreciation = parseFloat(document.getElementById(`form-1065-depreciation-${year}-${incomeId}`)?.value) || 0;
                const form1065Depletion = parseFloat(document.getElementById(`form-1065-depletion-${year}-${incomeId}`)?.value) || 0;
                const form1065Amortization = parseFloat(document.getElementById(`form-1065-amortization-${year}-${incomeId}`)?.value) || 0;
                const form1065Mortgages = parseFloat(document.getElementById(`form-1065-mortgages-${year}-${incomeId}`)?.value) || 0;
                const form1065Travel = parseFloat(document.getElementById(`form-1065-travel-${year}-${incomeId}`)?.value) || 0;
                const percentOwnership = parseFloat(document.getElementById(`percent-ownership-${year}-${incomeId}`)?.value) || 0;
    
                // Validate percent ownership
                if (percentOwnership <= 0 || percentOwnership > 100) {
                    resultPanel.innerHTML = "<p style='color: red; background: #fee2e2; padding: 10px; border-radius: 5px; border: 1px solid red;'>Percent Ownership for ${year} must be between 0 and 100.</p>";
                    resultPanel.classList.remove("hidden");
                    printBtn.classList.add('hidden');
                    saveIncomeData(incomeId);
                    return;
                }
    
                // Calculate Schedule K-1 Subtotal (not adjusted by percent ownership)
                let scheduleK1Subtotal = scheduleK1Ordinary;
                scheduleK1Subtotal += scheduleK1NetRental; // Add net rental real estate; other net income (loss)
                scheduleK1Subtotal += scheduleK1Guaranteed; // Add guaranteed payments to partner
    
                // Calculate Form 1065 Adjustments Subtotal (before percent ownership)
                let form1065Adjustments = 0;
                form1065Adjustments += form1065Ordinary; // Add ordinary (income) loss from other partnerships
                form1065Adjustments += form1065Nonrecurring; // Add nonrecurring other (income) or loss
                form1065Adjustments += form1065Depreciation; // Add depreciation
                form1065Adjustments += form1065Depletion; // Add depletion
                form1065Adjustments += form1065Amortization; // Add amortization/casualty
                form1065Adjustments -= form1065Mortgages; // Subtract mortgages or notes payable in less than 1 year
                form1065Adjustments -= form1065Travel; // Subtract non-deductible travel and entertainment expenses
    
                // Apply percent ownership to Form 1065 adjustments only
                const adjustedForm1065 = (form1065Adjustments * percentOwnership) / 100;
    
                // Calculate total income for the year
                totalYearIncome = scheduleK1Subtotal + adjustedForm1065;
    
                totals[year] = {
                    scheduleK1Ordinary,
                    scheduleK1NetRental,
                    scheduleK1Guaranteed,
                    scheduleK1Subtotal,
                    form1065Ordinary,
                    form1065Nonrecurring,
                    form1065Depreciation,
                    form1065Depletion,
                    form1065Amortization,
                    form1065Mortgages,
                    form1065Travel,
                    form1065Adjustments,
                    adjustedForm1065: isNaN(adjustedForm1065) ? 0 : adjustedForm1065,
                    percentOwnership,
                    totalYearIncome
                };
            } else if (incomeType === 'irs-form-1120s') {
                const scheduleK1Ordinary = parseFloat(document.getElementById(`schedule-k1-ordinary-${year}-${incomeId}`)?.value) || 0;
                const scheduleK1NetRental = parseFloat(document.getElementById(`schedule-k1-net-rental-${year}-${incomeId}`)?.value) || 0;
                const form1120sNonrecurring = parseFloat(document.getElementById(`form-1120s-nonrecurring-${year}-${incomeId}`)?.value) || 0;
                const form1120sDepreciation = parseFloat(document.getElementById(`form-1120s-depreciation-${year}-${incomeId}`)?.value) || 0;
                const form1120sDepletion = parseFloat(document.getElementById(`form-1120s-depletion-${year}-${incomeId}`)?.value) || 0;
                const form1120sAmortization = parseFloat(document.getElementById(`form-1120s-amortization-${year}-${incomeId}`)?.value) || 0;
                const form1120sMortgages = parseFloat(document.getElementById(`form-1120s-mortgages-${year}-${incomeId}`)?.value) || 0;
                const form1120sTravel = parseFloat(document.getElementById(`form-1120s-travel-${year}-${incomeId}`)?.value) || 0;
                const percentOwnership = parseFloat(document.getElementById(`percent-ownership-${year}-${incomeId}`)?.value) || 0;
    
                // Validate percent ownership
                if (percentOwnership <= 0 || percentOwnership > 100) {
                    resultPanel.innerHTML = "<p style='color: red; background: #fee2e2; padding: 10px; border-radius: 5px; border: 1px solid red;'>Percent Ownership for ${year} must be between 0 and 100.</p>";
                    resultPanel.classList.remove("hidden");
                    printBtn.classList.add('hidden');
                    saveIncomeData(incomeId);
                    return;
                }
    
                // Calculate Schedule K-1 Subtotal (not adjusted by percent ownership)
                let scheduleK1Subtotal = scheduleK1Ordinary;
                scheduleK1Subtotal += scheduleK1NetRental; // Add net rental real estate; other net income (loss)
    
                // Calculate Form 1120S Adjustments Subtotal (before percent ownership)
                let form1120sAdjustments = 0;
                form1120sAdjustments += form1120sNonrecurring; // Add nonrecurring other (income) or loss
                form1120sAdjustments += form1120sDepreciation; // Add depreciation
                form1120sAdjustments += form1120sDepletion; // Add depletion
                form1120sAdjustments += form1120sAmortization; // Add amortization/casualty
                form1120sAdjustments -= form1120sMortgages; // Subtract mortgages or notes payable in less than 1 year
                form1120sAdjustments -= form1120sTravel; // Subtract non-deductible travel and entertainment expenses
    
                // Apply percent ownership to Form 1120S adjustments only
                const adjustedForm1120s = (form1120sAdjustments * percentOwnership) / 100;
    
                // Calculate total income for the year
                totalYearIncome = scheduleK1Subtotal + adjustedForm1120s;
    
                totals[year] = {
                    scheduleK1Ordinary,
                    scheduleK1NetRental,
                    scheduleK1Subtotal,
                    form1120sNonrecurring,
                    form1120sDepreciation,
                    form1120sDepletion,
                    form1120sAmortization,
                    form1120sMortgages,
                    form1120sTravel,
                    form1120sAdjustments,
                    adjustedForm1120s: isNaN(adjustedForm1120s) ? 0 : adjustedForm1120s,
                    percentOwnership,
                    totalYearIncome
                };
            } else if (incomeType === 'irs-form-1120') {
                const form1120TaxableIncome = parseFloat(document.getElementById(`form-1120-taxable-income-${year}-${incomeId}`).value) || 0;
                const form1120TotalTax = parseFloat(document.getElementById(`form-1120-total-tax-${year}-${incomeId}`).value) || 0;
                const form1120NonrecurringGains = parseFloat(document.getElementById(`form-1120-nonrecurring-gains-${year}-${incomeId}`).value) || 0;
                const form1120NonrecurringIncome = parseFloat(document.getElementById(`form-1120-nonrecurring-income-${year}-${incomeId}`).value) || 0;
                const form1120Depreciation = parseFloat(document.getElementById(`form-1120-depreciation-${year}-${incomeId}`).value) || 0;
                const form1120Amortization = parseFloat(document.getElementById(`form-1120-amortization-${year}-${incomeId}`).value) || 0;
                const form1120SpecialDeductions = parseFloat(document.getElementById(`form-1120-special-deductions-${year}-${incomeId}`).value) || 0;
                const form1120Mortgages = parseFloat(document.getElementById(`form-1120-mortgages-${year}-${incomeId}`).value) || 0;
                const form1120Travel = parseFloat(document.getElementById(`form-1120-travel-${year}-${incomeId}`).value) || 0;
                const dividendsPaid = parseFloat(document.getElementById(`dividends-paid-${year}-${incomeId}`).value) || 0;
    
                // Calculate Form 1120 Adjustments Subtotal
                let form1120Subtotal = form1120TaxableIncome;
                form1120Subtotal += form1120TotalTax; // Add total tax
                form1120Subtotal += form1120NonrecurringGains; // Add nonrecurring (gains)/losses
                form1120Subtotal += form1120NonrecurringIncome; // Add nonrecurring other (income) loss
                form1120Subtotal += form1120Depreciation; // Add depreciation
                form1120Subtotal += form1120Amortization; // Add amortization/casualty loss
                form1120Subtotal += form1120SpecialDeductions; // Add net operating loss and special deductions
                form1120Subtotal -= form1120Mortgages; // Subtract mortgages or notes payable in less than 1 year
                form1120Subtotal -= form1120Travel; // Subtract non-deductible travel and entertainment expenses
    
                // Subtract dividends paid to borrower
                totalYearIncome = form1120Subtotal - dividendsPaid;
    
                totals[year] = {
                    form1120TaxableIncome,
                    form1120TotalTax,
                    form1120NonrecurringGains,
                    form1120NonrecurringIncome,
                    form1120Depreciation,
                    form1120Amortization,
                    form1120SpecialDeductions,
                    form1120Mortgages,
                    form1120Travel,
                    form1120Subtotal,
                    dividendsPaid,
                    totalYearIncome
                };
            }
    
            // Add year-specific results to the output
            resultsHtml += `
                <div class="year-section">
                    <h4>${year} Income Details</h4>
                    <div class="result-table">
            `;
    
            if (incomeType === 'irs-form-1040') {
                // W-2 Income
                if (totals[year].w2 !== 0) {
                    resultsHtml += `
                        <div class="result-row">
                            <strong>W-2 Income:</strong>
                            <span>${formatter.format(totals[year].w2)}</span>
                        </div>
                    `;
                }
    
                // Schedule B – Interest and Ordinary Dividends
                const scheduleBTotal = totals[year].scheduleBInterest + totals[year].scheduleBDividends;
                if (scheduleBTotal !== 0) {
                    resultsHtml += `
                        <div class="result-row">
                            <strong>Schedule B – Interest and Ordinary Dividends:</strong>
                            <span>${formatter.format(scheduleBTotal)}</span>
                        </div>
                    `;
                }
    
                // Schedule C – Profit or Loss from Business: Sole Proprietorship
                if (totals[year].scheduleCSubtotal !== 0) {
                    resultsHtml += `
                        <div class="result-row">
                            <strong>Schedule C – Profit or Loss from Business: Sole Proprietorship:</strong>
                            <span>${formatter.format(totals[year].scheduleCSubtotal)}</span>
                        </div>
                    `;
                }
    
                // Schedule D – Capital Gains and Losses
                if (totals[year].scheduleDGains !== 0) {
                    resultsHtml += `
                        <div class="result-row">
                            <strong>Schedule D – Capital Gains and Losses:</strong>
                            <span>${formatter.format(totals[year].scheduleDGains)}</span>
                        </div>
                    `;
                }
    
                // Schedule F – Profit or Loss from Farming
                if (totals[year].scheduleFSubtotal !== 0) {
                    resultsHtml += `
                        <div class="result-row">
                            <strong>Schedule F – Profit or Loss from Farming:</strong>
                            <span>${formatter.format(totals[year].scheduleFSubtotal)}</span>
                        </div>
                    `;
                }
            } else if (incomeType === 'irs-form-1065') {
                // Schedule K-1 Subtotal
                if (totals[year].scheduleK1Subtotal !== 0) {
                    resultsHtml += `
                        <div class="result-row">
                            <strong>Schedule K-1 – Partner's Share of Income:</strong>
                            <span>${formatter.format(totals[year].scheduleK1Subtotal)}</span>
                        </div>
                    `;
                }
    
                // Form 1065 Adjustments Subtotal (after percent ownership)
                if (totals[year].form1065Adjustments !== 0) {
                    resultsHtml += `
                        <div class="result-row">
                            <strong>Form 1065 – Adjustments to Business Cash Flow:</strong>
                            <span>${formatter.format(totals[year].adjustedForm1065)}</span>
                        </div>
                    `;
                }
    
                // Percent Ownership
                resultsHtml += `
                    <div class="result-row">
                        <strong>Percent Ownership:</strong>
                        <span>${totals[year].percentOwnership}%</span>
                    </div>
                `;
            } else if (incomeType === 'irs-form-1120s') {
                // Schedule K-1 Subtotal
                if (totals[year].scheduleK1Subtotal !== 0) {
                    resultsHtml += `
                        <div class="result-row">
                            <strong>Schedule K-1 – Shareholder's Share of Income:</strong>
                            <span>${formatter.format(totals[year].scheduleK1Subtotal)}</span>
                        </div>
                    `;
                }
    
                // Form 1120S Adjustments Subtotal (after percent ownership)
                if (totals[year].form1120sAdjustments !== 0) {
                    resultsHtml += `
                        <div class="result-row">
                            <strong>Form 1120S – Adjustments to Business Cash Flow:</strong>
                            <span>${formatter.format(totals[year].adjustedForm1120s)}</span>
                        </div>
                    `;
                }
    
                // Percent Ownership
                resultsHtml += `
                    <div class="result-row">
                        <strong>Percent Ownership:</strong>
                        <span>${totals[year].percentOwnership}%</span>
                    </div>
                `;
            } else if (incomeType === 'irs-form-1120') {
                // Form 1120 Adjustments Subtotal (before dividends)
                if (totals[year].form1120Subtotal !== totals[year].form1120TaxableIncome) {
                    resultsHtml += `
                        <div class="result-row">
                            <strong>Form 1120 – Adjustments to Business Cash Flow:</strong>
                            <span>${formatter.format(totals[year].form1120Subtotal)}</span>
                        </div>
                    `;
                }
    
                // Dividends Paid to Borrower
                if (totals[year].dividendsPaid !== 0) {
                    resultsHtml += `
                        <div class="result-row">
                            <strong>Dividends Paid to Borrower:</strong>
                            <span>${formatter.format(totals[year].dividendsPaid)}</span>
                        </div>
                    `;
                }
            }
    
            // Always show Total Income for the year
            resultsHtml += `
                    <div class="result-row total-row">
                        <strong>Total Income for ${year}:</strong>
                        <span>${formatter.format(totals[year].totalYearIncome)}</span>
                    </div>
                </div>
            </div>
            `;
        });
    
        // Calculate average income if 2 years and display it prominently
        if (years.length === 2) {
            const year1 = years[0];
            const year2 = years[1];
            const averageIncome = (totals[year1].totalYearIncome + totals[year2].totalYearIncome) / 2;
            resultsHtml += `
                <div class="result-footer">
                    <div class="result-row average-row">
                        <strong>Average Yearly Income (${year1}-${year2}):</strong>
                        <span>${formatter.format(averageIncome)}</span>
                    </div>
                </div>
            `;
            totals.averageIncome = averageIncome;
        }
    
        // Output results
        resultPanel.innerHTML = resultsHtml;
        resultPanel.classList.remove("hidden");
    
        // Show the print button after successful computation
        printBtn.classList.remove('hidden');
    
        // Store the result data for printing
        resultPanel.dataset.inputs = JSON.stringify({
            incomeType,
            description,
            totals
        });
    
        // Save the data after computation
        saveIncomeData(incomeId);
    
        // Update the grand total
        updateGrandTotal();
    }
    function updateGrandTotal() {
        const allIncomes = [];
        for (let i = 1; i <= incomeCount; i++) {
            const incomePanel = document.getElementById(`result-${i}`);
            if (incomePanel && incomePanel.dataset.inputs && !incomePanel.classList.contains('hidden')) {
                const incomeData = JSON.parse(incomePanel.dataset.inputs);
                if (incomeData.totals) {
                    allIncomes.push(incomeData);
                }
            }
        }
    
        let grandTotal = 0;
        allIncomes.forEach(income => {
            if (years.length === 1) {
                // For 1 year, just use the total income for that year
                grandTotal += income.totals[years[0]].totalYearIncome;
            } else if (years.length === 2) {
                // For 2 years, calculate the average yearly income for this income source
                const year1Income = income.totals[years[0]].totalYearIncome;
                const year2Income = income.totals[years[1]].totalYearIncome;
                const averageYearlyIncome = (year1Income + year2Income) / 2;
                grandTotal += averageYearlyIncome;
            }
        });
    
        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
        resultsContainer.innerHTML = allIncomes.length > 0 ? `
            <div class="result-panel grand-total-panel">
                <div class="result-row average-row">
                    <strong>Grand Total of All Income Sources${years.length === 2 ? ' (Average Yearly Income)' : ''}:</strong>
                    <span>${formatter.format(grandTotal)}</span>
                </div>
            </div>
        ` : '';
    }

    function printIncome(incomeId) {
        // Collect all income sources with computed results for printing
        const allIncomes = [];
        for (let i = 1; i <= incomeCount; i++) {
            const incomePanel = document.getElementById(`result-${i}`);
            if (incomePanel && incomePanel.dataset.inputs && !incomePanel.classList.contains('hidden')) {
                const incomeData = JSON.parse(incomePanel.dataset.inputs);
                if (incomeData.totals) {
                    allIncomes.push(incomeData);
                }
            }
        }

        // If no income sources have computed results, show an alert and return
        if (allIncomes.length === 0) {
            alert('No income sources with computed results to print. Please compute results for at least one income source.');
            return;
        }

        const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

        // Calculate grand total for print
        let grandTotal = 0;
        allIncomes.forEach(income => {
            years.forEach(year => {
                grandTotal += income.totals[year].totalYearIncome;
            });
        });

        // Open a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Print Income Calculations</title>
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
                    h4 {
                        font-size: 1.3em;
                        margin-top: 20px;
                        margin-bottom: 10px;
                    }
                    .print-section {
                        border: 1px solid #ccc;
                        padding: 20px;
                        border-radius: 10px;
                        max-width: 600px;
                        margin: 0 auto;
                        page-break-after: always; /* Ensure each income source is on a new page */
                    }
                    .print-section:last-child {
                        page-break-after: auto; /* No page break after the last income source */
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
                    .grand-total {
                        border: 1px solid #ccc;
                        padding: 20px;
                        border-radius: 10px;
                        max-width: 600px;
                        margin: 20px auto;
                        text-align: center;
                    }
                    .grand-total p {
                        font-size: 1.2em;
                        margin: 5px 0;
                    }
                    .grand-total p strong {
                        display: inline-block;
                        width: 300px;
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
                <h2>Income Calculations</h2>
                ${allIncomes.map((income, index) => {
                    let html = `
                        <div class="print-section">
                            <h3>Income Source: ${income.description}</h3>
                            <p><strong>Income Type:</strong> ${income.incomeType === 'irs-form-1040' ? 'IRS Form 1040' : income.incomeType === 'irs-form-1065' ? 'IRS Form 1065' : income.incomeType === 'irs-form-1120s' ? 'IRS Form 1120S' : 'IRS Form 1120'}</p>
                    `;
                    years.forEach(year => {
                        const totals = income.totals[year];
                        html += `<h4>${year} Income Details</h4>`;

                        if (income.incomeType === 'irs-form-1040') {
                            // W-2 Income
                            if (totals.w2 !== 0) {
                                html += `
                                    <p><strong>W-2 Income:</strong> ${formatter.format(totals.w2)}</p>
                                `;
                            }

                            // Schedule B – Interest and Ordinary Dividends
                            const scheduleBTotal = totals.scheduleBInterest + totals.scheduleBDividends;
                            if (scheduleBTotal !== 0) {
                                html += `
                                    <p><strong>Schedule B – Interest and Ordinary Dividends:</strong> ${formatter.format(scheduleBTotal)}</p>
                                `;
                            }

                            // Schedule C – Profit or Loss from Business: Sole Proprietorship
                            if (totals.scheduleCSubtotal !== 0) {
                                html += `
                                    <p><strong>Schedule C – Profit or Loss from Business: Sole Proprietorship:</strong> ${formatter.format(totals.scheduleCSubtotal)}</p>
                                `;
                            }

                            // Schedule D – Capital Gains and Losses
                            if (totals.scheduleDGains !== 0) {
                                html += `
                                    <p><strong>Schedule D – Capital Gains and Losses:</strong> ${formatter.format(totals.scheduleDGains)}</p>
                                `;
                            }

                            // Schedule F – Profit or Loss from Farming
                            if (totals.scheduleFSubtotal !== 0) {
                                html += `
                                    <p><strong>Schedule F – Profit or Loss from Farming:</strong> ${formatter.format(totals.scheduleFSubtotal)}</p>
                                `;
                            }
                        } else if (income.incomeType === 'irs-form-1065') {
                            // Schedule K-1 Subtotal
                            if (totals.scheduleK1Subtotal !== 0) {
                                html += `
                                    <p><strong>Schedule K-1 – Partner's Share of Income:</strong> ${formatter.format(totals.scheduleK1Subtotal)}</p>
                                `;
                            }

                            // Form 1065 Adjustments Subtotal (after percent ownership)
                            if (totals.form1065Adjustments !== 0) {
                                html += `
                                    <p><strong>Form 1065 – Adjustments to Business Cash Flow:</strong> ${formatter.format(totals.adjustedForm1065)}</p>
                                `;
                            }

                            // Percent Ownership
                            html += `
                                <p><strong>Percent Ownership:</strong> ${totals.percentOwnership}%</p>
                            `;
                        } else if (income.incomeType === 'irs-form-1120s') {
                            // Schedule K-1 Subtotal
                            if (totals.scheduleK1Subtotal !== 0) {
                                html += `
                                    <p><strong>Schedule K-1 – Shareholder's Share of Income:</strong> ${formatter.format(totals.scheduleK1Subtotal)}</p>
                                `;
                            }

                            // Form 1120S Adjustments Subtotal (after percent ownership)
                            if (totals.form1120sAdjustments !== 0) {
                                html += `
                                    <p><strong>Form 1120S – Adjustments to Business Cash Flow:</strong> ${formatter.format(totals.adjustedForm1120s)}</p>
                                `;
                            }

                            // Percent Ownership
                            html += `
                                <p><strong>Percent Ownership:</strong> ${totals.percentOwnership}%</p>
                            `;
                        } else if (income.incomeType === 'irs-form-1120') {
                            // Form 1120 Adjustments Subtotal (before dividends)
                            if (totals.form1120Subtotal !== totals.form1120TaxableIncome) {
                                html += `
                                    <p><strong>Form 1120 – Adjustments to Business Cash Flow:</strong> ${formatter.format(totals.form1120Subtotal)}</p>
                                `;
                            }

                            // Dividends Paid to Borrower
                            if (totals.dividendsPaid !== 0) {
                                html += `
                                    <p><strong>Dividends Paid to Borrower:</strong> ${formatter.format(totals.dividendsPaid)}</p>
                                `;
                            }
                        }

                        // Always show Total Income for the year
                        html += `
                            <p><strong>Total Income for ${year}:</strong> ${formatter.format(totals.totalYearIncome)}</p>
                        `;
                    });

                    if (years.length === 2) {
                        html += `
                            <p><strong>Average Income (${years[0]}-${years[1]}):</strong> ${formatter.format(income.totals.averageIncome)}</p>
                        `;
                    }

                    html += `
                            <div class="print-footer">Calculated by Hank's Tools</div>
                        </div>
                    `;
                    return html;
                }).join('')}
                <div class="grand-total">
                    <p><strong>Grand Total of All Income Sources:</strong> ${formatter.format(grandTotal)}</p>
                </div>
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