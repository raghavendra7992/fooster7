// Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose'); // for MongoDB
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const port = process.env.PORT || 3000;
// App setup
const app = express();
app.use(bodyParser.json());

// Database connection
// ... (specific code for chosen database)

// Models
const userSchema = new mongoose.Schema("./models/usermodel.js");
const enquirySchema = new mongoose.Schema("./models/enquiryschema.js");
const User = mongoose.model('User', userSchema);
const Enquiry = mongoose.model('Enquiry', enquirySchema);

// JWT helper functions
const generateToken = (user) => {
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1h', 
      });
      return token;
 };
const verifyToken = (req, res, next) => { 
    const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
 
message: 'Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message:
 
'Invalid token' });
    }

    req.user = decoded; 
    next();
  });
};

// API routes
app.post('/api/users/login', async (req, res) => { 
    const { email, password } = req.body;

    try {
      // Find user by email
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      // Compare password
  
      
  const isMatch = await user.comparePassword(password);
  
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      // Generate JWT token
      const token = generateToken(user);
  
      // Send response with token and user details
      res.json({ token, user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
 });
app.post('/api/users/register', async (req, res) => { 
    const { email, password, role } = req.body;

  try {
    
const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create new user
    const user = new User({ email, password, role });
    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    // Send response with token and user details
    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
 });
app.post('/api/enquiries', async (req, res) => {
    const { name, email, course_interest, phone, message, source } = req.body;

    try {
      // Validate enquiry data
      // ... (add validation rules for required fields and data types)
  
      // Create new enquiry
      const enquiry = new Enquiry({
        name,
        email,
        course_interest,
        phone,
        message,
        source,
      });
      await enquiry.save();
  
      // Send response with enquiry details
      res.json(enquiry);
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: 'Error creating enquiry' });
    }
}); // Public enquiry form
app.put('/api/enquiries/:id/claim', verifyToken, async (req, res) => {
    const { id } = req.params;
    const user = req.user; // Verified user from verifyToken middleware
  
    try {
      // Find enquiry to claim
      const enquiry = await Enquiry.findById(id);
  
      if (!enquiry) {
        return res.status(404).json({ message: 'Enquiry not found' });
      }
  
      // Check if enquiry is already claimed
      if (enquiry.claimed_by) {
        return res.status(400).json({ message: 'Enquiry already claimed' });
      }
  
      // Validate user role
      if (user.role !== 'counselor') {
        return res.status(403).json({ message: 'Unauthorized to claim enquiries' });
      }
  
      // Claim enquiry
      enquiry.claimed_by = user._id;
      enquiry.assigned_at = Date.now();
      await enquiry.save();
  
      // Send response with claimed enquiry details
      res.json(enquiry);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error claiming enquiry' });
    }
 });
app.get('/api/enquiries/unclaimed', verifyToken, async (req, res) => { 
    try {
        const unclaimedEnquiries = await Enquiry.find({ claimed_by: null });
        res.json(unclaimedEnquiries);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching unclaimed enquiries' });
      }
});
app.get('/api/enquiries/claimed', verifyToken, async (req, res) => {
    try {
        const user = req.user; // Authenticated user from verifyToken middleware
    
        const claimedEnquiries = await Enquiry.find({
          claimed_by: user._id,
        });
    
        res.json(claimedEnquiries);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching claimed enquiries' });
      }
 });

// Error handling middleware
app.use((err, req, res, next) => { console.error(err.stack); // Log error for debugging

if (err.name === 'ValidationError') {
  return res.status(400).json({ message: err.message }); // Handle validation errors
}

if (err.name === 'UnauthorizedError') {
  return res.status(401).json({ message: 'Unauthorized' }); // Handle authentication errors
}

// Handle other specific errors as needed

res.status(500).json({ message: 'Something went wrong' }) });

// Server start
app.listen(port, () => { 
    console.log(`Server listening on port ${port}`);
 });
