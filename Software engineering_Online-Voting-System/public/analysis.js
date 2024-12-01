import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
    // Add download all stats button to HTML
    const analysisContainer = document.querySelector('.analysis-container');
    const downloadAllBtn = document.createElement('button');
    downloadAllBtn.id = 'downloadAllStats';
    downloadAllBtn.className = 'download-btn';
    downloadAllBtn.innerHTML = '<i class="fas fa-download"></i> Download All Statistics';
    analysisContainer.appendChild(downloadAllBtn);

    // Check authentication and admin status
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        loadPollAnalysis();
    });

    async function loadPollAnalysis() {
        const urlParams = new URLSearchParams(window.location.search);
        const pollId = urlParams.get('id');

        if (!pollId) {
            window.location.href = 'manage-polls.html';
            return;
        }

        try {
            const pollDoc = await getDoc(doc(db, "polls", pollId));
            if (!pollDoc.exists()) {
                alert('Poll not found');
                window.location.href = 'manage-polls.html';
                return;
            }

            const poll = pollDoc.data();
            document.getElementById('poll-title').textContent = poll.title;

            // Create charts
            createPieChart(poll);
            createBarChart(poll);
            displayStatistics(poll);

            // Add download all functionality
            setupDownloadAllButton(poll);

        } catch (error) {
            console.error("Error loading poll analysis:", error);
            alert("Error loading analysis data");
        }
    }

    function setupDownloadAllButton(poll) {
        const downloadAllBtn = document.getElementById('downloadAllStats');
        downloadAllBtn.addEventListener('click', async () => {
            try {
                // Show loading state
                downloadAllBtn.disabled = true;
                downloadAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

                // Get the container of all statistics
                const container = document.querySelector('.analysis-container');

                // Use html2canvas to capture the entire container
                const canvas = await html2canvas(container, {
                    backgroundColor: '#ffffff',
                    scale: 2, // Higher quality
                    logging: false,
                    useCORS: true,
                    onclone: function(clonedDoc) {
                        // Ensure charts are visible in cloned document
                        const clonedContainer = clonedDoc.querySelector('.analysis-container');
                        clonedContainer.style.padding = '20px';
                        clonedContainer.style.background = '#ffffff';
                    }
                });

                // Create download link
                const link = document.createElement('a');
                const timestamp = new Date().toISOString().slice(0,10);
                link.download = `${poll.title.replace(/\s+/g, '-').toLowerCase()}-statistics-${timestamp}.jpg`;
                link.href = canvas.toDataURL('image/jpeg', 1.0);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Reset button state
                downloadAllBtn.disabled = false;
                downloadAllBtn.innerHTML = '<i class="fas fa-download"></i> Download All Statistics';

            } catch (error) {
                console.error('Error downloading statistics:', error);
                alert('Error downloading statistics. Please try again.');
                downloadAllBtn.disabled = false;
                downloadAllBtn.innerHTML = '<i class="fas fa-download"></i> Download All Statistics';
            }
        });
    }

    function createPieChart(poll) {
        const ctx = document.getElementById('pieChart').getContext('2d');
        const pieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: poll.options,
                datasets: [{
                    data: poll.votes,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: poll.title,
                        font: {
                            size: 16
                        }
                    }
                }
            }
        });

        // Add download functionality
        const downloadBtn = document.getElementById('downloadPieChart');
        downloadBtn.addEventListener('click', () => {
            // Create a temporary link
            const link = document.createElement('a');
            link.download = `${poll.title.replace(/\s+/g, '-').toLowerCase()}-pie-chart.png`;
            
            // Convert chart to base64 image
            const pieChartCanvas = document.getElementById('pieChart');
            
            // Create a white background
            const context = pieChartCanvas.getContext('2d');
            const imageData = context.getImageData(0, 0, pieChartCanvas.width, pieChartCanvas.height);
            const newCanvas = document.createElement('canvas');
            newCanvas.width = pieChartCanvas.width;
            newCanvas.height = pieChartCanvas.height;
            const newContext = newCanvas.getContext('2d');
            
            // Fill white background
            newContext.fillStyle = 'white';
            newContext.fillRect(0, 0, newCanvas.width, newCanvas.height);
            
            // Draw original chart on top
            newContext.putImageData(imageData, 0, 0);
            
            try {
                // Convert to image and trigger download
                link.href = newCanvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                console.error("Error downloading chart:", error);
                alert("Error downloading chart. Please try again.");
            }
        });
    }

    // Add a function to handle CORS issues if needed
    function addWhiteBackground(canvas) {
        return new Promise((resolve) => {
            const context = canvas.getContext('2d');
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const newCanvas = document.createElement('canvas');
            newCanvas.width = canvas.width;
            newCanvas.height = canvas.height;
            const newContext = newCanvas.getContext('2d');
            
            // Fill white background
            newContext.fillStyle = 'white';
            newContext.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw original chart
            newContext.putImageData(imageData, 0, 0);
            
            resolve(newCanvas.toDataURL('image/png'));
        });
    }

    function createBarChart(poll) {
        const ctx = document.getElementById('barChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: poll.options,
                datasets: [{
                    label: 'Number of Votes',
                    data: poll.votes,
                    backgroundColor: '#36A2EB'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    function displayStatistics(poll) {
        const totalVotes = poll.votes.reduce((a, b) => a + b, 0);
        const maxVotes = Math.max(...poll.votes);
        const maxVoteOption = poll.options[poll.votes.indexOf(maxVotes)];
        
        const statistics = document.getElementById('statistics');
        statistics.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${totalVotes}</div>
                <div class="stat-label">Total Votes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${poll.options.length}</div>
                <div class="stat-label">Total Options</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${maxVotes}</div>
                <div class="stat-label">Highest Votes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${((maxVotes/totalVotes)*100).toFixed(1)}%</div>
                <div class="stat-label">Leading Percentage</div>
            </div>
        `;
    }
}); 