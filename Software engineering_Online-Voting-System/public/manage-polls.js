import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
    const pollList = document.getElementById('poll-list');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModal = document.querySelector('.close');

    // Check authentication and admin status
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
    });

    // View Poll Function
    async function viewPoll(pollId) {
        try {
            const pollDoc = await getDoc(doc(db, "polls", pollId));
            if (pollDoc.exists()) {
                const poll = pollDoc.data();
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

                modalBody.innerHTML = `
                    ${optionsHtml}
                    <div class="modal-actions">
                        <button class="btn btn-analysis" onclick="window.location.href='analysis.html?id=${pollId}'">
                            <i class="fas fa-chart-bar"></i> Detailed Analysis
                        </button>
                    </div>
                `;

                modal.style.display = 'block';
            }
        } catch (error) {
            console.error("Error viewing poll: ", error);
            alert("Error viewing poll details");
        }
    }

    // Helper functions for analysis
    function getLeadingOption(options, votes) {
        const maxVotes = Math.max(...votes);
        const leadingIndex = votes.indexOf(maxVotes);
        return `${options[leadingIndex]} (${maxVotes} votes)`;
    }

    function getParticipationRate(votersCount) {
        // You might want to get total registered users from your database
        // For now, we'll just show the raw number
        return `${votersCount} participants`;
    }

    function createDistributionChart(votes, totalVotes) {
        return votes.map(vote => {
            const percentage = totalVotes > 0 ? (vote / totalVotes * 100).toFixed(1) : 0;
            return `
                <div class="distribution-bar">
                    <div class="distribution-fill" style="width: ${percentage}%"></div>
                    <span class="distribution-label">${percentage}%</span>
                </div>
            `;
        }).join('');
    }

    // Make viewPoll available globally
    window.viewPoll = viewPoll;

    async function displayPolls() {
        try {
            const querySnapshot = await getDocs(collection(db, "polls"));
            pollList.innerHTML = '';

            // Convert querySnapshot to array for sorting
            const polls = [];
            querySnapshot.forEach((doc) => {
                polls.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Sort polls by creation time (newest first)
            polls.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            // Display sorted polls
            polls.forEach((poll) => {
                const pollElement = document.createElement('div');
                pollElement.className = 'poll-item';
                
                // Format the date to local time
                const createdDate = new Date(poll.createdAt);
                const formattedDate = createdDate.toLocaleString('en-HK', {
                    timeZone: 'Asia/Hong_Kong',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });

                pollElement.innerHTML = `
                    <div class="poll-info">
                        <h3>${poll.title}</h3>
                        <p>Created on: ${formattedDate}</p>
                    </div>
                    <div class="poll-actions">
                        <button class="btn btn-view" onclick="viewPoll('${poll.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-edit" onclick="editPoll('${poll.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-delete" onclick="deletePoll('${poll.id}')">
                            <i class="fas fa-trash-alt"></i> Delete
                        </button>
                    </div>
                `;
                pollList.appendChild(pollElement);
            });
        } catch (error) {
            console.error("Error getting polls: ", error);
            alert("Error loading polls");
        }
    }

    // Edit Poll Function
    window.editPoll = function(pollId) {
        window.location.href = `edit-poll.html?id=${pollId}`;
    };

    // Delete Poll Function
    window.deletePoll = async function(pollId) {
        if (confirm('Are you sure you want to delete this poll?')) {
            try {
                await deleteDoc(doc(db, "polls", pollId));
                alert("Poll deleted successfully");
                displayPolls(); // Refresh the poll list
            } catch (error) {
                console.error("Error deleting poll: ", error);
                alert("Error deleting poll");
            }
        }
    };

    // Update modal close functionality
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Add keyboard support for closing modal (Escape key)
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
        }
    });

    // Initial display of polls
    displayPolls();
});
