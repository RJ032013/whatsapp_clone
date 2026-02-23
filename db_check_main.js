const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://ravi:123@cluster0.zemgu0j.mongodb.net/whatsapp_sender';

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    category: { type: String, default: '1st' },
    faceDescriptor: { type: [Number], default: [] }
});
const Contact = mongoose.model('Contact', contactSchema);

async function check() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to whatsapp_sender DB');
        const contacts = await Contact.find();
        console.log('Contacts count:', contacts.length);
        contacts.slice(0, 10).forEach(c => console.log(`- ${c.name} (${c.category})`));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
check();
