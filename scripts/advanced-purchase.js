document.addEventListener('DOMContentLoaded', () => {
    // Bind event listeners after DOM is fully loaded
    const homeValueInput = document.getElementById("home-value");
    const downPaymentInput = document.getElementById("down-payment");
    const taxTypeSelect = document.getElementById("tax-type");
    const loanTypeSelect = document.getElementById("loan-type");
    const computeBtn = document.getElementById("compute-btn");
    const resetBtn = document.getElementById("reset-btn");

    // Event listeners for dynamic updates
    homeValueInput.addEventListener("input", updateLoanAmount);
    downPaymentInput.addEventListener("input", updateLoanAmount);
    taxTypeSelect.addEventListener("change", toggleTaxFields);
    loanTypeSelect.addEventListener("change", toggleInterestOnly);
    computeBtn.addEventListener("click", calculateAdvancedPurchase);
    resetBtn.addEventListener("click", resetCalculator);

    // Initial setup
    toggleTaxFields();
    toggleInterestOnly();
});

function toggleTaxFields() {
    const taxType = document.getElementById("tax-type").value;
    const taxRateGroup = document.getElementById("tax-rate-group");
    const taxMonthlyGroup = document.getElementById("tax-monthly-group");

    if (taxType === "rate") {
        taxRateGroup.classList.remove("hidden");
        taxMonthlyGroup.classList.add("hidden");
        document.getElementById("tax-rate").required = true;
        document.getElementById("tax-monthly").required = false;
    } else {
        taxRateGroup.classList.add("hidden");
        taxMonthlyGroup.classList.remove("hidden");
        document.getElementById("tax-rate").required = false;
        document.getElementById("tax-monthly").required = true;
    }
}

function toggleInterestOnly() {
    const loanType = document.getElementById("loan-type").value;
    const interestOnlyPeriodGroup = document.getElementById("interest-only-period-group");

    if (loanType === "interest-only") {
        interestOnlyPeriodGroup.classList.remove("hidden");
        document.getElementById("interest-only-period").required = true;
    } else {
        interestOnlyPeriodGroup.classList.add("hidden");
        document.getElementById("interest-only-period").required = false;
    }
}

function updateLoanAmount() {
    const homeValue = parseFloat(document.getElementById("home-value").value);
    const downPaymentPercent = parseFloat(document.getElementById("down-payment").value);

    if (!isNaN(homeValue) && !isNaN(downPaymentPercent)) {
        const downPayment = (downPaymentPercent / 100) * homeValue;
        const loanAmount = homeValue - downPayment;
        document.getElementById("loan-amount").value = loanAmount.toFixed(2);
    }
}

function calculateAdvancedPurchase() {
    // Get input values
    const homeValue = parseFloat(document.getElementById("home-value").value);
    const downPaymentPercent = parseFloat(document.getElementById("down-payment").value);
    const loanAmount = parseFloat(document.getElementById("loan-amount").value);
    const interestRate = parseFloat(document.getElementById("interest-rate").value) / 100 / 12; // Monthly rate
    const loanTerm = parseInt(document.getElementById("loan-term").value) * 12; // Total months
    const taxType = document.getElementById("tax-type").value;
    const taxRate = taxType === "rate" ? parseFloat(document.getElementById("tax-rate").value) / 100 / 12 : 0; // Monthly tax rate
    const taxMonthly = taxType === "monthly" ? parseFloat(document.getElementById("tax-monthly").value) : 0;
    const insurance = parseFloat(document.getElementById("insurance").value);
    const hoa = parseFloat(document.getElementById("hoa").value);
    const pmi = document.getElementById("pmi-group").classList.contains("hidden") ? 0 : parseFloat(document.getElementById("pmi").value) || 0;
    const loanType = document.getElementById("loan-type").value;
    const interestOnlyPeriod = loanType === "interest-only" ? parseInt(document.getElementById("interest-only-period").value) * 12 : 0; // Months

    const resultPanel = document.getElementById("result");
    const resetBtn = document.getElementById("reset-btn");

    // Validate inputs
    if (isNaN(homeValue) || isNaN(downPaymentPercent) || isNaN(loanAmount) || isNaN(interestRate) || isNaN(loanTerm) ||
        (taxType === "rate" && isNaN(taxRate)) || (taxType === "monthly" && isNaN(taxMonthly)) ||
        isNaN(insurance) || isNaN(hoa) || (loanType === "interest-only" && isNaN(interestOnlyPeriod))) {
        resultPanel.innerHTML = "<p style='color: red; background: #fee2e2; padding: 10px; border-radius: 5px; border: 1px solid red;'>Please enter valid numbers in all required fields.</p>";
        resultPanel.classList.remove("hidden");
        resetBtn.classList.remove("hidden");
        return;
    }

    // Calculate LTV and show PMI if > 80%
    const ltv = (loanAmount / homeValue) * 100;
    if (ltv > 80) {
        document.getElementById("pmi-group").classList.remove("hidden");
        resultPanel.innerHTML = "<p style='color: red; background: #fee2e2; padding: 10px; border-radius: 5px; border: 1px solid red;'>LTV exceeds 80%. PMI may be required.</p>";
        resultPanel.classList.remove("hidden");
        resetBtn.classList.remove("hidden");
    } else {
        document.getElementById("pmi-group").classList.add("hidden");
    }

    // Calculate taxes
    const monthlyTaxes = taxType === "rate" ? (homeValue * taxRate) : taxMonthly;

    // Calculate payments
    let interestOnlyPayment = 0;
    let amortizedPayment = 0;
    let totalMonthlyPaymentIO = 0;
    let totalMonthlyPaymentPostIO = 0;

    if (loanType === "amortized") {
        // Amortized loan
        amortizedPayment = (loanAmount * interestRate * Math.pow(1 + interestRate, loanTerm)) / 
                           (Math.pow(1 + interestRate, loanTerm) - 1);
        totalMonthlyPaymentPostIO = amortizedPayment + monthlyTaxes + insurance + hoa + pmi;
    } else {
        // Interest-only loan
        interestOnlyPayment = loanAmount * interestRate; // Interest-only payment
        totalMonthlyPaymentIO = interestOnlyPayment + monthlyTaxes + insurance + hoa + pmi;

        // Amortized payment for remaining term
        const remainingTerm = loanTerm - interestOnlyPeriod;
        if (remainingTerm > 0) {
            amortizedPayment = (loanAmount * interestRate * Math.pow(1 + interestRate, remainingTerm)) / 
                               (Math.pow(1 + interestRate, remainingTerm) - 1);
            totalMonthlyPaymentPostIO = amortizedPayment + monthlyTaxes + insurance + hoa + pmi;
        } else {
            totalMonthlyPaymentPostIO = totalMonthlyPaymentIO; // If no remaining term, keep IO payment
        }
    }

    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    // Simplified output
    resultPanel.innerHTML = `
        ${ltv > 80 ? "<p style='color: red; background: #fee2e2; padding: 10px; border-radius: 5px; border: 1px solid red;'>LTV exceeds 80%. PMI may be required.</p>" : ""}
        <div class="result-card">
            <strong>LTV</strong>
            <span>${ltv.toFixed(2)}%</span>
        </div>
        ${loanType === "interest-only" ? `
        <div class="result-card">
            <strong>Total Payment (ITIA)</strong>
            <span>${formatter.format(totalMonthlyPaymentIO)}</span>
        </div>
        <div class="result-card">
            <strong>Interest Only Payment</strong>
            <span>${formatter.format(interestOnlyPayment)}</span>
        </div>
        <div class="result-card">
            <strong>Total Payment (PITIA after IO)</strong>
            <span>${formatter.format(totalMonthlyPaymentPostIO)}</span>
        </div>
        <div class="result-card">
            <strong>Principal & Interest (after IO)</strong>
            <span>${formatter.format(amortizedPayment)}</span>
        </div>
        <div class="result-card">
            <strong>Monthly Taxes</strong>
            <span>${formatter.format(monthlyTaxes)}</span>
        </div>
        <div class="result-card">
            <strong>Monthly Insurance</strong>
            <span>${formatter.format(insurance)}</span>
        </div>
        ${hoa > 0 ? `
        <div class="result-card">
            <strong>Monthly HOA</strong>
            <span>${formatter.format(hoa)}</span>
        </div>` : ''}
        ${pmi > 0 ? `
        <div class="result-card">
            <strong>Monthly PMI</strong>
            <span>${formatter.format(pmi)}</span>
        </div>` : ''}` : `
        <div class="result-card">
            <strong>Total Payment (PITIA)</strong>
            <span>${formatter.format(totalMonthlyPaymentPostIO)}</span>
        </div>
        <div class="result-card">
            <strong>Principal & Interest</strong>
            <span>${formatter.format(amortizedPayment)}</span>
        </div>
        <div class="result-card">
            <strong>Monthly Taxes</strong>
            <span>${formatter.format(monthlyTaxes)}</span>
        </div>
        <div class="result-card">
            <strong>Monthly Insurance</strong>
            <span>${formatter.format(insurance)}</span>
        </div>
        ${hoa > 0 ? `
        <div class="result-card">
            <strong>Monthly HOA</strong>
            <span>${formatter.format(hoa)}</span>
        </div>` : ''}
        ${pmi > 0 ? `
        <div class="result-card">
            <strong>Monthly PMI</strong>
            <span>${formatter.format(pmi)}</span>
        </div>` : ''}`}
    `;
    resultPanel.classList.remove("hidden");
    resetBtn.classList.remove("hidden");
}

function resetCalculator() {
    document.getElementById("home-value").value = "";
    document.getElementById("down-payment").value = "";
    document.getElementById("loan-amount").value = "";
    document.getElementById("interest-rate").value = "";
    document.getElementById("loan-term").value = "";
    document.getElementById("tax-type").value = "rate";
    document.getElementById("tax-rate").value = "";
    document.getElementById("tax-monthly").value = "";
    document.getElementById("insurance").value = "";
    document.getElementById("hoa").value = "";
    document.getElementById("pmi").value = "";
    document.getElementById("loan-type").value = "amortized";
    document.getElementById("interest-only-period").value = "";
    const resultPanel = document.getElementById("result");
    resultPanel.innerHTML = "";
    resultPanel.classList.add("hidden");
    document.getElementById("reset-btn").classList.add("hidden");
    document.getElementById("tax-rate-group").classList.remove("hidden");
    document.getElementById("tax-monthly-group").classList.add("hidden");
    document.getElementById("pmi-group").classList.add("hidden");
    document.getElementById("interest-only-period-group").classList.add("hidden");
}