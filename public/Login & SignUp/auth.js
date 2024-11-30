// Function to handle signup
function handleSignup() {
    const firstName = document.getElementById("firstname").value.trim();
    const lastName = document.getElementById("lastname").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confim_password").value.trim();

    // Validate fields
    if (!firstName || !lastName || !username || !password || !confirmPassword) {
        alert("All fields are required!");
        return false;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
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
        alert("User already exists! Please use a different username.");
        return false;
    }

    localStorage.setItem(username, JSON.stringify(user));
    alert("Signup successful! You can now login.");
    // Redirect to login page
    window.location.href = "../Login & SignUp/jio_login.html";
    return false;
}

// Function to handle login
function handleLogin() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Please enter your username and password!");
        return false;
    }

    const user = localStorage.getItem(username);

    if (!user) {
        alert("User not found! Please sign up first.");
        return false;
    }

    const parsedUser = JSON.parse(user);

    if (parsedUser.password !== password) {
        alert("Incorrect password!");
        return false;
    }

    alert(`Welcome back, ${parsedUser.firstName} ${parsedUser.lastName}!`);
    // Redirect to the main web app
    window.location.href = "../index.html";
    return false;
}


