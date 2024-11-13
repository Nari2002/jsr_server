const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 5000;

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// File paths
const propertiesFilePath = './properties.json';
const projectsFilePath = './projects.json';

// Function to load data from JSON files
const loadData = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath);
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
  }
  return [];
};

// Function to save data to JSON files
const saveData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing to file ${filePath}:`, error);
  }
};

// Load properties and projects from files
let properties = loadData(propertiesFilePath);
let projects = loadData(projectsFilePath);

// Property Routes

app.post('/properties', upload.single('image'), (req, res) => {
  const { name, price, location, sqft } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : '';

  const newProperty = {
    id: properties.length + 1,
    name,
    price,
    location,
    sqft,
    image,
  };

  properties.push(newProperty);
  saveData(propertiesFilePath, properties); // Save to JSON file
  res.status(201).json(newProperty);
});

app.get('/properties', (req, res) => {
  res.json(properties);
});

app.delete('/properties/:id', (req, res) => {
  const { id } = req.params;
  const propertyIndex = properties.findIndex(property => property.id === parseInt(id));

  if (propertyIndex === -1) {
    return res.status(404).json({ message: 'Property not found' });
  }

  const property = properties[propertyIndex];
  if (property.image) {
    try {
      fs.unlinkSync(`.${property.image}`);
    } catch (error) {
      console.error('Error deleting image file:', error);
    }
  }

  properties.splice(propertyIndex, 1);
  saveData(propertiesFilePath, properties); // Save updated list to JSON file
  res.status(200).json({ message: 'Property deleted successfully' });
});

// Project Routes

app.post('/projects', upload.single('image'), (req, res) => {
  const { name, location, description } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : '';

  const newProject = {
    id: projects.length + 1,
    name,
    location,
    description,
    image,
  };

  projects.push(newProject);
  saveData(projectsFilePath, projects); // Save to JSON file
  res.status(201).json(newProject);
});

app.get('/projects', (req, res) => {
  res.json(projects);
});

app.delete('/projects/:id', (req, res) => {
  const { id } = req.params;
  const projectIndex = projects.findIndex(project => project.id === parseInt(id));

  if (projectIndex === -1) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const project = projects[projectIndex];
  if (project.image) {
    try {
      fs.unlinkSync(`.${project.image}`);
    } catch (error) {
      console.error('Error deleting image file:', error);
    }
  }

  projects.splice(projectIndex, 1);
  saveData(projectsFilePath, projects); // Save updated list to JSON file
  res.status(200).json({ message: 'Project deleted successfully' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }
  console.log(`Server running at http://localhost:${port}`);
});

