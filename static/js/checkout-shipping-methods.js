(function () {
    function syncSelection(radios) {
        radios.forEach(function (radio) {
            var row = radio.closest(".shipping-method-row");
            if (!row) {
                return;
            }
            if (radio.checked) {
                row.classList.add("is-selected");
            } else {
                row.classList.remove("is-selected");
            }
        });
    }

    function init() {
        var radios = document.querySelectorAll('input[name="method_code"]');
        if (!radios.length) {
            return;
        }
        radios.forEach(function (radio) {
            radio.addEventListener("change", function () {
                syncSelection(radios);
            });
        });
        syncSelection(radios);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
