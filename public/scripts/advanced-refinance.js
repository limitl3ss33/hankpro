document.addEventListener('DOMContentLoaded', () => {
    // Bind event listeners after DOM is fully loaded
    const taxTypeSelect = document.getElementById("tax-type");
    const loanTypeSelect = document.getElementById("loan-type");
    const computeBtn = document.getElementById("compute-btn");
    const resetBtn = document.getElementById("reset-btn");
    const advancedOptionsBtn = document.getElementById("advanced-options-btn");

    // Event listeners for dynamic updates
    taxTypeSelect.addEventListener("change", toggleTaxFields);
    loanTypeSelect.addEventListener("change", toggleInterestOnly);
    computeBtn.addEventListener("click", calculateAdvancedRefinance);
    resetBtn.addEventListener("click", resetCalculator);
    advancedOptionsBtn.addEventListener("click", toggleAdvancedOptions);

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

function toggleAdvancedOptions() {
    const advancedOptions = document.getElementById("advanced-options");
    const advancedOptionsPoints = document.getElementById("advanced-options-points");
    const advancedOptionsTitleFees = document.getElementById("advanced-options-title-fees");
    advancedOptions.classList.toggle("hidden");
    advancedOptionsPoints.classList.toggle("hidden");
    advancedOptionsTitleFees.classList.toggle("hidden");
}

function calculateAdvancedRefinance() {
    // Get input values
    const homeValue = parseFloat(document.getElementById("home-value").value);
    const currentLoanAmount = parseFloat(document.getElementById("current-loan-amount").value);
    const newLoanAmount = parseFloat(document.getElementById("new-loan-amount").value);
    const interestRate = parseFloat(document.getElementById("interest-rate").value) / 100 / 12; // Monthly rate
    const loanTerm = parseInt(document.getElementById("loan-term").value) * 12; // Total months
    const taxType = document.getElementById("tax-type").value;
    const taxRate = taxType === "rate" ? parseFloat(document.getElementById("tax-rate").value) / 100 / 12 : 0; // Monthly tax rate
    const taxMonthly = taxType === "monthly" ? parseFloat(document.getElementById("tax-monthly").value) : 0;
    const insurance = parseFloat(document.getElementById("insurance").value);
    const hoa = parseFloat(document.getElementById("hoa").value);
    const refinanceType = document.getElementById("refinance-type").value;
    const loanType = document.getElementById("loan-type").value;
    const interestOnlyPeriod = loanType === "interest-only" ? parseInt(document.getElementById("interest-only-period").value) * 12 : 0; // Months
    const underwritingFee = parseFloat(document.getElementById("underwriting-fee").value) || 0;
    const points = parseFloat(document.getElementById("points").value) || 0; // Positive or negative percentage
    const titleFees = parseFloat(document.getElementById("title-fees").value) || 0;

    const resultPanel = document.getElementById("result");
    const resetBtn = document.getElementById("reset-btn");

    // Validate inputs
    if (isNaN(homeValue) || isNaN(currentLoanAmount) || isNaN(newLoanAmount) || isNaN(interestRate) || isNaN(loanTerm) ||
        (taxType === "rate" && isNaN(taxRate)) || (taxType === "monthly" && isNaN(taxMonthly)) ||
        isNaN(insurance) || isNaN(hoa) || (loanType === "interest-only" && isNaN(interestOnlyPeriod))) {
        resultPanel.innerHTML = "<p style='color: red; background: #fee2e2; padding: 10px; border-radius: 5px; border: 1px solid red;'>Please enter valid numbers in all required fields.</p>";
        resultPanel.classList.remove("hidden");
        resetBtn.classList.remove("hidden");
        return;
    }

    // Calculate LTV
    const ltv = (newLoanAmount / homeValue) * 100;

    // Enforce 80% LTV cap for Cash-Out
    if (refinanceType === "cash-out" && ltv > 80) {
        resultPanel.innerHTML = "<p style='color: red; background: #fee2e2; padding: 10px; border-radius: 5px; border: 1px solid red;'>LTV exceeds 80% for Cash-Out refinance. Maximum allowed LTV is 80%.</p>";
        resultPanel.classList.remove("hidden");
        resetBtn.classList.remove("hidden");
        return;
    }

    // Calculate taxes
    const monthlyTaxes = taxType === "rate" ? (homeValue * taxRate) : taxMonthly;

    // Calculate P&I or Interest-Only payment
    let piPayment = 0;
    let piPaymentPostIO = 0;
    let totalMonthlyPayment = 0;
    let totalMonthlyPaymentPostIO = 0;
    let totalInterest = 0;

    if (loanType === "amortized") {
        // Amortized loan
        piPayment = (newLoanAmount * interestRate * Math.pow(1 + interestRate, loanTerm)) / 
                    (Math.pow(1 + interestRate, loanTerm) - 1);
        totalMonthlyPayment = piPayment + monthlyTaxes + insurance + hoa;
        totalInterest = (totalMonthlyPayment * loanTerm) - newLoanAmount;
    } else {
        // Interest-only loan
        piPayment = newLoanAmount * interestRate; // Interest-only payment
        totalMonthlyPayment = piPayment + monthlyTaxes + insurance + hoa;

        // Amortized payment for remaining term
        const remainingTerm = loanTerm - interestOnlyPeriod;
        if (remainingTerm > 0) {
            piPaymentPostIO = (newLoanAmount * interestRate * Math.pow(1 + interestRate, remainingTerm)) / 
                              (Math.pow(1 + interestRate, remainingTerm) - 1);
            totalMonthlyPaymentPostIO = piPaymentPostIO + monthlyTaxes + insurance + hoa;
            totalInterest = (piPayment * interestOnlyPeriod) + (totalMonthlyPaymentPostIO * remainingTerm) - newLoanAmount;
        } else {
            totalMonthlyPaymentPostIO = totalMonthlyPayment;
            totalInterest = (totalMonthlyPayment * loanTerm) - newLoanAmount;
        }
    }

    // Calculate Total Loan Cost
    const pointsCost = (points / 100) * newLoanAmount; // Points as a percentage of new loan amount
    const totalLoanCost = underwritingFee + pointsCost + titleFees;

    // Calculate Total Cash Out for Cash-Out refinance
    let totalCashOut = 0;
    if (refinanceType === "cash-out") {
        totalCashOut = newLoanAmount - currentLoanAmount - totalLoanCost;
    }

    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    // Output results
    resultPanel.innerHTML = `
        <div class="result-card">
            <strong>LTV</strong>
            <span>${ltv.toFixed(2)}%</span>
        </div>
        ${loanType === "interest-only" ? `
        <div class="result-card">
            <strong>Monthly Total Payment (IO)</strong>
            <span>${formatter.format(totalMonthlyPayment)}</span>
        </div>
        <div class="result-card">
            <strong>Interest Only</strong>
            <span>${formatter.format(piPayment)}</span>
        </div>
        <div class="result-card">
            <strong>Monthly Total Payment (Post-IO)</strong>
            <span>${formatter.format(totalMonthlyPaymentPostIO)}</span>
        </div>
        <div class="result-card">
            <strong>P&I (Post-IO)</strong>
            <span>${formatter.format(piPaymentPostIO)}</span>
        </div>` : `
        <div class="result-card">
            <strong>Monthly Total Payment</strong>
            <span>${formatter.format(totalMonthlyPayment)}</span>
        </div>
        <div class="result-card">
            <strong>P&I</strong>
            <span>${formatter.format(piPayment)}</span>
        </div>`}
        <div class="result-card">
            <strong>Taxes</strong>
            <span>${formatter.format(monthlyTaxes)}</span>
        </div>
        <div class="result-card">
            <strong>Insurance</strong>
            <span>${formatter.format(insurance)}</span>
        </div>
        ${hoa > 0 ? `
        <div class="result-card">
            <strong>HOA</strong>
            <span>${formatter.format(hoa)}</span>
        </div>` : ''}
        ${refinanceType === "cash-out" ? `
        <div class="result-card">
            <strong>Total Cash Out</strong>
            <span>${formatter.format(totalCashOut)}</span>
        </div>` : ''}
        <div class="result-card">
            <strong>Total Interest Over the Life of the Loan</strong>
            <span>${formatter.format(totalInterest)}</span>
        </div>
        ${(underwritingFee !== 0 || points !== 0 || titleFees !== 0) ? `
        <div class="result-card">
            <strong>Total Loan Cost</strong>
            <span>${formatter.format(totalLoanCost)}</span>
        </div>` : ''}
    `;
    resultPanel.classList.remove("hidden");
    resetBtn.classList.remove("hidden");
}

function resetCalculator() {
    document.getElementById("home-value").value = "";
    document.getElementById("current-loan-amount").value = "";
    document.getElementById("new-loan-amount").value = "";
    document.getElementById("interest-rate").value = "";
    document.getElementById("loan-term").value = "";
    document.getElementById("tax-type").value = "rate";
    document.getElementById("tax-rate").value = "";
    document.getElementById("tax-monthly").value = "";
    document.getElementById("insurance").value = "";
    document.getElementById("hoa").value = "";
    document.getElementById("refinance-type").value = "rate-term";
    document.getElementById("loan-type").value = "amortized";
    document.getElementById("interest-only-period").value = "";
    document.getElementById("underwriting-fee").value = "";
    document.getElementById("points").value = "";
    document.getElementById("title-fees").value = "";
    const resultPanel = document.getElementById("result");
    resultPanel.innerHTML = "";
    resultPanel.classList.add("hidden");
    document.getElementById("reset-btn").classList.add("hidden");
    document.getElementById("tax-rate-group").classList.remove("hidden");
    document.getElementById("tax-monthly-group").classList.add("hidden");
    document.getElementById("interest-only-period-group").classList.add("hidden");
    document.getElementById("advanced-options").classList.add("hidden");
    document.getElementById("advanced-options-points").classList.add("hidden");
    document.getElementById("advanced-options-title-fees").classList.add("hidden");
}