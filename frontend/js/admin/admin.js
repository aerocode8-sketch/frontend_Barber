
// evita que usuarios no autenticados accedan al panel de administración, y redirige al login si el token no es válido o ha expirado.
document.addEventListener('DOMContentLoaded', () => {

    const token =
        localStorage.getItem("token");

    if (!token) {

        window.location.href =
            "auth_admin.html";

        return;
    }

    const appState = {
        currentFilter: "all",
        calendarDate: new Date(),
        selectedDate: new Date(),
        blockedSchedule: {}
    };


    const barbero = JSON.parse(
        localStorage.getItem("barbero")
    );

    let bloqueos = [];

    if (barbero) {

        document.getElementById(
            "perfilNombre"
        ).textContent =
            `${barbero.nombres} ${barbero.apellidos}`;

        document.getElementById(
            "perfilEmail"
        ).textContent =
            barbero.email;

        document.getElementById(
            "perfilTelefono"
        ).textContent =
            barbero.telefono;
    }

    // Verifica que el token siga siendo válido. Si no lo es, limpia el almacenamiento y redirige al login.
    fetch(
        `${API_URL}/api/auth/perfil`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    )
        .then(async (response) => {

            if (!response.ok) {

                localStorage.removeItem("token");
                localStorage.removeItem("barbero");

                window.location.href =
                    "auth_admin.html";

                return;
            }

        })
        .catch(() => {

            localStorage.removeItem("token");
            localStorage.removeItem("barbero");

            window.location.href =
                "auth_admin.html";

        });


    let appointments = [];

    const timeSlots = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

    const buttons = document.querySelectorAll('.nav-btn-item');
    const sections = document.querySelectorAll('.tab-content');
    const todayList = document.querySelector('[data-appointment-list="today"]');
    const allList = document.querySelector('[data-appointment-list="all"]');
    const dayTitle = document.getElementById('calendar-title');
    const calendarDays = document.getElementById('calendar-days');
    const timeSlotsContainer = document.getElementById('time-slots');
    const selectedDayLabel = document.getElementById('selected-day-label');
    const blockedSummaryList = document.getElementById('blocked-summary-list');
    const dayStatus = document.getElementById('day-status');
    const blockDayButton = document.getElementById('btn-block-day');
    const saveBlocksButton = document.getElementById('btn-save-blocks');
    const statToday = document.querySelector('[data-stat="today-count"]');
    const statAssigned = document.querySelector('[data-stat="assigned-count"]');
    const statBlocked = document.querySelector('[data-stat="blocked-count"]');
    const logoutBtn = document.getElementById("logoutBtn");

    const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
    const dayFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

    // Cambia entre pestañas del panel.
    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            buttons.forEach((item) => item.classList.remove('active'));
            sections.forEach((section) => section.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    document.querySelectorAll('[data-jump-tab]').forEach((button) => {
        button.addEventListener('click', () => activateTab(button.dataset.jumpTab));
    });

    document.querySelectorAll('[data-scroll-target]').forEach((button) => {
        button.addEventListener('click', () => activateTab(button.dataset.scrollTarget));
    });


    document.querySelectorAll('[data-calendar-nav]').forEach((button) => {
        button.addEventListener('click', () => {
            const step = button.dataset.calendarNav === 'prev' ? -1 : 1;
            appState.calendarDate = new Date(appState.calendarDate.getFullYear(), appState.calendarDate.getMonth() + step, 1);
            renderCalendar();
        });
    });

    blockDayButton.addEventListener('click', () => {
        const selectedKey = toKey(appState.selectedDate);
        const current = appState.blockedSchedule[selectedKey] || { fullDay: false, slots: [] };
        current.fullDay = !current.fullDay;
        current.slots = current.fullDay ? [...timeSlots] : [];
        appState.blockedSchedule[selectedKey] = current;
        renderCalendar();
        renderSelectedDay();
        renderStats();
    });

    saveBlocksButton.addEventListener('click', async () => {

        const selectedKey =
            toKey(appState.selectedDate);

        const blockInfo =
            appState.blockedSchedule[selectedKey];

        if (!blockInfo || blockInfo.slots.length === 0) {

            alert("Selecciona al menos una hora.");

            return;
        }

        const bloqueosDelDia =
            bloqueos
                .filter(
                    bloqueo =>
                        bloqueo.fecha.split("T")[0] === selectedKey
                )
                .map(
                    bloqueo =>
                        convertirHora12(
                            bloqueo.hora_ini
                        )
                );

        const slotsNuevos =
            blockInfo.slots.filter(
                slot =>
                    !bloqueosDelDia.includes(slot)
            );

        console.log(
            "Bloqueos ya guardados:",
            bloqueosDelDia
        );

        console.log(
            "Nuevos bloques:",
            slotsNuevos
        );

        if (slotsNuevos.length === 0) {

            alert(
                "No hay nuevos bloqueos para guardar"
            );

            return;
        }

        try {

            for (const slot of slotsNuevos) {

                const horaIni =
                    convertirHora24(slot);

                const horaFin =
                    sumarUnaHora(
                        horaIni.substring(0, 5)
                    );

                const bloqueoData = {

                    id_barbero:
                        barbero.id_barbero,

                    fecha:
                        selectedKey,

                    hora_ini:
                        horaIni,

                    hora_fin:
                        horaFin
                };

                const response =
                    await fetch(
                        `${API_URL}/api/bloqueos`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify(
                                bloqueoData
                            )
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.mensaje
                    );
                }
            }

            alert(
                "Bloqueos guardados correctamente"
            );

            await cargarBloqueosBD();

            renderSelectedDay();

            renderStats();

        } catch (error) {

            alert(error.message);

            console.error(error);

        }

    });

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            cerrarSesion
        );

    }

    function cerrarSesion() {

        localStorage.removeItem("token");
        localStorage.removeItem("barbero");
        window.location.href = "auth_admin.html";
    }

    async function cargarBloqueosBD() {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/bloqueos/barbero/${barbero.id_barbero}`
                );


            const bloqueosResponse =
                await response.json();

            bloqueos =
                bloqueosResponse;

            appState.blockedSchedule = {};

            bloqueosResponse.forEach((bloqueo) => {

                const fecha =
                    bloqueo.fecha.split("T")[0];

                if (!appState.blockedSchedule[fecha]) {

                    appState.blockedSchedule[fecha] = {
                        fullDay: false,
                        slots: []
                    };
                }

                appState.blockedSchedule[fecha].slots.push(
                    convertirHora12(
                        bloqueo.hora_ini
                    )
                );

            });

            renderCalendar();
            renderStats();

            console.log(
                "Bloqueos cargados:",
                appState.blockedSchedule
            );

        } catch (error) {

            console.error(
                "Error cargando bloqueos:",
                error
            );

        }
    }

    async function cargarCitasBD() {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/citas/barbero/${barbero.id_barbero}`
                );

            const citas =
                await response.json();

            appointments =
                citas.map((cita) => ({

                    id:
                        cita.id_cita,

                    client:
                        `${cita.nombre_cliente} ${cita.apellido_cliente}`,

                    service:
                        cita.nombre_servicio,

                    barber:
                        `${cita.nombre_barbero} ${cita.apellido_barbero}`,

                    date:
                        cita.fecha_cita.split("T")[0],

                    time:
                        convertirHora12(
                            cita.hora_cita
                        ),

                    status:
                        "pending",

                    kind:
                        "all"
                }));

            renderAppointments();

            console.log(
                "Citas cargadas:",
                appointments
            );

        } catch (error) {

            console.error(
                "Error cargando citas:",
                error
            );

        }
    }



    function activateTab(tabId) {
        buttons.forEach((item) => item.classList.toggle('active', item.dataset.tab === tabId));
        sections.forEach((section) => section.classList.toggle('active', section.id === tabId));
    }

    function renderAppointments() {
        // Renderiza las citas según el filtro activo.
        const todayKey = toKey(new Date());
        const todayAppointments = appointments.filter((item) => item.date === todayKey);
        const allAppointments = appState.currentFilter === 'all'
            ? appointments
            : appointments.filter((item) => item.status === appState.currentFilter);

        renderAppointmentList(todayList, todayAppointments, 'No hay citas para hoy.');
        renderAppointmentList(allList, allAppointments, 'No hay citas para ese filtro.');
        renderStats();
    }

    function sumarUnaHora(hora24) {

        const [h, m] = hora24.split(":");

        const fecha = new Date();

        fecha.setHours(Number(h));
        fecha.setMinutes(Number(m));
        fecha.setSeconds(0);

        fecha.setHours(fecha.getHours() + 1);

        return fecha.toTimeString().substring(0, 8);
    }

    function convertirHora24(hora12) {

        const [hora, periodo] = hora12.split(" ");

        let [h, m] = hora.split(":");

        h = parseInt(h);

        if (periodo === "PM" && h !== 12) {
            h += 12;
        }

        if (periodo === "AM" && h === 12) {
            h = 0;
        }

        return `${String(h).padStart(2, "0")}:${m}:00`;
    }

    function convertirHora12(hora24) {

        let [h, m] = hora24.split(":");

        h = parseInt(h);

        const periodo =
            h >= 12 ? "PM" : "AM";

        if (h === 0) {
            h = 12;
        } else if (h > 12) {
            h -= 12;
        }

        return `${String(h).padStart(2, "0")}:${m} ${periodo}`;
    }

    function renderAppointmentList(container, items, emptyMessage) {
        if (!container) {
            return;
        }

        container.innerHTML = '';

        if (!items.length) {
            container.classList.add('is-empty');
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = emptyMessage;
            container.appendChild(emptyState);
            return;
        }

        container.classList.remove('is-empty');

        items.forEach((appointment) => {
            const card = document.createElement('article');
            card.className = 'appointment-card';

            card.innerHTML = `
				<div class="appointment-top">
					<div>
						<h3>${appointment.client}</h3>
						<p>${appointment.service}</p>
					</div>
					<button class="delete-appointment" data-id="${appointment.id}">Cancelar</button>
				</div>
				<div class="appointment-bottom">
					<span>📅 ${formatDate(appointment.date)}</span>
					<span>⏰ ${appointment.time}</span>
					<span>👤 ${appointment.barber}</span>
				</div>
			`;

            const botonEliminar =
                card.querySelector(".delete-appointment");

            botonEliminar.addEventListener(
                "click",
                async () => {

                    if (
                        !confirm(
                            "¿Deseas cancelar esta cita?"
                        )
                    ) {
                        return;
                    }

                    try {

                        const response =
                            await fetch(
                                `${API_URL}/api/citas/${appointment.id}`,
                                {
                                    method: "DELETE"
                                }
                            );

                        const data =
                            await response.json();

                        if (!response.ok) {

                            throw new Error(
                                data.mensaje
                            );

                        }

                        alert(
                            "Cita cancelada correctamente"
                        );

                        await cargarCitasBD();

                        renderAppointments();

                        renderStats();

                    } catch (error) {

                        alert(
                            error.message
                        );

                        console.error(error);

                    }

                }
            );

            container.appendChild(card);
        });
    }

    function renderCalendar() {
        // Pinta el mes actual con marcas visuales para selección y bloqueo.
        dayTitle.textContent = monthFormatter.format(appState.calendarDate);
        calendarDays.innerHTML = '';

        const year = appState.calendarDate.getFullYear();
        const month = appState.calendarDate.getMonth();
        const firstOfMonth = new Date(year, month, 1);
        const lastOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastOfMonth.getDate();
        const leadingOffset = (firstOfMonth.getDay() + 6) % 7;
        const totalCells = Math.ceil((leadingOffset + daysInMonth) / 7) * 7;

        for (let index = 0; index < totalCells; index += 1) {
            const dayNumber = index - leadingOffset + 1;

            if (dayNumber < 1 || dayNumber > daysInMonth) {
                const spacer = document.createElement('div');
                spacer.className = 'day day-empty';
                spacer.setAttribute('aria-hidden', 'true');
                calendarDays.appendChild(spacer);
                continue;
            }

            const currentDate = new Date(year, month, dayNumber);
            const dayButton = document.createElement('button');
            const key = toKey(currentDate);
            const blockInfo = appState.blockedSchedule[key];
            const isSelected = key === toKey(appState.selectedDate);
            const isToday = key === toKey(new Date());

            dayButton.type = 'button';
            dayButton.className = ['day', isToday ? 'today' : '', isSelected ? 'selected' : '', blockInfo ? 'has-block' : '', blockInfo?.fullDay ? 'blocked' : ''].filter(Boolean).join(' ');
            dayButton.textContent = dayNumber;
            dayButton.title = formatDate(key);
            dayButton.addEventListener('click', () => {
                appState.selectedDate = currentDate;
                renderCalendar();
                renderSelectedDay();
            });

            calendarDays.appendChild(dayButton);
        }

        renderSelectedDay();
    }

    function renderSelectedDay() {
        // Actualiza el detalle lateral del día escogido.
        const selectedKey = toKey(appState.selectedDate);
        const blockInfo = appState.blockedSchedule[selectedKey];

        selectedDayLabel.textContent = dayFormatter.format(appState.selectedDate);
        dayStatus.textContent = blockInfo?.fullDay ? 'Bloqueado' : 'Disponible';
        dayStatus.className = `status ${blockInfo?.fullDay ? 'canceled' : 'pending'}`;

        timeSlotsContainer.innerHTML = '';
        timeSlots.forEach((slot) => {
            const blocked = Boolean(blockInfo?.fullDay || blockInfo?.slots?.includes(slot));
            const slotLabel = document.createElement('label');
            slotLabel.className = ['time-slot', blocked ? 'is-active' : '', blockInfo?.fullDay ? 'is-disabled' : ''].filter(Boolean).join(' ');

            slotLabel.innerHTML = `
				<input type="checkbox" ${blocked ? 'checked' : ''} ${blockInfo?.fullDay ? 'disabled' : ''}>
				<span>${slot}</span>
			`;

            slotLabel.addEventListener('click', (event) => {
                if (blockInfo?.fullDay) {
                    event.preventDefault();
                    return;
                }

                const current = appState.blockedSchedule[selectedKey] || { fullDay: false, slots: [] };
                const exists = current.slots.includes(slot);

                if (exists) {
                    current.slots = current.slots.filter((item) => item !== slot);
                } else {
                    current.slots = [...current.slots, slot];
                }

                if (current.slots.length === 0) {
                    delete appState.blockedSchedule[selectedKey];
                } else {
                    appState.blockedSchedule[selectedKey] = current;
                }

                renderCalendar();
                renderStats();
            });

            timeSlotsContainer.appendChild(slotLabel);
        });

        renderBlockedSummary(selectedKey);
    }

    function renderBlockedSummary(dateKey) {

        blockedSummaryList.innerHTML = "";

        const bloqueosDelDia = bloqueos.filter(
            bloqueo =>
                bloqueo.fecha.split("T")[0] === dateKey
        );

        if (bloqueosDelDia.length === 0) {

            const item = document.createElement("li");

            item.innerHTML = `
            <span>No hay bloqueos para este día</span>
            <span>Disponible</span>
        `;

            blockedSummaryList.appendChild(item);


            return;
        }

        bloqueosDelDia.forEach((bloqueo) => {

            const item = document.createElement("li");

            item.innerHTML = `
            <span>
                ${bloqueo.hora_ini.substring(0, 5)}
                -
                ${bloqueo.hora_fin.substring(0, 5)}
            </span>

			<div class="block-buttons">

			<button
                class="edit-block"
                data-id="${bloqueo.id_bloqueo}"
            >
                Editar
            </button>

            <button
                class="delete-block"
                data-id="${bloqueo.id_bloqueo}"
            >
                Eliminar
            </button>
			</div>
        `;

            blockedSummaryList.appendChild(item);
            const botonEliminar =
                item.querySelector(".delete-block");

            const botonEditar =
                item.querySelector(".edit-block");

            botonEditar.addEventListener(
                "click",
                async () => {

                    const nuevaHoraInicio = prompt(
                        "Nueva hora inicio (HH:MM)",
                        bloqueo.hora_ini.substring(0, 5)
                    );

                    if (!nuevaHoraInicio) {
                        return;
                    }

                    const nuevaHoraFin = prompt(
                        "Nueva hora fin (HH:MM)",
                        bloqueo.hora_fin.substring(0, 5)
                    );

                    if (!nuevaHoraFin) {
                        return;
                    }

                    try {

                        const response =
                            await fetch(
                                `${API_URL}/api/bloqueos/${bloqueo.id_bloqueo}`,
                                {
                                    method: "PUT",
                                    headers: {
                                        "Content-Type":
                                            "application/json"
                                    },
                                    body: JSON.stringify({
                                        fecha:
                                            bloqueo.fecha.split("T")[0],
                                        hora_ini:
                                            `${nuevaHoraInicio}:00`,
                                        hora_fin:
                                            `${nuevaHoraFin}:00`
                                    })
                                }
                            );

                        const data =
                            await response.json();

                        if (!response.ok) {
                            throw new Error(
                                data.mensaje
                            );
                        }

                        alert(
                            "Bloqueo actualizado correctamente"
                        );

                        await cargarBloqueosBD();

                        renderSelectedDay();

                    } catch (error) {

                        alert(
                            error.message
                        );

                        console.error(error);

                    }

                }
            );

            botonEliminar.addEventListener(
                "click",
                async () => {

                    if (
                        !confirm(
                            "¿Deseas eliminar este bloqueo?"
                        )
                    ) {
                        return;
                    }

                    try {

                        const response =
                            await fetch(
                                `${API_URL}/api/bloqueos/${bloqueo.id_bloqueo}`,
                                {
                                    method: "DELETE"
                                }
                            );

                        const data =
                            await response.json();

                        if (!response.ok) {
                            throw new Error(
                                data.mensaje
                            );
                        }

                        alert(
                            "Bloqueo eliminado correctamente"
                        );

                        await cargarBloqueosBD();

                        renderSelectedDay();

                    } catch (error) {

                        alert(
                            error.message
                        );

                        console.error(
                            error
                        );

                    }

                }
            );

        });

    }

    function renderStats() {
        if (statToday) {
            const hoy = toKey(new Date());

            statToday.textContent = appointments.filter(
                (item) => item.date === hoy
            ).length;
        }

        if (statAssigned) {
            statAssigned.textContent = appointments.length;
        }

        if (statBlocked) {
            statBlocked.textContent = bloqueos.length;
        }
    }

    function statusLabel(status) {
        const labels = {
            pending: 'Pendiente',
            completed: 'Completada',
            canceled: 'Cancelada',
        };

        return labels[status] || status;
    }

    function formatDate(dateInput) {
        const date = typeof dateInput === 'string' ? new Date(`${dateInput}T00:00:00`) : dateInput;
        return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(date);
    }

    function toKey(date) {
        const current = date instanceof Date ? date : new Date(date);
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    (async () => {

        await cargarBloqueosBD();
        await cargarCitasBD();

        renderCalendar();
        renderSelectedDay();
        renderAppointments();
        renderStats();

    })();
});
