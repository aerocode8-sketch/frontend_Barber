if (!localStorage.getItem("cliente")) {
  window.location.href = "auth.html";
}

const cliente = JSON.parse(localStorage.getItem("cliente"));
const selectedServiceElement = document.getElementById("selected-service");
const daysContainer = document.getElementById("days-container");
const hoursContainer = document.getElementById("hours-container");
const scheduleMessage = document.getElementById("schedule-message");
const summaryDay = document.getElementById("summary-day");
const summaryHour = document.getElementById("summary-hour");
const summaryService = document.getElementById("summary-service");
const confirmButton = document.getElementById("confirm-booking");
const barbersContainer = document.getElementById("barbers-container");
const summaryBarber = document.getElementById("summary-barber");
const servicio = JSON.parse(localStorage.getItem("servicio"));
const hasValidService = Boolean(servicio);

// Estado local de la reserva; el backend luego reemplazará estos datos mock.
// Mostramos el servicio que el usuario eligió en la pantalla anterior.
if (selectedServiceElement) {
  selectedServiceElement.textContent = hasValidService ? servicio.nombre_servicio : "Servicio no seleccionado";
}

// Aquí guardamos la fecha, hora y barbero seleccionados por el usuario.
let selectedDay = null;
let selectedHour = null;
let selectedBarber = null;
let selectedBarberName = null; // Para mostrar el nombre del barbero en el resumen, ya que selectedBarber ahora guarda el ID.
let selectedDate = null;
let selectedDateISO = null; // Para guardar la fecha en formato ISO para el backend (YYYY-MM-DD).

let availableBarbers = [];
let horasOcupadas = [];
let horasBloqueadas = [];

// Horarios disponibles para mostrar cuando el usuario elija un día.
const availableHours = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "7:30 PM"
];

// Días de la semana para construir el calendario.
const weekDays = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado"
];

// Meses para mostrar el nombre correcto del mes.
const months = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre"
];

// Convierte una hora en formato "8:30 AM" a un objeto Date con la misma fecha que baseDate.
function hourStringToDate(baseDate, hourString) {
  if (!baseDate) return null;
  const parts = hourString.split(' ');
  const timePart = parts[0];
  const meridiem = parts[1] || '';
  const timeParts = timePart.split(':');
  let hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1] || '0', 10);

  if (meridiem.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;

  return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes, 0, 0);
}


// Función para convertir la hora seleccionada a formato 24 horas para enviar al backend.
function convertirHora(hora12) {
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

// Obtenemos la fecha actual para calcular disponibilidad.
const today = new Date();


// Limpia los estilos activos cuando cambia la selección.
function clearActiveDays() {
  const dayButtons = document.querySelectorAll(".calendar");
  dayButtons.forEach((button) => {
    button.classList.remove("active-day");
  });
}

// Limpia los estilos activos de las horas.
function clearActiveHours() {
  const hourButtons = document.querySelectorAll(".hour-btn");
  hourButtons.forEach((button) => {
    button.classList.remove("active-hour");
  });
}

// Limpia los estilos activos de los barberos.
function clearActiveBarbers() {
  const barberButtons = document.querySelectorAll(".barber-btn");
  barberButtons.forEach((button) => {
    button.classList.remove("active-barber");
  });
}

// Actualiza el resumen visible con la selección actual.
function updateSummary() {

  if (summaryService) {
    summaryService.textContent =
      hasValidService
        ? servicio.nombre_servicio
        : "Selecciona un servicio";
  }

  if (summaryBarber) {
    summaryBarber.textContent =
      selectedBarberName || "-";
  }

  if (summaryDay) {
    summaryDay.textContent =
      selectedDay || "-";
  }

  if (summaryHour) {
    summaryHour.textContent =
      selectedHour || "-";
  }

}

async function cargarHorasOcupadas() {

  if (!selectedBarber || !selectedDateISO) {
    return;
  }

  try {

    const response = await fetch(
      `${API_URL}/api/citas/barbero/${selectedBarber}`
    );

    const citas = await response.json();

    horasOcupadas = citas
      .filter(
        cita => cita.fecha_cita.split("T")[0] === selectedDateISO
      )
      .map(
        cita => cita.hora_cita
      );

  } catch (error) {

    console.error(
      "Error obteniendo horas ocupadas:",
      error
    );

  }

}

async function cargarBloqueos() {

  if (!selectedBarber || !selectedDateISO) {
    return;
  }

  try {

    const response = await fetch(
      `${API_URL}/api/bloqueos/barbero/${selectedBarber}`
    );

    const bloqueos =
      await response.json();

    horasBloqueadas = [];

    bloqueos
      .filter(
        bloqueo =>
          bloqueo.fecha.split("T")[0] === selectedDateISO
      )
      .forEach((bloqueo) => {

        let horaActual =
          bloqueo.hora_ini.substring(0, 5);

        const horaFin =
          bloqueo.hora_fin.substring(0, 5);

        while (horaActual < horaFin) {

          horasBloqueadas.push(
            `${horaActual}:00`
          );

          const [h, m] =
            horaActual.split(":");

          const fecha =
            new Date();

          fecha.setHours(
            Number(h)
          );

          fecha.setMinutes(
            Number(m) + 30
          );

          horaActual =
            fecha
              .toTimeString()
              .substring(0, 5);
        }

      });


  } catch (error) {

    console.error(
      "Error obteniendo bloqueos:",
      error
    );

  }
}


fetch(
  `${API_URL}/api/barberos`
)
  .then(async (response) => {

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.mensaje ||
        "Error obteniendo barberos"
      );
    }

    availableBarbers = data;

    renderBarbers();

  })
  .catch((error) => {

    console.error(error);

    if (scheduleMessage) {
      scheduleMessage.textContent =
        "No fue posible cargar los barberos.";
    }

  });


// Renderiza las tarjetas de barberos disponibles.
function renderBarbers() {
  if (!barbersContainer) return;

  barbersContainer.innerHTML = "";

  availableBarbers.forEach((barber) => {
    const barberButton = document.createElement("button");
    barberButton.type = "button";
    barberButton.classList.add("calendar", "barber-btn");
    barberButton.innerHTML = `
    <img
        src="${barber.foto}"
        alt="${barber.nombres}"
        class="barber-photo"
    >

    <p>
        ${barber.nombres}
        ${barber.apellidos}
    </p>
    `;

    barberButton.addEventListener("click", () => {
      clearActiveBarbers();
      barberButton.classList.add("active-barber");

      selectedBarber = barber.id_barbero; // Guardamos el ID del barbero para enviar al backend
      selectedBarberName = `${barber.nombres} ${barber.apellidos}`; // Guardamos el nombre completo para mostrar en el resumen
      selectedDay = null;
      selectedHour = null;
      selectedDate = null;
      selectedDateISO = null;
      horasOcupadas = [];
      horasBloqueadas = [];


      updateSummary();
      renderDays();
      renderHours();
      clearActiveDays();
      clearActiveHours();
    });

    barbersContainer.appendChild(barberButton);
  });
}

// Renderiza los horarios disponibles según el barbero y día elegidos.
function renderHours() {
  if (!hoursContainer || !scheduleMessage) return;

  hoursContainer.innerHTML = "";

  if (!selectedBarber) {
    scheduleMessage.textContent = "Selecciona un barbero para ver los horarios disponibles.";
    return;
  }

  // Si todavía no se ha elegido un día, mostramos un mensaje de guía.
  if (!selectedDay) {
    scheduleMessage.textContent = "Selecciona un día para ver los horarios disponibles.";
    return;
  }

  scheduleMessage.textContent = `Horarios disponibles para ${selectedDay}.`;

  let horasDisponibles = [...availableHours];

  const diaSemana = selectedDate.getDay();

  // Lunes (1) a Viernes (5)
  if (diaSemana >= 1 && diaSemana <= 5) {

    horasDisponibles = horasDisponibles.filter(
      hora =>
        hora !== "09:00 AM" &&
        hora !== "09:30 AM" &&
        hora !== "12:30 PM"
    );

  }

  // Domingo (0)
  if (diaSemana === 0) {

    hoursContainer.innerHTML = "";
    scheduleMessage.textContent =
      "La barbería no atiende los domingos.";

    return;

  }

  horasDisponibles.forEach((hour) => {
    const horaBackend =
      convertirHora(hour);

    const estaOcupada =
      horasOcupadas.includes(
        horaBackend
      );

    const estaBloqueada =
      horasBloqueadas.includes(
        horaBackend
      );

    const hourButton = document.createElement("button");
    hourButton.type = "button";
    hourButton.classList.add("calendar", "hour-btn");
    hourButton.innerHTML = `<p>${hour}</p>`;

    // Si la fecha seleccionada es hoy, deshabilitamos las horas que ya pasaron.
    const now = new Date();
    const isSelectedToday = selectedDate && selectedDate.toDateString() === now.toDateString();
    const slotDate = hourStringToDate(selectedDate || now, hour);

    if (estaOcupada || estaBloqueada) {
      return;
    }
    if (isSelectedToday && slotDate && slotDate <= now) {
      hourButton.classList.add('disabled-hour');
      hourButton.disabled = true;
      if (estaOcupada) {
        hourButton.title = "Horario ocupado";
      } else if (isSelectedToday && slotDate && slotDate <= now) {
        hourButton.title = "Hora ya pasada";
      }

    } else {
      hourButton.addEventListener("click", () => {
        if (hourButton.disabled) return;
        clearActiveHours();
        hourButton.classList.add("active-hour");
        selectedHour = hour;
        updateSummary();
      });
    }

    hoursContainer.appendChild(hourButton);
  });
}

// Crea la vista de los próximos 7 días disponibles.
function renderDays() {
  if (!daysContainer) return;

  daysContainer.innerHTML = "";

  if (!selectedBarber) {
    return;
  }

  // Vamos a mostrar los próximos 7 días desde hoy.
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);

    const dayName = weekDays[date.getDay()];
    const dayNumber = date.getDate();
    const monthName = months[date.getMonth()];

    const dayButton = document.createElement("button");
    dayButton.type = "button";
    dayButton.classList.add("calendar");

    // Si el día generado es el día actual, lo marcamos como hoy.
    const isToday = i === 0;
    if (isToday) {
      dayButton.classList.add("today-day");
    }

    dayButton.innerHTML = `
      <p>${isToday ? "hoy" : dayName}</p>
      <p class="num">${dayNumber}</p>
      <p>${monthName}</p>
    `;

    dayButton.addEventListener("click", async () => {
      if (!selectedBarber) {
        alert("Primero debes seleccionar un barbero.");
        return;
      }

      clearActiveDays();
      dayButton.classList.add("active-day");

      // --- NUEVA LÓGICA DE NORMALIZACIÓN ---
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 a 11
      const dayNum = String(date.getDate()).padStart(2, '0');

      selectedDateISO = `${year}-${month}-${dayNum}`; // Resultado: "2026-06-04"

      // Guardamos en LocalStorage para que el backend lo reciba limpio
      localStorage.setItem("fecha_reserva", selectedDateISO);

      // Guardamos el día seleccionado en texto simple y en objeto Date para validaciones.
      selectedDay = `${isToday ? "hoy" : dayName} ${dayNumber} ${monthName}`;
      selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      selectedHour = null;

      // Al cambiar de día, limpiamos la selección de horas.
      updateSummary();
      await cargarHorasOcupadas();
      await cargarBloqueos();
      renderHours();
      clearActiveHours();
    });

    daysContainer.appendChild(dayButton);
  }
}

// Botón de confirmación: deja listo el objeto para cuando el backend reciba la cita.
if (confirmButton) {
  confirmButton.addEventListener("click", () => {
    if (!hasValidService) {
      alert("Primero debes seleccionar un servicio para continuar con la reserva.");
      window.location.href = "services.html";
      return;
    }

    if (!selectedBarber || !selectedDay || !selectedHour) {
      alert("Primero debes seleccionar un barbero, un día y una hora.");
      return;
    }

    // Aquí luego podrás mandar la cita al backend.
    const bookingData = {
      id_cliente: cliente.id_cliente,
      id_servicio: servicio.id_servicio,
      id_barbero: selectedBarber,
      fecha_cita: selectedDateISO,
      hora_cita: convertirHora(selectedHour)
    };

    fetch(
      `${API_URL}/api/citas`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bookingData)
      }
    )
      .then(async (response) => {

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.mensaje ||
            "Error al crear la cita"
          );
        }

        alert(
          "Cita creada exitosamente"
        );

      })
      .catch((error) => {

        alert(error.message);

        console.error(error);

      });
  });
}

if (!hasValidService) {
  if (scheduleMessage) {
    scheduleMessage.textContent = "No hay servicio seleccionado. Regresa y elige un servicio para continuar.";
  }

  if (confirmButton) {
    confirmButton.disabled = true;
  }
}

// Inicializamos la pantalla.
updateSummary();
renderDays();
renderHours();