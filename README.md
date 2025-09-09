## Hackathon Submission Explorer — 811 AI Projects + 800+ Nano Banana Workflows

Explore the live demo: [serjoschduering.github.io/kgl-submission-explorer](https://serjoschduering.github.io/kgl-submission-explorer/)  
Bookmark the link above — it appears again at the end.

### Insights at a Glance (from 811 submissions)

- **Creative content generation dominates**: Tags like **Multi-modal Input**, **Image Editing**, **For Creators**, and **Creative Tool** are among the most frequent — pointing to a strong focus on creative tooling and multimodal AI.
- **User-centric categories lead**: **Media & Entertainment** and **Personal & Social** are the top categories.
- **Cluster landscape**: Two levels — **High-level (12 clusters)** and **Detailed (~36 clusters)**.
- **Distinct cluster signatures**:
  - `High_0`: relatively high for “Educational Content Generation” and “Personalization”.
  - `High_1`: relatively high for “Media & Entertainment”, “Creative Tool”, and “Image Generation”.
- **Novelty spectrum (similarity)**: The top-10 most unique ideas average ~**0.24–0.28** similarity; the top-10 most common ideas average ~**0.49–0.51**.
- **AECO note**: My work leans AECO. **Interior Design** is the second-largest cluster. **Arch Viz** is present and sits roughly around the **10th** position — a clear opportunity zone for targeted innovation.
  
  Note: In visuals and copy we only refer to two cluster levels — **High (12)** and **Detailed (~36)**.

> Two reference charts (add images into `docs/images/` if available):
>
> - `docs/images/cluster-member-distribution-detailed.png` — Cluster Member Distribution (Detailed)
> - `docs/images/cluster-member-distribution-high.png` — Cluster Member Distribution (High)

### Why this exists

It’s hard to make sense of 800+ ideas. This explorer reveals where ideas concentrate, where they diverge, and where white space might exist — and then bridges insights to action via 800+ Nano Banana workflows.

### What you can do

- **Explore**: Zoomable D3 scatter plot, cluster coloring, hover/click interactions, and similar-project highlighting.
- **Analyze**: Stats dashboard for tag distribution, category breakdown, high-level and detailed cluster distributions, uniqueness histogram, and a top-25 most-unique list.
- **Act**: Use the Nano Banana workflow library to quickly prototype pipelines that mirror the observed patterns (image/video transforms, multimodal assembly, personalization loops, design tooling).

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

This README highlights the insights first so you can jump straight into exploration. Then take the workflows and build.
