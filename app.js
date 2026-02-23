require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// DB Connection using the "live" database URI from your main app
// If the variable is not found in .env, it defaults to a local one
const MONGODB_URI = 'mongodb+srv://ravi:123@cluster0.zemgu0j.mongodb.net/face_attendance';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to LIVE MongoDB Database'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Models
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    faceDescriptor: { type: [Number], default: [] },
    createdAt: { type: Date, default: Date.now }
});
const Student = mongoose.model('Student', studentSchema);

const attendanceSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    status: { type: String, enum: ['Present', 'Absent'], default: 'Absent' },
    timestamp: { type: Date, default: Date.now }
});
const Attendance = mongoose.model('Attendance', attendanceSchema);

// Routes
app.get('/', async (req, res) => {
    try {
        const stats = {
            students: await Student.countDocuments(),
            registered: await Student.countDocuments({ faceDescriptor: { $exists: true, $not: { $size: 0 } } })
        };
        res.render('index', { stats });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Face Registration View
app.get('/register', async (req, res) => {
    try {
        const students = await Student.find().sort({ name: 1 });
        res.render('register', { students });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Auto Scanner View
app.get('/scan', (req, res) => {
    res.render('scan');
});

// API: Register Student
app.post('/api/students', async (req, res) => {
    try {
        const { name, category } = req.body;
        await Student.create({ name, category });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API: Save Face Data
app.post('/api/face/register', async (req, res) => {
    try {
        const { studentId, descriptor } = req.body;
        await Student.findByIdAndUpdate(studentId, { faceDescriptor: descriptor });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API: Get Registered Students for Scanner
app.get('/api/face/descriptors', async (req, res) => {
    try {
        const students = await Student.find({
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
            { studentId, date: today },
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
