function cerrarSesion() {

    localStorage.removeItem(
        "tokenSuperAdmin"
    );

    localStorage.removeItem(
        "superAdmin"
    );

    window.location.href =
        "auth_superadmin.html";

}