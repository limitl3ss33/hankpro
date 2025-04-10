document.addEventListener('DOMContentLoaded', () => {
    const { jsPDF } = window.jspdf;
    const generateLetterBtn = document.getElementById('generate-letter-btn');
    const resetFormBtn = document.getElementById('reset-form-btn');
    const letterPreview = document.getElementById('letter-preview');
    const companyLogoInput = document.getElementById('company-logo');
    const purchasePriceInput = document.getElementById('purchase-price');
    const downPaymentDollarInput = document.getElementById('down-payment-dollar');
    const downPaymentPercentInput = document.getElementById('down-payment-percent');
    const loanAmountInput = document.getElementById('loan-amount');
    const rateInput = document.getElementById('rate');

    // Define formatters at a higher scope
    const formatter = new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 2, // Ensure two decimal places
        maximumFractionDigits: 2
    });
    const rateFormatter = new Intl.NumberFormat('en-US', { 
        style: 'percent', 
        minimumFractionDigits: 3, // Ensure three decimal places
        maximumFractionDigits: 3 
    });

    // Format phone number
    function formatPhoneNumber(phone) {
        const cleaned = ('' + phone).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return `${match[1]}-${match[2]}-${match[3]}`;
        }
        return phone;
    }

    // Form inputs to save in local storage
    const formInputs = [
        'officer-name', 'officer-position', 'officer-nmls', 'officer-email', 'officer-phone',
        'company-name', 'company-nmls', 'client-name', 'property-address', 'purchase-price',
        'down-payment-dollar', 'down-payment-percent', 'loan-amount', 'rate'
    ];

    // Load saved inputs from local storage
    formInputs.forEach(id => {
        const input = document.getElementById(id);
        const savedValue = localStorage.getItem(id);
        if (savedValue) {
            input.value = savedValue;
        }
        input.addEventListener('input', () => {
            localStorage.setItem(id, input.value);
        });
    });

    // Handle logo separately since it's a file input
    companyLogoInput.addEventListener('change', () => {
        if (companyLogoInput.files[0]) {
            localStorage.setItem('company-logo', 'has-logo'); // Placeholder to indicate a logo was selected
        } else {
            localStorage.removeItem('company-logo');
        }
    });

    // Reset form and local storage
    resetFormBtn.addEventListener('click', () => {
        formInputs.forEach(id => {
            const input = document.getElementById(id);
            input.value = '';
            localStorage.removeItem(id);
        });
        companyLogoInput.value = '';
        localStorage.removeItem('company-logo');
        letterPreview.innerHTML = '';
        letterPreview.classList.add('hidden');
    });

    // Prevent negative numbers and cap down payment at 100% of purchase price
    const numericInputs = [purchasePriceInput, downPaymentDollarInput, downPaymentPercentInput, loanAmountInput];
    numericInputs.forEach(input => {
        input.addEventListener('input', () => {
            const purchasePrice = parseFloat(purchasePriceInput.value) || 0;
            if (parseFloat(input.value) < 0) {
                input.value = 0;
            }
            if (input === downPaymentDollarInput || input === downPaymentPercentInput) {
                let downPaymentDollar = parseFloat(downPaymentDollarInput.value) || 0;
                let downPaymentPercent = parseFloat(downPaymentPercentInput.value) || 0;
                if (input === downPaymentDollarInput && downPaymentDollar > purchasePrice) {
                    downPaymentDollar = purchasePrice;
                    downPaymentDollarInput.value = downPaymentDollar;
                    downPaymentPercent = 100;
                    downPaymentPercentInput.value = downPaymentPercent.toFixed(2);
                } else if (input === downPaymentPercentInput && downPaymentPercent > 100) {
                    downPaymentPercent = 100;
                    downPaymentPercentInput.value = downPaymentPercent.toFixed(2);
                    downPaymentDollar = purchasePrice;
                    downPaymentDollarInput.value = downPaymentDollar;
                }
            }
            updateDownPaymentAndLoanAmount(input === downPaymentDollarInput ? 'dollar' : 'percent');
        });
    });

    // Auto-calculate loan amount and sync down payment inputs
    function updateDownPaymentAndLoanAmount(source) {
        const purchasePrice = parseFloat(purchasePriceInput.value) || 0;
        let downPaymentDollar = parseFloat(downPaymentDollarInput.value) || 0;
        let downPaymentPercent = parseFloat(downPaymentPercentInput.value) || 0;

        if (purchasePrice > 0) {
            if (source === 'dollar' && downPaymentDollar >= 0) {
                downPaymentPercent = (downPaymentDollar / purchasePrice) * 100;
                downPaymentPercentInput.value = downPaymentPercent.toFixed(2);
            } else if (source === 'percent' && downPaymentPercent >= 0) {
                downPaymentDollar = purchasePrice * (downPaymentPercent / 100);
                downPaymentDollarInput.value = downPaymentDollar.toFixed(2);
            }
            if (downPaymentDollar >= 0) {
                loanAmountInput.value = purchasePrice - downPaymentDollar;
            }
        }
    }

    purchasePriceInput.addEventListener('input', () => updateDownPaymentAndLoanAmount('dollar'));
    downPaymentDollarInput.addEventListener('input', () => updateDownPaymentAndLoanAmount('dollar'));
    downPaymentPercentInput.addEventListener('input', () => updateDownPaymentAndLoanAmount('percent'));

    // Remove red box for valid 3-decimal rates
    rateInput.addEventListener('input', () => {
        const value = parseFloat(rateInput.value);
        if (value >= 0 && value <= 100) {
            rateInput.setCustomValidity('');
        } else {
            rateInput.setCustomValidity('Rate must be between 0 and 100.');
        }
    });

    generateLetterBtn.addEventListener('click', () => {
        // Get loan officer details
        const officerName = document.getElementById('officer-name').value.trim();
        const officerPosition = document.getElementById('officer-position').value.trim() || 'Loan Officer';
        const officerNMLS = document.getElementById('officer-nmls').value.trim();
        const officerEmail = document.getElementById('officer-email').value.trim();
        const officerPhone = document.getElementById('officer-phone').value.trim();
        const companyName = document.getElementById('company-name').value.trim();
        const companyNMLS = document.getElementById('company-nmls').value.trim();

        // Get client details
        const clientName = document.getElementById('client-name').value.trim();
        const propertyAddress = document.getElementById('property-address').value.trim().replace(/[.,:;]$/, ''); // Remove trailing punctuation
        const purchasePrice = parseFloat(purchasePriceInput.value) || 0;
        const downPaymentDollar = parseFloat(downPaymentDollarInput.value) || 0;
        const downPaymentPercent = parseFloat(downPaymentPercentInput.value) || 0;
        const loanAmount = parseFloat(loanAmountInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;

        // Calculate down payment display value
        let downPaymentDisplay = formatter.format(downPaymentDollar);
        if (downPaymentPercent > 0) {
            downPaymentDisplay = `${downPaymentPercent}% (${formatter.format(downPaymentDollar)})`;
        }

        // Format phone number
        const formattedPhone = formatPhoneNumber(officerPhone);

        // Validate required fields
        if (!officerName || !officerNMLS || !officerEmail || !officerPhone || !companyName || !companyNMLS || !clientName || !propertyAddress || purchasePrice <= 0 || downPaymentDollar < 0 || loanAmount <= 0 || rate <= 0) {
            alert('Please fill in all required fields with valid values.');
            return;
        }

        // Handle logo upload and convert to base64 to avoid CORS issues
        let logoSrc = '';
        const logoFile = companyLogoInput.files[0];
        if (logoFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                logoSrc = e.target.result; // Base64 string
                generatePreviewAndPDF();
            };
            reader.onerror = function() {
                console.error('Error reading logo file');
                logoSrc = '';
                generatePreviewAndPDF();
            };
            reader.readAsDataURL(logoFile);
        } else {
            generatePreviewAndPDF();
        }

        // Function to generate the preview and PDF
        function generatePreviewAndPDF() {
            // Generate the letter HTML for preview
            const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const letterHtml = `
                <div class="letter-container">
                    ${logoSrc ? `<img src="${logoSrc}" alt="${companyName} Logo" class="letter-logo">` : ''}
                    <div class="letter-header">
                        <h1>Pre-Qualification Letter</h1>
                        <p>${currentDate}</p>
                    </div>
                    <div class="letter-body">
                        <p>Dear ${clientName},</p>
                        <p>We are pleased to inform you that, based on the information provided, you are pre-qualified for a mortgage loan with the following terms:</p>
                        <div class="letter-details">
                            <div class="detail-row">
                                <strong>Property Address:</strong>
                                <span>${propertyAddress}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Purchase Price:</strong>
                                <span>${formatter.format(purchasePrice)}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Down Payment:</strong>
                                <span>${downPaymentDisplay}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Loan Amount:</strong>
                                <span>${formatter.format(loanAmount)}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Interest Rate:</strong>
                                <span>${rateFormatter.format(rate / 100)}</span>
                            </div>
                        </div>
                        <p>This pre-qualification is subject to a full credit review, appraisal, title search, and verification of all information provided. It is not a commitment to lend and is valid for 90 days from the date of this letter. Please feel free to contact me with any questions or to proceed with the next steps in your mortgage application process.</p>
                        <p>Sincerely,</p>
                        <div class="letter-signature">
                            <p>${officerName}</p>
                            <p>${officerPosition}</p>
                            <p>NMLS #${officerNMLS}</p>
                            <p>${companyName}</p>
                            <p>Company NMLS #${companyNMLS}</p>
                            <p>Email: ${officerEmail}</p>
                            <p>Phone: ${formattedPhone}</p>
                        </div>
                    </div>
                    <div class="letter-footer">
                        <button id="download-letter-btn">Download as PDF</button>
                    </div>
                </div>
            `;

            // Display the letter preview
            letterPreview.innerHTML = letterHtml;
            letterPreview.classList.remove('hidden');

            // Attach event listener to the visible download button
            const downloadBtn = letterPreview.querySelector('#download-letter-btn');
            if (!downloadBtn) {
                console.error('Download button not found in letterPreview');
                return;
            }

            downloadBtn.addEventListener('click', () => {
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'in',
                    format: 'letter' // 8.5in x 11in
                });

                // Set font and margins
                pdf.setFont('helvetica');
                pdf.setFontSize(12);
                const margin = 0.75; // 0.75in margins
                let yPosition = margin;

                // Add logo if present
                if (logoSrc) {
                    const img = new Image();
                    img.src = logoSrc;
                    img.onload = () => {
                        const maxWidth = 1; // 1in wide
                        let imgWidth = maxWidth;
                        let imgHeight = (img.height * imgWidth) / img.width;
                        if (imgHeight > maxWidth) {
                            imgHeight = maxWidth;
                            imgWidth = (img.width * imgHeight) / img.height;
                        }
                        pdf.addImage(img, 'JPEG', (8.5 - imgWidth) / 2, yPosition, imgWidth, imgHeight); // Center logo
                        yPosition += imgHeight + 0.75; // Add space after logo
                        addLetterContent();
                    };
                    img.onerror = () => {
                        console.error('Error loading logo image');
                        addLetterContent(); // Proceed without logo
                    };
                } else {
                    addLetterContent();
                }

                function addLetterContent() {
                    // Header
                    pdf.setFontSize(16);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Pre-Qualification Letter', 8.5 / 2, yPosition, { align: 'center' });
                    yPosition += 0.3;

                    pdf.setFontSize(10);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(currentDate, 8.5 / 2, yPosition, { align: 'center' });
                    yPosition += 0.5;

                    // Teal header line
                    pdf.setDrawColor(108, 235, 206); // Teal color (#6CEBCE)
                    pdf.setLineWidth(0.02);
                    pdf.line(margin, yPosition, 8.5 - margin, yPosition);
                    yPosition += 0.5;

                    // Body
                    pdf.setFontSize(12);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(`Dear ${clientName},`, margin, yPosition);
                    yPosition += 0.4;

                    pdf.text('We are pleased to inform you that, based on the information provided, you are pre-qualified for a mortgage loan with the following terms:', margin, yPosition, { maxWidth: 7.0 });
                    yPosition += 0.5;

                    // Details (with styled box)
                    const detailsStartY = yPosition;
                    const detailsWidth = 7.0; // 8.5in - 1.5in total margins
                    const detailsPadding = 0.2;
                    const detailsItems = [
                        { label: 'Property Address:', value: propertyAddress },
                        { label: 'Purchase Price:', value: formatter.format(purchasePrice) },
                        { label: 'Down Payment:', value: downPaymentDisplay },
                        { label: 'Loan Amount:', value: formatter.format(loanAmount) },
                        { label: 'Interest Rate:', value: rateFormatter.format(rate / 100) }
                    ];

                    // Calculate the height of the details section
                    let detailsContentHeight = 0;
                    detailsItems.forEach(item => {
                        const valueLines = pdf.splitTextToSize(item.value, 4.5); // Wrap value if too long
                        detailsContentHeight += 0.3 * valueLines.length; // Adjust for multi-line values
                    });

                    // Calculate total box height including padding
                    const detailsHeight = detailsContentHeight + (detailsPadding * 2);

                    // Draw the styled box
                    pdf.setFillColor(245, 245, 245); // Very light gray background
                    pdf.setDrawColor(108, 235, 206); // Teal border
                    pdf.setLineWidth(0.01);
                    pdf.roundedRect(margin, detailsStartY - detailsPadding, detailsWidth, detailsHeight, 0.1, 0.1, 'FD');

                    // Add details inside the box
                    yPosition = detailsStartY;
                    pdf.setFontSize(10);
                    detailsItems.forEach(item => {
                        pdf.setFont('helvetica', 'bold');
                        pdf.text(item.label, margin + detailsPadding, yPosition);
                        pdf.setFont('helvetica', 'normal');
                        const valueLines = pdf.splitTextToSize(item.value, 4.5); // Wrap value if too long
                        pdf.text(valueLines, margin + detailsPadding + 1.5, yPosition);
                        yPosition += 0.3 * valueLines.length; // Adjust for multi-line values
                    });

                    yPosition = detailsStartY + detailsHeight - detailsPadding + 0.5;

                    // Additional text
                    pdf.setFontSize(12);
                    pdf.text('This pre-qualification is subject to a full credit review, appraisal, title search, and verification of all information provided. It is not a commitment to lend and is valid for 90 days from the date of this letter. Please feel free to contact me with any questions or to proceed with the next steps in your mortgage application process.', margin, yPosition, { maxWidth: 7.0 });
                    yPosition += 0.8;

                    // Signature
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Sincerely,', margin, yPosition);
                    yPosition += 0.5;

                    pdf.setFont('helvetica', 'normal');
                    pdf.text(officerName, margin, yPosition);
                    yPosition += 0.3;
                    pdf.text(officerPosition, margin, yPosition);
                    yPosition += 0.3;
                    pdf.text(`NMLS #${officerNMLS}`, margin, yPosition);
                    yPosition += 0.3;
                    pdf.text(companyName, margin, yPosition);
                    yPosition += 0.3;
                    pdf.text(`Company NMLS #${companyNMLS}`, margin, yPosition);
                    yPosition += 0.3;
                    pdf.text(`Email: ${officerEmail}`, margin, yPosition);
                    yPosition += 0.3;
                    pdf.text(`Phone: ${formattedPhone}`, margin, yPosition);
                    yPosition += 0.5;

                    // Footer line
                    pdf.setDrawColor(108, 235, 206); // Teal color
                    pdf.setLineWidth(0.01);
                    pdf.line(margin, yPosition, 8.5 - margin, yPosition);

                    // Save the PDF
                    pdf.save(`PreQualificationLetter_${clientName}_${currentDate}.pdf`);
                }
            });
        }
    });
});