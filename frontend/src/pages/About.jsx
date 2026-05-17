function About() {
    return (
        <div className="page">
            <div className="page-header">
                <h1>About PlantCare 🌿</h1>
            </div>

            <div className="about-section">
                <h2>The Problem</h2>
                <p>
                    As someone who ownes a lot of indoor plants, I've experienced firsthand the challenges of keeping them alive. 
                    Many people love having indoor plants but struggle to keep them alive
                    due to lack of knowledge about proper care routines. Different plants
                    have very different needs for water, sunlight, and soil.
                </p>
            </div>

            <div className="about-section">
                <h2>The Solution</h2>
                <p>
                    PlantCare connects to a database of thousands of plant species and
                    gives you personalized care instructions for every plant in your
                    house. You can search by name or even upload a photo to identify
                    a plant you don't recognize.
                </p>
            </div>

            <div className="about-section">
                <h2>How to Use PlantCare</h2>
                <ul>
                    <li>Go to <strong>Add Plant</strong> and search for your plant by name</li>
                    <li>Or upload a photo to identify an unknown plant and then search manually</li>
                    <li>Click a result to see its care requirements</li>
                    <li>Click <strong>Add to My Collection</strong> to save it</li>
                    <li>Visit <strong>Home</strong> to see all your plants and their care info</li>
                </ul>
            </div>

            <div className="about-section">
                <h2>APIs Used</h2>
                <ul>
                    <li><strong>Perenual API</strong> — plant care data and species information</li>
                    <li><strong>Pl@ntNet API</strong> — plant identification from photos</li>
                </ul>
            </div>
        </div>
    );
}

export default About;