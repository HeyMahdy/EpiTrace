import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import query from "../../config/db.js";

export async function registerUser(req, res) {
  try {
    // 1. Extract fields from the request body
    const { email, password, rePassword } = req.body;

    // 2. Basic Validation
    if (!email || !password || !rePassword) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (password !== rePassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // 3. Check if user already exists
    const userExists = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // 4. Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Insert into Database
    const insertQuery = `
      INSERT INTO users (email, password) 
      VALUES ($1, $2) 
      RETURNING id, email, created_at;
    `;
    const result = await query(insertQuery, [email, passwordHash]);
    const newUser = result.rows[0];

    const token = jwt.sign(
      {
        userId: newUser.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.status(201).json({
      message: "User registered successfully",
      token: token,
      user: {
        id: newUser.id,
        email: newUser.email,
        joinedAt: newUser.created_at,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    // 1. Basic Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 2. Find user in Database
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    // 3. If user doesn't exist OR password doesn't match, send the SAME error.
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 4. Compare Passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 5. Generate JWT
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        last_updated: user.updated_at
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}