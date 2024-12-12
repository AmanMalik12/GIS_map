function showPopup(message, buttonLabel, redirectUrl) {
    // Create the popup content
    const content = `
        <div style="position: relative; text-align: center; width: 360px; margin: auto; border: 1px solid #ccc; border-radius: 8px; background: #fff; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); padding: 15px;">
            <!-- Logo -->
            <img id="popup-image" src="../image/jio.png" alt="Jio Logo" 
                 style="width: 60px; height: 60px; border-radius: 50%; 
                        display: block; margin: 0 auto; 
                        border: 2px solid white; background: white; box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);">
            
            <!-- Popup Content -->
            <div style="text-align: center; font-family: Arial, sans-serif; margin-top: 10px;">
                <strong>${message}</strong><br><br>
                <button id="popup-button" style="background: #4caf50; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">${buttonLabel}</button>
            </div>
        </div>
    `;

    // Create the popup container
// Create the popup container
const popupContainer = document.createElement('div');
popupContainer.id = 'popup-container';
popupContainer.style.position = 'fixed';
popupContainer.style.top = '16%'; /* This centers it vertically */
popupContainer.style.left = '50%'; /* This centers it horizontally */
popupContainer.style.transform = 'translate(-50%, -50%)'; /* Adjust both horizontally and vertically */
popupContainer.style.zIndex = '1000'; /* Ensure the popup stays on top */
popupContainer.innerHTML = content;

document.body.appendChild(popupContainer);


    // Add functionality to the button
    document.getElementById('popup-button').onclick = function () {
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            document.body.removeChild(popupContainer); // Close the popup
        }
    };
}


// Function to handle signup
function handleSignup() {
    const firstName = document.getElementById("firstname").value.trim();
    const lastName = document.getElementById("lastname").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confim_password").value.trim();

    // Validate fields
    if (!firstName || !lastName || !username || !password || !confirmPassword) {
        showPopup("All fields are required!", "Close");
        return false;
    }

    if (password !== confirmPassword) {
        showPopup("Passwords do not match!", "Close");
        return false;
    }

    // Save user details to localStorage
    const user = {
        firstName,
        lastName,
        username,
        password,
    };

    if (localStorage.getItem(username)) {
        showPopup("User already exists! Please use a different username.", "Close");
        return false;
    }

    localStorage.setItem(username, JSON.stringify(user));
    showPopup("Signup successful! You can now login.", "Go to Login", "../Login & SignUp/jio_login.html");
    return false;
}

// Function to handle login
function handleLogin() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        showPopup("Please enter your username and password!", "Close");
        return false;
    }

    const user = localStorage.getItem(username);

    if (!user) {
        showPopup("User not found! Please sign up first.", "Close");
        return false;
    }

    const parsedUser = JSON.parse(user);

    if (parsedUser.password !== password) {
        showPopup("Incorrect password!", "Close");
        return false;
    }

    showPopup(`Welcome, ${parsedUser.firstName} ${parsedUser.lastName}!`, "Continue", "../index.html");
    return false;
}
