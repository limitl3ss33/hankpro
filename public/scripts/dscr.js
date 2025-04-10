document.addEventListener('DOMContentLoaded', () => {
    // Bind event listeners after DOM is fully loaded
    const loanTypeSelect = document.getElementById("loan-type");
    const computeBtn = document.getElementById("compute-btn");
    const resetBtn = document.getElementById("reset-btn");

    // Event listeners for dynamic updates
    loanTypeSelect.addEventListener("change", toggleInterestOnly);
    computeBtn.addEventListener("click", calculateDSCR);
    resetBtn.addEventListener("click", resetCalculator);

    // Initial setup
    toggleInterestOnly();
});

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

function calculateDSCR() {
    // Get input values
    const rent = parseFloat(document.getElementById("rent").value);
    const loanAmount = parseFloat(document.getElementById("loan-amount").value);
    const interestRate = parseFloat(document.getElementById("interest-rate").value) / 100 / 12; // Monthly rate
    const loanTerm = parseInt(document.getElementById("loan-term").value) * 12; // Total months
    const taxes = parseFloat(document.getElementById("taxes").value);
    const insurance = parseFloat(document.getElementById("insurance").value);
    const hoa = parseFloat(document.getElementById("hoa").value);
    const loanType = document.getElementById("loan-type").value;
    const interestOnlyPeriod = loanType === "interest-only" ? parseInt(document.getElementById("interest-only-period").value) * 12 : 0; // Months

    const resultPanel = document.getElementById("result");
    const resetBtn = document.getElementById("reset-btn");

    // Validate inputs
    if (isNaN(rent) || isNaN(loanAmount) || isNaN(interestRate) || isNaN(loanTerm) ||
        isNaN(taxes) || isNaN(insurance) || isNaN(hoa) || (loanType === "interest-only" && isNaN(interestOnlyPeriod))) {
        resultPanel.innerHTML = "<p style='color: red; background: #fee2e2; padding: 10px; border-radius: 5px; border: 1px solid red;'>Please enter valid numbers in all required fields.</p>";
        resultPanel.classList.remove("hidden");
        resetBtn.classList.remove("hidden");
        return;
    }

    // Calculate P&I or Interest-Only payment
    let piPayment = 0;
    let piPaymentPostIO = 0;
    let totalMonthlyPayment = 0;
    let totalMonthlyPaymentPostIO = 0;

    if (loanType === "amortized") {
        // Amortized loan
        piPayment = (loanAmount * interestRate * Math.pow(1 + interestRate, loanTerm)) / 
                    (Math.pow(1 + interestRate, loanTerm) - 1);
        totalMonthlyPayment = piPayment + taxes + insurance + hoa;
    } else {
        // Interest-only loan
        piPayment = loanAmount * interestRate; // Interest-only payment
        totalMonthlyPayment = piPayment + taxes + insurance + hoa;

        // Amortized payment for remaining term
        const remainingTerm = loanTerm - interestOnlyPeriod;
        if (remainingTerm > 0) {
            piPaymentPostIO = (loanAmount * interestRate * Math.pow(1 + interestRate, remainingTerm)) / 
                              (Math.pow(1 + interestRate, remainingTerm) - 1);
            totalMonthlyPaymentPostIO = piPaymentPostIO + taxes + insurance + hoa;
        } else {
            totalMonthlyPaymentPostIO = totalMonthlyPayment; // If no remaining term, keep IO payment
        }
    }

    // Calculate DSCR (Monthly Rent / Total Payment)
    const dscr = rent / totalMonthlyPayment;

    // Calculate Cash Flow (Monthly Rent - Total Payment)
    const cashFlow = rent - totalMonthlyPayment;

    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    // Output results
    resultPanel.innerHTML = `
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
            <span>${formatter.format(taxes)}</span>
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
        <div class="result-card">
            <strong>DSCR</strong>
            <span>${dscr.toFixed(2)}</span>
        </div>
        <div class="result-card">
            <strong>${cashFlow >= 0 ? 'Positive' : 'Negative'} Cash Flow</strong>
            <span>${formatter.format(Math.abs(cashFlow))}/mo</span>
        </div>
    `;
    resultPanel.classList.remove("hidden");
    resetBtn.classList.remove("hidden");
}

function resetCalculator() {
    document.getElementById("rent").value = "";
    document.getElementById("loan-amount").value = "";
    document.getElementById("interest-rate").value = "";
    document.getElementById("loan-term").value = "";
    document.getElementById("taxes").value = "";
    document.getElementById("insurance").value = "";
    document.getElementById("hoa").value = "";
    document.getElementById("loan-type").value = "amortized";
    document.getElementById("interest-only-period").value = "";
    const resultPanel = document.getElementById("result");
    resultPanel.innerHTML = "";
    resultPanel.classList.add("hidden");
    document.getElementById("reset-btn").classList.add("hidden");
    document.getElementById("interest-only-period-group").classList.add("hidden");
}