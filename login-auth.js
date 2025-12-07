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
        const userCred = await signInWithEmailAndPassword(auth, email, pass);

        localStorage.setItem("currentUser", JSON.stringify({
            uid: userCred.user.uid,
            email: email,
            role: "user"
        }));

        window.location.href = "index.html";

    } catch (err) {
        msg.innerText = err.message;
        msg.classList.add("show");
    }
}

window.loginNow = loginNow;
