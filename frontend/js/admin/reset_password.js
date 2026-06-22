const form = document.getElementById("resetPasswordForm");
const tokenInput = document.getElementById("token");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const submitButton = form?.querySelector('button[type="submit"]');
const formMessage = document.getElementById("formMessage");

const STORAGE_KEYS = {
	email: "adminRecoveryEmail",
	verified: "adminRecoveryVerified",
	token: "adminRecoveryToken",
};

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

// Este es el último paso del flujo y solo debe abrirse si el código ya fue validado.

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

function getRecoveryToken() {
	return localStorage.getItem(STORAGE_KEYS.token);
}

function isCodeVerified() {
	return localStorage.getItem(STORAGE_KEYS.verified) === "true";
}

function clearValidation() {
	setInvalidState(passwordInput, false);
	setInvalidState(confirmPasswordInput, false);
}

function ensureVerification() {
	if (!isCodeVerified() || !getRecoveryToken()) {
		window.location.href = "verify_code.html";
		return false;
	}

	return true;
}

function getPasswordValues() {
	return {
		password: passwordInput?.value.trim() || "",
		confirmPassword: confirmPasswordInput?.value.trim() || "",
	};
}

function handleInput() {
	clearValidation();
	if (formMessage?.textContent) {
		setMessage("");
	}
}

function handleSubmit(event) {
	event.preventDefault();

	if (!passwordInput || !confirmPasswordInput || !submitButton) {
		return;
	}

	const { password, confirmPassword } = getPasswordValues();
	clearValidation();
	setMessage("");

	if (!password || !confirmPassword) {
		setMessage("Completa ambos campos para continuar.");
		if (!password) {
			setInvalidState(passwordInput, true);
			passwordInput.focus();
			return;
		}

		setInvalidState(confirmPasswordInput, true);
		confirmPasswordInput.focus();
		return;
	}

	if (!PASSWORD_REGEX.test(password)) {
		setInvalidState(passwordInput, true);
		setMessage("La contraseña debe tener al menos 8 caracteres y contener letras y números.");
		passwordInput.focus();
		return;
	}

	if (password !== confirmPassword) {
		setInvalidState(confirmPasswordInput, true);
		setMessage("Las contraseñas no coinciden.");
		confirmPasswordInput.focus();
		return;
	}
	submitButton.disabled = true;
	submitButton.textContent =
		"Actualizando...";

	fetch(
		`${API_URL}/api/auth/nueva-password`,
		{
			method: "POST",
			headers: {
				"Content-Type":
					"application/json"
			},
			body: JSON.stringify({
				token_recuperacion:
					getRecoveryToken(),
				nuevaContrasena:
					password
			})
		}
	)
		.then(async (response) => {

			const data =
				await response.json();

			if (!response.ok) {

				throw new Error(
					data.mensaje
				);
			}

			setMessage(
				data.mensaje,
				true
			);

			localStorage.removeItem(
				STORAGE_KEYS.email
			);

			localStorage.removeItem(
				STORAGE_KEYS.verified
			);

			localStorage.removeItem(
				STORAGE_KEYS.token
			);

			setTimeout(() => {

				window.location.href =
					"auth_admin.html";

			}, 1000);

		})
		.catch((error) => {

			setMessage(
				error.message ||
				"Error al actualizar la contraseña"
			);

		})
		.finally(() => {

			submitButton.disabled =
				false;

			submitButton.textContent =
				"Restablecer contraseña";

		});
}

if (form && passwordInput && confirmPasswordInput) {
	if (!ensureVerification()) {
		// La redirección ya fue disparada por ensureVerification().
	} else {
		if (tokenInput) {
			tokenInput.value = getRecoveryToken() || "";
		}

		passwordInput.addEventListener("input", handleInput);
		confirmPasswordInput.addEventListener("input", handleInput);
		form.addEventListener("submit", handleSubmit);
		passwordInput.focus();
	}
}
