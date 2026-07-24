document.addEventListener("DOMContentLoaded", async () => {

    const token =
        localStorage.getItem("tokenSuperAdmin");

    if (!token) {

        window.location.href = "auth_superadmin.html";
        return;

    }

    try {

        const response = await fetch(
            `${API_URL}/api/superadmin/perfil`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {

            localStorage.removeItem("tokenSuperAdmin");
            localStorage.removeItem("superAdmin");

            window.location.href = "auth_superadmin.html";

            return;

        }

    } catch (error) {

        localStorage.removeItem("tokenSuperAdmin");
        localStorage.removeItem("superAdmin");

        window.location.href = "auth_superadmin.html";

    }

});