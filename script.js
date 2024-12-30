// Step 1: Initialize Google Sign-In
window.onload = () => {
    window.google.accounts.id.initialize({
        client_id: "147934510488-allie69121uoboqbr26nhql7u0205res.apps.googleusercontent.com",
        callback: handleCredentialResponse,
        scope: "https://www.googleapis.com/auth/drive.file"
    });

    window.google.accounts.id.renderButton(
        document.querySelector(".g_id_signin"),
        { theme: "outline", size: "large" }
    );
};

// Step 2: Handle User Sign-In
function handleCredentialResponse(response) {
    const idToken = response.credential;
    console.log("Encoded JWT ID token:", idToken);
    alert("Sign-In successful!");

    window.localStorage.setItem("google_id_token", idToken);
    document.getElementById("fileInput").style.display = "inline-block";
    document.getElementById("uploadBtn").disabled = false;
}

// Step 3: Display Selected Files and Allow Highlighting
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");

let selectedFiles = [];

fileInput.addEventListener("change", event => {
    fileList.innerHTML = ""; // Clear previous list
    Array.from(event.target.files).forEach((file, index) => {
        const fileItem = document.createElement("div");
        fileItem.classList.add("file-item");
        
        // Display file name and make it clickable to highlight
        const fileName = document.createElement("span");
        fileName.textContent = file.name;
        fileName.classList.add("file-name");
        fileName.onclick = () => toggleFileSelection(fileItem, file);  // Toggle selection on click
        fileItem.appendChild(fileName);
        
        fileList.appendChild(fileItem);
    });
});

// Step 4: Handle File Upload
const uploadBtn = document.getElementById("uploadBtn");
const uploadStatus = document.getElementById("uploadStatus");

uploadBtn.addEventListener("click", () => {
    const files = fileInput.files;

    if (!files.length) {
        alert("Please select at least one file to upload.");
        return;
    }

    if (!confirm("Are you sure you want to upload the selected files?")) {
        return;
    }

    const idToken = getIdToken();
    if (!idToken) {
        alert("Please sign in first.");
        return;
    }

    Array.from(files).forEach(file => {
        // Provide feedback to the user
        uploadStatus.textContent = `Uploading ${file.name}...`;

        // Upload file to Google Drive
        uploadFileToGoogleDrive(file, idToken);
    });
});

// Function to Upload File to Google Drive
function uploadFileToGoogleDrive(file, idToken) {
    console.log("Preparing to upload:", file.name);

    // Create form data
    const formData = new FormData();
    formData.append("file", file);

    // Send the file to Google Drive using the Google API
    const uploadRequest = new XMLHttpRequest();
    uploadRequest.open("POST", "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart");
    uploadRequest.setRequestHeader("Authorization", `Bearer ${idToken}`);

    // Monitor upload progress
    uploadRequest.upload.addEventListener("progress", event => {
        if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            uploadStatus.textContent = `Uploading: ${Math.round(progress)}%`;
        }
    });

    // Handle upload completion
    uploadRequest.onload = () => {
        if (uploadRequest.status === 200) {
            console.log(`File "${file.name}" uploaded successfully.`);
            uploadStatus.textContent = `File "${file.name}" uploaded successfully!`;
        } else {
            console.error("File upload failed:", uploadRequest.statusText);
            uploadStatus.textContent = `Error uploading file.`;
        }
    };

    // Handle errors
    uploadRequest.onerror = () => {
        console.error("Request error:", uploadRequest.statusText);
        uploadStatus.textContent = `Error uploading file.`;
    };

    // Send the file
    uploadRequest.send(formData);
}

// Get ID Token from LocalStorage
function getIdToken() {
    return window.localStorage.getItem("google_id_token");
}

// Function to toggle file selection (highlight)
function toggleFileSelection(fileItem, file) {
    fileItem.classList.toggle("highlighted");

    // Add or remove the file from the selectedFiles array based on whether it's highlighted
    if (fileItem.classList.contains("highlighted")) {
        selectedFiles.push(file);
    } else {
        selectedFiles = selectedFiles.filter(selectedFile => selectedFile !== file);
    }
}

// Function to delete selected files
deleteSelectedBtn.addEventListener("click", () => {
    if (selectedFiles.length === 0) {
        alert("No files selected for deletion.");
        return;
    }

    if (!confirm("Are you sure you want to delete the selected files?")) {
        return;
    }

    // Remove the selected files from the file input list and update UI
    selectedFiles.forEach(file => {
        const fileItems = document.querySelectorAll(".file-item");
        fileItems.forEach(fileItem => {
            if (fileItem.textContent === file.name) {
                fileItem.remove();  // Remove the file item from the list
            }
        });
    });

    // Clear the selected files array and reset the input
    selectedFiles = [];
    fileInput.value = ""; // Clear file input
});
