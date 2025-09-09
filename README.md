## Hackathon Submission Explorer — 811 AI Projects + 800+ Nano Banana Workflows

Explore the live demo: [serjoschduering.github.io/kgl-submission-explorer](https://serjoschduering.github.io/kgl-submission-explorer/)  
Bookmark the link above — it appears again at the end.

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
- **Analyze**: Stats dashboard for tag distribution, category breakdown, high-level and detailed cluster distributions, uniqueness histogram, and a top-25 most-unique list.
- **Act**: Use the Nano Banana workflow library to quickly prototype pipelines that mirror the observed patterns (image/video transforms, multimodal assembly, personalization loops, design tooling).

### Uniqueness index (how it’s computed)

- Definition: The average cosine similarity to the 50 most similar projects, measured on the embedding vectors derived from the generated standardized descriptions.
- Interpretation: Lower average similarity ⇒ fewer close neighbors in description space (more “unique”). This is not a quality judgment — just a positioning signal.

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

### Roadmap

- Responsive UI and keyboard accessibility
- Collision-aware cluster labels
- Sharable URLs for saved views
- AECO-focused presets and example workflows

### Credits & Links

- Live site: [serjoschduering.github.io/kgl-submission-explorer](https://serjoschduering.github.io/kgl-submission-explorer/)

### Notes & disclaimer

- The dataset was compiled from public hackathon materials; a small number of projects may be missing or have incomplete metadata.
- Cluster counts are reported at two levels: High (12) and Detailed (~36). We avoid naming specific clusters in this README to keep the focus on broader patterns.

This README highlights the insights first so you can jump straight into exploration. Then take the workflows and build.
