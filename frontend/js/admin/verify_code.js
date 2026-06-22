const form = document.getElementById("verifyCodeForm");
const codeInput = document.getElementById("code");
const submitButton = form?.querySelector('button[type="submit"]');
const formMessage = document.getElementById("formMessage");
const resendLink = document.querySelector(".extra-options .back-link[href='forgot_password.html']");

const STORAGE_KEYS = {
    email: "adminRecoveryEmail",
    verified: "adminRecoveryVerified",
    token: "adminRecoveryToken",
};

const CODE_REGEX = /^\d{6}$/;

// Esta pantalla solo valida el código que se generó en el paso anterior.

function setMessage(message, isSuccess = false) {
    if (!formMessage) {
        return;
    }

    formMessage.textContent = message;
    formMessage.classList.toggle("success", isSuccess);
}

function setInvalidState(input, isInvalid) {
    if (!input) {
        return;
    }

    input.classList.toggle("invalid", isInvalid);
}



function getEmail() {
    return localStorage.getItem(STORAGE_KEYS.email);
}


function ensurePreviousStep() {
    if (!getEmail()) {
        window.location.href = "forgot_password.html";
        return false;
    }

    return true;
}

function clearMessageState() {
    if (formMessage?.textContent) {
        setMessage("");
    }

    setInvalidState(codeInput, false);
}

function normalizeCode(value) {
    return value.replace(/\D/g, "").slice(0, 6);
}

function handleCodeInput(event) {
    if (!codeInput) {
        return;
    }

    const normalized = normalizeCode(event.target.value);
    if (event.target.value !== normalized) {
        event.target.value = normalized;
    }

    setInvalidState(codeInput, false);
    if (formMessage?.textContent) {
        setMessage("");
    }
}

function handleSubmit(event) {

    event.preventDefault();

    if (!codeInput || !submitButton) {
        return;
    }

    const codeValue = normalizeCode(
        codeInput.value.trim()
    );

    setInvalidState(codeInput, false);
    setMessage("");

    if (!CODE_REGEX.test(codeValue)) {

        setInvalidState(
            codeInput,
            true
        );

        setMessage(
            "Ingresa un código válido de 6 dígitos."
        );

        codeInput.focus();

        return;
    }

    submitButton.disabled = true;
    submitButton.textContent =
        "Verificando...";

    fetch(
        `${API_URL}/api/auth/verificar-codigo`,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify({
                email: getEmail(),
                codigo: codeValue
            })
        }
    )
        .then(async (response) => {

            const data =
                await response.json();

            if (!response.ok) {

                setInvalidState(
                    codeInput,
                    true
                );

                setMessage(
                    data.mensaje
                );

                codeInput.focus();

                throw new Error(
                    data.mensaje
                );
            }

            localStorage.setItem(
                STORAGE_KEYS.verified,
                "true"
            );

            localStorage.setItem(
                STORAGE_KEYS.token,
                data.token_recuperacion
            );

            setMessage(
                data.mensaje,
                true
            );

            setTimeout(() => {

                window.location.href =
                    "reset_password.html";

            }, 1000);

        })
        .catch((error) => {

            console.error(
                "Error verificando código:",
                error
            );
            setMessage(
                "No fue posible verificar el código. Por favor, intenta nuevamente."
            );

        })
        .finally(() => {

            submitButton.disabled = false;
            submitButton.textContent =
                "Validar código";

        });

}

function handleResend(event) {
    event.preventDefault();

    setMessage(
        "Serás redirigido para solicitar un nuevo código.",
        true
    );

    setTimeout(() => {
        window.location.href =
            "forgot_password.html";
    }, 1000);
}

if (form && codeInput) {
    if (!ensurePreviousStep()) {
        // La redirección ya fue disparada por ensurePreviousStep().
    } else {
        clearMessageState();
        codeInput.addEventListener("input", handleCodeInput);
        form.addEventListener("submit", handleSubmit);
        resendLink?.addEventListener("click", handleResend);
        codeInput.focus();
    }
}
