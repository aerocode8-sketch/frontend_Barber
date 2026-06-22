const formBarber = document.getElementById("formBarbero"); /* Se obtiene el elemento del formulario utilizando su ID. */
const nombre = document.getElementById("nombre"); /* Se obtienen los elementos del formulario de registro de administrador utilizando sus IDs. */
const apellido = document.getElementById("apellido"); /* Se obtienen los elementos del formulario de registro de administrador utilizando sus IDs. */
const email = document.getElementById("email"); /* Se obtienen los elementos del formulario de registro de administrador utilizando sus IDs. */
const telefono = document.getElementById("telefono"); /* Se obtienen los elementos del formulario de registro de administrador utilizando sus IDs. */
const password = document.getElementById("password"); /* Se obtienen los elementos del formulario de registro de administrador utilizando sus IDs. */
const confirmpassword = document.getElementById("confirmpassword"); /* Se obtienen los elementos del formulario de registro de administrador utilizando sus IDs. */
const generalError = document.getElementById("generalError"); /* Contenedor de errores general. */
const submitButton = formBarber.querySelector("button[type='submit']"); /* Se obtiene el botón de envío del formulario. */

function isValidEmail(value) { /* Función para validar el formato del correo electrónico utilizando una expresión regular. */
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/* Función para mostrar error en un campo específico */
function showFieldError(fieldId, message) {
    const errorDiv = document.getElementById(`error-${fieldId}`);
    if (errorDiv) {
        errorDiv.textContent = "⚠️ " + message;
        errorDiv.style.display = "block";
    }
}

/* Función para limpiar error de un campo */
function clearFieldError(fieldId) {
    const errorDiv = document.getElementById(`error-${fieldId}`);
    if (errorDiv) {
        errorDiv.textContent = "";
        errorDiv.style.display = "none";
    }
}

/* Función para limpiar todos los errores */
function clearAllErrors() {
    document.querySelectorAll(".form-error").forEach(error => {
        error.textContent = "";
        error.style.display = "none";
    });
    generalError.style.display = "none";
    generalError.textContent = "";
}

formBarber.addEventListener("submit", (e) => { /* Se agrega un evento de escucha al formulario para detectar cuando se envía. */
    e.preventDefault(); /* Se previene el comportamiento predeterminado del formulario, que es recargar la página. */
    clearAllErrors(); /* Se limpian todos los errores previos. */

    const nombreValor = nombre.value.trim(); /* Se obtiene el valor del campo de nombre y se eliminan los espacios en blanco al inicio y al final. */
    const apellidoValor = apellido.value.trim(); /* Se obtiene el valor del campo de apellido y se eliminan los espacios en blanco al inicio y al final. */
    const emailValor = email.value.trim(); /* Se obtiene el valor del campo de email y se eliminan los espacios en blanco al inicio y al final. */
    const telefonoValor = telefono.value.trim(); /* Se obtiene el valor del campo de teléfono y se eliminan los espacios en blanco al inicio y al final. */
    const passwordValor = password.value.trim(); /* Se obtiene el valor del campo de contraseña y se eliminan los espacios en blanco al inicio y al final. */
    const confirmpasswordValor = confirmpassword.value.trim(); /* Se obtiene el valor del campo de confirmación de contraseña y se eliminan los espacios en blanco al inicio y al final. */

    /* Validaciones de campos vacíos */
    let hasErrors = false;
    if (!nombreValor) {
        showFieldError("nombre", "El nombre es requerido.");
        hasErrors = true;
    }
    if (!apellidoValor) {
        showFieldError("apellido", "El apellido es requerido.");
        hasErrors = true;
    }
    if (!emailValor) {
        showFieldError("email", "El correo es requerido.");
        hasErrors = true;
    }
    if (!telefonoValor) {
        showFieldError("telefono", "El teléfono es requerido.");
        hasErrors = true;
    }
    if (!passwordValor) {
        showFieldError("password", "La contraseña es requerida.");
        hasErrors = true;
    }
    if (!confirmpasswordValor) {
        showFieldError("confirmpassword", "Debes confirmar la contraseña.");
        hasErrors = true;
    }

    if (hasErrors) {
        return; /* Se detiene la ejecución del código. */
    }

    /* Validación de email */
    if (!isValidEmail(emailValor)) {
        showFieldError("email", "Correo electrónico inválido.");
        return;
    }

    /* Validación de teléfono */
    if (!/^\d{10}$/.test(telefonoValor)) {
        showFieldError(
            "telefono",
            "El teléfono debe contener exactamente 10 dígitos."
        );
        return;
    }

    /* Validación de longitud de contraseña */
    if (passwordValor.length < 8) {
        showFieldError(
            "password",
            "La contraseña debe tener al menos 8 caracteres."
        );
        return;
    }

    /* Validación de coincidencia de contraseñas */
    if (passwordValor !== confirmpasswordValor) {
        showFieldError("confirmpassword", "Las contraseñas no coinciden.");
        return; /* Se detiene la ejecución del código. */
    }

    submitButton.disabled = true;
    submitButton.textContent = "Registrando...";

    fetch(
        `${API_URL}/api/auth/register`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nombres: nombreValor,
                apellidos: apellidoValor,
                email: emailValor,
                telefono: telefonoValor,
                contrasena: passwordValor,
                confirmarContrasena: confirmpasswordValor
            })
        }
    )
        .then(async (response) => {

            const data = await response.json();

            if (!response.ok) {

                generalError.textContent =
                    "⚠️ " + data.mensaje;

                generalError.style.display =
                    "block";

                throw new Error(data.mensaje);
            }

            alert(
                "Barbero registrado correctamente"
            );

            window.location.href =
                "auth_admin.html";

        })
        .catch((error) => {

            console.error(
                "Error registrando barbero:",
                error
            );

        })
        .finally(() => {

            submitButton.disabled = false;

            submitButton.textContent =
                "👤 Crear Cuenta";

        });

});

nombre.addEventListener("input", () => { /* Se agrega un evento de escucha al campo de nombre para detectar cuando el usuario ingresa texto. */
    nombre.value = nombre.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ""); /* Se eliminan los caracteres no alfabéticos del campo de nombre. */
    clearFieldError("nombre"); /* Limpia el error cuando el usuario empieza a escribir. */
});

apellido.addEventListener("input", () => { /* Se agrega un evento de escucha al campo de apellido para detectar cuando el usuario ingresa texto. */
    apellido.value = apellido.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ""); /* Se eliminan los caracteres no alfabéticos del campo de apellido. */
    clearFieldError("apellido"); /* Limpia el error cuando el usuario empieza a escribir. */
});

email.addEventListener("input", () => { /* Se agrega un evento de escucha al campo de email para detectar cuando el usuario ingresa texto. */
    clearFieldError("email"); /* Limpia el error cuando el usuario empieza a escribir. */
});

telefono.addEventListener("input", () => { /* Se agrega un evento de escucha al campo de teléfono para detectar cuando el usuario ingresa texto. */
    telefono.value = telefono.value.replace(/[^0-9]/g, "").slice(0, 10); /* Se eliminan los caracteres no numéricos del campo de teléfono y se limita a 10 caracteres. */
    clearFieldError("telefono"); /* Limpia el error cuando el usuario empieza a escribir. */
});

password.addEventListener("input", () => { /* Se agrega un evento de escucha al campo de contraseña. */
    clearFieldError("password"); /* Limpia el error cuando el usuario empieza a escribir. */
});

confirmpassword.addEventListener("input", () => { /* Se agrega un evento de escucha al campo de confirmación de contraseña. */
    clearFieldError("confirmpassword"); /* Limpia el error cuando el usuario empieza a escribir. */
});

/* ================= TOGGLE MOSTRAR/OCULTAR CONTRASEÑA ================= */

const passwordToggles = document.querySelectorAll(".password-toggle");

/* El registro valida todo en frontend y deja listo el acceso al login administrativo. */

passwordToggles.forEach(toggle => {
    toggle.addEventListener("click", (e) => {
        e.preventDefault();

        const targetId = toggle.getAttribute("data-target");
        const inputField = document.getElementById(targetId);

        if (inputField.type === "password") {
            inputField.type = "text";
            toggle.textContent = "🔓";
        } else {
            inputField.type = "password";
            toggle.textContent = "🔒";
        }
    });
});

