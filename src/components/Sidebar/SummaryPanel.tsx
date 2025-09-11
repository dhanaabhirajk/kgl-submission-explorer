import React from 'react';

type Section = {
  title: string;
  oneLiner: string;
  bullets: string[];
  image: string; // relative to BASE_URL, already percent-encoded
};

const sections: { group: string; items: Section[] }[] = [
  {
    group: 'Media & Entertainment',
    items: [
      {
        title: 'AI-Powered Visual Storytelling',
        oneLiner:
          "Automatically generate multi-panel visual narratives like comics, storyboards, and children's books from text or images.",
        bullets: [
          'Comic & webtoon generation with character/style consistency',
          "Personalized children's storybooks with narration",
          'Cinematic storyboarding with camera angles and lighting',
        ],
        image: 'topics/VisualStoryTellingBetterone%20Large.jpeg',
      },
      {
        title: 'Personalized & Multi-Modal Art Generation',
        oneLiner: 'Fuse photos, text, voice, and music to create unique artworks and experiences.',
        bullets: [
          'Art style transformations for portraits and photos',
          'Audio-to-visual synesthesia (songs, narration → visuals)',
          'Personalized media: cast users into posters, scenes, and worlds',
        ],
        image: 'topics/personalizedMedia%20Large.jpeg',
      },
    ],
  },
  {
    group: 'Fashion, E-commerce & Retail',
    items: [
      {
        title: 'Virtual Try-On & AI Styling',
        oneLiner: 'Preview products like clothing, hairstyles, or eyewear on yourself before buying.',
        bullets: [
          'Photo-based clothing try-on and beauty previews',
          'AI personal stylist for outfits and occasions',
          'Realistic eyewear fit previews',
        ],
        image: 'topics/Virtual_tryon%20Large.jpeg',
      },
      {
        title: 'AI-Powered Product Photography & Mockups',
        oneLiner: 'Create studio-quality product shots, mockups, and ad creatives from a single image.',
        bullets: [
          'Automated lifestyle scenes and clean studio backgrounds',
          'Single-image → 3D model for 360° view',
          'Merch mockups (shirts, mugs, posters)',
        ],
        image: 'topics/ProductPhoto%20Large.jpeg',
      },
    ],
  },
  {
    group: 'Architecture & Real Estate',
    items: [
      {
        title: 'AI Interior Design & Virtual Staging',
        oneLiner: 'Transform room photos into redesigned spaces with styles, layouts, and furniture changes.',
        bullets: [
          'Instant room restyles across design themes',
          'Add/remove/replace furniture with prompts or catalog picks',
          'From floor plans to photoreal 3D renderings',
        ],
        image: 'topics/AIInteriorandStaging%20Large.jpeg',
      },
    ],
  },
  {
    group: 'Design & Development Tools',
    items: [
      {
        title: 'AI-Assisted Creative & Technical Design',
        oneLiner: 'Generate UI mockups, game assets, textures, and technical illustrations from text/sketches.',
        bullets: [
          'Wireframes → high-fidelity UI',
          'Spritesheets, PBR textures, isometric maps',
          'Blueprints, scientific diagrams, LEGO-style instructions',
        ],
        image: 'topics/digitalWorkfshop%20Large.jpeg',
      },
    ],
  },
  {
    group: 'Marketing & Advertising',
    items: [
      {
        title: 'Automated Brand & Campaign Generation',
        oneLiner: 'Create brand kits and multi-platform ad campaigns from a single idea, logo, or image.',
        bullets: [
          'Logos, palettes, fonts, and business cards',
          'Auto-generated creatives and captions for social platforms',
          'Smart thumbnail/QR sticker generation',
        ],
        image: 'topics/Adcampaings%20Large.jpeg',
      },
    ],
  },
  {
    group: 'Personalization & Social Tools',
    items: [
      {
        title: 'AI-Powered Photo Editing & Enhancement',
        oneLiner: 'Restore, stylize, and transform photos using natural language or presets.',
        bullets: [
          'Restoration & colorization of old/damaged photos',
          'Avatars, headshots, and profile pictures from a selfie',
          'Pose/expression editing and creative compositing',
        ],
        image: 'topics/memoryRecosntruction%20Large.jpeg',
      },
      {
        title: 'Productivity & Utilities',
        oneLiner: 'Practical tools for daily life, documents, and B2B workflows.',
        bullets: [
          'Recipe suggestions from ingredients photos',
          'Visual resumes and document transformations',
          'DIY & repair visual guidance',
        ],
        image: 'topics/ProductivityUtils%20Large.jpeg',
      },
    ],
  },
  {
    group: 'Science, Healthcare & Wellness',
    items: [
      {
        title: 'AI for Health Visualization & Motivation',
        oneLiner: 'Use visuals to explain procedures, visualize outcomes, and support wellbeing.',
        bullets: [
          'Surgical/dental pre-visualization on personal photos',
          'Fitness and form analysis; habit visualization',
          'Emotional visualization & medical education',
        ],
        image: 'topics/AIforHealthand%20motivation%20Large.jpeg',
      },
      {
        title: 'AI for Scientific Visualization & Research',
        oneLiner: 'Generate/analyze scientific data and visuals for research and training.',
        bullets: [
          'Synthetic datasets for computer vision',
          'Forensic & historical reconstruction',
          'Data → 3D relief maps and simulations',
        ],
        image: 'topics/ResearchandDiscovery%20Large.jpeg',
      },
    ],
  },
  {
    group: 'Security, Safety & Forensics',
    items: [
      {
        title: 'Forensic & Investigative Visualization',
        oneLiner: 'Support investigations with suspect imagery and scene reconstructions.',
        bullets: [
          'Age progression & disguise scenarios',
          'Crime scene reconstruction from partial evidence',
          'Digital forensics training experiences',
        ],
        image: 'topics/ForensitRecosntruction%20Large.jpeg',
      },
      {
        title: 'Safety & Risk Assessment',
        oneLiner: 'Analyze environments for hazards, defects, and damage.',
        bullets: [
          'Workplace/home inspections from a single photo',
          'Vehicle damage estimation and post-repair visualization',
          'Scam/threat education via visuals',
        ],
        image: 'topics/saftyInspection%20Large.jpeg',
      },
      {
        title: 'Emergency Response & Aid',
        oneLiner: 'Provide immediate, visual guidance during emergencies.',
        bullets: [
          'Real-time first-aid overlays and narration',
          'Instant, standardized emergency flyer generation',
        ],
        image: 'topics/EmergencyResponse%20Large.jpeg',
      },
    ],
  },
];

export const SummaryPanel: React.FC = () => {
  const base = import.meta.env.BASE_URL || '/';
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-white font-semibold mb-2">Topic Overview</h3>
        <p className="text-gray-400 text-sm">
          A quick, visual map of opportunity areas observed in 811 submissions. Each section shows a
          widescreen header image and a concise summary you can skim.
        </p>
      </div>

      {sections.map((group, gi) => (
        <div key={gi} className="p-4 border-b border-gray-800">
          <h4 className="text-gray-200 font-semibold text-sm mb-3">{group.group}</h4>
          <div className="space-y-6">
            {group.items.map((s, si) => (
              <div key={si} className="bg-gray-800/30 rounded-lg border border-gray-800 overflow-hidden">
                <div className="w-full h-40 md:h-48 bg-gray-900">
                  <img
                    src={`${base}${s.image}`}
                    alt={s.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <div className="text-white font-medium mb-1">{s.title}</div>
                  <p className="text-gray-300 text-sm mb-2">{s.oneLiner}</p>
                  <ul className="list-disc list-inside text-gray-400 text-xs space-y-1">
                    {s.bullets.map((b, bi) => (
                      <li key={bi}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryPanel;


