import * as Apollon from '.';
import * as themings from '../../public/themings.json';
//import './styles.css'
//require("./styles.css")
import "./additions/Components/Teacher/style.scss";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, BrowserRouter as Router } from 'react-router-dom';
import App from './additions/App';
import "@mantine/core/styles.css"
import '@mantine/notifications/styles.css';
import '@mantine/carousel/styles.css';
import { MantineProvider } from '@mantine/core';


/*const container = document.getElementById('apollon')!;
let editor: Apollon.ApollonEditor | null = null;
let options: Apollon.ApollonOptions = {
  model: JSON.parse(window.localStorage.getItem('apollon')!),
  colorEnabled: true,
  scale: 0.8,
};

export const onChange = (event: MouseEvent) => {
  const { name, value } = event.target as HTMLSelectElement;
  options = { ...options, [name]: value };
  render();
};

export const onSwitch = (event: MouseEvent) => {
  const { name, checked: value } = event.target as HTMLInputElement;
  options = { ...options, [name]: value };
  render();
};

export const save = () => {
  if (!editor) return;

  const model: Apollon.UMLModel = editor.model;
  localStorage.setItem('apollon', JSON.stringify(model));
  options = { ...options, model };
  return options;
};

export const clear = () => {
  localStorage.removeItem('apollon');
  options = { ...options, model: undefined };
};

export const setTheming = (theming: string) => {
  const root = document.documentElement;
  const selectedButton = document.getElementById(
    theming === 'light' ? 'theming-light-mode-button' : 'theming-dark-mode-button',
  );
  const unselectedButton = document.getElementById(
    theming === 'light' ? 'theming-dark-mode-button' : 'theming-light-mode-button',
  );
  if (selectedButton && unselectedButton) {
    selectedButton.classList.add('selected');
    unselectedButton.classList.remove('selected');
  }
  for (const themingVar of Object.keys(themings[theming])) {
    root.style.setProperty(themingVar, themings[theming][themingVar]);
  }
};

export const draw = async (mode?: 'include' | 'exclude') => {
  if (!editor) return;

  const filter: string[] = [
    ...Object.entries(editor.model.interactive.elements)
      .filter(([, value]) => value)
      .map(([key]) => key),
    ...Object.entries(editor.model.interactive.relationships)
      .filter(([, value]) => value)
      .map(([key]) => key),
  ];

  const exportParam = mode ? { [mode]: filter, scale: editor.getScaleFactor() } : { scale: editor.getScaleFactor() };

  const { svg }: Apollon.SVG = await editor.exportAsSVG(exportParam);
  const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
  const svgBlobURL = URL.createObjectURL(svgBlob);
  window.open(svgBlobURL);
};

const render = () => {
  save();
  if (editor) {
    editor.destroy();
  }
  editor = new Apollon.ApollonEditor(container, options);
};*/
//render();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <BrowserRouter basename='/umlegend'>
    <MantineProvider defaultColorScheme='auto' >
      <App />
    </MantineProvider>
  </BrowserRouter>
)