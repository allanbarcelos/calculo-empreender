import { mount } from '../bootstrap.jsx';
import '../index.css';
import App from './App.jsx';
import { createWorkServices } from './container.js';
import { workDatabase } from './database.js';

mount({ createServices: createWorkServices, database: workDatabase, App });
