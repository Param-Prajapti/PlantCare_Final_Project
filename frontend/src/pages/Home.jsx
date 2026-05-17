import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function Home() {
    const [plants, setPlants] = useState([]);
    const [plantDetails, setPlantDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [editingWatered, setEditingWatered] = useState(null);

    useEffect(function () {
        async function loadPlants() {
            await fetch('http://localhost:3000/api/plants')
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    setPlants(data);

                    for (var i = 0; i < data.length; i++) {
                        var plant = data[i];
                        if (plant.perenual_id) {
                            fetchPlantDetails(plant.perenual_id);
                        }
                    }
                    setLoading(false);
                })
                .catch(function (err) {
                    console.error('Error loading plants:', err);
                    setLoading(false);
                });
        }

        loadPlants();
    }, []);

    async function fetchPlantDetails(perenualId) {
        await fetch('http://localhost:3000/api/search/details/' + perenualId)
            .then(function (res) { return res.json(); })
            .then(function (details) {
                const hasWatering = details.watering && !details.watering.includes('Upgrade');
                const hasSunlight = details.sunlight && details.sunlight.length > 0;
                if (hasWatering || hasSunlight) {
                    setPlantDetails(function (prev) {
                        var updated = Object.assign({}, prev);
                        updated[perenualId] = details;
                        return updated;
                    });
                }
            });
    }

    async function handleWateredChange(plantId, newDate) {
        await fetch('http://localhost:3000/api/plants/' + plantId, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ last_watered: newDate })
        })
            .then(function (res) {
                if (res.ok) {
                    setPlants(function (prev) {
                        return prev.map(function (p) {
                            if (p.id === plantId) {
                                return Object.assign({}, p, { last_watered: newDate });
                            }
                            return p;
                        });
                    });
                    setEditingWatered(null);
                }
            })
            .catch(function (err) {
                console.error('Error updating watered date:', err);
            });
    }

    function getChartData() {
        let frequent = 0;
        let average = 0;
        let minimum = 0;
        let unknown = 0;

        for (var i = 0; i < plants.length; i++) {
            var details = plantDetails[plants[i].perenual_id];
            var watering = details ? details.watering : null;

            if (!watering || watering.includes('Upgrade')) {
                unknown++;
            } else if (watering.toLowerCase() === 'frequent') {
                frequent++;
            } else if (watering.toLowerCase() === 'average') {
                average++;
            } else if (watering.toLowerCase() === 'minimum') {
                minimum++;
            } else {
                unknown++;
            }
        }

        return {
            labels: ['Frequent', 'Average', 'Minimum', 'Unknown'],
            datasets: [{
                data: [frequent, average, minimum, unknown],
                backgroundColor: ['#1a73e8', '#2d6a4f', '#e9a800', '#aaaaaa'],
                borderWidth: 2
            }]
        };
    }

    if (loading) {
        return <p className="loading">Loading your plants...</p>;
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1>My Plants 🌱</h1>   
            </div>

            {plants.length === 0 ? (
                <div className="empty-state">
                    <p>You haven't added any plants yet!</p>
                    <a href="/search">Search for a plant to get started →</a>
                </div>
            ) : (
                <div className="plant-grid">
                    {plants.map(function (plant) {
                        var details = plantDetails[plant.perenual_id];
                        return (
                            <div key={plant.id} className="plant-card">
                                <div className="plant-card-image">
                                    {plant.image_url ? (
                                        <img src={plant.image_url} alt={plant.user_plant_name} />
                                    ) : (
                                        <div className="plant-card-placeholder">🌿</div>
                                    )}
                                </div>

                                <div className="plant-card-body">
                                    <div className="plant-card-header">
                                        <h2>{plant.user_plant_name}</h2>
                                        <span className={'badge badge-' + (plant.care_level || 'easy').toLowerCase()}>
                                            {plant.care_level || 'Easy'}
                                        </span>
                                    </div>

                                    <p className="species-name">{plant.species_name}</p>

                                    <div className="care-info">
                                        <div className="care-item">
                                            <span className="care-icon">💧</span>
                                            <span>{details ? details.watering : 'Not available'}</span>
                                        </div>

                                        <div className="care-item">
                                            <span className="care-icon">☀️</span>
                                            <span>{details && details.sunlight ? details.sunlight[0] : 'Not available'}</span>
                                        </div>

                                        <div className="care-item">
                                            <span className="care-icon">📅</span>
                                            {editingWatered === plant.id ? (
                                                <input
                                                    type="date"
                                                    defaultValue={plant.last_watered || ''}
                                                    max={new Date().toISOString().split('T')[0]}
                                                    onChange={function (e) { handleWateredChange(plant.id, e.target.value); }}
                                                    onBlur={function () { setEditingWatered(null); }}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span
                                                    className="watered-date"
                                                    onClick={function () { setEditingWatered(plant.id); }}
                                                >
                                                    {plant.last_watered ? 'Last watered: ' + plant.last_watered : 'Set last watered date'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {plants.length > 0 && (
                <div className="chart-section">
                    <h2> Watering Overview</h2>
                    <p className="section-hint">Breakdown of watering needs across your plants</p>
                    <div className="chart-container">
                        <Doughnut
                            data={getChartData()}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { position: 'bottom' }
                                }
                            }}
                        />
                    </div>
                    <div className="watering-legend">
                        <h3>Watering Frequency Guide</h3>
                        <div className="legend-item">
                            <span className="legend-dot frequent"></span>
                            <div>
                                <strong>Frequent</strong> — Every 3-5 days. Plant needs consistent moisture, soil should not dry out.
                            </div>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot average"></span>
                            <div>
                                <strong>Average</strong> — Every 7-14 days. Water when top inch of soil is dry.
                            </div>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot minimum"></span>
                            <div>
                                <strong>Minimum</strong> — Every 14-28 days. Drought tolerant, let soil dry out completely between waterings.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;