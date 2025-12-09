import { 
    getAuth, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const auth = getAuth();

async function loginNow() {
    const email = document.getElementById("email").value.trim();
    const pass  = document.getElementById("password").value.trim();
    const role = document.querySelector('input[name="role"]:checked')?.value;
    const msg   = document.getElementById("msg");

    if (!role) {
        msg.textContent = "Pilih role terlebih dahulu";
        msg.classList.add("show");
        return;
    }

    try {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);

        // SIMPAN USER + ROLE
        localStorage.setItem("currentUser", JSON.stringify({
            uid: userCred.user.uid,
            email: email,
            role: role,   // <----- INI PENTING
            name: email.split("@")[0]
        }));

        window.location.href = "index.html";

    } catch (err) {
        msg.textContent = err.message;
        msg.classList.add("show");
    }
}

window.loginNow = loginNow;
