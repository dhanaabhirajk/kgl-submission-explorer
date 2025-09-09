## Hackathon Submission Explorer — 811 AI Projects 

A lightweight, client‑side app that maps 811 AI hackathon submissions so you can see the landscape at a glance and dive into any project fast. Each dot is a project positioned by UMAP and colored by cluster; click to open details and similar projects. A built‑in statistics view reveals tag/category trends, high‑level (12) and detailed (~36) cluster distributions, and a uniqueness index for spotting crowded areas and white space.

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



### Credits & Links

- Live site: [serjoschduering.github.io/kgl-submission-explorer](https://serjoschduering.github.io/kgl-submission-explorer/)

### Notes & disclaimer

- The dataset was compiled from public hackathon materials; a small number of projects may be missing or have incomplete metadata.
