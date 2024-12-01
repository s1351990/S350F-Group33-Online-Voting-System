import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');

    async function findUserByUsername(username) {
        try {
            // Check users collection first
            const usersRef = collection(db, "users");
            const userQuery = query(usersRef, where("username", "==", username));
            const userSnapshot = await getDocs(userQuery);

            if (!userSnapshot.empty) {
                const userData = userSnapshot.docs[0].data();
                return {
                    ...userData,
                    collection: 'users'
                };
            }

            // If not found in users, check candidate collection
            const candidateRef = collection(db, "candidate");
            const candidateQuery = query(candidateRef, where("username", "==", username));
            const candidateSnapshot = await getDocs(candidateQuery);

            if (!candidateSnapshot.empty) {
                const candidateData = candidateSnapshot.docs[0].data();
                return {
                    ...candidateData,
                    collection: 'candidate'
                };
            }

            return null;
        } catch (error) {
            console.error("Error finding user:", error);
            throw error;
        }
    }

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            // Find user in either collection
            const user = await findUserByUsername(username);

            if (!user) {
                loginMessage.textContent = "Username not found.";
                loginMessage.style.color = 'red';
                return;
            }

            // Attempt to sign in
            const userCredential = await signInWithEmailAndPassword(auth, user.email, password);
            
            if (userCredential.user) {
                let message = '';
                let redirectPath = '';

                // Determine user type and redirect accordingly
                if (user.isAdmin === true) {
                    message = "Welcome, Admin!";
                    redirectPath = 'manage-polls.html';
                } else if (user.collection === 'candidate') {
                    message = `Welcome, Candidate! (Location: ${user.location})`;
                    redirectPath = 'candidate-results.html';
                } else {
                    message = "Welcome!";
                    redirectPath = 'voting.html';
                }

                // Show success message
                loginMessage.textContent = message;
                loginMessage.style.color = 'green';

                // Redirect after a short delay
                setTimeout(() => {
                    window.location.href = redirectPath;
                }, 1500);
            }

        } catch (error) {
            console.error("Login error:", error);
            
            switch (error.code) {
                case 'auth/wrong-password':
                    loginMessage.textContent = "Incorrect password.";
                    break;
                case 'auth/too-many-requests':
                    loginMessage.textContent = "Too many failed attempts. Please try again later.";
                    break;
                case 'auth/invalid-credential':
                    loginMessage.textContent = "Invalid username or password.";
                    break;
                default:
                    loginMessage.textContent = "Login failed. Please try again.";
            }
            loginMessage.style.color = 'red';
        }
    });
});



