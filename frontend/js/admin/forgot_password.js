const form = document.getElementById("forgotPasswordForm");
const emailInput = document.getElementById("email");
const submitButton = form?.querySelector('button[type="submit"]');
const formMessage = document.getElementById("formMessage");

const STORAGE_KEYS = {
	email: "adminRecoveryEmail",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


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

function clearRecoveryState() {
	localStorage.removeItem("adminRecoveryVerified");
	localStorage.removeItem("adminRecoveryToken");
}

// Limpia mensajes y estilos cuando el usuario vuelve a escribir.
function handleInput() {
	setInvalidState(emailInput, false);

	if (formMessage?.textContent) {
		setMessage("");
	}
}

function handleSubmit(event) {
	event.preventDefault();

	if (!emailInput || !submitButton) {
		return;
	}

	const emailValue = emailInput.value.trim().toLowerCase();
	const emailValid = Boolean(emailValue) && EMAIL_REGEX.test(emailValue);

	setInvalidState(emailInput, !emailValid);
	setMessage("");

	if (!emailValue) {
		setMessage("Completa el correo para continuar.");
		emailInput.focus();
		return;
	}

	if (!emailValid) {
		setMessage("Ingresa un correo electrónico válido.");
		emailInput.focus();
		return;
	}

	submitButton.disabled = true;
	submitButton.textContent = "Enviando...";


	fetch(
		`${API_URL}/api/auth/recuperar-password`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				email: emailValue
			})
		}
	)
		.then(async (response) => {

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.mensaje
				);
			}

			clearRecoveryState();

			localStorage.setItem(
				STORAGE_KEYS.email,
				emailValue
			);

			setMessage(
				data.mensaje,
				true
			);

			setTimeout(() => {

				window.location.href =
					"verify_code.html";

			}, 1000);

		})
		.catch((error) => {

			setMessage(
				error.message ||
				"Error al enviar el código"
			);

		})
		.finally(() => {

			submitButton.disabled = false;
			submitButton.textContent =
				"Continuar";

		});
}
if (form && emailInput) {
	emailInput.addEventListener("input", handleInput);
	form.addEventListener("submit", handleSubmit);
}
