const barbersContainer = document.getElementById('barbersContainer');
let barberoEditando = null;
const barberFormSection = document.getElementById("barberFormSection");
const barberForm = document.getElementById("editBarber");
const formTitle = document.getElementById("formTitle");
const barberName = document.getElementById("barberName");
const barberLastName = document.getElementById("barberLastName");
const barberEmail = document.getElementById("barberEmail");
const barberPhone = document.getElementById("barberPhone");

async function cargarBarberos() {
    try {

        const response = await fetch(`${API_URL}/api/barberos`);

        if (!response.ok) {
            throw new Error('Error al obtener los barberos');
        }

        const barberos = await response.json();


        barbersContainer.innerHTML = '';

        barberos.forEach((barbero) => {

            const card = document.createElement('div');
            card.classList.add('barber-card');

            card.innerHTML = `
                <h3>${barbero.nombres} ${barbero.apellidos}</h3>

                <p>
                    <strong>Correo:</strong><br>
                    ${barbero.email}
                </p>

                <p>
                    <strong>Teléfono:</strong>
                    ${barbero.telefono}
                </p>

                <p>
                    <strong>Estado:</strong>
                    ${barbero.activo ? "🟢 Activo" : "🔴 Inactivo"}
                </p>

                <div class="barber-actions">
                    <button class="edit-btn">
                        Editar
                    </button>

                    <button class="status-btn">
                        ${barbero.activo ? "Desactivar" : "Activar"}
                    </button>
                </div>
            `;
            const editButton = card.querySelector(".edit-btn");
            editButton.addEventListener(
                "click",
                () => {

                    barberoEditando = barbero.id_barbero;
                    barberFormSection.classList.remove("hidden");
                    formTitle.textContent = "Editar Barbero";

                    barberName.value = barbero.nombres;
                    barberLastName.value = barbero.apellidos;
                    barberEmail.value = barbero.email;
                    barberPhone.value = barbero.telefono;

                    barberFormSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }
            );

            const statusButton = card.querySelector(".status-btn");
            statusButton.addEventListener(
                "click",
                async () => {

                    const response = await fetch(
                        `${API_URL}/api/barberos/${barbero.id_barbero}/estado`,
                        {
                            method: "PATCH"
                        }
                    );

                    const data = await response.json();

                    if (!response.ok) {
                        alert(data.mensaje);
                        return;
                    }
                    alert(data.mensaje);
                    cargarBarberos();
                }
            );

            barbersContainer.appendChild(card);
        });

    } catch (error) {
        console.error(error);
    }
}

cargarBarberos();

barberForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        try {
            const nombres = barberName.value.trim();

            const apellidos = barberLastName.value.trim();

            const email = barberEmail.value.trim();

            const telefono = barberPhone.value.trim();

            const datosBarbero = {
                nombres,
                apellidos,
                email,
                telefono
            };

            const response = await fetch(
                `${API_URL}/api/barberos/${barberoEditando}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(datosBarbero)
                }
            );
            const data = await response.json();

            if (!response.ok) {
                alert(data.mensaje);
                return;
            }
            alert(data.mensaje);

            barberForm.reset();

            barberoEditando = null;

            barberFormSection.classList.add("hidden");

            cargarBarberos();
        }
        catch (error) {
            console.error(error);
            alert("Ocurrió un error al actualizar el barbero.");
        }
    }
);