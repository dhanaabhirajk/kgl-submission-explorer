// Script to generate mock governance grievance data for SN2 system

const fs = require('fs');
const path = require('path');

// Telugu districts
const districts = [
  'Visakhapatnam', 'East Godavari', 'West Godavari', 'Krishna', 'Guntur',
  'Prakasam', 'Nellore', 'Chittoor', 'Kadapa', 'Kurnool',
  'Anantapur', 'Srikakulam', 'Vizianagaram'
];

// Government departments
const departments = [
  'Public Health & Sanitation',
  'Roads & Infrastructure',
  'Water Supply',
  'Electricity',
  'Education',
  'Healthcare',
  'Public Transport',
  'Land Records',
  'Police',
  'Municipal Services'
];

// Grievance categories
const categories = [
  'Sanitation', 'Infrastructure', 'Water Supply', 'Power Outage',
  'Road Maintenance', 'Healthcare Access', 'Education', 'Drainage',
  'Street Lighting', 'Garbage Collection', 'Public Transport',
  'Land Issues', 'Safety & Security', 'Document Services'
];

// Severity levels
const severities = ['Low', 'Medium', 'High', 'Critical'];
const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

// Sample grievance titles (Telugu + English)
const grievanceTitles = [
  // Sanitation
  'Garbage accumulation near residential area',
  'Overflowing sewage on main road',
  'Public toilet facility not maintained',
  'Stray animals causing sanitation issues',
  'Illegal dumping in vacant plot',
  
  // Water Supply
  'Water supply irregular for past week',
  'Contaminated drinking water supply',
  'Water pipeline burst causing flooding',
  'Low water pressure in apartment complex',
  'Public water tap not functioning',
  
  // Infrastructure
  'Pothole on main road causing accidents',
  'Street lights not working for 2 weeks',
  'Damaged footpath near school',
  'Illegal construction blocking road',
  'Bridge repair needed urgently',
  
  // Electricity
  'Frequent power cuts in locality',
  'Transformer breakdown affecting 500+ homes',
  'Street light pole fallen on road',
  'Electric wires hanging dangerously low',
  'Meter reading incorrect for 3 months',
  
  // Healthcare
  'Insufficient staff at primary health center',
  'Medicine shortage at government hospital',
  'Ambulance service delayed in emergency',
  'Vaccination center closed without notice',
  'Unsanitary conditions in community health center',
  
  // Education
  'School building needs urgent repairs',
  'Teacher shortage affecting quality',
  'No toilet facility for girl students',
  'Drinking water facility not available',
  'Mid-day meal quality poor',
  
  // Public Services
  'Bus service frequency reduced',
  'Auto rickshaw drivers overcharging',
  'Birth certificate processing delayed',
  'Ration shop not opening regularly',
  'Pension payment delayed for seniors'
];

const grievanceDescriptions = [
  'The issue has been persisting for several weeks causing significant inconvenience to residents.',
  'Multiple complaints have been filed but no action taken so far.',
  'Urgent attention required as it is affecting daily life of citizens.',
  'The problem becomes more severe during monsoon season.',
  'Local community has pooled resources for temporary fix but permanent solution needed.',
  'Health hazard developing due to prolonged neglect of the issue.',
  'Especially affecting senior citizens and children in the area.',
  'Previous assurances from officials have not materialized.',
  'Photographic evidence attached showing severity of situation.',
  'Neighboring areas have received attention while this remains unresolved.'
];

// Generate random date within last 6 months
function randomDate() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 6);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

// Generate random UMAP coordinates with clusters
function generateUMAPCoords(clusterId, memberIndex) {
  // Create distinct cluster centers
  const clusterCenters = [
    [-8, 6], [5, 8], [-2, -7], [8, -3], [-6, -2],
    [3, 2], [-4, 5], [7, 1], [0, -5], [4, 7]
  ];
  
  const center = clusterCenters[clusterId % clusterCenters.length];
  const spread = 2.5;
  
  return [
    center[0] + (Math.random() - 0.5) * spread,
    center[1] + (Math.random() - 0.5) * spread
  ];
}

// Generate grievance data
function generateGrievances(count = 500) {
  const grievances = [];
  
  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const department = departments[Math.floor(Math.random() * departments.length)];
    const district = districts[Math.floor(Math.random() * districts.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const title = grievanceTitles[Math.floor(Math.random() * grievanceTitles.length)];
    const description = grievanceDescriptions[Math.floor(Math.random() * grievanceDescriptions.length)];
    
    const highLevelLabel = Math.floor(i / 50) % 10;
    const mediumLevelLabel = Math.floor(i / 25) % 20;
    const detailedLabel = Math.floor(i / 15) % 35;
    
    const coords = generateUMAPCoords(highLevelLabel, i);
    
    grievances.push({
      data_point_id: i + 1,
      title: title,
      subtitle: `${category} issue in ${district} district`,
      description: description,
      hero_image_url: 'https://via.placeholder.com/400x300?text=Grievance+Image',
      writeup_url: '#',
      date: randomDate(),
      tags: [category, severity, status],
      category_tags: [department, district],
      district: district,
      department: department,
      severity: severity,
      status: status,
      sla_days: Math.floor(Math.random() * 30) + 1,
      citizen_id: `CIT${String(i + 1).padStart(6, '0')}`,
      resolution_summary: status === 'Resolved' || status === 'Closed' 
        ? 'Issue resolved after site inspection and corrective action taken.'
        : '',
      umap_dim_1: coords[0],
      umap_dim_2: coords[1],
      umap_cluster_label: highLevelLabel,
      high_level_region_label: highLevelLabel,
      detailed_region_label: detailedLabel,
      high_level_hierarchical_label: highLevelLabel,
      medium_level_hierarchical_label: mediumLevelLabel,
      detailed_hierarchical_label: detailedLabel
    });
  }
  
  return grievances;
}

// Generate cluster definitions
function generateClusters() {
  const highLevelClusters = [
    { name: 'Sanitation & Waste Management', description: 'Grievances related to garbage collection, sewage, and cleanliness', color: '#e74c3c' },
    { name: 'Water Supply & Quality', description: 'Issues with water availability, quality, and distribution', color: '#3498db' },
    { name: 'Road & Infrastructure', description: 'Road conditions, potholes, street lighting, and public infrastructure', color: '#f39c12' },
    { name: 'Electricity & Power', description: 'Power supply, outages, billing, and electrical infrastructure', color: '#9b59b6' },
    { name: 'Healthcare Services', description: 'Primary health centers, hospitals, and medical facilities', color: '#e91e63' },
    { name: 'Education & Schools', description: 'School infrastructure, teacher availability, and education quality', color: '#00bcd4' },
    { name: 'Public Transport', description: 'Bus services, auto rickshaws, and transportation issues', color: '#4caf50' },
    { name: 'Municipal Services', description: 'Birth certificates, rations, pensions, and administrative services', color: '#ff9800' },
    { name: 'Safety & Security', description: 'Police services, street safety, and security concerns', color: '#795548' },
    { name: 'Land & Property', description: 'Land records, illegal construction, and property disputes', color: '#607d8b' }
  ];
  
  const detailedClusters = [
    { name: 'Garbage Collection Delays', description: 'Regular garbage pickup not happening', color: '#c0392b', parent: 0 },
    { name: 'Sewage Overflow', description: 'Sewage systems overflowing or blocked', color: '#e74c3c', parent: 0 },
    { name: 'Public Toilet Issues', description: 'Maintenance and cleanliness of public facilities', color: '#ec7063', parent: 0 },
    { name: 'Water Supply Interruption', description: 'Irregular or no water supply', color: '#2980b9', parent: 1 },
    { name: 'Water Quality Issues', description: 'Contaminated or poor quality water', color: '#3498db', parent: 1 },
    { name: 'Pipeline Problems', description: 'Leaks, bursts, and infrastructure damage', color: '#5dade2', parent: 1 },
    { name: 'Road Potholes', description: 'Damaged roads causing accidents and inconvenience', color: '#d68910', parent: 2 },
    { name: 'Street Lighting', description: 'Non-functional or insufficient street lights', color: '#f39c12', parent: 2 },
    { name: 'Footpath Damage', description: 'Broken or obstructed pedestrian paths', color: '#f8c471', parent: 2 },
    { name: 'Frequent Power Cuts', description: 'Unscheduled and regular electricity interruptions', color: '#7d3c98', parent: 3 },
    { name: 'Transformer Issues', description: 'Equipment breakdown affecting large areas', color: '#9b59b6', parent: 3 },
    { name: 'Billing Discrepancies', description: 'Incorrect meter readings and bills', color: '#bb8fce', parent: 3 },
    { name: 'Staff Shortage', description: 'Insufficient medical staff at health centers', color: '#c2185b', parent: 4 },
    { name: 'Medicine Availability', description: 'Essential medicines out of stock', color: '#e91e63', parent: 4 },
    { name: 'Emergency Services', description: 'Ambulance delays and emergency response', color: '#f06292', parent: 4 },
    { name: 'School Infrastructure', description: 'Building repairs and basic facilities needed', color: '#0097a7', parent: 5 },
    { name: 'Teacher Availability', description: 'Staff shortages affecting education quality', color: '#00bcd4', parent: 5 },
    { name: 'Student Facilities', description: 'Toilets, drinking water, and basic amenities', color: '#4dd0e1', parent: 5 },
    { name: 'Bus Service Issues', description: 'Frequency, routes, and availability', color: '#388e3c', parent: 6 },
    { name: 'Auto Overcharging', description: 'Fare disputes and pricing issues', color: '#4caf50', parent: 6 },
    { name: 'Document Processing', description: 'Birth certificates, licenses, and official documents', color: '#ef6c00', parent: 7 },
    { name: 'Ration Distribution', description: 'PDS shop operations and food supply', color: '#ff9800', parent: 7 },
    { name: 'Pension Services', description: 'Delayed or irregular pension payments', color: '#ffb74d', parent: 7 },
    { name: 'Police Response', description: 'Law enforcement and complaint handling', color: '#5d4037', parent: 8 },
    { name: 'Street Safety', description: 'Crime prevention and public safety', color: '#795548', parent: 8 },
    { name: 'Land Records', description: 'Documentation and registration issues', color: '#455a64', parent: 9 },
    { name: 'Illegal Construction', description: 'Unauthorized building and encroachment', color: '#607d8b', parent: 9 }
  ];
  
  const clusters = [];
  
  // High level clusters
  highLevelClusters.forEach((cluster, idx) => {
    clusters.push({
      cluster_level: 'High',
      cluster_id: `high_${idx}`,
      cluster_label: idx,
      name: cluster.name,
      description: cluster.description,
      centroid: generateUMAPCoords(idx, 0),
      members: [],
      combined_label: `High Level - ${cluster.name}`,
      color: cluster.color
    });
  });
  
  // Detailed clusters
  detailedClusters.forEach((cluster, idx) => {
    clusters.push({
      cluster_level: 'Detailed',
      cluster_id: `detailed_${idx}`,
      cluster_label: idx,
      name: cluster.name,
      description: cluster.description,
      centroid: generateUMAPCoords(cluster.parent, idx),
      members: [],
      combined_label: `Detailed - ${cluster.name}`,
      color: cluster.color
    });
  });
  
  return clusters;
}

// Generate similarity data
function generateSimilarities(grievances) {
  return grievances.map(grievance => {
    const similarProjects = [];
    const numSimilar = 20; // Reduced from 50 for mock data
    
    for (let i = 0; i < numSimilar; i++) {
      let randomId;
      do {
        randomId = Math.floor(Math.random() * grievances.length) + 1;
      } while (randomId === grievance.data_point_id || similarProjects.some(p => p.project_id === randomId));
      
      similarProjects.push({
        project_id: randomId,
        similarity_score: 0.95 - (i * 0.04) + (Math.random() * 0.02)
      });
    }
    
    return {
      data_point_id: grievance.data_point_id,
      top_similar_projects: similarProjects
    };
  });
}

// Main execution
console.log('Generating governance grievance data...');

const grievances = generateGrievances(500);
const clusters = generateClusters();
const similarities = generateSimilarities(grievances);

// Add member IDs to clusters
grievances.forEach(g => {
  const highCluster = clusters.find(c => c.cluster_level === 'High' && c.cluster_label === g.high_level_hierarchical_label);
  const detailedCluster = clusters.find(c => c.cluster_level === 'Detailed' && c.cluster_label === g.detailed_hierarchical_label);
  
  if (highCluster) highCluster.members.push(g.data_point_id);
  if (detailedCluster) detailedCluster.members.push(g.data_point_id);
});

// Write to files
const dataDir = path.join(__dirname, '../public/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(
  path.join(dataDir, 'augmented_original_data_no_embeddings.json'),
  JSON.stringify(grievances, null, 2)
);

fs.writeFileSync(
  path.join(dataDir, 'consolidated_clusters.json'),
  JSON.stringify(clusters, null, 2)
);

fs.writeFileSync(
  path.join(dataDir, 'top_50_similar_projects.json'),
  JSON.stringify(similarities, null, 2)
);

console.log(`✓ Generated ${grievances.length} grievances`);
console.log(`✓ Generated ${clusters.length} clusters`);
console.log(`✓ Generated similarity data for ${similarities.length} grievances`);
console.log('✓ Data saved to public/data directory');
