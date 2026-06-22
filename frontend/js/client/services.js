if (!localStorage.getItem("cliente")) {
    window.location.href = "auth.html";
}

const cliente = JSON.parse(
    localStorage.getItem("cliente")
);

const userNameElement =
    document.getElementById("user-name");

if (userNameElement && cliente) {
    userNameElement.textContent =
        cliente.nombre;
}

const servicesContainer =
    document.getElementById("services-container");

async function cargarServicios() {

    try {

        const response = await fetch(
            `${API_URL}/api/servicios`
        );

        const servicios =
            await response.json();

        servicesContainer.innerHTML = "";

        servicios.forEach((servicio) => {

            const card =
                document.createElement("button");

            card.classList.add(
                "service-card"
            );

            card.innerHTML = `
                <h2>${servicio.nombre_servicio}</h2>
                <p>${servicio.descripcion}</p>
                <span class="btn">
                    $ ${servicio.precio.toLocaleString("es-CO")}
                </span>
            `;

            card.addEventListener(
                "click",
                () => {

                    localStorage.setItem(
                        "servicio",
                        JSON.stringify(servicio)
                    );

                    window.location.href =
                        "booking.html";
                }
            );

            servicesContainer.appendChild(
                card
            );

        });

    } catch (error) {

        console.error(
            "Error cargando servicios:",
            error
        );

        servicesContainer.innerHTML =
            "<p>Error cargando servicios.</p>";
    }
}

cargarServicios();