const form = document.getElementById("form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitButton = form?.querySelector('button[type="submit"]');
const formMessage = document.getElementById("formMessage");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function setMessage(message) {
	if (!formMessage) {
		return;
	}

	formMessage.textContent = message;
}

function setInvalidState(input, isInvalid) {
	if (!input) {
		return;
	}

	input.classList.toggle("invalid", isInvalid);
}

function clearValidation() {
	setMessage("");
	setInvalidState(emailInput, false);
	setInvalidState(passwordInput, false);
}

function focusFirstInvalidField(emailValid, passwordValid) {
	if (!emailValid) {
		emailInput.focus();
		return;
	}

	if (!passwordValid) {
		passwordInput.focus();
	}
}

function handleEmailInput() {
	setInvalidState(emailInput, false);

	if (formMessage?.textContent) {
		setMessage("");
	}
}

function handlePasswordInput() {
	setInvalidState(passwordInput, false);

	if (formMessage?.textContent) {
		setMessage("");
	}
}

function handleSubmit(event) {
	event.preventDefault();

	if (!form || !emailInput || !passwordInput) {
		return;
	}

	clearValidation();

	const emailValue = emailInput.value.trim().toLowerCase();
	const passwordValue = passwordInput.value;

	const emailValid = Boolean(emailValue) && EMAIL_REGEX.test(emailValue);
	const passwordValid = Boolean(passwordValue.trim()) && passwordValue.trim().length >= MIN_PASSWORD_LENGTH;

	if (!emailValid) {
		setInvalidState(emailInput, true);
	}

	if (!passwordValid) {
		setInvalidState(passwordInput, true);
	}

	if (!emailValue || !passwordValue.trim()) {
		setMessage("Completa todos los campos para continuar.");
		focusFirstInvalidField(Boolean(emailValue), Boolean(passwordValue.trim()));
		return;
	}

	if (!emailValid) {
		setMessage("Ingresa un correo electrónico válido.");
		focusFirstInvalidField(false, passwordValid);
		return;
	}

	if (!passwordValid) {
		setMessage("La contraseña debe tener al menos 8 caracteres.");
		focusFirstInvalidField(emailValid, false);
		return;
	}


	if (submitButton) {
		submitButton.disabled = true;
		submitButton.textContent = "Ingresando...";
	}

	fetch(
		`${API_URL}/api/auth/login`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				email: emailValue,
				contrasena: passwordValue
			})
		}
	)
		.then(async (response) => {

			const data = await response.json();

			if (!response.ok) {

				setMessage(
					data.mensaje ||
					"Error al iniciar sesión"
				);

				throw new Error(data.mensaje);
			}

			localStorage.setItem(
				"token",
				data.token
			);

			localStorage.setItem(
				"barbero",
				JSON.stringify(
					data.barbero
				)
			);

			window.location.href =
				"admin.html";

		})
		.catch((error) => {

			console.error(
				"Error login:",
				error
			);

		})
		.finally(() => {

			if (submitButton) {
				submitButton.disabled = false;
				submitButton.textContent =
					"Continuar";
			}

		});

}

if (form) {
	emailInput?.addEventListener("input", handleEmailInput);
	passwordInput?.addEventListener("input", handlePasswordInput);
	form.addEventListener("submit", handleSubmit);
}
