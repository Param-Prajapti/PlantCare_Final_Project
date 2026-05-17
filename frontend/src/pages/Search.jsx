import { useState } from 'react';
import { toast } from 'react-toastify';

function Search() {
    const [searchName, setSearchName] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPlant, setSelectedPlant] = useState(null);
    const [plantDetails, setPlantDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [identifying, setIdentifying] = useState(false);
    const [identifyResults, setIdentifyResults] = useState([]);
    const [imagePreview, setImagePreview] = useState(null);

    async function handleSearch() {
        if (!searchName) return;
        setLoading(true);
        setSearchResults([]);
        setSelectedPlant(null);

        await fetch('https://plant-care-final-project.vercel.app/api/search?name=' + searchName)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                setSearchResults(data.data || []);
                setLoading(false);
            })
            .catch(function (err) {
                console.error('Search error:', err);
                setLoading(false);
            });
    }

    function imageChange(e) {
        var file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setIdentifyResults([]);
    }

    async function identifyPlant() {
        if (!imageFile) return;
        setIdentifying(true);
        setIdentifyResults([]);

        var timeout = setTimeout(function () {
            setIdentifying(false);
            toast.error('Request timed out. Try a smaller or clearer photo.');
        }, 30000);

        var reader = new FileReader();
        reader.onloadend = async function () {
            var base64 = reader.result;

            await fetch('https://plant-care-final-project.vercel.app/api/identify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64, mimeType: imageFile.type })
            })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    clearTimeout(timeout);
                    if (data.matches) {
                        setIdentifyResults(data.matches);
                    } else {
                        toast.error('Could not identify plant. Try a clearer photo.');
                    }
                    setIdentifying(false);
                })
                .catch(function (err) {
                    clearTimeout(timeout);
                    toast.error('Error identifying plant. Try again.');
                    setIdentifying(false);
                });
        };
        reader.readAsDataURL(imageFile);
    }

    async function selectPlant(plant) {
        setSelectedPlant(plant);
        setPlantDetails(null);

        await fetch('https://plant-care-final-project.vercel.app/api/search/details/' + plant.id)
            .then(function (res) { return res.json(); })
            .then(function (details) {
                var hasWatering = details.watering && !details.watering.includes('Upgrade');
                var hasSunlight = details.sunlight && details.sunlight.length > 0;
                if (hasWatering && hasSunlight) {
                    setPlantDetails(details);
                }
            })
            .catch(function (err) {
                console.error('Details error:', err);
            });
    }

    async function handleIdentifySelect(match) {
        setIdentifyResults([]);
        setLoading(true);

        const genus = match.species.split(' ')[0];
        setSearchName(genus);

        await fetch('https://plant-care-final-project.vercel.app/api/search?name=' + genus)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                var results = data.data || [];
                let filtered = [];
                for (var i = 0; i < results.length; i++) {
                    if (results[i].id <= 3000) {
                        filtered.push(results[i]);
                    }
                }
                setSearchResults(filtered);
                findBestMatch(filtered);
                setLoading(false);
            })
            .catch(function (err) {
                console.error('Search error:', err);
                toast.error('Could not find care details. Try searching by name.');
                setLoading(false);
            });
    }

    function findBestMatch(results) {
        let index = 0;

        async function tryNext() {
            if (index >= results.length) return;
            var plant = results[index];
            index++;

            await fetch('https://plant-care-final-project.vercel.app/api/search/details/' + plant.id)
                .then(function (res) { return res.json(); })
                .then(function (details) {
                    const hasWatering = details.watering && !details.watering.includes('Upgrade');
                    const hasSunlight = details.sunlight && details.sunlight.length > 0;
                    if (hasWatering && hasSunlight) {
                        setSelectedPlant(plant);
                        setPlantDetails(details);
                    } else {
                        tryNext();
                    }
                })
                .catch(function () { tryNext(); });
        }

        tryNext();
    }

    async function addPlant() {
        if (!selectedPlant) return;

        const plantToAdd = {
            user_plant_name: selectedPlant.common_name,
            species_name: selectedPlant.scientific_name ? selectedPlant.scientific_name[0] : '',
            last_watered: new Date().toISOString().split('T')[0],
            image_url: imagePreview || '',
            perenual_id: selectedPlant.id,
            care_level: plantDetails ? plantDetails.care_level : 'Medium'
        };

        await fetch('https://plant-care-final-project.vercel.app/api/plants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plantToAdd)
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                toast.success(data.plant.user_plant_name + ' added to your collection!');
                setSelectedPlant(null);
                setSearchResults([]);
                setSearchName('');
                setImagePreview(null);
                setImageFile(null);
            })
            .catch(function (err) {
                toast.error('Error adding plant. Please try again.');
            });
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>Find a Plant 🔍</h1>
                <p>Search by name or upload a photo to identify your plant</p>
            </div>

            <div className="search-box">
                <h2>Search by Name</h2>
                <div className="search-input-row">
                    <input
                        type="text"
                        placeholder="e.g. pothos, aloe, rose..."
                        value={searchName}
                        onChange={function (e) { setSearchName(e.target.value); }}
                        onKeyDown={function (e) { if (e.key === 'Enter') handleSearch(); }}
                    />
                    <button onClick={handleSearch}>Search</button>
                </div>
            </div>

            <div className="search-box">
                <h2>Identify by Photo 📷</h2>
                <p className="section-hint">Upload a photo of a leaf or the whole plant</p>

                <div className="image-upload-row">
                    <label className="file-upload-label">
                        📷 {imageFile ? imageFile.name : 'Choose Photo'}
                        <input type="file" accept="image/*" onChange={imageChange} />
                    </label>
                    {imageFile && (
                        <button onClick={identifyPlant} disabled={identifying}>
                            {identifying ? 'Analyzing...' : 'Identify Plant'}
                        </button>
                    )}
                </div>

                {identifying && (
                    <div className="identifying-status">
                        <p>🌿 Scanning plant features... this may take few seconds</p>
                    </div>
                )}

                {imagePreview && (
                    <img src={imagePreview} alt="Plant preview" className="image-preview" />
                )}

                {identifyResults.length > 0 && (
                    <div className="identify-results">
                        <h3>Best Matches — search for one manually:</h3>
                        {identifyResults.map(function (match, i) {
                            return (
                                <div
                                    key={i}
                                    className="result-item"
                                    onClick={function () { handleIdentifySelect(match); }}
                                >
                                    <strong>{match.commonNames ? match.commonNames[0] : match.species}</strong>
                                    <span>{match.species} — {match.score}% match</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {loading && <p className="loading">Searching...</p>}

            {searchResults.length > 0 && (
                <div className="results-section">
                    <h2>Search Results</h2>
                    <div className="results-list">
                        {searchResults.map(function (plant) {
                            return (
                                <div
                                    key={plant.id}
                                    className={'result-item' + (selectedPlant && selectedPlant.id === plant.id ? ' selected' : '')}
                                    onClick={function () { selectPlant(plant); }}
                                >
                                    <strong>{plant.common_name}</strong>
                                    <span>{plant.scientific_name ? plant.scientific_name[0] : ''}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {selectedPlant && (
                <div className="selected-plant">
                    <h2>{selectedPlant.common_name}</h2>
                    <p className="species-name">
                        {selectedPlant.scientific_name ? selectedPlant.scientific_name[0] : ''}
                    </p>

                    {plantDetails ? (
                        <div className="care-info">
                            <div className="care-item">
                                <span className="care-icon">💧</span>
                                <span>{plantDetails.watering || 'Not available'}</span>
                            </div>
                            <div className="care-item">
                                <span className="care-icon">☀️</span>
                                <span>{plantDetails.sunlight ? plantDetails.sunlight[0] : 'Not available'}</span>
                            </div>
                            <div className="care-item">
                                <span className="care-icon">🌱</span>
                                <span>{plantDetails.care_level || 'Not available'}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="section-hint">
                            Care details not available for this plant on the free plan.
                        </p>
                    )}

                    <button className="add-button" onClick={addPlant}>
                        Add to My Plants
                    </button>
                </div>
            )}
        </div>
    );
}

export default Search;