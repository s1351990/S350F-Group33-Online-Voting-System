import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

document.addEventListener('DOMContentLoaded', async function() {
    const form = document.getElementById('poll-form');
    const optionsContainer = document.getElementById('options-container');
    const addOptionBtn = document.getElementById('add-option-btn');
    const cancelEditBtn = document.getElementById('cancel-poll-btn');
    
    // Get poll ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const pollId = urlParams.get('id');

    if (!pollId) {
        alert('No poll ID specified');
        window.location.href = 'manage-polls.html';
        return;
    }

    // Load existing poll data
    try {
        const pollDoc = await getDoc(doc(db, "polls", pollId));
        if (!pollDoc.exists()) {
            alert('Poll not found');
            window.location.href = 'manage-polls.html';
            return;
        }

        const pollData = pollDoc.data();
        document.getElementById('poll-title').value = pollData.title;

        // Add existing options
        pollData.options.forEach((option, index) => {
            addOptionToForm(option, pollData.votes[index]);
        });

    } catch (error) {
        console.error("Error loading poll:", error);
        alert('Error loading poll data');
    }

    function addOptionToForm(optionText = '', votes = 0) {
        const optionWrapper = document.createElement('div');
        optionWrapper.className = 'option-wrapper';
        optionWrapper.innerHTML = `
            <input type="text" class="poll-option" value="${optionText}" required>
            <span class="votes-count">(${votes} votes)</span>
            <button type="button" class="delete-option">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;

        optionWrapper.querySelector('.delete-option').addEventListener('click', function() {
            if (optionsContainer.children.length > 2) {
                optionsContainer.removeChild(optionWrapper);
            } else {
                alert('You must have at least two options.');
            }
        });

        optionsContainer.appendChild(optionWrapper);
    }

    addOptionBtn.addEventListener('click', () => addOptionToForm());

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const title = document.getElementById('poll-title').value;
        const options = Array.from(document.querySelectorAll('.poll-option'))
            .map(input => input.value.trim())
            .filter(value => value !== '');

        if (options.length < 2) {
            alert('You must have at least two options.');
            return;
        }

        try {
            // Get current votes
            const pollDoc = await getDoc(doc(db, "polls", pollId));
            const currentData = pollDoc.data();
            const votes = options.map((option, index) => {
                // Keep existing votes if option exists, otherwise initialize to 0
                return currentData.options[index] ? currentData.votes[index] : 0;
            });

            // Update the poll
            await updateDoc(doc(db, "polls", pollId), {
                title: title,
                options: options,
                votes: votes,
                updatedAt: new Date().toISOString()
            });

            alert('Poll updated successfully!');
            window.location.href = 'voting.html';
        } catch (error) {
            console.error("Error updating poll:", error);
            alert('Error updating poll: ' + error.message);
        }
    });

    cancelEditBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            window.history.back();
        }
    });
}); 