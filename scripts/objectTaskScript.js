// script.js

let feedwebsocket;
let objectwebsocket;

let items = [];


// const host = "127.0.0.1:8000";
const host = "backend.angeloantu.online";


// Function to populate the item list
function populateItemList(items) {
    const it = items.length;
    const itemList = document.querySelector('.item-list');

    // Clear existing items in the list
    itemList.innerHTML = '';

    items.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'item';

        li.innerHTML = 
        `  
            <div class="item-details">
                <span class="item-number">${index + 1}.</span> 
                <span class="item-name">${item.object_name.split("#")[0]}</span>
                <span class="item-mfg">EXP: ${item.expiry}</span>
                <span class="item-mfg">MFG: ${item.mfg}</span>
                <span class="item-mfg">Batch No: ${item.batch_no}</span>
                <span class="item-mfg">COUNT: ${it}</span>
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
// async function sendFeedToServer(video) {
//     const canvas = document.createElement('canvas');
//     const context = canvas.getContext('2d');
    
//     // Connect to the WebSocket
//     feedwebsocket = new WebSocket(`wss://${host}/ws/camera_feed_expiry`);
//     objectwebsocket = new WebSocket(`wss://${host}/ws/packed_products_expiry`);
    
    
//     feedwebsocket.onopen = () => {
//         setInterval(() => {
//             if (video.readyState === 4 && video.videoWidth && video.videoHeight) {
//                 canvas.width = video.videoWidth;
//                 canvas.height = video.videoHeight;
//                 context.drawImage(video, 0, 0, canvas.width, canvas.height);
//                 const imageData = canvas.toDataURL('image/jpeg'); // Capture frame as JPEG

//                 // Send the image data to the WebSocket server
//                 if (feedwebsocket.readyState === WebSocket.OPEN) {
//                     feedwebsocket.send(imageData);
//                 }
//             }
//         }, 250); // Capture and send at a delay
//     };

//     feedwebsocket.onerror = (error) => {
//         console.error('feed WebSocket error:', error);
//     };
    
//     feedwebsocket.onclose = () => {
//         console.log('feed WebSocket connection closed');
//     };

//     feedwebsocket.onmessage = (event) => {
//         // Set the source of the img element to the received image
//         const imageFeed = document.getElementById('cameraFeed');
//         imageFeed.src = event.data; // Set the source to the received image
//     };

//     objectwebsocket.onerror = (error) => {
//         console.log("object socket error", error)
//     }

//     objectwebsocket.onclose = () => {
//         console.log("object socket closed");
//     }

//     objectwebsocket.onmessage = (event) => {
//         const data = JSON.parse(event.data);
//         console.log(data['details']);
//         console.log("product name :",data['product_name']);
//         console.log("name detection : ", data['name_detection']);
//         const count = data['count'];
//         console.log("COUNT : ",count);
//         populateItemList(data['details'],count);
//     }

// }

function playBeep() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'sine'; // Sound wave type
    oscillator.frequency.setValueAtTime(440, context.currentTime); // Frequency in Hz (A4 note)
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2); // Fade out
    oscillator.stop(context.currentTime + 0.2);
}

let beepflag = true;
async function sendFeedToServer(video) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    let feedwebsocket, objectwebsocket;
    const reconnectInterval = 100; // 500 ms

    function connectFeedWebSocket() {
        feedwebsocket = new WebSocket(`wss://${host}/ws/camera_feed_expiry`);
        
        feedwebsocket.onopen = () => {
            console.log('Feed WebSocket connected');
            
            setInterval(() => {
                if (video.readyState === 4 && video.videoWidth && video.videoHeight) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = canvas.toDataURL('image/jpeg'); // Capture frame as JPEG

                    // Send the image data to the WebSocket server
                    if (feedwebsocket.readyState === WebSocket.OPEN) {
                        console.log("image sent");
                        feedwebsocket.send(imageData);
                    }
                }
            }, 100); // Capture and send at a delay
        };

        feedwebsocket.onerror = (error) => {
            console.error('Feed WebSocket error:', error);
        };

        feedwebsocket.onclose = () => {
            console.log('Feed WebSocket connection closed. Reconnecting...');
            setTimeout(connectFeedWebSocket, reconnectInterval);
        };

        feedwebsocket.onmessage = (event) => {
            // Set the source of the img element to the received image
            const imageFeed = document.getElementById('cameraFeed');
            imageFeed.src = event.data; // Set the source to the received image
        };
    }

    function connectObjectWebSocket() {
        objectwebsocket = new WebSocket(`wss://${host}/ws/packed_products_expiry`);

        objectwebsocket.onopen = () => {
            console.log("Object WebSocket connected");
        };

        objectwebsocket.onerror = (error) => {
            console.error("Object WebSocket error:", error);
        };

        objectwebsocket.onclose = () => {
            console.log("Object WebSocket connection closed. Reconnecting...");
            setTimeout(connectObjectWebSocket, reconnectInterval);
        };

        objectwebsocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // console.log(data['details']);
            console.log("Product name:", data['product_name']);
            // console.log("Name detection:", data['name_detection']);
            const count = data['count'];
            // console.log("COUNT:", count);
            populateItemList(data['details']);
            console.log(data['name_detection']);
            if(data['name_detection'] == false && beepflag == true)
            {
                playBeep();
                playBeep();
                playBeep();
                playBeep();
                beepflag = false;
            }
        };
    }

    // Initialize both WebSocket connections
    connectFeedWebSocket();
    connectObjectWebSocket();
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


function finishTask() {
    // Close the WebSocket connection
    if (feedwebsocket) {
        feedwebsocket.close();
        console.log('WebSocket connection closed.');
    }

    if(objectwebsocket){
        feedwebsocket.close();
        console.log('WebSocket connection closed.');
    }

    // Navigate to another page (change "completion.html" to your target page)
     
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
