import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for fetching places
app.post('/api/places', async (req, res) => {
  const { location, filter } = req.body;

  if (!location || typeof location !== 'string') {
    return res.status(400).json({ error: 'Invalid location provided' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

    const prompt = `You are a travel expert. Provide exactly 10 recommended places to visit in ${location} for ${filter} travelers.
For each place, include:
1. Name (real, specific places)
2. Google Maps link (format: https://www.google.com/maps/place/Place+Name)
3. Approximate distance from city center (e.g., "5km from center")
4. Recommended transportation method

Return ONLY a valid JSON array with these properties for each place:
[
  {
    "name": "Place Name",
    "mapLink": "https://www.google.com/maps/place/...",
    "distance": "Xkm from center",
    "travelMode": "Transport method"
  }
]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    let places;
    try {
      // Try to parse the response directly
      const jsonMatch = responseText.match(/\[.*\]/s);
      if (jsonMatch) {
        places = JSON.parse(jsonMatch[0]);
      } else {
        places = JSON.parse(responseText);
      }
    } catch (e) {
      console.error('Failed to parse response:', responseText);
      throw new Error('Failed to parse API response');
    }

    if (!Array.isArray(places)) {
      throw new Error('Invalid response format from Gemini API');
    }

    // Ensure we have exactly 10 places
    places = places.slice(0, 10).map(place => ({
      ...place,
      rating: (Math.random() * 2 + 3).toFixed(1) // Random rating 3.0-5.0
    }));

    res.json({ places });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({
      error: 'Unable to fetch travel information',
      details: err.message
    });
  }
});

// Serve the main HTML file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});