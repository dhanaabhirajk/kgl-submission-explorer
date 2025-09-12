## Hackathon Submission Explorer

A lightweight, client‑side app that maps 800+ nano-banana hackathon submissions so you can see the landscape at a glance and dive into any project fast. Each dot is a project positioned by UMAP and colored by cluster; hover or click to open details and similar projects. A built‑in statistics view reveals tag/category trends, high‑level (12) and detailed (~36) cluster distributions, and a uniqueness index for spotting crowded areas and white space.

Explore the live demo: [serjoschduering.github.io/kgl-submission-explorer](https://serjoschduering.github.io/kgl-submission-explorer/)  

![Animated demo of the explorer](docs/demo-ani.gif)

### Insights at a Glance (from 811 submissions)

- **Creative applications lead**: Tags like Multi‑modal Input, Image Editing, For Creators, and Creative Tool are among the most frequent — strong signal for creative tooling and multimodal AI.
- **People‑first categories**: Media & Entertainment and Personal & Social dominate the dataset.
- **Cluster landscape**: Two levels only — High‑level (12) and Detailed (~36). These reveal different “flavors” of work across the space without naming individual clusters.


### Why this exists

It’s hard to make sense of 800+ ideas. This explorer helps reveal where ideas concentrate, where they diverge, and where white space might exist — and then bridges insights to action via 800+ Nano Banana workflows.

### UI at a glance

Two main modes — Explore and Statistics — with panels for filtering, details, and cluster insights.

![Two UI examples: statistics dashboard and explore canvas](docs/dashboard.jpg)

### Data processing pipeline (pre‑processing)

Short version of the workflow that prepared this dataset:

1. Collect project writeups
2. Sample ~50% to create a suitable keyword list (Gemini 2.5 Pro)
3. Process each writeup to (GPT‑5):
   - Add tags and category tags
   - Generate a standardized description
4. Create embeddings from the standardized descriptions
5. Dimensionality reduction: PCA → UMAP
6. Hierarchical clustering on UMAP space
7. Summarize and label clusters (GPT‑5)
8. export similarity matrix based on embeddings


### What you can do

- **Explore**: Zoomable D3 scatter plot, cluster coloring, hover/click interactions, and similar-project highlighting.
- **Visualize as Terrain**: Transform the data landscape into an intuitive geographical map where data density creates terrain elevation — from oceans to mountain peaks. Settlement overlays show concentrated project areas as villages, towns, and cities.
- **Analyze**: Stats dashboard for tag distribution, category breakdown, high-level and detailed cluster distributions, uniqueness histogram, and a top-25 most-unique list.
- **Act**: Use the Nano Banana workflow library to quickly prototype pipelines that mirror the observed patterns (image/video transforms, multimodal assembly, personalization loops, design tooling).

### Visual styles for navigation

Multiple background styles make the "project landscape" easier to read depending on task:

- Points (default) — pure scatter for maximum clarity
- Density background — soft contours reveal hotspots
- Island background — geographic metaphor over density
- Fantasy map (nano‑banana) — playful, readable world map skin for presentations

![Visual styles: points, density, island, fantasy](docs/visual_styles.jpg)

## Topic overview

<p>This section provides a quick, visual overview of opportunity areas observed in the dataset.</p>

<h3>Media &amp; Entertainment</h3>

<table>
  <tr>
    <td width="60%" valign="top">
      <h4>AI-Powered Visual Storytelling</h4>
      <p><strong>One-Liner:</strong> Automatically generate multi-panel visual narratives like comics, storyboards, and children's books from text prompts or user-provided images.</p>
      <p><strong>Idea Variations:</strong></p>
      <ul>
        <li><strong>Comic &amp; Webtoon Generation:</strong> Users provide a story, characters, and a style to generate multi-page comics, often ensuring character and style consistency across panels. Some tools allow users to cast themselves in the story by uploading a photo.</li>
        <li><strong>Children's Storybooks:</strong> Create personalized, illustrated stories for children, often casting the child or their pet as the hero by using their photo. Many include educational elements and AI-generated narration.</li>
        <li><strong>Cinematic Storyboarding:</strong> Turn scripts or simple ideas into cinematic storyboards, complete with different camera angles, scene breakdowns, and lighting suggestions.</li>
        <li><strong>Video &amp; Animation:</strong> Generate short animated videos, flipbooks, or motion posters from a single image or story prompt, with some tools creating frame-by-frame animations while maintaining consistency.</li>
      </ul>
    </td>
    <td width="40%" valign="top">
      <img src="docs/VisualStoryTellingBetterone%20Large.jpeg" alt="AI-Powered Visual Storytelling" width="100%" />
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="60%" valign="top">
      <h4>Personalized &amp; Multi-Modal Art Generation</h4>
      <p><strong>One-Liner:</strong> Create unique artistic media by fusing different inputs like photos, text, voice, and music.</p>
      <p><strong>Idea Variations:</strong></p>
      <ul>
        <li><strong>Art Style Transformation:</strong> Transform personal photos into various artistic styles, such as paintings, cartoons, or the aesthetic of famous artists and photography agencies.</li>
        <li><strong>Synesthesia &amp; Audio-to-Visual Art:</strong> Generate visual art, storyboards, or animations directly from audio inputs like songs, voice narration (including tone and volume), or soundscapes.</li>
        <li><strong>Personalized Media Creation:</strong> Cast users as the heroes of video game posters, movie scenes, or historical events by fusing their photos with thematic elements. A niche version creates humorous photos of users with celebrities.</li>
        <li><strong>Generative Art Games:</strong> Create interactive games where users collaboratively build artwork, solve visual puzzles like "Spot the Difference," or turn their drawings into animated stories.</li>
        <li><strong>Thematic World &amp; Map Generation:</strong> Transform real-world maps (e.g., Google Maps) into fantasy-style worlds or generate procedural isometric game maps from a theme.</li>
      </ul>
    </td>
    <td width="40%" valign="top">
      <img src="docs/personalizedMedia%20Large.jpeg" alt="Personalized & Multi-Modal Art Generation" width="100%" />
    </td>
  </tr>
  
</table>

<h3>Fashion, E-commerce &amp; Retail</h3>

<table>
  <tr>
    <td width="60%" valign="top">
      <h4>Virtual Try-On &amp; AI Styling</h4>
      <p><strong>One-Liner:</strong> Applications that allow users to visualize products like clothing, hairstyles, or furniture on themselves or in their own space before purchasing.</p>
      <p><strong>Idea Variations:</strong></p>
      <ul>
        <li><strong>Clothing &amp; Fashion Try-On:</strong> Upload a photo to see how clothing items from e-commerce sites would look, often integrated via a web app or Chrome extension.</li>
        <li><strong>Hairstyle &amp; Beauty Previews:</strong> Experiment with different hairstyles, hair colors, nail art, or even tattoo designs on a personal photo.</li>
        <li><strong>AI Personal Stylist:</strong> Receive complete outfit recommendations based on personal style, uploaded wardrobe items, or event context (like travel destinations) and then visualize the results.</li>
        <li><strong>Eyewear Try-On:</strong> Virtually place different styles of glasses on a user's face to check the fit and look.</li>
      </ul>
    </td>
    <td width="40%" valign="top">
      <img src="docs/Virtual_tryon%20Large.jpeg" alt="Virtual Try-On & AI Styling" width="100%" />
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="60%" valign="top">
      <h4>AI-Powered Product Photography &amp; Mockups</h4>
      <p><strong>One-Liner:</strong> Tools for e-commerce sellers to instantly create professional, studio-quality product photos, mockups, and ad creatives from a single product image.</p>
      <p><strong>Idea Variations:</strong></p>
      <ul>
        <li><strong>Automated Lifestyle Scenes:</strong> Place a product image into various realistic lifestyle scenes or on clean studio backgrounds to create marketing-ready photos.</li>
        <li><strong>3D Model Generation:</strong> Convert a single 2D product image into an interactive 3D model for a 360-degree viewing experience.</li>
        <li><strong>Merchandise Mockups:</strong> Visualize logos or designs on various merchandise items like t-shirts, mugs, and posters.</li>
      </ul>
    </td>
    <td width="40%" valign="top">
      <img src="docs/ProductPhoto%20Large.jpeg" alt="AI-Powered Product Photography & Mockups" width="100%" />
    </td>
  </tr>
</table>

<h3>Architecture &amp; Real Estate</h3>

<table>
  <tr>
    <td width="60%" valign="top">
      <h4>AI Interior Design &amp; Virtual Staging</h4>
      <p><strong>One-Liner:</strong> Applications that transform photos of empty or furnished rooms into fully redesigned spaces, allowing users to experiment with different styles and layouts.</p>
      <p><strong>Idea Variations:</strong></p>
      <ul>
        <li><strong>Instant Room Redesign:</strong> Upload a photo of a room to see it instantly redesigned in various interior design styles (e.g., minimalist, modern, pop art) or for a specific theme (e.g., a child's room).</li>
        <li><strong>Virtual Furniture Placement:</strong> Add, remove, or replace furniture in a room photo using text prompts or by selecting items from a catalog.</li>
        <li><strong>Floor Plan Visualization:</strong> Convert 2D floor plans or architectural sketches into photorealistic 3D renderings and immersive video walkthroughs.</li>
        <li><strong>Architectural &amp; Urban Visualization:</strong> Reimagine building exteriors, visualize the impact of climate change on cities, or complete unfinished construction projects from photos.</li>
      </ul>
    </td>
    <td width="40%" valign="top">
      <img src="docs/AIInteriorandStaging%20Large.jpeg" alt="AI Interior Design & Virtual Staging" width="100%" />
    </td>
  </tr>
</table>

<h3>Design &amp; Development Tools</h3>

<table>
  <tr>
    <td width="60%" valign="top">
      <h4>AI-Assisted Creative &amp; Technical Design</h4>
      <p><strong>One-Liner:</strong> Tools that automate and enhance the design process for developers, designers, and creators by generating assets like UI mockups, game sprites, and technical diagrams.</p>
      <p><strong>Idea Variations:</strong></p>
      <ul>
        <li><strong>UI/UX Mockup Generation:</strong> Convert hand-drawn wireframes, sketches, or text descriptions into high-fidelity user interface mockups.</li>
        <li><strong>Game Asset Generation:</strong> Create game-ready assets, such as character spritesheets, seamless PBR textures, and isometric world maps, from text prompts.</li>
        <li><strong>Technical &amp; Scientific Illustration:</strong> Generate diagrams, blueprints, scientific illustrations (e.g., neural networks, industrial processes), and even LEGO instructions from technical descriptions or sketches.</li>
        <li><strong>Node-Based Visual Editors:</strong> Offer a canvas-based interface where users can connect different AI generation and editing nodes to create complex, non-destructive compositions.</li>
        <li><strong>Font Generation:</strong> Create a complete, usable font from a single descriptive prompt.</li>
      </ul>
    </td>
    <td width="40%" valign="top">
      <img src="docs/digitalWorkfshop%20Large.jpeg" alt="AI-Assisted Creative & Technical Design" width="100%" />
    </td>
  </tr>
</table>

<h3>Marketing &amp; Advertising</h3>

<table>
  <tr>
    <td width="60%" valign="top">
      <h4>Automated Brand &amp; Campaign Generation</h4>
      <p><strong>One-Liner:</strong> AI-powered platforms that generate complete, multi-format marketing campaigns or brand identity kits from a single idea, logo, or product photo.</p>
      <p><strong>Idea Variations:</strong></p>
      <ul>
        <li><strong>Brand Identity Kit Creation:</strong> Generate a complete brand kit including logos, color palettes, fonts, and business card mockups from a simple text prompt.</li>
        <li><strong>Multi-Platform Ad Campaigns:</strong> Automatically create a full suite of ad creatives, captions, and posters for different social media platforms based on a single product image or URL.</li>
        <li><strong>YouTube Thumbnail Generation:</strong> Create optimized, high-click-through-rate thumbnails for videos, often by analyzing the video's content or title.</li>
        <li><strong>QR Code Sticker Generation:</strong> Create artistic and visually appealing stickers that embed functional QR codes for marketing or personal use.</li>
      </ul>
    </td>
    <td width="40%" valign="top">
      <img src="docs/Adcampaings%20Large.jpeg" alt="Automated Brand & Campaign Generation" width="100%" />
    </td>
  </tr>
</table>

<h3>Personalization &amp; Social Tools</h3>

<table>
  <tr>
    <td width="60%" valign="top">
      <h4>AI-Powered Photo Editing &amp; Enhancement</h4>
      <p><strong>One-Liner:</strong> Intelligent photo editors that use natural language or one-click presets to perform complex edits, restorations, and creative transformations.</p>
      <p><strong>Idea Variations:</strong></p>
      <ul>
        <li><strong>Photo Restoration &amp; Colourization:</strong> Repair and colourize old, damaged, or black-and-white photos to bring cherished memories back to life. Some tools can even "reunite" families by placing deceased relatives into modern photos.</li>
        <li><strong>Personalized Avatars &amp; Profile Pictures:</strong> Create unique avatars, professional headshots, or stylized profile pictures from a single selfie, often placing the user in different scenarios, cultural contexts, or historical eras.</li>
        <li><strong>Sticker &amp; Emoji Generation:</strong> Instantly convert any photo into a pack of personalized stickers or emojis with various expressions.</li>
        <li><strong>Creative Photo Compositing:</strong> Seamlessly merge people from different photos into a single group shot or place a person into a famous landmark or alongside a celebrity.</li>
        <li><strong>Pose &amp; Expression Editing:</strong> Change a person's entire body pose or facial expression using simple text commands like "make me stand more confidently".</li>
      </ul>
    </td>
    <td width="40%" valign="top">
      <img src="docs/memoryRecosntruction%20Large.jpeg" alt="AI-Powered Photo Editing & Enhancement" width="100%" />
    </td>
  </tr>
</table>

<h3>Productivity, Education &amp; Accessibility</h3>

<table>
  <tr>
    <td width="60%" valign="top">
      <h4>AI-Enhanced Learning &amp; Accessibility Tools</h4>
      <p><strong>One-Liner:</strong> Applications that transform educational content into engaging visual formats and provide tools for users with disabilities.</p>
      <p><strong>Idea Variations:</strong></p>
      <ul>
        <li><strong>Visual Learning Guides:</strong> Convert complex technical, scientific, or historical topics into simple, illustrated comic strips, diagrams, or IKEA-style instructions to make them easier to understand.</li>
        <li><strong>Interactive Language Learning:</strong> Create immersive story-based games where the user is a character, or use AI to generate visual mnemonics for vocabulary.</li>
        <li><strong>Tools for Accessibility:</strong> Generate descriptions, narrations, and high-contrast re-colorings of graphs and images to make visual data accessible. Another idea is an app that translates text to American Sign Language using a consistent avatar.</li>
        <li><strong>Visual Note-Taking:</strong> Transform video lectures or meetings into structured visual notes with AI-generated diagrams and summaries.</li>
        <li><strong>AI Art Mentor:</strong> An application that analyzes children's drawings, provides constructive feedback, and connects their art to famous artists or STEAM concepts.</li>
      </ul>
    </td>
    <td width="40%" valign="top">
      <img src="docs/interactiveLearning%20Large.jpeg" alt="AI-Enhanced Learning & Accessibility Tools" width="100%" />
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="60%" valign="top">
      <h4>Productivity &amp; Utilities</h4>
      <p><strong>One-Liner:</strong> Practical AI tools designed to solve everyday problems, enhance professional documents, or assist in specific B2B workflows.</p>
      <p><strong>Idea Variations:</strong></p>
      <ul>
        <li><strong>Recipe Generation from Ingredients:</strong> Snap a photo of your available ingredients, and the AI generates recipe suggestions, complete with instructions and images of the final dish.</li>
        <li><strong>Visual Resume Enhancement:</strong> Transform a standard text resume into an interactive, visual narrative with personalized images for different job roles.</li>
        <li><strong>DIY &amp; Repair Assistance:</strong> Generate visual, step-by-step IKEA-style assembly instructions or get AI-guided help for repairing broken items by taking a photo of the problem.</li>
      </ul>
    </td>
    <td width="40%" valign="top">
      <img src="docs/ProductivityUtils%20Large.jpeg" alt="Productivity & Utilities" width="100%" />
    </td>
  </tr>
</table>

<h3>Science, Healthcare &amp; Wellness</h3>

<table>
  <tr>
    <td width="60%" valign="top">
      <h4>AI for Health Visualization &amp; Motivation</h4>
      <p><strong>One-Liner:</strong> Applications that use AI-generated visuals to help users understand medical procedures, visualize health outcomes, and process emotions.</p>
      <p><strong>Idea Variations:</strong></p>
      <ul>
        <li><strong>Surgical &amp; Dental Pre-Visualization:</strong> Show patients a realistic "after" preview of cosmetic procedures like smile design or plastic surgery on their own photo.</li>
        <li><strong>Health &amp; Fitness Motivation:</strong> Visualize the potential future physical effects of lifestyle choices on a user's photo to encourage healthier habits, or analyze workout form from a video.</li>
        <li><strong>Emotional Visualization &amp; Mental Health:</strong> Transform descriptions of emotions or facial expressions into abstract art or personalized story comics to aid in mental health and self-reflection.</li>
        <li><strong>Medical &amp; Scientific Education:</strong> Generate synthetic medical imagery for training, visualize how medications work, or identify plant diseases from a photo.</li>
      </ul>
    </td>
    <td width="40%" valign="top">
      <img src="docs/AIforHealthand%20motivation%20Large.jpeg" alt="AI for Health Visualization & Motivation" width="100%" />
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="60%" valign="top">
      <h4>AI for Scientific Visualization &amp; Research</h4>
      <p><strong>One-Liner:</strong> Tools that use AI to generate and analyze scientific data, from restoring ancient artifacts to creating synthetic datasets for model training.</p>
      <p><strong>Idea Variations:</strong></p>
      <ul>
        <li><strong>Synthetic Data Generation:</strong> Create custom, annotated image datasets for training computer vision models.</li>
        <li><strong>Forensic &amp; Historical Reconstruction:</strong> Restore damaged ancient artworks or reconstruct accident and crime scenes from fragmented visual evidence like partial sketches, blurry photos, and blueprints.</li>
        <li><strong>Data-to-Visuals:</strong> Transform complex 2D geographical data into detailed 3D topographic relief maps or generate CFD simulations from airfoil images.</li>
      </ul>
    </td>
    <td width="40%" valign="top">
      <img src="docs/ResearchandDiscovery%20Large.jpeg" alt="AI for Scientific Visualization & Research" width="100%" />
    </td>
  </tr>
</table>

<h3>Security, Safety &amp; Forensics</h3>

<table>
  <tr>
    <td width="60%" valign="top">
      <h4>Forensic &amp; Investigative Visualization</h4>
      <p><strong>One-Liner:</strong> AI tools designed to assist in investigations by generating suspect images, reconstructing crime scenes, and training for digital forensics.</p>
      <p><strong>Idea Variations:</strong></p>
      <ul>
        <li><strong>Suspect Visualization:</strong> Generate age-progressed images of missing persons or visualize suspects in various disguises based on old photos or sketches.</li>
        <li><strong>Crime Scene Reconstruction:</strong> Fuse fragmented evidence—like blurry CCTV footage, witness sketches, and blueprints—into a single, coherent photorealistic scene to aid investigations.</li>
        <li><strong>Digital Forensics Training:</strong> Create educational games that teach users to identify tampered or AI-generated images, enhancing digital literacy.</li>
      </ul>
    </td>
    <td width="40%" valign="top">
      <img src="docs/ForensitRecosntruction%20Large.jpeg" alt="Forensic & Investigative Visualization" width="100%" />
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="60%" valign="top">
      <h4>Safety &amp; Risk Assessment</h4>
      <p><strong>One-Liner:</strong> Applications that use a device's camera to analyze real-world environments for potential hazards, structural defects, or damage.</p>
      <p><strong>Idea Variations:</strong></p>
      <ul>
        <li><strong>Workplace &amp; Home Inspection:</strong> Identify safety hazards in industrial settings or structural issues in homes from a single photo.</li>
        <li><strong>Damage Assessment &amp; Insurance Claims:</strong> Analyze photos of vehicle damage to generate repair cost estimates and visualize the post-repair look, or transform verbal accident reports into visual reconstructions for insurance claims.</li>
        <li><strong>Scam &amp; Threat Detection:</strong> Visualize AI actively blocking online scams or fraudulent calls in real-time educational narratives.</li>
      </ul>
    </td>
    <td width="40%" valign="top">
      <img src="docs/saftyInspection%20Large.jpeg" alt="Safety & Risk Assessment" width="100%" />
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="60%" valign="top">
      <h4>Emergency Response &amp; Aid</h4>
      <p><strong>One-Liner:</strong> Tools that provide immediate, AI-powered visual guidance during emergencies.</p>
      <p><strong>Idea Variations:</strong></p>
      <ul>
        <li><strong>Real-Time First-Aid Guidance:</strong> Use a phone camera to analyze an injury and receive real-time visual instructions and voice guidance.</li>
        <li><strong>Emergency Flyer Generation:</strong> Instantly create standardized, print-ready missing person flyers from a single photo and key details.</li>
      </ul>
    </td>
    <td width="40%" valign="top">
      <img src="docs/EmergencyResponse%20Large.jpeg" alt="Emergency Response & Aid" width="100%" />
    </td>
  </tr>
</table>

### Terrain visualization (optional)

Turn project density into a simple geographic metaphor to reveal hotspots at a glance.

- Density → elevation via KDE over UMAP
- Two styles (Natural, Urban) with adjustable thresholds and overlays
- Export high‑res maps with legends; optional settlement dots

### Uniqueness index (how it's computed)

- Definition: The average cosine similarity to the 50 most similar projects, measured on the embedding vectors derived from the generated standardized descriptions.
- Interpretation: Lower average similarity ⇒ fewer close neighbors in description space (more "unique"). This is not a quality judgment — just a positioning signal.

### Live Demo

- Start here: [serjoschduering.github.io/kgl-submission-explorer](https://serjoschduering.github.io/kgl-submission-explorer/)

### Getting Started (local)

```bash
npm install
npm run dev
```

### Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Visualization**: D3 (SVG)
- **State**: Zustand
- **Styles**: Tailwind
- **Data**: Static JSON (projects, clusters, similarities) loaded client-side



### Credits & Links

- Live site: [serjoschduering.github.io/kgl-submission-explorer](https://serjoschduering.github.io/kgl-submission-explorer/)

### Notes & disclaimer

- The dataset was compiled from public hackathon materials; a small number of projects may be missing or have incomplete metadata.
