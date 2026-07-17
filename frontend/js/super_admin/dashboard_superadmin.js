document.addEventListener('DOMContentLoaded', () => {

    const token = localStorage.getItem("token");

    if (!token) {

        window.location.href =
            "auth_superadmin.html";

        return;
    }
});