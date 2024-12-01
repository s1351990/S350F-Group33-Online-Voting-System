import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCWy5osy0x4yNyctikjVqCvvW1o0s9scVY",
    authDomain: "group33online-voting-system.firebaseapp.com",
    projectId: "group33online-voting-system",
    storageBucket: "group33online-voting-system.firebasestorage.app",
    messagingSenderId: "786433889062",
    appId: "1:786433889062:web:952ee50e5a4290711367e7",
    measurementId: "G-QG7X6KSLNP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    // Password validation
    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    // Password strength validation
    if (password.length < 6) {
        alert("Password should be at least 6 characters long!");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store additional user data in Firestore
        await setDoc(doc(db, "users", user.uid), {
            email: email,
            username: username,
            isAdmin: false,
            createdAt: new Date().toISOString()
        });

        alert("Registration successful! Please login.");
        window.location.href = "login.html";
    } catch (error) {
        console.error("Registration error:", error);
        switch (error.code) {
            case 'auth/email-already-in-use':
                alert("This email is already registered!");
                break;
            case 'auth/invalid-email':
                alert("Invalid email address!");
                break;
            case 'auth/weak-password':
                alert("Password is too weak!");
                break;
            default:
                alert("Registration failed: " + error.message);
        }
    }
});