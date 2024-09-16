function showAuthModal(elmID) {
    let authModal = new bootstrap.Modal(document.getElementById(elmID), { backdrop: "static", keyboard: false });
    authModal.show();
}