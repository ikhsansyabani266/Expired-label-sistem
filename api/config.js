export default function handler(req, res) {
    // Mengembalikan Environment Variables dari Vercel ke front-end secara dinamis
    res.status(200).json({
        supabaseUrl: process.env.SUPABASE_URL || '',
        supabaseKey: process.env.SUPABASE_KEY || ''
    });
}