const servicesContainer = document.getElementById("servicesContainer");
const addServiceForm = document.getElementById("addServiceForm");
const serviceFormSection = document.querySelector(".service-form-section");
let servicioEditando = null;
const formTitle = document.querySelector(".service-form-section h2");
const submitButton = addServiceForm.querySelector("button");

async function cargarServicios() {

    try {

        const response = await fetch(
            `${API_URL}/api/servicios`
        );

        if (!response.ok) {
            throw new Error(
                "Error obteniendo los servicios"
            );
        }

        const servicios = await response.json();
        console.log(servicios);
        servicesContainer.innerHTML = "";

        servicios.forEach((servicio) => {
            const card = document.createElement("div");
            card.classList.add("service-card");

            card.innerHTML = `
                <h3>${servicio.nombre_servicio}</h3>

                <p>
                    <strong>Descripción:</strong><br>
                    ${servicio.descripcion}
                </p>

                <p>
                    <strong>Precio:</strong>
                    $${servicio.precio}
                </p>

                <p>
                    <strong>Duración:</strong>
                    ${servicio.duracion} minutos
                </p>

                <div class="service-actions">
                    <button class="edit-btn">
                        Editar
                    </button>

                    <button
                        class="delete-btn"
                        data-id="${servicio.id_servicio}">
                        Eliminar
                    </button>
                </div>
            `;

            const deleteButton = card.querySelector(".delete-btn");
            deleteButton.addEventListener(
                "click",
                async () => {
                    const confirmar = confirm("¿Estás seguro de eliminar este servicio?");

                    if (!confirmar) {
                        return;
                    }

                    const idServicio = deleteButton.dataset.id;

                    try {
                        const response = await fetch(
                            `${API_URL}/api/servicios/${idServicio}`,
                            {
                                method: "DELETE"
                            }
                        );

                        if (!response.ok) {

                            const data = await response.json();

                            throw new Error(
                                data.mensaje
                            );

                        }

                        const data = await response.json();

                        alert(data.mensaje);
                        await cargarServicios();

                    } catch (error) {

                        console.error(
                            "Error eliminando servicio:",
                            error
                        );

                        alert(error.message);

                    }

                }
            );

            const editButton = card.querySelector(".edit-btn");
            editButton.addEventListener(
                "click",
                () => {

                    servicioEditando = servicio.id_servicio;

                    document.getElementById("serviceName").value =
                        servicio.nombre_servicio;

                    document.getElementById("serviceDescription").value =
                        servicio.descripcion;

                    document.getElementById("servicePrice").value =
                        servicio.precio;

                    document.getElementById("serviceDuration").value =
                        servicio.duracion;

                    formTitle.textContent =
                        "Editar Servicio";

                    submitButton.textContent =
                        "Guardar Cambios";

                    serviceFormSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }
            );

            servicesContainer.appendChild(card);

        });

    } catch (error) {

        console.error(
            "Error obteniendo servicios:",
            error
        );

    }

}

cargarServicios();
addServiceForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        const nombre_servicio =
            document.getElementById("serviceName").value.trim();

        const descripcion =
            document.getElementById("serviceDescription").value.trim();

        const precio =
            document.getElementById("servicePrice").value;

        const duracion =
            document.getElementById("serviceDuration").value;

        try {
            let metodo;
            let url;

            if (servicioEditando === null) {

                metodo = "POST";

                url = `${API_URL}/api/servicios`;

            } else {

                metodo = "PUT";

                url = `${API_URL}/api/servicios/${servicioEditando}`;

            }

            const response = await fetch(
                url,
                {
                    method: metodo,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        nombre_servicio,
                        descripcion,
                        precio,
                        duracion
                    })
                }
            );

            if (!response.ok) {

                const data = await response.json();

                throw new Error(
                    data.mensaje
                );

            }

            const data = await response.json();


            addServiceForm.reset();
            servicioEditando = null;

            formTitle.textContent =
                "Agregar Nuevo Servicio";

            submitButton.textContent =
                "Agregar Servicio";
            await cargarServicios();
            alert(data.mensaje);

        } catch (error) {

            console.error(
                "Error guardando servicio:",
                error
            );

            alert(error.message);

        }

    }
);