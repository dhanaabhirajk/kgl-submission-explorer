# Hackathon Submission Explorer
## Interactive Visualization Platform for AI Hackathon Projects

### Executive Summary

The Hackathon Submission Explorer is an interactive web application that visualizes 800 AI hackathon submissions as an explorable semantic map. Using advanced embedding techniques and intelligent clustering, the platform transforms a traditional list of projects into a spatial landscape where similar ideas naturally cluster together, enabling serendipitous discovery and pattern recognition across the entire submission corpus.

### Problem Statement

Hackathon competitions generate hundreds of innovative projects, but traditional gallery views make it difficult to:
- Discover projects with similar technical approaches or conceptual themes
- Understand the broader landscape of submitted ideas
- Find unexpected connections between seemingly different projects
- Navigate efficiently through large submission volumes

Our solution presents submissions as an interactive 2D map where proximity represents similarity, transforming browsing into exploration.

---

## User Stories

### Story 1: The Judge's Overview
*"As a hackathon judge, I want to quickly understand the distribution of project themes and identify clusters of similar submissions, so I can ensure fair evaluation across different innovation areas."*

Sarah opens the explorer and immediately sees 800 colored dots organized into meaningful clusters. She notices a dense cluster in the "Computer Vision" region and zooms in to explore. Hovering over dots reveals project previews, and she discovers five teams have tackled accessibility through image recognition—each with unique approaches. She filters by the "accessibility" tag to see all related projects across different clusters, helping her calibrate scoring criteria.

### Story 2: The Participant's Discovery
*"As a hackathon participant, I want to find projects similar to mine and discover complementary technologies, so I can learn from others and potentially find collaboration opportunities."*

Alex submitted a voice-controlled photo editor. He clicks on his project and the similarity panel shows 8 related submissions based on conceptual similarity. He discovers a team that solved audio processing challenges he struggled with, and clicks through to their writeup to learn their approach.

### Story 3: The Sponsor's Search
*"As a technology sponsor, I want to find all projects that creatively used our API, so I can identify winners for our special prize category and showcase innovative implementations."*

The ElevenLabs team searches for "voice" and "elevenlabs" keywords. The map highlights 47 projects, scattered across different thematic regions—from accessibility tools to gaming applications. They switch to filtered view to focus only on these projects, then explore each cluster to understand different use patterns. The spatial view reveals that voice features were particularly popular in education and accessibility clusters.

---

## System Architecture

### Core Technologies
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Visualization**: D3.js (SVG-based scatter plot with zoom/pan)
- **UI Framework**: Tailwind CSS v3
- **UI Components**: Radix UI (accessible primitives)
- **Search**: Fuse.js (client-side fuzzy search)
- **Animations**: Framer Motion
- **Data Delivery**: Static JSON files from /data directory
- **Data Format**: Three JSON files with UMAP coordinates, clusters, and similarities

### Data Model (Actual Implementation)

```typescript
interface Submission {
  // Identifiers
  data_point_id: number;
  
  // Content
  title: string;
  subtitle: string;
  description: string;
  hero_image_url: string;
  writeup_url: string;
  
  // Metadata
  date: string;
  tags: string[];
  category_tags: string[];
  
  // Clustering & Positioning
  umap_dim_1: number;
  umap_dim_2: number;
  umap_cluster_label: number;
  high_level_region_label: number;
  detailed_region_label: number;
  high_level_hierarchical_label: number;
  medium_level_hierarchical_label: number;
  detailed_hierarchical_label: number;
}

interface SimilarityData {
  data_point_id: number;
  top_similar_projects: Array<{
    project_id: number;
    similarity_score: number;
  }>; // Top 50 most similar projects
}

interface Cluster {
  cluster_level: 'High' | 'Medium' | 'Detailed';
  cluster_id: string;
  cluster_label: number;
  name: string;
  description: string;
  centroid: [number, number];
  members: number[];
  combined_label: string;
  color: string;
}

interface DataStructure {
  // Main data files
  submissions: Submission[];              // From augmented_original_data_no_embeddings.json
  clusters: Cluster[];                    // From consolidated_clusters.json
  similarities: SimilarityData[];         // From top_50_similar_projects.json
  
  // Runtime indices for performance
  indices: {
    byId: Map<number, Submission>;
    byCluster: Map<number, number[]>;
    byTag: Map<string, number[]>;
    similarityMap: Map<number, SimilarityData>;
  };
}
```

---

## Feature Specifications

### 1. Canvas Visualization

#### 1.1 Scatter Plot Display
- **Points**: Each submission rendered as a colored dot
- **Position**: UMAP coordinates map to canvas space
- **Size**: 6px default, scales 4-10px based on zoom level
- **Color Schemes**:
  - By Cluster: 20 distinct colors for AI-generated semantic groups
  - By Category: Semantic colors (AI/ML=purple, Web=blue, etc.)
  - By Track: Competition track assignment
  - By Density: Heat map of submission concentration

#### 1.2 Hierarchical Cluster System
- **High-Level Clusters**: Major thematic areas (from high_level_hierarchical_label)
  - Broadest categorization of projects
  - Color-coded using cluster colors
  - Labels visible at all zoom levels
  
- **Medium-Level Clusters**: Intermediate groupings (from medium_level_hierarchical_label)
  - More specific than high-level
  - Labels visible at zoom level > 0.5
  
- **Detailed Clusters**: Fine-grained topics (from detailed_hierarchical_label)
  - Most specific categorization
  - AI-generated names and descriptions
  - Labels visible at zoom level > 0.75

#### 1.3 Interactive Elements
- **Pan**: Click and drag to navigate
- **Zoom**: Scroll or pinch to zoom (range: 0.1x to 10x)
- **Hover**: 350px tooltip with image preview
- **Click**: Opens detailed modal view
- **Multi-select**: Shift+click for comparison mode

### 2. Similarity System

#### 2.1 Pre-computed Similarity

- Uses pre-calculated top-50 similar projects per submission
- Similarity scores range from 0 to 1 (cosine similarity)
- Instant lookup without runtime computation
- Shows top-8 most similar projects in UI panel
- Enables "Find Similar" navigation between related projects

### 3. Filtering System

#### 3.1 Traditional Filters
**Multi-Select Dropdowns**:
- Categories (14 options)
- Clusters (20 options)  
- Tags (100+ options with autocomplete)
- Track (competition tracks)

**Filter Behavior**:
- Accumulate selections
- Click "Apply Filters" to update
- Show count of matching projects
- Filtered-out points fade to 20% opacity
- "Clear All" reset button

#### 3.2 Search Functionality
**Keyword Search**:
- Full-text search across title, subtitle, description
- Real-time results as you type
- Highlights matching projects
- Shows relevance score

**Search Query Examples**:
- `"voice recognition"` - Exact phrase
- `gaming AR` - Both terms
- `tag:elevenlabs` - Specific tag
- `cluster:7` - Specific cluster

### 4. User Interface Components

#### 4.1 Layout Structure
```
┌─────────────────────────────────────────────────┐
│  Navigation Bar                                  │
├─────────────┬────────────────────────────────────┤
│             │                                     │
│  Sidebar    │        Canvas View                  │
│             │                                     │
│  ┌────────┐ │     ○  ○    ○○○  ○                 │
│  │Filters │ │    ○  ○○○    ○  ○○○                │
│  └────────┘ │     ○○  ○  ○○○    ○                │
│             │       [Topic: Computer Vision]      │
│  ┌────────┐ │                                     │
│  │Similar │ │                                     │
│  └────────┘ │                                     │
└─────────────┴────────────────────────────────────┘
```

#### 4.2 Component Specifications

**Tooltip (Hover)**:
```typescript
{
  image: string (350px width),
  title: string,
  subtitle: string,
  tags: string[] (first 4),
  cluster: string,
  // Optional: similarity score if item selected
}
```

**Detail Modal (Click)**:
```typescript
{
  hero_image: string (full size),
  title: string,
  subtitle: string,
  description: string (full text),
  tags: string[] (all),
  categories: string[],
  track: string,
  date: string,
  
  actions: {
    view_writeup: () => void,    // Opens external link
    find_similar: () => void,     // Updates similarity panel
    add_to_compare: () => void,   // Comparison mode
  }
}
```

**Similarity Panel**:
- Shows 8 most similar projects
- Each item shows:
  - Thumbnail (100px)
  - Title
  - Similarity score (percentage)
- Click to navigate to project

**Filter Panel**:
- Collapsible sections
- Badge counts for active filters
- Search within filter options
- Preset filter combinations

### 5. Navigation Controls

#### 5.1 View Controls
- **Home**: Reset to initial view
- **Zoom In/Out**: +/- buttons
- **Fit All**: Auto-zoom to show all visible points
- **Minimap**: Small overview in corner

#### 5.2 Display Options
- **Color By**: Dropdown to select color scheme
- **Show Labels**: Toggle topic region labels
- **Point Size**: Slider for dot size

### 6. Performance Specifications

#### 6.1 Loading Strategy
```typescript
// Progressive loading with actual data structure
1. Load submission data (811 entries) < 500ms
2. Load cluster definitions (3 levels) < 200ms
3. Load similarity lookups (top-50 per project) < 300ms
4. Load images on-demand via lazy loading
5. Cache viewed images in memory
```

#### 6.2 Optimization Targets
- **Initial Paint**: < 1 second
- **Interactive Ready**: < 2 seconds  
- **Hover Response**: < 16ms (60 FPS)
- **Filter Update**: < 100ms
- **Search Results**: < 50ms
- **Similarity Lookup**: < 5ms (pre-computed top-50)

### 7. Data Pipeline

#### 7.1 Pre-processing (Already Completed)
```python
# Data preparation pipeline (already done)
1. ✅ Generated embeddings and computed similarities
2. ✅ UMAP projection to 2D coordinates
3. ✅ Top-50 similarity scores per project
4. ✅ Hierarchical clustering (3 levels)
5. ✅ Cluster names and descriptions via AI
6. ✅ All data exported to JSON files
```

#### 7.2 Runtime Data Structure
```typescript
// Optimized for frontend performance
{
  // Static JSON data
  submissions: Submission[],              // 811 projects
  clusters: Cluster[],                   // ~60 clusters across 3 levels
  similarities: SimilarityData[],         // Top-50 per project
  
  // Runtime indices
  indices: {
    byId: Map<number, Submission>,
    byCluster: Map<number, number[]>,
    byTag: Map<string, number[]>,
    similarityLookup: Map<number, SimilarityData>,
  },
  
  // Search
  search: {
    index: SearchIndex,                 // Built from title + description  }
}
```

### 8. Responsive Design

#### 8.1 Desktop (>1200px)
- Full sidebar (300px)
- Canvas uses remaining space
- All controls visible

#### 8.2 Tablet (768-1200px)
- Collapsible sidebar
- Floating controls
- Touch-optimized interactions

#### 8.3 Mobile (<768px)
- Bottom sheet for filters
- Simplified tooltip
- Pinch-to-zoom support
- Reduced point density for performance

---

## Implementation Roadmap

### Phase 1: Core Visualization (Week 1)
- [ ] Setup React + TypeScript + Deck.gl
- [ ] Implement basic scatter plot
- [ ] Add zoom/pan controls
- [ ] Load and render 800 points

### Phase 2: Interactivity (Week 2)
- [ ] Hover tooltips with images
- [ ] Click for detail modal
- [ ] Similarity panel
- [ ] Color scheme toggle

### Phase 3: Filtering & Search (Week 3)
- [ ] Filter panel UI
- [ ] Filter logic implementation
- [ ] Keyword search
- [ ] Search highlighting

### Phase 4: Polish & Optimization (Week 4)
- [ ] Topic region overlays
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Final UI polish

---

## Success Metrics

1. **Engagement**: Average session duration > 5 minutes
2. **Discovery**: Users view 20+ projects per session
3. **Performance**: All interactions < 100ms response time
4. **Usability**: Find specific project in < 30 seconds
5. **Insight**: Identify 3+ meaningful clusters within first minute

---

## Appendix: Color Palette

```typescript
const theme = {
  // Background
  canvas: '#0A0F1B',
  sidebar: '#111827',
  
  // Clusters (20 distinct colors)
  clusters: [
    '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B',
    '#EF4444', '#EC4899', '#14B8A6', '#84CC16',
    '#A855F7', '#6366F1', '#06B6D4', '#EAB308',
    '#F97316', '#F43F5E', '#22D3EE', '#A3E635',
    '#C084FC', '#818CF8', '#2DD4BF', '#FACC15'
  ],
  
  // UI Elements
  text: {
    primary: '#F9FAFB',
    secondary: '#9CA3AF',
    muted: '#6B7280'
  },
  
  // States
  hover: 'rgba(59, 130, 246, 0.5)',
  selected: 'rgba(239, 68, 68, 0.8)',
  filtered: 'rgba(255, 255, 255, 0.2)'
};
```

This platform transforms the overwhelming task of reviewing 800 hackathon submissions into an intuitive exploration experience, where patterns emerge naturally and unexpected discoveries await at every zoom level.