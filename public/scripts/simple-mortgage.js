function calculateSimpleMortgage() {
    const loanAmount = parseFloat(document.getElementById("loan-amount").value);
    const interestRate = parseFloat(document.getElementById("interest-rate").value) / 100 / 12;
    const loanTerm = parseInt(document.getElementById("loan-term").value) * 12;

    const resultPanel = document.getElementById("result");
    const resetBtn = document.getElementById("reset-btn");

    if (isNaN(loanAmount) || isNaN(interestRate) || isNaN(loanTerm)) {
        resultPanel.innerHTML = "<p>Please enter valid numbers in all fields.</p>";
        resultPanel.classList.remove("hidden");
        resetBtn.classList.remove("hidden");
        return;
    }

    const monthlyPayment = (loanAmount * interestRate * Math.pow(1 + interestRate, loanTerm)) / 
                          (Math.pow(1 + interestRate, loanTerm) - 1);
    const totalCost = monthlyPayment * loanTerm;
    const totalInterest = totalCost - loanAmount;

    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    resultPanel.innerHTML = `
        <div class="result-card">
            <strong>Monthly Payment</strong>
            <span>${formatter.format(monthlyPayment)}</span>
        </div>
        <div class="result-card">
            <strong>Total Cost</strong>
            <span>${formatter.format(totalCost)}</span>
        </div>
        <div class="result-card">
            <strong>Total Interest</strong>
            <span>${formatter.format(totalInterest)}</span>
        </div>
    `;
    resultPanel.classList.remove("hidden");
    resetBtn.classList.remove("hidden");
}

function resetCalculator() {
    document.getElementById("loan-amount").value = "";
    document.getElementById("interest-rate").value = "";
    document.getElementById("loan-term").value = "";
    const resultPanel = document.getElementById("result");
    resultPanel.innerHTML = "";
    resultPanel.classList.add("hidden");
    document.getElementById("reset-btn").classList.add("hidden");
}