import { 
    getAuth, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const auth = getAuth();

async function loginNow() {
    const email = document.getElementById("email").value.trim();
    const pass  = document.getElementById("password").value.trim();
    const msg   = document.getElementById("error-message");

    msg.classList.remove("show");
    msg.innerText = "";

    try {
        // Login Firebase Auth
        const userCred = await signInWithEmailAndPassword(auth, email, pass);

        // Simpan user ke localStorage
        localStorage.setItem("currentUser", JSON.stringify({
            uid: userCred.user.uid,
            email: email,
            role: "user" // nanti kita perbaiki role di langkah berikut
        }));

        // Redirect ke dashboard
        window.location.href = "index.html";

    } catch (err) {
        msg.innerText = err.message;
        msg.classList.add("show");
    }
}

// supaya bisa dipanggil dari HTML
window.loginNow = loginNow;

