import { 
    getAuth, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const auth = getAuth();

async function loginNow() {
    const role = document.getElementById("role").value;
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

    try {
        const userCred = await signInWithEmailAndPassword(auth, email, pass);

        localStorage.setItem("currentUser", JSON.stringify({
            uid: userCred.user.uid,
            email: email,
            role: role
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

