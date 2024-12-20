const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "replace_this_with_a_secure_key",
        resave: false,
        saveUninitialized: true,
    })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const USERS = [
    {
        id: 1,
        username: "AdminUser",
        email: "admin@example.com",
        password: bcrypt.hashSync("admin123", SALT_ROUNDS), //In a database, you'd just store the hashes, but for 
                                                            // our purposes we'll hash these existing users when the 
                                                            // app loads
        role: "admin",
    },
    {
        id: 2,
        username: "RegularUser",
        email: "user@example.com",
        password: bcrypt.hashSync("user123", SALT_ROUNDS),
        role: "user", // Regular user
    },
];

function getAllUsers() {
    return [
        { name: "User1", email: "admin@example.com", role: "admin" },
        { name: "User2", email:"user@example.com", role: "user" },
    ];
}

// GET /login - Render login form
app.get("/login", (_request, response) => {
    response.render("login");
});

// POST /login - Allows a user to login
app.post("/login", (request, response) => {
    const { email, password } = request.body;
    if (!email || !password) {
        return response.status(400).send("Please fill the required fields");
    }

    const user = USERS.find((user) => user.email === email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return response.status(401).send("Invalid credentials");
    }

    request.session.user = user;
    response.redirect("/landing");

});

// GET /signup - Render signup form
app.get("/signup", (_request, response) => {
    response.render("signup");
});

// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
    const { username, email, password } = request.body;
    if (!username || !email || !password) {
        return response.status(400).send("Please fill in all required fields");
    }

    const existingUser = USERS.find((user) => user.email === email);
    if (existingUser) {
        return response.status(400).send("User already exists");
    }

    const id = USERS.length + 1;
    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    const newUser = { id, username, email, password: hashedPassword, role: "user" };
    USERS.push(newUser);
    response.redirect("/login");
    
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
    if (request.session.user) {
        return response.redirect("/landing");
    }
    response.render("index");
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) => {
    const user = request.session.user;
    if (!user) {
        return response.redirect("/login");
    }

    const USERS = (user && user.role === "admin") ? getAllUsers() : null; 

    // Render the landing page with user and USERS
    response.render("landing", { user, USERS });
});

// POST /logout - Logs out the user
app.post('/logout', (request, response) => {
    request.session.destroy();
    response.redirect('/login');
  });

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
