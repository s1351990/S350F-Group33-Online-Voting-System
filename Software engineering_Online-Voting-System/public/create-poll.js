import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firebase configuration
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
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('poll-form');
    const addOptionBtn = document.getElementById('add-option-btn');
    const optionsContainer = document.getElementById('options-container');
    const cancelBtn = document.getElementById('cancel-poll-btn');

    // Check authentication
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
        }
    });

    // Add new option field
    addOptionBtn.addEventListener('click', () => {
        const optionWrapper = document.createElement('div');
        optionWrapper.className = 'option-wrapper';
        optionWrapper.innerHTML = `
            <input type="text" class="poll-option" required>
            <button type="button" class="delete-option">
                <i class="fas fa-trash"></i>
            </button>
        `;
        optionsContainer.appendChild(optionWrapper);

        // Add delete functionality to new option
        const deleteBtn = optionWrapper.querySelector('.delete-option');
        deleteBtn.addEventListener('click', () => {
            optionWrapper.remove();
        });
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('poll-title').value;
        const optionInputs = document.querySelectorAll('.poll-option');
        const options = Array.from(optionInputs).map(input => input.value.trim());

        try {
            const user = auth.currentUser;
            const pollData = {
                title: title,
                options: options,
                votes: new Array(options.length).fill(0),
                createdAt: Date.now(),
                createdBy: user.uid,
                voters: []
            };

            await addDoc(collection(db, "polls"), pollData);
            
            // Get user document to check admin status
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().isAdmin) {
                window.location.href = 'manage-polls.html';
            } else {
                window.location.href = 'voting.html';
            }
        } catch (error) {
            console.error("Error creating poll:", error);
            alert("Error creating poll. Please try again.");
        }
    });

    // Cancel button handler
    cancelBtn.addEventListener('click', () => {
        window.history.back();
    });
});
