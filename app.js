const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// DB Connection using the "live" database URI from your main app
// Using the URI from the root .env if available
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ravi:123@cluster0.zemgu0j.mongodb.net/whatsapp_sender';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to LIVE MongoDB Database (whatsapp_sender)'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Models - Mapped to the main app's "contacts" collection
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String }, // Optional in attendance context but present in DB
    category: { type: String, required: true },
    faceDescriptor: { type: [Number], default: [] },
    createdAt: { type: Date, default: Date.now }
}, { collection: 'contacts' }); // Explicitly use 'contacts' collection
const Contact = mongoose.model('Contact', contactSchema);

const attendanceSchema = new mongoose.Schema({
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    status: { type: String, enum: ['Present', 'Absent'], default: 'Absent' },
    timestamp: { type: Date, default: Date.now }
});
const Attendance = mongoose.model('Attendance', attendanceSchema);

// Routes
app.get('/', async (req, res) => {
    try {
        const stats = {
            students: await Contact.countDocuments(),
            registered: await Contact.countDocuments({ faceDescriptor: { $exists: true, $not: { $size: 0 } } })
        };
        res.render('index', { stats });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Face Registration View
app.get('/register', async (req, res) => {
    try {
        const students = await Contact.find().sort({ name: 1 });
        console.log(`[DEBUG] Found ${students.length} contacts for register page`);
        res.render('register', { students });
    } catch (err) {
        console.error('[DEBUG] Error fetching contacts:', err);
        res.status(500).send('Server Error');
    }
});

// Auto Scanner View
app.get('/scan', (req, res) => {
    res.render('scan');
});

// API: Register Student (Updates/Creates in contacts collection)
app.post('/api/students', async (req, res) => {
    try {
        const { name, category } = req.body;
        // Search if contact exists by name and category (simple check)
        // or just create new if phone is missing
        await Contact.create({ name, category, phone: 'manual_' + Date.now() });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API: Save Face Data
app.post('/api/face/register', async (req, res) => {
    try {
        const { studentId, descriptor } = req.body;
        await Contact.findByIdAndUpdate(studentId, { faceDescriptor: descriptor });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API: Get Registered Students for Scanner
app.get('/api/face/descriptors', async (req, res) => {
    try {
        const students = await Contact.find({
            faceDescriptor: { $exists: true, $not: { $size: 0 } }
        }).select('name faceDescriptor');
        res.json({ success: true, data: students });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API: Mark Attendance
app.post('/api/attendance', async (req, res) => {
    try {
        const { studentId } = req.body;
        const today = new Date().toISOString().split('T')[0];

        await Attendance.findOneAndUpdate(
            { contactId: studentId, date: today },
            { status: 'Present' },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = 4000; // Standalone port
app.listen(PORT, () => console.log(`🚀 Standalone AI Face App: http://localhost:${PORT}`));
