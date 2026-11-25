import App from './App.jsx';
import { mount } from './bootstrap.jsx';
import './index.css';
import { jsonDatabase } from './repositories/database.js';
import { createServices } from './services/container.js';

mount({ createServices, database: jsonDatabase, App });
