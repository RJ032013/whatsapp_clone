const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://ravi:123@cluster0.zemgu0j.mongodb.net/face_attendance';

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    faceDescriptor: { type: [Number], default: [] },
    createdAt: { type: Date, default: Date.now }
});
const Student = mongoose.model('Student', studentSchema);

async function check() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');
        const students = await Student.find();
        console.log('Students count:', students.length);
        students.forEach(s => console.log(`- ${s.name} (${s.category})`));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
check();
