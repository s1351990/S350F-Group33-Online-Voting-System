import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, arrayUnion, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
    const pollsList = document.getElementById('polls-list');
    const modal = document.getElementById('poll-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const submitVoteBtn = document.getElementById('submit-vote');
    const closeBtn = document.querySelector('.close');
    const userInfo = document.getElementById('user-info');
    
    let selectedOption = null;
    let currentPollId = null;
    let currentUser = null;

    // Check authentication state
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            try {
                // Fetch username from Firestore
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const userData = userDoc.data();
                const username = userData?.username || user.email; // Fallback to email if username not found
                
                userInfo.innerHTML = `
                    <div class="user-details">
                        <span class="username">Welcome, ${username}</span>
                    </div>
                `;
                loadPolls();
            } catch (error) {
                console.error("Error fetching user data:", error);
                // Fallback to email if there's an error
                userInfo.innerHTML = `
                    <div class="user-details">
                        <span class="username">Welcome, ${user.email}</span>
                    </div>
                `;
                loadPolls();
            }
        } else {
            window.location.href = 'login.html';
        }
    });

    async function loadPolls() {
        try {
            const querySnapshot = await getDocs(collection(db, "polls"));
            pollsList.innerHTML = '';

            // Convert querySnapshot to array and sort
            const polls = [];
            querySnapshot.forEach((doc) => {
                polls.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Sort polls: user's polls first, then sort by creation date
            polls.sort((a, b) => {
                // First sort by creator (current user's polls first)
                if (a.createdBy === currentUser.uid && b.createdBy !== currentUser.uid) return -1;
                if (a.createdBy !== currentUser.uid && b.createdBy === currentUser.uid) return 1;
                
                // Then sort by creation date (newest first)
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            // Render sorted polls
            polls.forEach((poll) => {
                const isCreator = poll.createdBy === currentUser.uid;
                const pollElement = document.createElement('div');
                pollElement.className = 'poll-item';
                pollElement.innerHTML = `
                    <div class="poll-info">
                        <h3>${poll.title}</h3>
                        <p>Created by: ${poll.creatorEmail || 'Anonymous'}</p>
                        <p>Created on: ${new Date(poll.createdAt).toLocaleDateString()}</p>
                        ${isCreator ? '<span class="creator-badge">Your Poll</span>' : ''}
                        ${isCreator ? `
                            <button class="view-analysis-btn" onclick="window.location.href='analysis.html?id=${poll.id}'">
                                <i class="fas fa-chart-bar"></i> View Detailed Analysis
                            </button>
                        ` : `
                            <button class="view-poll-btn" data-id="${poll.id}">
                                <i class="fas fa-poll"></i> View Poll
                            </button>
                        `}
                        ${isCreator ? `
                            <button class="edit-poll-btn" data-id="${poll.id}">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="delete-poll-btn" data-id="${poll.id}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        ` : ''}
                    </div>
                `;
                pollsList.appendChild(pollElement);

                // Add event listeners for non-creator polls
                if (!isCreator) {
                    pollElement.querySelector('.view-poll-btn').addEventListener('click', () => {
                        openPollModal(poll.id);
                    });
                }

                if (isCreator) {
                    pollElement.querySelector('.edit-poll-btn').addEventListener('click', () => {
                        window.location.href = `edit-poll.html?id=${poll.id}`;
                    });

                    pollElement.querySelector('.delete-poll-btn').addEventListener('click', () => {
                        deletePoll(poll.id);
                    });
                }
            });
        } catch (error) {
            console.error("Error loading polls:", error);
            pollsList.innerHTML = '<p>Error loading polls. Please try again later.</p>';
        }
    }

    async function openPollModal(pollId) {
        try {
            const pollRef = doc(db, "polls", pollId);
            const pollDoc = await getDoc(pollRef);
            
            if (pollDoc.exists()) {
                const poll = pollDoc.data();
                currentPollId = pollId;
                modalTitle.textContent = poll.title;

                // Check if user has already voted
                const hasVoted = poll.voters && poll.voters.includes(currentUser.uid);
                
                if (hasVoted) {
                    showResults(poll);
                } else {
                    showVotingOptions(poll);
                }
                
                modal.style.display = 'block';
            }
        } catch (error) {
            console.error("Error opening poll:", error);
            alert("Error loading poll details");
        }
    }

    function showVotingOptions(poll) {
        modalBody.innerHTML = `
            <div class="voting-options">
                ${poll.options.map((option, index) => `
                    <button class="option-button" data-index="${index}">
                        ${option}
                    </button>
                `).join('')}
            </div>
        `;

        const optionButtons = modalBody.querySelectorAll('.option-button');
        optionButtons.forEach(button => {
            button.addEventListener('click', () => {
                optionButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                selectedOption = parseInt(button.dataset.index);
                submitVoteBtn.disabled = false;
            });
        });

        submitVoteBtn.style.display = 'block';
        submitVoteBtn.disabled = true;
    }

    function showResults(poll) {
        const totalVotes = poll.votes.reduce((a, b) => a + b, 0);
        modalBody.innerHTML = `
            <div class="already-voted-message">
                <i class="fas fa-check-circle"></i>
                <p>You have already voted in this poll</p>
            </div>
            <div class="results">
                ${poll.options.map((option, index) => {
                    const percentage = totalVotes > 0 ? (poll.votes[index] / totalVotes * 100).toFixed(1) : 0;
                    return `
                        <div class="option-result">
                            <div class="option-text">${option}</div>
                            <div class="progress-bar">
                                <div class="progress" style="width: ${percentage}%"></div>
                            </div>
                            <div class="votes-count">
                                ${poll.votes[index]} votes (${percentage}%)
                            </div>
                        </div>
                    `;
                }).join('')}
                <div class="total-votes">Total votes: ${totalVotes}</div>
                
                <!-- Add Analysis Link -->
                <div class="analysis-link-container">
                    <a href="analysis.html?id=${currentPollId}" class="btn btn-analysis">
                        <i class="fas fa-chart-bar"></i> View Detailed Analysis
                    </a>
                </div>
            </div>
        `;

        submitVoteBtn.style.display = 'none';
    }

    submitVoteBtn.addEventListener('click', async () => {
        if (selectedOption !== null && currentPollId) {
            try {
                const pollRef = doc(db, "polls", currentPollId);
                const pollDoc = await getDoc(pollRef);
                const poll = pollDoc.data();
                
                // Update votes array
                const newVotes = [...poll.votes];
                newVotes[selectedOption]++;

                await updateDoc(pollRef, {
                    votes: newVotes,
                    voters: arrayUnion(currentUser.uid)
                });

                showResults({ ...poll, votes: newVotes });
                alert('Vote submitted successfully!');
            } catch (error) {
                console.error("Error submitting vote:", error);
                alert("Error submitting vote. Please try again.");
            }
        }
    });

    // Modal close handlers
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        selectedOption = null;
        submitVoteBtn.disabled = true;
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            selectedOption = null;
            submitVoteBtn.disabled = true;
        }
    };

    // Initialize the page
    loadPolls();

    // Make loadPolls available in wider scope
    window.loadPolls = loadPolls;

    async function deletePoll(pollId) {
        if (confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
            try {
                await deleteDoc(doc(db, "polls", pollId));
                alert('Poll deleted successfully!');
                await loadPolls(); // Wait for polls to reload
            } catch (error) {
                console.error("Error deleting poll:", error);
                alert('Error deleting poll. Please try again.');
            }
        }
    }
}); 
