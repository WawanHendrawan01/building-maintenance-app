import { 
    getAuth, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const auth = getAuth();

async function loginNow() {
    const email = document.getElementById("email").value.trim();
    const pass  = document.getElementById("password").value.trim();
    const msg   = document.getElementById("msg");

    msg.classList.remove("show");
    msg.innerText = "";

const role = document.querySelector('input[name="role"]:checked')?.value;
    if (!role) {
        showError("Pilih role terlebih dahulu");
        return;
    }
    if (!email || !pass) {
        showError("Email dan password wajib diisi");
        return;
    }
    const adminEmails = [
    "wawan.hendrawan1130@gmail.com"
];

if (
    role === "admin" &&
    !adminEmails.includes(email.toLowerCase())
) {
    showError("Akun ini tidak memiliki akses sebagai Admin.");
    return;
}

    try {
    const userCred = await signInWithEmailAndPassword(auth, email, pass);

    const adminEmails = [
        "wawan.hendrawan1130@gmail.com"
    ];

    const actualRole = adminEmails.includes(
        userCred.user.email.toLowerCase()
    )
        ? "admin"
        : "user";

    if (role !== actualRole) {
        showError(
            actualRole === "user"
                ? "Akun ini hanya dapat login sebagai User."
                : "Akun Admin harus memilih role Admin."
        );
        return;
    }

    localStorage.setItem("currentUser", JSON.stringify({
        uid: userCred.user.uid,
        email: userCred.user.email,
        role: actualRole
    }));

    window.location.href = "index.html";

} catch (err) {
    showError(err.message);
}

    function showError(msgText) {
        msg.innerText = msgText;
        msg.classList.add("show");
    }
}

window.loginNow = loginNow;

