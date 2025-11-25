document.addEventListener('DOMContentLoaded', function () {
    const currencyInputs = document.querySelectorAll('.currency-input');

    currencyInputs.forEach(input => {
        // Format on initial load if value exists
        if (input.value) {
            formatInput(input);
        }

        input.addEventListener('input', function (e) {
            formatInput(e.target);
        });
    });

    function formatInput(input) {
        // Remove non-digit chars
        let value = input.value.replace(/\D/g, '');
        if (value === '') {
            input.value = '';
            return;
        }
        // Format with commas
        value = parseInt(value).toLocaleString('en-US');
        input.value = value;
    }

    // Before form submit, clean up values? 
    // Actually backend should handle cleaning "1,000" -> 1000.
    // We handled this in transactionController. We should do this for all controllers.
    // Or we can strip commas on submit.
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function () {
            currencyInputs.forEach(input => {
                input.value = input.value.replace(/,/g, '');
            });
        });
    });
});
