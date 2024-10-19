// script.js

let websocket;

const items = [
    {
        "name": "Apple",
        "qty": 2,
        "quality": "Fresh", // Quality for fruits
        "image": "path/to/image1.jpg", // Replace with actual image paths
        "type": "fruit" // Indicate type
    },
    {
        "name": "Canned Beans",
        "qty": 5,
        "exp": "2025-01-15", // Expiration date for packaged items
        "image": "path/to/image2.jpg", // Replace with actual image paths
        "type": "packaged" // Indicate type
    }
    // Add more items as needed
];



// Function to populate the item list
function populateItemList(items) {
    const itemList = document.querySelector('.item-list');

    items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'item';

        li.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="item-image">
            <div class="item-details">
                <span class="item-name">${item.name}</span>
                ${item.type === 'packaged' ? `<span class="item-mfg">EXP: ${item.exp}</span>` : ''}
                ${item.type === 'fruit' ? `<span class="item-quality">Quality: ${item.quality}</span>` : ''}
            </div>
        `;

        itemList.appendChild(li);
    });
}


function startCamera() {
    const video = document.getElementById('previewFeed'); // Get the preview feed video element

    // Request access to the camera with preference for the rear camera on mobile devices
    const constraints = {
        video: {
            facingMode: {
                ideal: "environment" // Prefer rear camera but allow fallback
            }
        }
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            // Set the video source to the camera stream
            video.srcObject = stream;  // Display the camera feed in the preview feed
            // Hide the modal after allowing access (optional if using a modal)
            document.getElementById('cameraModal').style.display = 'none';
            sendFeedToServer(video);  // Sends the feed to the server via WebSocket
        })
        .catch(error => {
            console.error('Error accessing camera: ', error);
            // Fallback to default camera if error
            const fallbackConstraints = { video: true }; // Default camera
            navigator.mediaDevices.getUserMedia(fallbackConstraints)
                .then(stream => {
                    video.srcObject = stream;  // Display fallback camera feed in the preview
                    document.getElementById('cameraModal').style.display = 'none';
                })
                .catch(fallbackError => {
                    console.error('Error accessing default camera: ', fallbackError);
                });
        });
}


// Function to show the camera modal
function showCameraModal() {
    document.getElementById('cameraModal').style.display = 'flex';
}

// to send feed to the server
async function sendFeedToServer(video) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Connect to the WebSocket
    websocket = new WebSocket('ws://localhost:8000/ws/camera_feed');
    
    websocket.onopen = () => {
        setInterval(() => {
            if (video.readyState === 4 && video.videoWidth && video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg'); // Capture frame as JPEG

                // Send the image data to the WebSocket server
                if (websocket.readyState === WebSocket.OPEN) {
                    websocket.send(imageData);
                }
            }
        }, 100); // Capture and send every second
    };

    websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    websocket.onclose = () => {
        console.log('WebSocket connection closed');
    };

    websocket.onmessage = (event) => {
        // Set the source of the img element to the received image
        const imageFeed = document.getElementById('cameraFeed');
        imageFeed.src = event.data; // Set the source to the received image
    };

}


function makeDraggableAndResizable() {
    const previewBox = document.getElementById('cameraPreview');
    const resizeHandle = document.querySelector('.resize-handle');

    let offsetX = 0, offsetY = 0, isDragging = false;
    let isResizing = false;

    // Make the preview box draggable
    previewBox.addEventListener('mousedown', (event) => {
        if (event.target === resizeHandle) return; // Ignore if resizing
        isDragging = true;
        offsetX = event.clientX - previewBox.getBoundingClientRect().left;
        offsetY = event.clientY - previewBox.getBoundingClientRect().top;
        previewBox.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const newX = event.clientX - offsetX;
            const newY = event.clientY - offsetY;
            previewBox.style.left = `${newX}px`;
            previewBox.style.top = `${newY}px`;
        }
        if (isResizing) {
            const newWidth = event.clientX - previewBox.getBoundingClientRect().left;
            const newHeight = event.clientY - previewBox.getBoundingClientRect().top;
            previewBox.style.width = `${newWidth}px`;
            previewBox.style.height = `${newHeight}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        isResizing = false;
        previewBox.style.cursor = 'grab';
    });

    // Make the preview box resizable
    resizeHandle.addEventListener('mousedown', (event) => {
        isResizing = true;
        event.preventDefault(); // Prevent text selection during resizing
    });
}


// Event listeners for modal buttons
document.getElementById('allowCameraBtn').addEventListener('click', startCamera);
document.getElementById('denyCameraBtn').addEventListener('click', function() {
    alert('Camera access denied. The camera feed will not be displayed.');
});

// Load items on page load
window.onload = function() {
    populateItemList(items);
    showCameraModal();
    makeDraggableAndResizable();
};
