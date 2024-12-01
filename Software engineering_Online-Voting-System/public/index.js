import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

document.addEventListener('DOMContentLoaded', async function() {
    const pollsList = document.getElementById('polls-list');
    const modal = document.getElementById('modal');
    const closeModal = document.querySelector('.close');

    async function loadPolls() {
        try {
            const querySnapshot = await getDocs(collection(db, "polls"));
            pollsList.innerHTML = '';

            querySnapshot.forEach((doc) => {
                const poll = doc.data();
                const pollElement = document.createElement('div');
                pollElement.className = 'poll-item';
                pollElement.innerHTML = `
                    <div class="poll-info">
                        <h3>${poll.title}</h3>
                        <p>Created on: ${new Date(poll.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="poll-actions">
                        <button class="btn btn-view" onclick="viewPoll('${doc.id}')">
                            <i class="fas fa-eye"></i> View Results
                        </button>
                        <a href="login.html?id=${doc.id}" class="btn btn-edit">
                            <i class="fas fa-vote-yea"></i> Vote Now
                        </a>
                    </div>
                `;
                pollsList.appendChild(pollElement);
            });
        } catch (error) {
            console.error("Error loading polls:", error);
            alert("Error loading polls. Please try again later.");
        }
    }

    // Modal close functionality
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Add keyboard support for closing modal
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });

    loadPolls();
});

// Define viewPoll in the global scope
async function viewPoll(pollId) {
    try {
        const pollDoc = await getDoc(doc(db, "polls", pollId));
        if (pollDoc.exists()) {
            const poll = pollDoc.data();
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');
            const modal = document.getElementById('modal');
            
            modalTitle.textContent = poll.title;
            
            let totalVotes = poll.votes.reduce((a, b) => a + b, 0);
            let optionsHtml = poll.options.map((option, index) => {
                let percentage = totalVotes > 0 ? (poll.votes[index] / totalVotes * 100).toFixed(1) : 0;
                return `
                    <div class="poll-option">
                        <span>${option}</span>
                        <span>${poll.votes[index]} votes (${percentage}%)</span>
                    </div>
                    <div class="vote-bar">
                        <div class="vote-progress" style="width: ${percentage}%"></div>
                    </div>
                `;
            }).join('');
            
            // Add Analysis Link and Total Votes
            optionsHtml += `
                <div class="total-votes">Total votes: ${totalVotes}</div>
                <div class="analysis-link-container">
                    <a href="analysis.html?id=${pollId}" class="btn-analysis">
                        <i class="fas fa-chart-bar"></i> View Detailed Analysis
                    </a>
                </div>
            `;

            modalBody.innerHTML = optionsHtml;
            modal.style.display = 'block';
        }
    } catch (error) {
        console.error("Error viewing poll: ", error);
        alert("Error viewing poll details");
    }
}

// Make viewPoll available globally
window.viewPoll = viewPoll;