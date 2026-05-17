const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

//get all plants from database
app.get('/api/plants', async function(req, res) {
    const { data, error } = await supabase.from('plants').select('*');
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json(data);
});

//add a new plant to database
app.post('/api/plants', async function(req, res) {
    const { user_plant_name, species_name, last_watered, image_url, perenual_id, care_level } = req.body;
    const { data, error } = await supabase
        .from('plants')
        .insert([{ user_plant_name, species_name, last_watered, image_url, perenual_id, care_level }])
        .select();
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json({ message: 'Plant added!', plant: data[0] });
});

//update last watered date
app.patch('/api/plants/:id', async function(req, res) {
    const { id } = req.params;
    const { last_watered } = req.body;
    const { data, error } = await supabase
        .from('plants')
        .update({ last_watered })
        .eq('id', id)
        .select();
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json({ message: 'Updated!', plant: data[0] });
});

//search plants by name using Perenual API
app.get('/api/search', async function(req, res) {
    const { name } = req.query;
    if (!name) {
        return res.status(400).json({ error: 'Please provide a plant name' });
    }
    try {
        const response = await fetch('https://perenual.com/api/v2/species-list?key=' + process.env.PERENUAL_API_KEY + '&q=' + name);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch from Perenual API' });
    }
});

// get full care details for a specific plant by ID
app.get('/api/search/details/:id', async function(req, res) {
    const { id } = req.params;
    try {
        const response = await fetch('https://perenual.com/api/v2/species/details/' + id + '?key=' + process.env.PERENUAL_API_KEY);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch plant details' });
    }
});

// identify plant by image using Pl@ntNet API
app.post('/api/identify', async function(req, res) {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
        return res.status(400).json({ error: 'No image provided' });
    }
    try {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([imageBuffer], { type: mimeType || 'image/jpeg' });

        const formData = new FormData();
        formData.append('images', blob, 'plant.jpg');
        formData.append('organs', 'leaf');

        const response = await fetch(
            'https://my-api.plantnet.org/v2/identify/all?api-key=' + process.env.PLANTNET_API_KEY + '&lang=en',
            { method: 'POST', body: formData }
        );
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return res.status(404).json({ error: 'Could not identify plant' });
        }

        const topMatches = data.results.slice(0, 3).map(function(result) {
            return {
                species: result.species.scientificNameWithoutAuthor,
                commonNames: result.species.commonNames,
                score: Math.round(result.score * 100)
            };
        });

        res.json({ matches: topMatches });
    } catch (error) {
        console.error('Pl@ntNet error:', error);
        res.status(500).json({ error: 'Failed to identify plant' });
    }
});

app.listen(PORT, function() {
    console.log('Server running on http://localhost:' + PORT);
});